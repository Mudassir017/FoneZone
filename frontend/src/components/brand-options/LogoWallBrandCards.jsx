import { Link } from 'react-router-dom'
import Icon from '../Icon'
import BrandMark from './BrandMark'
import { brandClass, brandHref, modelCount } from './utils'

/**
 * Option 5 - Logo wall.
 * Calm, borderless tiles that put a big, bright logo centre stage, with a model-count chip
 * in the corner. Hover: soft halo outside the tile, it lifts slightly and the chip fills in.
 */
export default function LogoWallBrandCards({ brands, titleAs: Title = 'h3' }) {
  return (
    <div className="bo-grid">
      {brands.map((b) => (
        <Link key={b.id} to={brandHref(b)} className={`bo-card bo-glow bo-wall ${brandClass(b)}`}>
          <span className="bo-chip bo-wall__chip">{modelCount(b.id)}</span>
          <span className="bo-wall__stage">
            <BrandMark brand={b} />
          </span>
          <Title className="bo-card__name">{b.name}</Title>
          <span className="bo-card__tagline">{b.tagline}</span>
          <span className="bo-wall__cta">
            Explore <Icon name="chevronRight" size={16} />
          </span>
        </Link>
      ))}
    </div>
  )
}
