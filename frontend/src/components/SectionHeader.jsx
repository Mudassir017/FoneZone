import { Link } from 'react-router-dom'
import Icon from './Icon'

// Section titles are shown without a small label above them (owner decision, 12 Nov 2026).
export default function SectionHeader({ title, subtitle, linkTo, linkLabel = 'View all' }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="section-header__sub">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="link-arrow">
          {linkLabel} <Icon name="chevronRight" size={16} />
        </Link>
      )}
    </div>
  )
}
