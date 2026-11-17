import { Link } from 'react-router-dom'
import Icon from './Icon'

// headingLevel: use 1 when the empty state is the whole page (e.g. 404) so the page has an <h1>
export default function EmptyState({ icon = 'box', title, message, actionLabel, actionTo, children, headingLevel = 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon name={icon} size={40} strokeWidth={1.4} />
      </div>
      <Heading>{title}</Heading>
      {message && <p>{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn--primary">
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  )
}
