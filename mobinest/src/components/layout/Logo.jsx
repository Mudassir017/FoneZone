import { Link } from 'react-router-dom'
import '../../styles/brand.css'

// Namma Mobiles brand mark: the owner's round badge plus a stacked wordmark.
// Assets live in public/brand/ (generated from the owner's 1254px PNG).
export default function Logo() {
  return (
    <Link to="/" className="logo site-logo" aria-label="Namma Mobiles home">
      <img
        className="site-logo__badge"
        src="/brand/namma-mobiles-logo-128.webp"
        srcSet="/brand/namma-mobiles-logo-128.webp 128w, /brand/namma-mobiles-logo-256.webp 256w"
        sizes="56px"
        width="46"
        height="46"
        alt="Namma Mobiles"
        decoding="async"
      />
      <span className="site-logo__text" aria-hidden="true">
        <span className="site-logo__name">Namma</span>
        <span className="site-logo__tag">Mobiles</span>
      </span>
    </Link>
  )
}
