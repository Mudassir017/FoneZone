import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format'

export default function OrderItems({ items }) {
  return (
    <ul className="order-items">
      {items.map((i) => (
        <li key={i.key}>
          <span className="swatch-dot" style={{ background: i.colorHex || '#ccc' }} />
          <div>
            <Link to={i.type === 'phone' ? `/phones/${i.productId}` : `/accessories/${i.productId}`}>{i.name}</Link>
            <p className="small muted">
              {i.details}
              {i.condition && ` · ${i.condition}`} · Qty {i.qty}
            </p>
          </div>
          <strong>{formatPrice(i.unitPrice * i.qty)}</strong>
        </li>
      ))}
    </ul>
  )
}
