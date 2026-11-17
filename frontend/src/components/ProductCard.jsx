import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from './ProductImage'
import Rating from './Rating'
import Price from './Price'
import Icon from './Icon'
import { getBrand } from '../data/brands'
import { CONDITION_MAP } from '../data/conditions'
import { phoneImage } from '../utils/images'
import { useShortlistActions } from '../hooks/useShortlistActions'

const TAG_LABEL = { 'new-launch': 'New', bestseller: 'Bestseller', deal: 'Deal' }

export default function ProductCard({ phone, from, priority = false }) {
  const { isWishlisted, toggleWishlist, isCompared, toggleCompare } = useShortlistActions()
  const [color, setColor] = useState(phone.colors[0])
  const wished = isWishlisted('phone', phone.id)
  const compared = isCompared(phone.id)
  const condition = from?.conditionId && from.conditionId !== 'new' ? from.conditionId : null
  const params = new URLSearchParams()
  if (condition) params.set('condition', condition)
  if (color.name !== phone.colors[0].name) params.set('color', color.name)
  const href = `/phones/${phone.id}${params.size ? `?${params}` : ''}`
  const tag = phone.tags[0]

  return (
    <article className="product-card">
      <div className="product-card__media">
        {tag && <span className={`tag tag--${tag}`}>{TAG_LABEL[tag]}</span>}
        <button
          className={`icon-btn product-card__wish ${wished ? 'is-active' : ''}`}
          onClick={() => toggleWishlist('phone', phone.id, phone.name)}
          aria-label={wished ? `Remove ${phone.name} from wishlist` : `Add ${phone.name} to wishlist`}
          aria-pressed={wished}
        >
          <Icon name="heart" filled={wished} size={18} />
        </button>
        <Link to={href} tabIndex={-1} aria-hidden="true" className="product-card__img-link">
          <ProductImage image={phoneImage(phone.id, color.name)} alt="" priority={priority} />
        </Link>
      </div>

      <div className="product-card__body">
        <p className="product-card__brand">{getBrand(phone.brand)?.name}</p>
        <h3 className="product-card__title">
          <Link to={href}>{phone.name}</Link>
        </h3>

        <div className="product-card__swatches" role="radiogroup" aria-label="Colour">
          {phone.colors.slice(0, 5).map((c) => (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={c.name === color.name}
              aria-label={c.name}
              title={c.name}
              className={`swatch-dot ${c.name === color.name ? 'is-active' : ''}`}
              style={{ background: c.hex }}
              onClick={() => setColor(c)}
            />
          ))}
          {phone.colors.length > 5 && <span className="small muted">+{phone.colors.length - 5}</span>}
        </div>

        <Rating value={phone.rating} count={phone.reviews} />

        {from && (
          <div className="product-card__price">
            <Price
              price={from.price}
              mrp={from.mrp}
              prefix={phone.variants.length > 1 || phone.conditions.length > 1 ? 'From' : undefined}
            />
            <p className="product-card__note">
              {condition ? `${CONDITION_MAP[condition].label}` : 'Brand new'}
              {phone.conditions.length > 1 && ` · ${phone.conditions.length} conditions`}
            </p>
          </div>
        )}

        <label className="compare-check">
          <input type="checkbox" checked={compared} onChange={() => toggleCompare(phone.id, phone.name)} />
          Compare
        </label>
      </div>
    </article>
  )
}
