import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import AdminLayout from '../../components/admin/AdminLayout'
import { AdminContext } from '../../components/admin/context'
import { ErrorBox, Loading } from '../../components/admin/ui'
import ErrorBoundary from '../../components/ErrorBoundary'
import { ToastProvider, useToast } from '../../context/ToastContext'
import { createAdminApi } from '../../services/adminApi'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import NoAccess from './NoAccess'
import '../../styles/admin.css'

const Dashboard = lazy(() => import('./Dashboard'))
const Orders = lazy(() => import('./Orders'))
const OrderDetail = lazy(() => import('./OrderDetail'))
const Payments = lazy(() => import('./Payments'))
const Brands = lazy(() => import('./catalog/Brands'))
const Phones = lazy(() => import('./catalog/Phones'))
const Skus = lazy(() => import('./catalog/Skus'))
const Accessories = lazy(() => import('./catalog/Accessories'))
const Coupons = lazy(() => import('./Coupons'))
const Customers = lazy(() => import('./Customers'))
const AuditLog = lazy(() => import('./AuditLog'))

/**
 * Dev-only preview with fake sample data, for reviewing the UI without an admin account:
 * http://localhost:5173/admin?preview=1. `import.meta.env.DEV` is replaced by `false` in production
 * builds, so this branch and the sample-data module are removed from the bundle entirely.
 */
const PREVIEW = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')

function loadPreviewClient() {
  if (import.meta.env.DEV) return import('./preview/previewApi').then((m) => m.createPreviewApi())
  return Promise.resolve(null)
}

/** /admin/* entry: guard (Clerk sign-in + server-side ADMIN role), then the back-office routes. */
export default function AdminApp() {
  useDocumentTitle('Admin')
  return (
    <ToastProvider>
      {PREVIEW ? <PreviewGate /> : <AuthGate />}
    </ToastProvider>
  )
}

function AuthGate() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth()
  const { pathname, search } = useLocation()
  const client = useMemo(() => createAdminApi(() => getToken()), [getToken])
  // { userId, status: 'ok' | 'forbidden' | 'error', me, error }
  const [check, setCheck] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isSignedIn || !userId) return undefined
    let cancelled = false
    client.me().then(
      (me) => !cancelled && setCheck({ userId, attempt, status: 'ok', me }),
      (error) => !cancelled && setCheck({ userId, attempt, status: error.status === 403 ? 'forbidden' : 'error', error }),
    )
    return () => {
      cancelled = true
    }
  }, [client, isSignedIn, userId, attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  if (!isLoaded) return <FullPageLoading />
  if (!isSignedIn) {
    return <Navigate to={`/sign-in?redirect=${encodeURIComponent(pathname + search)}`} replace />
  }
  if (!check || check.userId !== userId || check.attempt !== attempt) return <FullPageLoading label="Checking admin access…" />
  if (check.status === 'forbidden') return <NoAccess onRetry={retry} />
  if (check.status === 'error') {
    return (
      <div className="adm tw">
        <div className="adm-gate">
          <div className="adm-card adm-gate__card">
            <h1>Admin unavailable</h1>
            <p className="muted">
              {check.error.status === 401
                ? 'The server did not accept your session. Try signing out and in again.'
                : 'Could not check your admin access. Is the API running?'}
            </p>
            <ErrorBox error={check.error} onRetry={retry} />
          </div>
        </div>
      </div>
    )
  }
  return <AdminShell client={client} me={check.me} preview={false} />
}

function PreviewGate() {
  const [client, setClient] = useState(null)
  useEffect(() => {
    loadPreviewClient().then(setClient)
  }, [])
  if (!client) return <FullPageLoading label="Loading preview…" />
  return <AdminShell client={client} me={{ userId: 'user_preview', email: 'owner@example.com', role: 'ADMIN', adminCount: 2 }} preview />
}

function AdminShell({ client, me, preview }) {
  const { toast } = useToast()
  const { pathname } = useLocation()
  const value = useMemo(() => ({ client, me, preview, toast }), [client, me, preview, toast])
  return (
    <AdminContext.Provider value={value}>
      <AdminLayout>
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderNumber" element={<OrderDetail />} />
              <Route path="payments" element={<Payments />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="catalog" element={<Navigate to="/admin/catalog/brands" replace />} />
              <Route path="catalog/brands" element={<Brands />} />
              <Route path="catalog/phones" element={<Phones />} />
              <Route path="catalog/skus" element={<Skus />} />
              <Route path="catalog/accessories" element={<Accessories />} />
              <Route path="customers" element={<Customers />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AdminLayout>
    </AdminContext.Provider>
  )
}

function FullPageLoading({ label }) {
  return (
    <div className="adm tw">
      <div className="adm-gate">
        <Loading label={label} />
      </div>
    </div>
  )
}
