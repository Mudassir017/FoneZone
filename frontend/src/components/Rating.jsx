import Icon from './Icon'
import { formatCount } from '../utils/format'

export default function Rating({ value, count, size = 'sm' }) {
  // Brand-new products have no reviews yet: never show an invented score.
  if (!count || !value) {
    return (
      <span className={`rating rating--${size} rating--new`}>
        <span className="rating__badge rating__badge--new">New</span>
        <span className="rating__count">No reviews yet</span>
      </span>
    )
  }
  return (
    <span className={`rating rating--${size}`} aria-label={`Rated ${value} out of 5${count ? ` by ${count} customers` : ''}`}>
      <span className="rating__badge">
        {value.toFixed(1)} <Icon name="star" size={12} filled strokeWidth={0} />
      </span>
      {count != null && <span className="rating__count">({formatCount(count)})</span>}
    </span>
  )
}
