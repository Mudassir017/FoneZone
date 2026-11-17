import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import QuantityStepper from '../components/QuantityStepper'
import ConditionBadge from '../components/ConditionBadge'
import LineThumb from '../components/LineThumb'
import OrderSummary from '../components/OrderSummary'
import Icon from '../components/Icon'
import { useCart, MAX_QTY_PER_LINE } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { COUPONS, FREE_SHIPPING_THRESHOLD } from '../utils/checkout'
import { formatPrice } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function CouponBox() {
  const { coupon, totals, applyCoupon, removeCoupon } = useCart()
  const [code, setCode] = useState('')
  const [showList, setShowList] = useState(false)

  if (coupon && totals.couponValid)
    return (
      <div className="coupon coupon--applied">
        <Icon name="tag" size={16} />
        <span>
          <strong>{coupon}</strong> applied
        </span>
        <button className="link-btn" onClick={removeCoupon}>
          Remove
        </button>
      </div>
    )

  return (
    <div className="coupon">
      <form
        className="coupon__form"
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim()) applyCoupon(code)
        }}
      >
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter coupon code" aria-label="Coupon code" />
        <button className="btn btn--outline btn--sm">Apply</button>
      </form>
      {coupon && totals.couponMessage && <p className="text-error small">{totals.couponMessage}</p>}
      <button className="link-btn small" onClick={() => setShowList((s) => !s)}>
        {showList ? 'Hide' : 'View'} available coupons
      </button>
      {showList && (
        <ul className="coupon__list">
          {Object.values(COUPONS).map((c) => (
            <li key={c.code}>
              <button
                className="coupon__code"
                onClick={() => {
                  setCode(c.code)
                  applyCoupon(c.code)
                }}
              >
                {c.code}
              </button>
              <span className="small">{c.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Cart() {
  useDocumentTitle('Cart')
  const { items, lines, totals, coupon, setQty, removeItem, restoreItem } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  const remove = (line) => {
    const raw = items.find((i) => i.key === line.key)
    removeItem(line.key)
    toast(`${line.name} removed`, {
      type: 'info',
      action: { label: 'Undo', onClick: () => restoreItem(raw) },
    })
  }

  if (!lines.length)
    return (
      <div className="container page">
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          message="Find your next phone from every major brand, new or refurbished."
          actionLabel="Start shopping"
          actionTo="/phones"
        />
      </div>
    )

  const remaining = FREE_SHIPPING_THRESHOLD - totals.subtotal

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
      <h1 className="page-title">Shopping cart</h1>

      <div className="checkout-layout">
        <div className="cart-lines">
          {remaining > 0 && (
            <p className="notice">
              <Icon name="truck" size={16} /> Add {formatPrice(remaining)} more for FREE delivery
            </p>
          )}
          {lines.map((line) => (
            <div key={line.key} className="cart-line card">
              <Link to={line.href}>
                <LineThumb line={line} />
              </Link>
              <div className="cart-line__info">
                <Link to={line.href} className="cart-line__name">
                  {line.name}
                </Link>
                <p className="muted small">{line.details}</p>
                {line.condition && (
                  <div className="cart-line__cond">
                    <ConditionBadge id={line.condition.id} label={line.condition.label} />
                    <span className="small muted">{line.condition.warranty}</span>
                  </div>
                )}
                <div className="cart-line__controls">
                  <QuantityStepper value={line.qty} onChange={(q) => setQty(line.key, q)} max={MAX_QTY_PER_LINE} />
                  <button className="link-btn" onClick={() => remove(line)}>
                    <Icon name="trash" size={16} /> Remove
                  </button>
                </div>
              </div>
              <div className="cart-line__price">
                <strong>{formatPrice(line.unitPrice * line.qty)}</strong>
                {line.unitMrp > line.unitPrice && <s className="muted small">{formatPrice(line.unitMrp * line.qty)}</s>}
                {line.qty > 1 && <span className="small muted">{formatPrice(line.unitPrice)} each</span>}
              </div>
            </div>
          ))}
          <Link to="/accessories" className="link-arrow">
            <Icon name="plus" size={16} /> Add accessories for your phone
          </Link>
        </div>

        <aside>
          <OrderSummary totals={totals} coupon={coupon}>
            <CouponBox />
            <button className="btn btn--primary btn--lg btn--block" onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </button>
            <p className="secure-note">
              <Icon name="shield" size={14} /> Safe & secure payments · Easy returns
            </p>
          </OrderSummary>
        </aside>
      </div>
    </div>
  )
}
