import { Link } from 'react-router-dom'
import AccessoryArt from './AccessoryArt'
import Rating from './Rating'
import Price from './Price'
import Icon from './Icon'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useShortlistActions } from '../hooks/useShortlistActions'

export default function AccessoryCard({ accessory }) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const { isWishlisted, toggleWishlist } = useShortlistActions()
  const wished = isWishlisted('accessory', accessory.id)
  const href = `/accessories/${accessory.id}`

  const quickAdd = () => {
    addItem({ type: 'accessory', productId: accessory.id, color: accessory.colors[0]?.name || '' })
    toast(`${accessory.name} added to cart`)
  }

  return (
    <article className="card product-card product-card--accessory">
      <div className="product-card__media">
        <button
          className={`icon-btn product-card__wish ${wished ? 'is-active' : ''}`}
          onClick={() => toggleWishlist('accessory', accessory.id, accessory.name)}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
        >
          <Icon name="heart" filled={wished} size={18} />
        </button>
        <Link to={href} tabIndex={-1} aria-hidden="true">
          <AccessoryArt accessory={accessory} />
        </Link>
      </div>
      <div className="product-card__body">
        <p className="product-card__brand">{accessory.brand}</p>
        <h3 className="product-card__title">
          <Link to={href}>{accessory.name}</Link>
        </h3>
        <Rating value={accessory.rating} count={accessory.reviews} />
        <Price price={accessory.price} mrp={accessory.mrp} />
        <button className="btn btn--outline btn--sm btn--block" onClick={quickAdd}>
          <Icon name="cart" size={16} /> Add to cart
        </button>
      </div>
    </article>
  )
}
