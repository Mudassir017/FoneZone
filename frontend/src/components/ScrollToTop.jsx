import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scroll to top on route change, or to #hash targets (e.g. /phones/x#buy). */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // wait a frame so lazy routes have rendered the target
      const id = decodeURIComponent(hash.slice(1))
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      return () => clearTimeout(t)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    return undefined
  }, [pathname, hash])
  return null
}
