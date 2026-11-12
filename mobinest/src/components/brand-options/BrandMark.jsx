import BrandLogo from '../BrandLogo'
import { LOGO_IDS } from './utils'

/** Decorative brand logo (the card's heading carries the name), or the name when there is no logo. */
export default function BrandMark({ brand, className = '' }) {
  return (
    <span className={`bo-mark ${className}`.trim()} aria-hidden="true">
      {LOGO_IDS.has(brand.id) ? <BrandLogo id={brand.id} /> : <span className="bo-mark__text">{brand.name}</span>}
    </span>
  )
}
