import { Link } from 'react-router-dom'
import Icon from '../Icon'
import BrandMark from './BrandMark'
import { brandClass, brandHref, isFinePointer, modelCount, prefersReducedMotion, trackPointer } from './utils'

/**
 * Option 1 - Card Spotlight (after Aceternity's card-spotlight).
 * A fine, neutral dot texture is revealed in a circle that follows the cursor (no colour wash),
 * plus a soft halo just outside the card.
 */
function SpotlightCard({ brand, Title }) {
  const onPointerMove = (e) => {
    if (isFinePointer(e) && !prefersReducedMotion()) trackPointer(e)
  }
  return (
    <Link to={brandHref(brand)} className={`bo-card bo-glow bo-spot ${brandClass(brand)}`} onPointerMove={onPointerMove}>
      <span className="bo-spot__light" aria-hidden="true" />
      <BrandMark brand={brand} className="bo-spot__mark" />
      <span className="bo-spot__text">
        <Title className="bo-card__name">{brand.name}</Title>
        <span className="bo-card__tagline">{brand.tagline}</span>
      </span>
      <span className="bo-spot__foot">
        <span className="bo-chip">{modelCount(brand.id)}</span>
        <Icon name="chevronRight" size={18} className="bo-arrow" />
      </span>
    </Link>
  )
}

export default function SpotlightBrandCards({ brands, titleAs = 'h3' }) {
  return (
    <div className="bo-grid">
      {brands.map((b) => (
        <SpotlightCard key={b.id} brand={b} Title={titleAs} />
      ))}
    </div>
  )
}
