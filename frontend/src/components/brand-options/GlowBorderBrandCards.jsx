import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../Icon'
import BrandMark from './BrandMark'
import { brandClass, brandHref, isFinePointer, modelCount, prefersReducedMotion } from './utils'

/**
 * Option 2 - Glowing border (after Aceternity's glowing-effect).
 * On hover a thin arc of the brand's colours runs along the border towards the cursor and a
 * soft halo appears just outside the card. Keyboard focus lights the whole border.
 */
function GlowBorderCard({ brand, Title }) {
  // Last angle written, kept unwrapped so the arc takes the short way round (359deg -> 1deg).
  const angle = useRef(0)

  const onPointerMove = (e) => {
    if (!isFinePointer(e) || prefersReducedMotion()) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const target = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI + 90
    const diff = ((((target - angle.current) % 360) + 540) % 360) - 180
    angle.current += diff
    el.style.setProperty('--gb-angle', `${angle.current}deg`)
  }

  return (
    <Link to={brandHref(brand)} className={`bo-card bo-gb ${brandClass(brand)}`} onPointerMove={onPointerMove}>
      <span className="bo-gb__surface">
        <span className="bo-gb__stage">
          <BrandMark brand={brand} />
        </span>
        <span className="bo-gb__body">
          <span className="bo-gb__text">
            <Title className="bo-card__name">{brand.name}</Title>
            <span className="bo-card__tagline">{brand.tagline}</span>
          </span>
          <span className="bo-chip">
            {modelCount(brand.id)} <Icon name="chevronRight" size={14} />
          </span>
        </span>
      </span>
      <span className="bo-gb__ring" aria-hidden="true" />
    </Link>
  )
}

export default function GlowBorderBrandCards({ brands, titleAs = 'h3' }) {
  return (
    <div className="bo-grid">
      {brands.map((b) => (
        <GlowBorderCard key={b.id} brand={b} Title={titleAs} />
      ))}
    </div>
  )
}
