import { Link } from 'react-router-dom'
import Icon from '../Icon'
import { PROMOTIONS } from '../../data/promotions'

// Infinite, seamless offers ticker for the top of the header.
// The list is rendered twice side by side and the track slides left by exactly one copy
// (-50%), so the loop has no visible jump. It pauses on hover/focus, and with
// "reduce motion" it becomes a static, horizontally scrollable row.
export default function AnnouncementBar({ items = PROMOTIONS }) {
  if (!items.length) return null

  const renderCopy = (isClone) => (
    <ul className="ticker__list" aria-hidden={isClone || undefined}>
      {items.map((p) => (
        <li key={p.id} className={`ticker__item ${p.highlight ? 'ticker__item--highlight' : ''}`}>
          <Icon name={p.icon} size={14} />
          {p.to ? (
            <Link to={p.to} tabIndex={isClone ? -1 : undefined}>
              {p.text}
            </Link>
          ) : (
            <span>{p.text}</span>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <section className="topbar" aria-label="Current offers">
      {/* ~6s per offer keeps the reading speed comfortable whatever the number of offers */}
      <div className="ticker" style={{ '--ticker-duration': `${items.length * 6}s` }}>
        <div className="ticker__track">
          {renderCopy(false)}
          {renderCopy(true)}
        </div>
      </div>
    </section>
  )
}
