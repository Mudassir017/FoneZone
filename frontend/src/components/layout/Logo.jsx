import { Link } from 'react-router-dom'
import '../../styles/brand.css'

// FoneZone brand mark: a stacked wordmark using currentColor.
export default function Logo() {
  return (
    <Link to="/" className="logo site-logo" aria-label="FoneZone home">
      <span className="site-logo__text" aria-hidden="true">
        <span className="site-logo__name">Fone</span>
        <span className="site-logo__tag">Zone</span>
      </span>
    </Link>
  )
}
