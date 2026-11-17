import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { lineKey, resolveLine } from '../utils/catalog'
import { computeTotals } from '../utils/checkout'
import { readStored } from '../hooks/useLocalStorage'

const CartContext = createContext(null)
const STORAGE_KEY = 'mobinest:cart'
export const MAX_QTY_PER_LINE = 5

const initialState = () => readStored('cart', { items: [], coupon: '' })

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const key = lineKey(action.item)
      const existing = state.items.find((i) => i.key === key)
      const items = existing
        ? state.items.map((i) =>
            i.key === key ? { ...i, qty: Math.min(MAX_QTY_PER_LINE, i.qty + (action.item.qty || 1)) } : i,
          )
        : [...state.items, { ...action.item, key, qty: Math.min(MAX_QTY_PER_LINE, action.item.qty || 1) }]
      return { ...state, items }
    }
    case 'setQty':
      return {
        ...state,
        items: state.items
          .map((i) => (i.key === action.key ? { ...i, qty: Math.min(MAX_QTY_PER_LINE, action.qty) } : i))
          .filter((i) => i.qty > 0),
      }
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.key !== action.key) }
    case 'restore':
      // Undo of a removal; ignore if the same line was re-added meanwhile.
      if (!action.item || state.items.some((i) => i.key === action.item.key)) return state
      return { ...state, items: [...state.items, action.item] }
    case 'setCoupon':
      return { ...state, coupon: action.code }
    case 'clear':
      return { items: [], coupon: '' }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  // Resolve against catalogue; silently drop items that no longer exist.
  const lines = useMemo(() => state.items.map(resolveLine).filter(Boolean), [state.items])
  const totals = useMemo(() => computeTotals(lines, state.coupon), [lines, state.coupon])

  const addItem = useCallback((item) => dispatch({ type: 'add', item }), [])
  const setQty = useCallback((key, qty) => dispatch({ type: 'setQty', key, qty }), [])
  const removeItem = useCallback((key) => dispatch({ type: 'remove', key }), [])
  const restoreItem = useCallback((item) => dispatch({ type: 'restore', item }), [])
  const applyCoupon = useCallback((code) => dispatch({ type: 'setCoupon', code: code.trim().toUpperCase() }), [])
  const removeCoupon = useCallback(() => dispatch({ type: 'setCoupon', code: '' }), [])
  const clearCart = useCallback(() => dispatch({ type: 'clear' }), [])

  const value = useMemo(
    () => ({
      items: state.items,
      lines,
      totals,
      coupon: state.coupon,
      count: totals.itemCount,
      addItem,
      setQty,
      removeItem,
      restoreItem,
      applyCoupon,
      removeCoupon,
      clearCart,
    }),
    [state, lines, totals, addItem, setQty, removeItem, restoreItem, applyCoupon, removeCoupon, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
