import { Link } from 'react-router-dom'
import Icon from '../Icon'
import BrandMark from './BrandMark'
import { brandClass, brandHref, modelCount } from './utils'

/**
 * Option 4 - Bento grid (after Aceternity's bento-grid).
 * The first brand (Apple) gets the large tile, the others stack beside it, all on a faint
 * dot-grid backdrop. Hover: soft halo outside the tile, the logo grows slightly and the text nudges right.
 */
export default function BentoBrandCards({ brands, titleAs: Title = 'h3' }) {
  return (
    <div className="bo-bento">
      {brands.map((b, i) => (
        <Link
          key={b.id}
          to={brandHref(b)}
          className={`bo-card bo-glow bo-bento__item ${i === 0 ? 'bo-bento__item--lg' : ''} ${brandClass(b)}`}
        >
          <span className="bo-bento__header">
            <BrandMark brand={b} />
          </span>
          <span className="bo-bento__body">
            <Title className="bo-card__name">{b.name}</Title>
            <span className="bo-card__tagline">{b.tagline}</span>
            <span className="bo-bento__foot">
              <span className="bo-chip">{modelCount(b.id)}</span>
              <span className="bo-bento__cta">
                Shop {b.name} <Icon name="chevronRight" size={16} />
              </span>
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}
