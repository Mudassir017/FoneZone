import { useState } from 'react'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'
import ProductImage from '../components/ProductImage'
import { phoneImage } from '../utils/images'
import { BRANDS } from '../data/brands'
import { PHONES, getPhone } from '../data/phones'
import { useToast } from '../context/ToastContext'
import { addDays, formatDate, formatPrice, formatStorage } from '../utils/format'
import { roundPrice } from '../utils/pricing'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Simple trade-in pricing model for the draft. In production, quotes should
// come from a pricing service fed by live resale market data.
const QUESTIONS = [
  {
    id: 'screen',
    label: 'Screen condition',
    options: [
      { id: 'flawless', label: 'Flawless', factor: 1 },
      { id: 'scratches', label: 'Minor scratches', factor: 0.88 },
      { id: 'cracked', label: 'Cracked / dead pixels', factor: 0.6 },
    ],
  },
  {
    id: 'body',
    label: 'Body condition',
    options: [
      { id: 'likenew', label: 'Like new', factor: 1 },
      { id: 'scuffs', label: 'Visible scuffs', factor: 0.92 },
      { id: 'dents', label: 'Dents / cracked back', factor: 0.75 },
    ],
  },
  {
    id: 'battery',
    label: 'Battery health',
    options: [
      { id: 'good', label: 'Above 85%', factor: 1 },
      { id: 'ok', label: '70% – 85%', factor: 0.93 },
      { id: 'poor', label: 'Below 70%', factor: 0.82 },
    ],
  },
  {
    id: 'box',
    label: 'Original box & charger',
    options: [
      { id: 'yes', label: 'I have both', factor: 1.03 },
      { id: 'no', label: 'Phone only', factor: 1 },
    ],
  },
]

const AGE_FACTOR = [0.62, 0.48, 0.36, 0.27, 0.2]
const RECYCLE_VOUCHER = 500
const CURRENT_YEAR = new Date().getFullYear()

function computeQuote(phone, variantIndex, answers, powersOn) {
  if (!powersOn) return 0
  const base = phone.variants[variantIndex].price
  const age = Math.min(AGE_FACTOR.length - 1, Math.max(0, CURRENT_YEAR - phone.year))
  const factor = QUESTIONS.reduce((f, q) => f * (q.options.find((o) => o.id === answers[q.id])?.factor ?? 1), 1)
  return roundPrice(base * AGE_FACTOR[age] * factor)
}

const defaultAnswers = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options[0].id]))

export default function Sell() {
  useDocumentTitle('Sell or Recycle Your Phone')
  const { toast } = useToast()
  const [brand, setBrand] = useState('')
  const [phoneId, setPhoneId] = useState('')
  const [variantIndex, setVariantIndex] = useState(0)
  const [powersOn, setPowersOn] = useState(true)
  const [answers, setAnswers] = useState(defaultAnswers)
  const [pickup, setPickup] = useState({ pincode: '', slot: '' })
  const [booked, setBooked] = useState(null)

  const phone = phoneId ? getPhone(phoneId) : null
  const models = PHONES.filter((p) => p.brand === brand)
  const quote = phone ? computeQuote(phone, variantIndex, answers, powersOn) : 0
  const slots = [1, 2, 3].map((d) => formatDate(addDays(d), { weekday: 'short', day: 'numeric', month: 'short' }))

  const reset = () => {
    setBrand('')
    setPhoneId('')
    setVariantIndex(0)
    setPowersOn(true)
    setAnswers(defaultAnswers)
    setBooked(null)
  }

  const book = (e) => {
    e.preventDefault()
    if (!/^[1-9]\d{5}$/.test(pickup.pincode)) return toast('Enter a valid 6-digit pincode', { type: 'error' })
    if (!pickup.slot) return toast('Choose a pickup slot', { type: 'error' })
    setBooked({ ...pickup, phone: phone.name, amount: quote })
    toast('Pickup scheduled!')
  }

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Sell / Recycle' }]} />
      <div className="sell-hero">
        <div>
          <h1 className="page-title">Sell or recycle your old phone</h1>
          <p className="muted">
            Instant quote in 30 seconds · Free doorstep pickup · Payment via UPI on pickup. Phone not working? We’ll recycle it
            responsibly and give you a {formatPrice(RECYCLE_VOUCHER)} Namma Mobiles voucher.
          </p>
        </div>
        <ol className="steps-row">
          <li>
            <Icon name="phone" size={20} /> Tell us about your phone
          </li>
          <li>
            <Icon name="tag" size={20} /> Get an instant quote
          </li>
          <li>
            <Icon name="truck" size={20} /> Free pickup & payment
          </li>
        </ol>
      </div>

      {booked ? (
        <div className="card sell-done">
          <span className="success-hero__icon">
            <Icon name="check" size={32} strokeWidth={2.5} />
          </span>
          <h2>Pickup booked for {booked.slot}</h2>
          <p>
            Our agent will collect your <strong>{booked.phone}</strong> at pincode {booked.pincode}.{' '}
            {booked.amount > 0 ? (
              <>
                You’ll receive <strong>{formatPrice(booked.amount)}</strong> after a quick on-the-spot check.
              </>
            ) : (
              <>
                We’ll recycle it responsibly and email your <strong>{formatPrice(RECYCLE_VOUCHER)}</strong> voucher.
              </>
            )}
          </p>
          <button className="btn btn--outline" onClick={reset}>
            Sell another phone
          </button>
        </div>
      ) : (
        <div className="sell-layout">
          <div className="card sell-form">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sell-brand">Brand</label>
                <select
                  id="sell-brand"
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value)
                    setPhoneId('')
                    setVariantIndex(0)
                  }}
                >
                  <option value="">Select brand</option>
                  {BRANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sell-model">Model</label>
                <select
                  id="sell-model"
                  value={phoneId}
                  disabled={!brand}
                  onChange={(e) => {
                    setPhoneId(e.target.value)
                    setVariantIndex(0)
                  }}
                >
                  <option value="">{brand ? 'Select model' : 'Select a brand first'}</option>
                  {models.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {phone && (
              <>
                <div className="option-block">
                  <div className="option-block__label">Variant</div>
                  <div className="pill-options">
                    {phone.variants.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`pill ${variantIndex === i ? 'is-active' : ''}`}
                        onClick={() => setVariantIndex(i)}
                        aria-pressed={variantIndex === i}
                      >
                        {v.ram}GB / {formatStorage(v.storage)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="option-block">
                  <div className="option-block__label">Does the phone switch on and work normally?</div>
                  <div className="pill-options">
                    <button type="button" className={`pill ${powersOn ? 'is-active' : ''}`} onClick={() => setPowersOn(true)} aria-pressed={powersOn}>
                      Yes
                    </button>
                    <button type="button" className={`pill ${!powersOn ? 'is-active' : ''}`} onClick={() => setPowersOn(false)} aria-pressed={!powersOn}>
                      No, it’s dead / faulty
                    </button>
                  </div>
                </div>

                {powersOn &&
                  QUESTIONS.map((q) => (
                    <div key={q.id} className="option-block">
                      <div className="option-block__label">{q.label}</div>
                      <div className="pill-options">
                        {q.options.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            className={`pill ${answers[q.id] === o.id ? 'is-active' : ''}`}
                            onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                            aria-pressed={answers[q.id] === o.id}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>

          <aside className="card sell-quote">
            {phone ? (
              <>
                <ProductImage image={phoneImage(phone.id, phone.colors[0].name)} alt={phone.name} className="sell-quote__art" sizes="200px" />
                <h2>{phone.name}</h2>
                {quote > 0 ? (
                  <>
                    <p className="muted small">Your instant quote</p>
                    <p className="sell-quote__amount">{formatPrice(quote)}</p>
                    <p className="small muted">+ extra ₹1,000 if you use it to buy a phone on Namma Mobiles</p>
                  </>
                ) : (
                  <>
                    <p className="sell-quote__recycle">
                      <Icon name="leaf" size={20} /> Eco recycling
                    </p>
                    <p className="small">
                      We’ll recycle it with a certified e-waste partner and give you a <strong>{formatPrice(RECYCLE_VOUCHER)}</strong> voucher.
                    </p>
                  </>
                )}
                <form onSubmit={book} className="sell-pickup">
                  <div className="field">
                    <label htmlFor="pickup-pin">Pickup pincode</label>
                    <input
                      id="pickup-pin"
                      inputMode="numeric"
                      maxLength={6}
                      value={pickup.pincode}
                      onChange={(e) => setPickup({ ...pickup, pincode: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="pickup-slot">Pickup day</label>
                    <select id="pickup-slot" value={pickup.slot} onChange={(e) => setPickup({ ...pickup, slot: e.target.value })}>
                      <option value="">Choose a day</option>
                      {slots.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn--primary btn--block">{quote > 0 ? 'Sell & schedule pickup' : 'Schedule free recycling'}</button>
                </form>
              </>
            ) : (
              <div className="sell-quote__empty">
                <Icon name="recycle" size={56} strokeWidth={1.2} />
                <p>Select your phone’s brand and model to see an instant quote.</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
