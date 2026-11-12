import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom'
import AppProviders from './context/AppProviders'
import Layout from './components/layout/Layout'
import PageLoader from './components/PageLoader'
import Home from './pages/Home'

// Route-level code splitting: only the home page ships in the initial bundle.
const Shop = lazy(() => import('./pages/Shop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Accessories = lazy(() => import('./pages/Accessories'))
const AccessoryDetail = lazy(() => import('./pages/AccessoryDetail'))
const Brands = lazy(() => import('./pages/Brands'))
const BrandStore = lazy(() => import('./pages/BrandStore'))
const Compare = lazy(() => import('./pages/Compare'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const AuthPage = lazy(() => import('./pages/Login'))

// Old /login links (and ?redirect=) forward to Clerk's sign-in page.
function LegacyLogin() {
  const { search } = useLocation()
  return <Navigate to={`/sign-in${search}`} replace />
}
const Account = lazy(() => import('./pages/Account'))
const Sell = lazy(() => import('./pages/Sell'))
const Help = lazy(() => import('./pages/Help'))
const NotFound = lazy(() => import('./pages/NotFound'))
// Hidden design preview (not in the navigation): brand-card options for the home page
const DesignBrandCards = lazy(() => import('./pages/DesignBrandCards'))
// Admin back office: its own lazy bundle and layout (no store header/footer); guarded inside.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

const router = createBrowserRouter([
  {
    path: 'admin/*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminApp />
      </Suspense>
    ),
  },
  {
    element: (
      <AppProviders>
        <Layout />
      </AppProviders>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'phones', element: <Shop /> },
      { path: 'phones/:id', element: <ProductDetail /> },
      { path: 'accessories', element: <Accessories /> },
      { path: 'accessories/:id', element: <AccessoryDetail /> },
      { path: 'brands', element: <Brands /> },
      { path: 'brands/:id', element: <BrandStore /> },
      { path: 'compare', element: <Compare /> },
      { path: 'wishlist', element: <Wishlist /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'order/:id', element: <OrderSuccess /> },
      // `/*` lets Clerk's multi-step flows (verification, factor-two) work with React Router
      { path: 'sign-in/*', element: <AuthPage mode="sign-in" /> },
      { path: 'sign-up/*', element: <AuthPage mode="sign-up" /> },
      { path: 'login', element: <LegacyLogin /> },
      { path: 'account', element: <Account /> },
      { path: 'sell', element: <Sell /> },
      { path: 'help/:topic', element: <Help /> },
      { path: 'design/brand-cards', element: <DesignBrandCards /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
