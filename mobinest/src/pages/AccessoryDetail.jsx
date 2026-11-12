import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AccessoryArt from '../components/AccessoryArt'
import AccessoryCard from '../components/AccessoryCard'
import Breadcrumbs from '../components/Breadcrumbs'
import Rating from '../components/Rating'
import Price from '../components/Price'
import Icon from '../components/Icon'
import QuantityStepper from '../components/QuantityStepper'
import SectionHeader from '../components/SectionHeader'
import NotFound from './NotFound'
import { ACCESSORIES, ACCESSORY_CATEGORY_MAP, getAccessory } from '../data/accessories'
import { ACTIVE_BRAND_IDS, BRAND_MAP } from '../data/brands'
import { useCart, MAX_QTY_PER_LINE } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useShortlistActions } from '../hooks/useShortlistActions'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatPrice } from '../utils/format'

export default function AccessoryDetail() {
  const { id } = useParams()
  const accessory = getAccessory(id)
  if (!accessory) return <NotFound message="We couldn’t find that accessory." />
  return <AccessoryView key={accessory.id} accessory={accessory} />
}

function AccessoryView({ accessory: a }) {
  const [color, setColor] = useState(a.colors[0])
  const [qty, setQty] = useState(1)
  const { addItem } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { isWishlisted, toggleWishlist } = useShortlistActions()
  useDocumentTitle(a.name)

  const category = ACCESSORY_CATEGORY_MAP[a.category]
  const wished = isWishlisted('accessory', a.id)
  const compat = a.compatibleBrands.includes('all')
    ? 'All smartphones'
    : a.compatibleBrands
        .filter((b) => ACTIVE_BRAND_IDS.includes(b))
        .map((b) => BRAND_MAP[b]?.name)
        .filter(Boolean)
        .join(', ') || 'Selected models'
  const related = ACCESSORIES.filter((x) => x.category === a.category && x.id !== a.id).slice(0, 4)

  const add = (buyNow) => {
    addItem({ type: 'accessory', productId: a.id, color: color?.name || '', qty })
    if (buyNow) navigate('/cart')
    else toast(`${a.name} added to cart`, { action: { label: 'View cart', onClick: () => navigate('/cart') } })
  }

  return (
    <div className="container page pdp-page">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Accessories', to: '/accessories' },
          { label: category.name, to: `/accessories?category=${category.id}` },
          { label: a.name },
        ]}
      />
      <div className="pdp">
        <div className="pdp__gallery">
          <div className="gallery__stage">
            <div className="gallery__slide">
              <AccessoryArt accessory={a} color={color} />
            </div>
          </div>
        </div>
        <div className="pdp__info">
          <span className="pdp__brand">{a.brand}</span>
          <h1 className="pdp__title">{a.name}</h1>
          <div className="pdp__rating">
            <Rating value={a.rating} count={a.reviews} size="md" />
          </div>
          <div className="pdp__price">
            <Price price={a.price} mrp={a.mrp} size="lg" />
            <p className="muted small">Inclusive of all taxes</p>
          </div>

          {a.colors.length > 0 && (
            <div className="option-block">
              <div className="option-block__label">
                Colour: <strong>{color.name}</strong>
              </div>
              <div className="swatches">
                {a.colors.map((c) => (
                  <button
                    key={c.name}
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
          )}

          <p className="pdp__compat">
            <Icon name="phone" size={16} /> Compatible with: <strong>{compat}</strong>
          </p>

          <div className="pdp__actions">
            <div className="pdp__actions-price">
              <strong>{formatPrice(a.price * qty)}</strong>
              <span>{a.brand}</span>
            </div>
            <QuantityStepper value={qty} onChange={setQty} max={MAX_QTY_PER_LINE} />
            <button className="btn btn--outline btn--lg" onClick={() => add(false)}>
              <Icon name="cart" size={18} /> Add to cart
            </button>
            <button className="btn btn--primary btn--lg" onClick={() => add(true)}>
              Buy now
            </button>
          </div>
          <div className="pdp__secondary">
            <button className={`link-btn ${wished ? 'is-active' : ''}`} onClick={() => toggleWishlist('accessory', a.id, a.name)}>
              <Icon name="heart" size={16} filled={wished} /> {wished ? 'Wishlisted' : 'Add to wishlist'}
            </button>
          </div>

          <p>{a.description}</p>
          <ul className="highlights">
            {a.features.map((f) => (
              <li key={f}>
                <Icon name="check" size={16} /> {f}
              </li>
            ))}
          </ul>
          <p className="small muted">
            Looking for a phone too? <Link to="/phones">Browse all phones</Link>
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <SectionHeader title={`More ${category.name.toLowerCase()}`} linkTo={`/accessories?category=${category.id}`} />
          <div className="product-grid">
            {related.map((r) => (
              <AccessoryCard key={r.id} accessory={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
