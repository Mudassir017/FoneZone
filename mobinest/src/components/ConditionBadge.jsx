import { CONDITION_MAP } from '../data/conditions'

export default function ConditionBadge({ id, label }) {
  const c = CONDITION_MAP[id]
  if (!c) return null
  return (
    <span className="condition-badge" style={{ '--c': c.color }}>
      {label || c.short}
    </span>
  )
}
