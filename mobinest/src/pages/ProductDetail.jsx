import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Gallery from '../components/Gallery'
import LocalNav from '../components/LocalNav'
import ProductShowcase from '../components/ProductShowcase'
import ComparisonCard from '../components/ComparisonCard'
import Rating from '../components/Rating'
import Icon from '../components/Icon'
import QuantityStepper from '../components/QuantityStepper'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import AccessoryCard from '../components/AccessoryCard'
import SectionHeader from '../components/SectionHeader'
import NotFound from './NotFound'
import { getPhone } from '../data/phones'
import { getBrand } from '../data/brands'
import { CONDITIONS, CONDITION_MAP } from '../data/conditions'
import { getPhonePrice, emiPerMonth } from '../utils/pricing'
import { compatibleAccessories, similarPhones } from '../utils/catalog'
import { addDays, formatDate, formatPrice, formatStorage } from '../utils/format'
import { useCart, MAX_QTY_PER_LINE } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useShortlistActions } from '../hooks/useShortlistActions'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { phoneGallery } from '../utils/images'

const SPEC_LABELS = {
  display: 'Display',
  processor: 'Processor',
  rearCamera: 'Rear camera',
  frontCamera: 'Front camera',
  battery: 'Battery',
  charging: 'Charging',
  os: 'Operating system',
  weight: 'Weight',
}

const IN_BOX = {
  new: ['Handset', 'USB-C cable', 'SIM ejector tool', 'Documentation'],
  refurbished: ['Handset', 'USB-C cable (Namma Mobiles certified)', 'SIM ejector tool', 'Namma Mobiles warranty card'],
  used: ['Handset', 'Charging cable', 'SIM ejector tool', 'Namma Mobiles warranty card'],
  recycled: ['Handset', 'Charging cable', 'Namma Mobiles warranty card'],
}

export default function ProductDetail() {
  const { id } = useParams()
  const phone = getPhone(id)
  if (!phone) return <NotFound message="We couldn’t find that phone. It may have been discontinued." />
  // key = id resets all selections when navigating between phones
  return <PhoneDetail key={phone.id} phone={phone} />
}

function DeliveryCheck() {
  const [pin, setPin] = useState('')
  const [result, setResult] = useState(null)

  const check = (e) => {
    e.preventDefault()
    if (!/^[1-9]\d{5}$/.test(pin)) return setResult({ ok: false, text: 'Enter a valid 6-digit pincode' })
    // Mock serviceability: metro pincodes (starting 1–6) get faster delivery
    const days = Number(pin[0]) <= 6 ? 2 : 4
    setResult({ ok: true, text: `Delivery by ${formatDate(addDays(days), { weekday: 'short', day: 'numeric', month: 'short' })} · Free` })
  }

  return (
    <form className="delivery" onSubmit={check}>
      <label htmlFor="pincode">
        <Icon name="pin" size={16} /> Check delivery
      </label>
      <div className="delivery__row">
        <input
          id="pincode"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter pincode"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        />
        <button className="btn btn--outline btn--sm">Check</button>
      </div>
      {result && <p className={result.ok ? 'text-success' : 'text-error'}>{result.text}</p>}
    </form>
  )
}

function PhoneDetail({ phone }) {
  const [params] = useSearchParams()
  const requested = params.get('condition')
  const [condition, setCondition] = useState(phone.conditions.includes(requested) ? requested : phone.conditions[0])
  const [variantIndex, setVariantIndex] = useState(0)
  const [color, setColor] = useState(phone.colors.find((c) => c.name === params.get('color')) ?? phone.colors[0])
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('specs')

  const { addItem } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { isWishlisted, toggleWishlist, isCompared, toggleCompare } = useShortlistActions()
  useDocumentTitle(phone.name)

  const brand = getBrand(phone.brand)
  const cond = CONDITION_MAP[condition]
  const variant = phone.variants[variantIndex]
  const { price, mrp, discountPct, stock } = getPhonePrice(phone, variantIndex, condition)
  const soldOut = stock === 0
  const wished = isWishlisted('phone', phone.id)

  const addToCart = (goToCheckout = false) => {
    addItem({ type: 'phone', productId: phone.id, variantIndex, color: color.name, condition, qty })
    if (goToCheckout) navigate('/cart')
    else
      toast(`${phone.name} (${formatStorage(variant.storage)}, ${color.name}) added to cart`, {
        action: { label: 'View cart', onClick: () => navigate('/cart') },
      })
  }

  return (
    <>
    <LocalNav
      title={phone.name}
      links={[
        { href: '#overview', label: 'Overview' },
        { href: '#specs', label: 'Specs' },
        { href: '#compare', label: 'Compare' },
      ]}
    />
    <div className="container page pdp-page">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Phones', to: '/phones' },
          { label: brand.name, to: `/phones?brand=${brand.id}` },
          { label: phone.name },
        ]}
      />

      <div className="pdp" id="buy">
        {/* ---------- Gallery ---------- */}
        <div className="pdp__gallery">
          <Gallery
            key={color.name}
            images={phoneGallery(phone, color.name)}
            alt={`${phone.name} in ${color.name}`}
            badge={
              <span className="condition-badge condition-badge--float" style={{ '--c': cond.color }}>
                {cond.label}
              </span>
            }
          />
        </div>

        {/* ---------- Buy box ---------- */}
        <div className="pdp__info">
          <Link to={`/phones?brand=${brand.id}`} className="pdp__brand">
            {brand.name}
          </Link>
          <h1 className="pdp__title">
            {phone.name}{' '}
            <span className="pdp__variant">
              ({variant.ram}GB RAM, {formatStorage(variant.storage)}, {color.name})
            </span>
          </h1>
          <div className="pdp__rating">
            <Rating value={phone.rating} count={phone.reviews} size="md" />
            <span className="muted">{phone.is5G ? '5G' : '4G'} · Launched {phone.year}</span>
          </div>

          <div className="pdp__price">
            <div className="price price--lg">
              <span className="price__now">{formatPrice(price)}</span>
              {discountPct > 0 && (
                <>
                  <span className="price__mrp">{formatPrice(mrp)}</span>
                  <span className="price__off">{discountPct}% off</span>
                </>
              )}
            </div>
            <p className="muted small">
              Inclusive of all taxes · No-cost EMI from <strong>{formatPrice(emiPerMonth(price))}/month</strong>
            </p>
            {stock !== undefined && (
              <p className={`stock ${soldOut ? 'stock--out' : stock <= 10 ? 'stock--low' : ''}`}>
                {soldOut ? 'Out of stock in this configuration' : stock <= 10 ? `Only ${stock} left – order soon` : 'In stock · ships in 24 hours'}
              </p>
            )}
          </div>

          {/* Condition */}
          <div className="option-block">
            <div className="option-block__label">
              Condition: <strong>{cond.label}</strong>
            </div>
            <div className="condition-options">
              {CONDITIONS.map((c) => {
                const available = phone.conditions.includes(c.id)
                const p = available ? getPhonePrice(phone, variantIndex, c.id).price : null
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!available}
                    className={`condition-option ${condition === c.id ? 'is-active' : ''}`}
                    style={{ '--c': c.color }}
                    onClick={() => setCondition(c.id)}
                    aria-pressed={condition === c.id}
                  >
                    <span className="condition-option__name">{c.short}</span>
                    <span className="condition-option__price">{available ? formatPrice(p) : 'Unavailable'}</span>
                  </button>
                )
              })}
            </div>
            <div className="condition-note" style={{ '--c': cond.color }}>
              <Icon name="shield" size={18} />
              <div>
                <strong>{cond.warranty}</strong>
                <p>{cond.description}</p>
              </div>
            </div>
          </div>

          {/* Colour */}
          <div className="option-block">
            <div className="option-block__label">
              Colour: <strong>{color.name}</strong>
            </div>
            <div className="swatches">
              {phone.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`swatch ${color.name === c.name ? 'is-active' : ''}`}
                  style={{ '--swatch': c.hex }}
                  onClick={() => setColor(c)}
                  aria-label={c.name}
                  aria-pressed={color.name === c.name}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Storage */}
          <div className="option-block">
            <div className="option-block__label">
              Storage: <strong>{formatStorage(variant.storage)}</strong>
            </div>
            <div className="variant-options">
              {phone.variants.map((v, i) => (
                <button
                  key={`${v.ram}-${v.storage}`}
                  type="button"
                  className={`variant-option ${variantIndex === i ? 'is-active' : ''}`}
                  onClick={() => setVariantIndex(i)}
                  aria-pressed={variantIndex === i}
                >
                  <strong>{formatStorage(v.storage)}</strong>
                  <span>{v.ram}GB RAM</span>
                  <span className="variant-option__price">{formatPrice(getPhonePrice(phone, i, condition).price)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions (becomes a sticky bottom bar on mobile) */}
          <div className="pdp__actions">
            <div className="pdp__actions-price">
              <strong>{formatPrice(price * qty)}</strong>
              <span>{cond.short} · {formatStorage(variant.storage)}</span>
            </div>
            <QuantityStepper value={qty} onChange={setQty} max={MAX_QTY_PER_LINE} />
            <button className="btn btn--outline btn--lg" onClick={() => addToCart(false)} disabled={soldOut}>
              <Icon name="cart" size={18} /> Add to cart
            </button>
            <button className="btn btn--primary btn--lg" onClick={() => addToCart(true)} disabled={soldOut}>
              {soldOut ? 'Sold out' : 'Buy now'}
            </button>
          </div>
          <div className="pdp__secondary">
            <button className={`link-btn ${wished ? 'is-active' : ''}`} onClick={() => toggleWishlist('phone', phone.id, phone.name)}>
              <Icon name="heart" size={16} filled={wished} /> {wished ? 'Wishlisted' : 'Add to wishlist'}
            </button>
            <button className="link-btn" onClick={() => toggleCompare(phone.id, phone.name)}>
              <Icon name="compare" size={16} /> {isCompared(phone.id) ? 'Remove from compare' : 'Add to compare'}
            </button>
          </div>

          <DeliveryCheck />

          <div className="offers">
            <h3>
              <Icon name="tag" size={16} /> Offers
            </h3>
            <ul>
              <li>
                <strong>WELCOME10</strong> · 10% off your first order, up to ₹2,000
              </li>
              <li>
                <strong>MOBI1000</strong> · Flat ₹1,000 off on orders above ₹25,000
              </li>
              <li>
                <strong>Exchange</strong> · Extra value when you <Link to="/sell">sell your old phone</Link>
              </li>
            </ul>
          </div>

          <ul className="highlights">
            {phone.highlights.map((h) => (
              <li key={h}>
                <Icon name="check" size={16} /> {h}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>

      <ProductShowcase phone={phone} />

    <div className="container page pdp-page pdp-page--rest">
      {/* ---------- Details tabs ---------- */}
      <section className="section" id="specs">
        <div className="tabs" role="tablist">
          {[
            ['specs', 'Specifications'],
            ['box', 'In the box'],
            ['grading', 'Condition guide'],
          ].map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'is-active' : ''}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="tab-panel" role="tabpanel">
          {tab === 'specs' && (
            <table className="spec-table">
              <tbody>
                <tr>
                  <th>Brand</th>
                  <td>{brand.name}</td>
                </tr>
                <tr>
                  <th>Variants</th>
                  <td>{phone.variants.map((v) => `${v.ram}GB + ${formatStorage(v.storage)}`).join(', ')}</td>
                </tr>
                {Object.entries(SPEC_LABELS).map(([key, label]) => (
                  <tr key={key}>
                    <th>{label}</th>
                    <td>{phone.specs[key]}</td>
                  </tr>
                ))}
                <tr>
                  <th>Network</th>
                  <td>{phone.is5G ? '5G, 4G LTE' : '4G LTE'}</td>
                </tr>
                <tr>
                  <th>Colours</th>
                  <td>{phone.colors.map((c) => c.name).join(', ')}</td>
                </tr>
              </tbody>
            </table>
          )}
          {tab === 'box' && (
            <ul className="highlights">
              {IN_BOX[condition].map((i) => (
                <li key={i}>
                  <Icon name="box" size={16} /> {i}
                </li>
              ))}
            </ul>
          )}
          {tab === 'grading' && (
            <div className="grading">
              {CONDITIONS.map((c) => (
                <div key={c.id} className="grading__item" style={{ '--c': c.color }}>
                  <h4>{c.label}</h4>
                  <p>{c.description}</p>
                  <p className="small muted">{c.warranty}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" id="compare">
        <SectionHeader title={`Compare ${phone.name}`} subtitle="See how it stacks up against similar phones." linkTo={`/compare?phones=${phone.id}`} linkLabel="Compare with any phone" />
        <div className="vs-grid">
          {similarPhones(phone, 3).map(({ phone: other }) => (
            <ComparisonCard key={other.id} title={`${phone.name} vs ${other.name}`} ids={[phone.id, other.id]} />
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader title={`Accessories for ${phone.name}`} linkTo={`/accessories?brand=${phone.brand}`} />
        <div className="product-grid">
          {compatibleAccessories(phone).map((a) => (
            <AccessoryCard key={a.id} accessory={a} />
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Similar phones" />
        <div className="product-grid">
          {similarPhones(phone).map(({ phone: p, from }) => (
            <ProductCard key={p.id} phone={p} from={from} />
          ))}
        </div>
      </section>
    </div>
    </>
  )
}
