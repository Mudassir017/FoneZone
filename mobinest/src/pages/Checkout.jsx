import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import OrderSummary from '../components/OrderSummary'
import LineThumb from '../components/LineThumb'
import Icon from '../components/Icon'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { COD_LIMIT, INDIAN_STATES, PAYMENT_METHODS, generateOrderId } from '../utils/checkout'
import { addDays, formatPrice } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ApiError, endpoints } from '../services/api'

const FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name', span: 2 },
  { name: 'phone', label: 'Mobile number', autoComplete: 'tel', inputMode: 'numeric', maxLength: 10 },
  { name: 'email', label: 'Email', autoComplete: 'email', type: 'email' },
  { name: 'address', label: 'Flat, house no., building, street', autoComplete: 'street-address', span: 2 },
  { name: 'landmark', label: 'Landmark (optional)', span: 2, optional: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'pincode', label: 'Pincode', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 },
]

function validate(form, paymentMethod, total) {
  const e = {}
  if (form.fullName.trim().length < 3) e.fullName = 'Enter your full name'
  if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number'
  if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email'
  if (form.address.trim().length < 8) e.address = 'Enter your complete address'
  if (form.city.trim().length < 2) e.city = 'Enter your city'
  if (!form.state) e.state = 'Select your state'
  if (!/^[1-9]\d{5}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode'
  if (paymentMethod === 'cod' && total > COD_LIMIT) e.payment = `Cash on Delivery is available only up to ${formatPrice(COD_LIMIT)}`
  return e
}

export default function Checkout() {
  useDocumentTitle('Checkout')
  const { items, lines, totals, coupon, clearCart } = useCart()
  const { user, addOrder, getToken } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [placed, setPlaced] = useState(false)

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    email: user?.email || '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [payment, setPayment] = useState('upi')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!lines.length && !placed) return <Navigate to="/cart" replace />

  const onChange = (e) => {
    const { name, value } = e.target
    const clean = name === 'phone' || name === 'pincode' ? value.replace(/\D/g, '') : value
    const next = { ...form, [name]: clean }
    setForm(next)
    if (touched) setErrors(validate(next, payment, totals.total))
  }

  const buildLocalOrder = () => ({
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    eta: addDays(4).toISOString(),
    status: 'Confirmed (demo)',
    userId: user?.id || null,
    email: (user?.email || form.email).toLowerCase(),
    address: { ...form },
    payment: PAYMENT_METHODS.find((p) => p.id === payment).label,
    coupon: totals.couponValid ? coupon : '',
    totals,
    items: lines.map((l) => ({
      key: l.key,
      type: l.type,
      productId: l.productId,
      name: l.name,
      details: l.details,
      condition: l.condition?.label || '',
      colorHex: l.color?.hex || '',
      colorName: l.color?.name || '',
      qty: l.qty,
      unitPrice: l.unitPrice,
    })),
  })

  const placeOrder = async (e) => {
    e.preventDefault()
    setTouched(true)
    const errs = validate(form, payment, totals.total)
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast('Please fix the highlighted fields', { type: 'error' })
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    setSubmitting(true)
    let order
    try {
      // The server receives only the selection and computes prices/totals itself.
      const token = user ? await getToken() : null
      order = await endpoints.placeOrder(
        {
          address: { ...form },
          paymentMethod: payment,
          couponCode: totals.couponValid ? coupon : null,
          items: items.map(({ type, productId, variantIndex = 0, color, condition, qty }) => ({
            type,
            productId,
            variantIndex,
            color: color || undefined,
            condition: type === 'phone' ? condition : undefined,
            qty,
          })),
        },
        token,
      )
    } catch (err) {
      if (!(err instanceof ApiError) || !err.isNetwork) {
        // Business/validation error from the server (out of stock, COD limit, invalid coupon…)
        setSubmitting(false)
        if (err.fields) setErrors((prev) => ({ ...prev, ...err.fields }))
        toast(err.message || 'Could not place the order', { type: 'error', duration: 5000 })
        return
      }
      // API unreachable: keep the demo usable with a locally-recorded order.
      toast('Server unreachable – order saved in demo mode on this device', { type: 'info', duration: 5000 })
      order = buildLocalOrder()
    }

    addOrder(order)
    setPlaced(true)
    clearCart()
    navigate(`/order/${order.id}`, { replace: true })
  }

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="page-title">Checkout</h1>
      {!user && (
        <p className="notice">
          <Icon name="user" size={16} /> Have an account? <Link to="/sign-in?redirect=/checkout">Sign in</Link> for faster checkout and order tracking.
        </p>
      )}

      <form className="checkout-layout" onSubmit={placeOrder} noValidate>
        <div className="checkout-main">
          <section className="card checkout-section">
            <h2>
              <span className="step">1</span> Delivery address
            </h2>
            <div className="form-grid">
              {FIELDS.map((f) => (
                <div key={f.name} className={`field ${f.span === 2 ? 'field--full' : ''}`}>
                  <label htmlFor={f.name}>{f.label}</label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type || 'text'}
                    value={form[f.name]}
                    onChange={onChange}
                    autoComplete={f.autoComplete}
                    inputMode={f.inputMode}
                    maxLength={f.maxLength}
                    aria-invalid={Boolean(errors[f.name])}
                    aria-describedby={errors[f.name] ? `${f.name}-err` : undefined}
                  />
                  {errors[f.name] && (
                    <span id={`${f.name}-err`} className="field__error">
                      {errors[f.name]}
                    </span>
                  )}
                </div>
              ))}
              <div className="field">
                <label htmlFor="state">State</label>
                <select id="state" name="state" value={form.state} onChange={onChange} aria-invalid={Boolean(errors.state)}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <span className="field__error">{errors.state}</span>}
              </div>
            </div>
          </section>

          <section className="card checkout-section">
            <h2>
              <span className="step">2</span> Payment method
            </h2>
            <div className="payment-options">
              {PAYMENT_METHODS.map((p) => {
                const disabled = p.id === 'cod' && totals.total > COD_LIMIT
                return (
                  <label key={p.id} className={`payment-option ${payment === p.id ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value={p.id}
                      checked={payment === p.id}
                      disabled={disabled}
                      onChange={() => {
                        setPayment(p.id)
                        if (touched) setErrors(validate(form, p.id, totals.total))
                      }}
                    />
                    <span>
                      <strong>{p.label}</strong>
                      <small>{disabled ? `Not available above ${formatPrice(COD_LIMIT)}` : p.hint}</small>
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.payment && <p className="field__error">{errors.payment}</p>}
            <p className="small muted">Demo payment: no money is charged. Your order is saved on the Namma Mobiles server.</p>
          </section>

          <section className="card checkout-section">
            <h2>
              <span className="step">3</span> Review items
            </h2>
            {lines.map((l) => (
              <div key={l.key} className="review-line">
                <LineThumb line={l} />
                <div>
                  <strong>{l.name}</strong>
                  <p className="small muted">
                    {l.details}
                    {l.condition && ` · ${l.condition.label}`} · Qty {l.qty}
                  </p>
                </div>
                <strong>{formatPrice(l.unitPrice * l.qty)}</strong>
              </div>
            ))}
          </section>
        </div>

        <aside>
          <OrderSummary totals={totals} coupon={coupon}>
            <button className="btn btn--primary btn--lg btn--block" disabled={submitting}>
              {submitting ? 'Placing order…' : `Place order · ${formatPrice(totals.total)}`}
            </button>
            <p className="secure-note">
              <Icon name="shield" size={14} /> 100% secure checkout
            </p>
          </OrderSummary>
        </aside>
      </form>
    </div>
  )
}
