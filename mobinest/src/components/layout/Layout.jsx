import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import CompareBar from './CompareBar'
import ScrollToTop from '../ScrollToTop'
import PageLoader from '../PageLoader'
import ErrorBoundary from '../ErrorBoundary'

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main" className="main">
        {/* key resets the boundary after navigating away from a crashed page */}
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <CompareBar />
      <Footer />
    </>
  )
}
