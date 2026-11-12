// Shared helpers for the brand-card design options (preview page: /design/brand-cards).
import { countPhonesByBrand } from '../../utils/catalog'
import { pluralize } from '../../utils/format'

/** Brands that have a mark in BrandLogo.jsx; any other brand falls back to its name. */
export const LOGO_IDS = new Set(['apple', 'samsung', 'google'])

const reduceQuery =
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

/** True when the visitor asked the OS for less motion (pointer effects are then switched off). */
export const prefersReducedMotion = () => Boolean(reduceQuery?.matches)

/** Pointer effects only follow a mouse or pen; touch scrolling must not trigger them. */
export const isFinePointer = (e) => e.pointerType === 'mouse' || e.pointerType === 'pen'

export const brandHref = (brand) => `/brands/${brand.id}`

export const modelCount = (brandId) => pluralize(countPhonesByBrand(brandId), 'model')

/** CSS hook classes that carry each brand's logo colour and glow palette (see brand-options.css). */
export const brandClass = (brand) => `bo-b bo-b--${brand.id}`

/**
 * Write the pointer position into CSS variables on the event's element
 * (--mx/--my in px) and return it as fractions of the element's size.
 */
export function trackPointer(e) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top
  el.style.setProperty('--mx', `${x}px`)
  el.style.setProperty('--my', `${y}px`)
  return { x: x / r.width, y: y / r.height }
}
