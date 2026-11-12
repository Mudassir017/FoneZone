import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => (
          <li key={item.label}>
            {item.to && i < items.length - 1 ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            {i < items.length - 1 && <Icon name="chevronRight" size={14} />}
          </li>
        ))}
      </ol>
    </nav>
  )
}
