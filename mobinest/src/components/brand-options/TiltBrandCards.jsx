import { Link } from 'react-router-dom'
import Icon from '../Icon'
import BrandMark from './BrandMark'
import { brandClass, brandHref, isFinePointer, modelCount, prefersReducedMotion, trackPointer } from './utils'

const MAX_TILT = 8 // degrees

/**
 * Option 3 - 3D tilt card (after Aceternity's 3d-card).
 * The card leans towards the cursor; on hover the logo, name and chip lift off the card
 * at different depths so the logo pops forward the most.
 */
function TiltCard({ brand, Title }) {
  const onPointerMove = (e) => {
    if (!isFinePointer(e) || prefersReducedMotion()) return
    const { x, y } = trackPointer(e)
    e.currentTarget.style.setProperty('--rx', `${((0.5 - y) * MAX_TILT * 2).toFixed(2)}deg`)
    e.currentTarget.style.setProperty('--ry', `${((x - 0.5) * MAX_TILT * 2).toFixed(2)}deg`)
  }
  const onPointerLeave = (e) => {
    e.currentTarget.style.setProperty('--rx', '0deg')
    e.currentTarget.style.setProperty('--ry', '0deg')
  }

  return (
    <div className="bo-tilt-wrap">
      <Link
        to={brandHref(brand)}
        className={`bo-card bo-tilt ${brandClass(brand)}`}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <span className="bo-tilt__surface">
          <span className="bo-tilt__text bo-z1">
            <Title className="bo-card__name">{brand.name}</Title>
            <span className="bo-card__tagline">{brand.tagline}</span>
          </span>
          <span className="bo-tilt__stage">
            <BrandMark brand={brand} className="bo-z3" />
          </span>
          <span className="bo-tilt__foot">
            <span className="bo-chip bo-z2">{modelCount(brand.id)}</span>
            <span className="bo-tilt__cta bo-z2">
              Shop now <Icon name="chevronRight" size={16} />
            </span>
          </span>
        </span>
      </Link>
    </div>
  )
}

export default function TiltBrandCards({ brands, titleAs = 'h3' }) {
  return (
    <div className="bo-grid">
      {brands.map((b) => (
        <TiltCard key={b.id} brand={b} Title={titleAs} />
      ))}
    </div>
  )
}
