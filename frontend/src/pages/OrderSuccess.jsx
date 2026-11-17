import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import NotFound from './NotFound'
import OrderItems from '../components/OrderItems'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatPrice } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function OrderSuccess() {
  const { id } = useParams()
  const { getOrder, user } = useAuth()
  const order = getOrder(id)
  useDocumentTitle('Order confirmed')

  if (!order) return <NotFound message="We couldn’t find that order." />
  const a = order.address

  return (
    <div className="container page narrow">
      <div className="success-hero">
        <span className="success-hero__icon">
          <Icon name="check" size={36} strokeWidth={2.5} />
        </span>
        <h1>Order placed successfully!</h1>
        <p>
          Order <strong>#{order.id}</strong> · Estimated delivery by{' '}
          <strong>{formatDate(order.eta, { weekday: 'long', day: 'numeric', month: 'short' })}</strong>
        </p>
        <p className="muted small">A confirmation has been sent to {order.email}</p>
      </div>

      <div className="card order-card">
        <h2>Items</h2>
        <OrderItems items={order.items} />
        <dl className="order-card__totals">
          <div>
            <dt>Paid via</dt>
            <dd>{order.payment}</dd>
          </div>
          {order.totals.couponDiscount > 0 && (
            <div>
              <dt>Coupon {order.coupon}</dt>
              <dd className="text-success">− {formatPrice(order.totals.couponDiscount)}</dd>
            </div>
          )}
          <div className="summary__total">
            <dt>Total</dt>
            <dd>{formatPrice(order.totals.total)}</dd>
          </div>
        </dl>
        <h2>Delivering to</h2>
        <p>
          <strong>{a.fullName}</strong> · {a.phone}
          <br />
          {a.address}
          {a.landmark && `, ${a.landmark}`}, {a.city}, {a.state} – {a.pincode}
        </p>
      </div>

      <div className="success-actions">
        <Link to="/phones" className="btn btn--outline">
          Continue shopping
        </Link>
        {user ? (
          <Link to="/account" className="btn btn--primary">
            View my orders
          </Link>
        ) : (
          <Link to="/accessories" className="btn btn--primary">
            Shop accessories
          </Link>
        )}
      </div>
    </div>
  )
}
