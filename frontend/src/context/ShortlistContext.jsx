import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

// Wishlist (phones + accessories) and Compare (phones only, max 3).
// Entries are "type:id" strings, e.g. "phone:iphone-17".
const ShortlistContext = createContext(null)
export const MAX_COMPARE = 4

export function ShortlistProvider({ children }) {
  const [wishlist, setWishlist] = useLocalStorage('wishlist', [])
  const [compare, setCompare] = useLocalStorage('compare', [])

  const isWishlisted = useCallback((type, id) => wishlist.includes(`${type}:${id}`), [wishlist])

  /** @returns {boolean} true if the item is now in the wishlist */
  const toggleWishlist = useCallback(
    (type, id) => {
      const entry = `${type}:${id}`
      const has = wishlist.includes(entry)
      setWishlist(has ? wishlist.filter((e) => e !== entry) : [...wishlist, entry])
      return !has
    },
    [wishlist, setWishlist],
  )

  const isCompared = useCallback((id) => compare.includes(id), [compare])

  /** @returns {'added'|'removed'|'full'} */
  const toggleCompare = useCallback(
    (id) => {
      if (compare.includes(id)) {
        setCompare(compare.filter((c) => c !== id))
        return 'removed'
      }
      if (compare.length >= MAX_COMPARE) return 'full'
      setCompare([...compare, id])
      return 'added'
    },
    [compare, setCompare],
  )

  const clearCompare = useCallback(() => setCompare([]), [setCompare])

  /** Replace the whole compare list (used by the compare page / shared links). */
  const setCompareList = useCallback((ids) => setCompare([...new Set(ids)].slice(0, MAX_COMPARE)), [setCompare])

  const value = useMemo(
    () => ({ wishlist, isWishlisted, toggleWishlist, compare, isCompared, toggleCompare, clearCompare, setCompareList }),
    [wishlist, isWishlisted, toggleWishlist, compare, isCompared, toggleCompare, clearCompare, setCompareList],
  )

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>
}

export function useShortlist() {
  const ctx = useContext(ShortlistContext)
  if (!ctx) throw new Error('useShortlist must be used inside <ShortlistProvider>')
  return ctx
}
