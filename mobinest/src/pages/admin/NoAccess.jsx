import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/react'
import { Copy, Lock, LogOut, RefreshCw, Store } from 'lucide-react'

/** Shown to signed-in users without the ADMIN role (the API answered 403). */
export default function NoAccess({ onRetry }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [copied, setCopied] = useState(false)
  const id = user?.id || ''
  const email = user?.primaryEmailAddress?.emailAddress

  const copy = () => {
    navigator.clipboard?.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className="adm tw">
      <div className="adm-gate">
        <div className="adm-card adm-gate__card">
          <div className="adm-gate__icon">
            <Lock />
          </div>
          <div>
            <h1>No admin access</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              You're signed in{email ? ` as ${email}` : ''}, but this account isn't a Namma Mobiles admin.
              The admin area is only for the shop's staff.
            </p>
          </div>

          <div>
            <h3 style={{ marginBottom: 8 }}>How to get access</h3>
            <ol className="small">
              <li>Send your <strong>user ID</strong> below to the shop owner or an existing admin.</li>
              <li>
                They open <em>Admin → Customers &amp; admins</em> and click <strong>Make admin</strong> (or enter your
                user ID there).
              </li>
              <li>
                Before there is any admin, the owner can add the ID to <code>ADMIN_CLERK_USER_IDS</code> on the server, or
                run <code>UPDATE customer SET role='ADMIN' WHERE clerk_user_id='…';</code>
              </li>
              <li>Then click <strong>Check again</strong> (access is re-checked within about 30 seconds).</li>
            </ol>
          </div>

          <div className="adm-codebox">
            <code>{id}</code>
            <button type="button" className="adm-btn adm-btn--sm" onClick={copy} disabled={!id}>
              <Copy /> {copied ? 'Copied' : 'Copy ID'}
            </button>
          </div>

          <div className="row">
            <button type="button" className="adm-btn adm-btn--primary" onClick={onRetry}>
              <RefreshCw /> Check again
            </button>
            <Link to="/" className="adm-btn">
              <Store /> Back to the store
            </Link>
            <span className="spacer" />
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => signOut({ redirectUrl: '/sign-in?redirect=/admin' })}>
              <LogOut /> Use another account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
