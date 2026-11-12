import Icon from './Icon'
import { ACCESSORY_CATEGORY_MAP } from '../data/accessories'
import { shade } from '../utils/color'

/** Placeholder product render for accessories (category icon on a tinted tile). */
export default function AccessoryArt({ accessory, color, className = '' }) {
  const hex = color?.hex || accessory.colors[0]?.hex || '#8a8d93'
  const icon = ACCESSORY_CATEGORY_MAP[accessory.category]?.icon || 'box'
  return (
    <div
      className={`accessory-art ${className}`}
      style={{ background: `linear-gradient(145deg, ${shade(hex, 0.82)}, ${shade(hex, 0.55)})` }}
      role="img"
      aria-label={accessory.name}
    >
      <Icon name={icon} size={88} strokeWidth={1.2} style={{ color: shade(hex, -0.35) }} />
    </div>
  )
}
