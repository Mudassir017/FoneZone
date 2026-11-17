import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { ShieldCheck } from 'lucide-react'
import { api } from '../../services/api'

/**
 * "Admin" button for the Account page. Renders nothing unless the API says this user's role is
 * ADMIN (GET /api/me), so customers never see it. The /admin routes are guarded by the server anyway.
 */
export default function AdminAccountLink({ className = 'btn btn--outline btn--sm' }) {
  const { isSignedIn, getToken, userId } = useAuth()
  const [adminFor, setAdminFor] = useState(null)

  useEffect(() => {
    if (!isSignedIn) return undefined
    let cancelled = false
    getToken()
      .then((token) => api('/api/me', { token }))
      .then((me) => !cancelled && setAdminFor(me?.role === 'ADMIN' ? userId : null))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken, userId])

  if (!isSignedIn || adminFor !== userId) return null
  return (
    <Link to="/admin" className={className}>
      <ShieldCheck size={16} /> Admin
    </Link>
  )
}
