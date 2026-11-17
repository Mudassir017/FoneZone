import { Link, Navigate } from 'react-router-dom'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import OrderItems from '../components/OrderItems'
import PageLoader from '../components/PageLoader'
import AdminAccountLink from '../components/admin/AdminAccountLink'
import { useAuth } from '../context/AuthContext'
import { useShortlist } from '../context/ShortlistContext'
import { formatDate, formatPrice, pluralize } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Account() {
  useDocumentTitle('My account')
  const { isLoaded, user, orders, logout, openUserProfile } = useAuth()
  const { wishlist } = useShortlist()

  // Always wait for Clerk to load before trusting the signed-in state.
  if (!isLoaded) return <PageLoader />
  if (!user) return <Navigate to="/sign-in?redirect=/account" replace />

  return (
    <div className="container page">
      <div className="account-head card">
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="" className="avatar" />
        ) : (
          <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
        )}
        <div>
          <h1>Hi, {user.name}</h1>
          <p className="muted">{user.email}</p>
        </div>
        <div className="account-head__stats">
          <Link to="/wishlist">
            <strong>{wishlist.length}</strong> wishlist
          </Link>
          <span>
            <strong>{orders.length}</strong> orders
          </span>
        </div>
        <div className="account-head__actions">
          {/* Only rendered for users whose role is ADMIN (checked with the API) */}
          <AdminAccountLink />
          <button className="btn btn--outline btn--sm" onClick={() => openUserProfile()}>
            <Icon name="user" size={16} /> Manage account
          </button>
          <button className="btn btn--ghost btn--sm" onClick={logout}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </div>

      <h2 className="section-title">My orders</h2>
      {orders.length ? (
        <div className="orders">
          {orders.map((o) => (
            <article key={o.id} className="card order-card">
              <header className="order-card__head">
                <div>
                  <p className="small muted">Order #{o.id}</p>
                  <p className="small">
                    Placed {formatDate(o.createdAt)} · {pluralize(o.items.reduce((s, i) => s + i.qty, 0), 'item')} ·{' '}
                    <strong>{formatPrice(o.totals.total)}</strong>
                  </p>
                </div>
                <span className="status-pill">
                  <Icon name="truck" size={14} /> {o.status} · arriving {formatDate(o.eta, { day: 'numeric', month: 'short' })}
                </span>
              </header>
              <OrderItems items={o.items} />
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="box" title="No orders yet" message="When you place an order it will show up here." actionLabel="Start shopping" actionTo="/phones" />
      )}
    </div>
  )
}
