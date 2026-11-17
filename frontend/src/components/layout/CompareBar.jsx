import { Link, useLocation } from 'react-router-dom'
import Icon from '../Icon'
import { useShortlist, MAX_COMPARE } from '../../context/ShortlistContext'
import { getPhone } from '../../data/phones'

/** Sticky tray shown when phones are selected for comparison. */
export default function CompareBar() {
  const { compare, toggleCompare, clearCompare } = useShortlist()
  const { pathname } = useLocation()
  if (!compare.length || pathname === '/compare' || pathname.startsWith('/checkout')) return null

  return (
    <div className="compare-bar" role="region" aria-label="Compare tray">
      <div className="container compare-bar__inner">
        <div className="compare-bar__items">
          {compare.map((id) => {
            const p = getPhone(id)
            if (!p) return null
            return (
              <span key={id} className="chip">
                {p.name}
                <button onClick={() => toggleCompare(id)} aria-label={`Remove ${p.name}`}>
                  <Icon name="close" size={14} />
                </button>
              </span>
            )
          })}
          <span className="compare-bar__hint">
            {compare.length}/{MAX_COMPARE} selected
          </span>
        </div>
        <div className="compare-bar__actions">
          <button className="btn btn--ghost btn--sm" onClick={clearCompare}>
            Clear
          </button>
          <Link to="/compare" className="btn btn--primary btn--sm">
            <Icon name="compare" size={16} /> Compare now
          </Link>
        </div>
      </div>
    </div>
  )
}
