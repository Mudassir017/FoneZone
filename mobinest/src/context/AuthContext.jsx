import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { endpoints } from '../services/api'

// Authentication is handled by Clerk. This context adapts the Clerk user into
// the { id, name, email } profile the store uses and owns order history:
//  - signed in  -> orders come from the API (GET /api/orders/me, Clerk Bearer token)
//  - always     -> placed orders are also cached locally so the confirmation page
//                  works instantly and the demo still works if the API is offline.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()
  const { signOut, openUserProfile } = useClerk()
  const [cachedOrders, setCachedOrders] = useLocalStorage('orders', [])
  const [remote, setRemote] = useState({ userId: null, orders: null, error: null })
  const [refreshKey, setRefreshKey] = useState(0)

  const user = useMemo(() => {
    if (!isSignedIn || !clerkUser) return null
    const email = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase() || ''
    return {
      id: clerkUser.id,
      email,
      name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || email.split('@')[0] || 'there',
      imageUrl: clerkUser.imageUrl,
    }
  }, [isSignedIn, clerkUser])

  const userId = user?.id

  // Load the signed-in user's orders from the server.
  useEffect(() => {
    if (!userId) return undefined
    let cancelled = false
    getToken()
      .then((token) => endpoints.myOrders(token))
      .then((orders) => !cancelled && setRemote({ userId, orders, error: null }))
      .catch((err) => !cancelled && setRemote({ userId, orders: null, error: err.message }))
    return () => {
      cancelled = true
    }
  }, [userId, getToken, refreshKey])

  const logout = useCallback(() => signOut({ redirectUrl: '/' }), [signOut])

  const addOrder = useCallback(
    (order) => {
      setCachedOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)])
      setRefreshKey((k) => k + 1)
    },
    [setCachedOrders],
  )

  const fromServer = Boolean(user && remote.userId === user.id && remote.orders)

  const myOrders = useMemo(() => {
    if (!user) return []
    const local = cachedOrders.filter((o) => o.userId === user.id || (!o.userId && o.email === user.email))
    if (!fromServer) return local
    const ids = new Set(remote.orders.map((o) => o.id))
    // server orders first; keep any locally-cached order the server doesn't know (placed offline)
    return [...remote.orders, ...local.filter((o) => !ids.has(o.id))].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    )
  }, [user, cachedOrders, fromServer, remote.orders])

  const getOrder = useCallback(
    (id) => cachedOrders.find((o) => o.id === id) || remote.orders?.find((o) => o.id === id),
    [cachedOrders, remote.orders],
  )

  const value = useMemo(
    () => ({
      isLoaded,
      user,
      getToken,
      logout,
      openUserProfile,
      orders: myOrders,
      ordersSource: fromServer ? 'api' : 'local',
      ordersError: user && remote.userId === user.id ? remote.error : null,
      addOrder,
      getOrder,
    }),
    [isLoaded, user, getToken, logout, openUserProfile, myOrders, fromServer, remote, addOrder, getOrder],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
