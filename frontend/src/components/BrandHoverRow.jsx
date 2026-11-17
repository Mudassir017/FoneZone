import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import BrandLogo from './BrandLogo'
import Icon from './Icon'

/**
 * Home "Pick your favourite" brand cards with Aceternity UI's "Card Hover Effect"
 * (https://ui.aceternity.com/components/card-hover-effect), adapted for FoneZone:
 * a soft highlight panel glides from card to card behind the one under the pointer
 * (or keyboard focus), extending just beyond the card edges. Reduced motion: it fades in place.
 */
export default function BrandHoverRow({ brands, countFor }) {
  const [active, setActive] = useState(null)
  const reduceMotion = useReducedMotion()

  return (
    <div className="brand-row brand-row--hover" onMouseLeave={() => setActive(null)}>
      {brands.map((b, i) => (
        <div
          key={b.id}
          className="brand-hover"
          onMouseEnter={() => setActive(i)}
          onFocus={() => setActive(i)}
          onBlur={() => setActive(null)}
        >
          <AnimatePresence>
            {active === i && (
              <motion.span
                className="brand-hover__bg"
                layoutId={reduceMotion ? undefined : 'brand-hover-bg'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
          <Link to={`/brands/${b.id}`} className="brand-card">
            <div className="brand-card__text">
              <h3>{b.name}</h3>
              <p>{b.tagline}</p>
              <span className="link-arrow">
                {countFor(b.id)} models <Icon name="chevronRight" size={16} />
              </span>
            </div>
            <span className="brand-card__logo" aria-hidden="true">
              <BrandLogo id={b.id} title="" />
            </span>
          </Link>
        </div>
      ))}
    </div>
  )
}
