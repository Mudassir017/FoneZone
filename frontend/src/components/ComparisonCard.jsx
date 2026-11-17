import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from './ProductImage'
import { getPhone } from '../data/phones'
import { phoneImage } from '../utils/images'

/** "A vs B vs C" card linking to a pre-filled comparison. */
export default function ComparisonCard({ title, ids }) {
  const phones = ids.map(getPhone).filter(Boolean)
  if (phones.length < 2) return null
  return (
    <Link to={`/compare?phones=${phones.map((p) => p.id).join(',')}`} className="vs-card">
      <div className="vs-card__imgs">
        {phones.map((p) => (
          <ProductImage key={p.id} image={phoneImage(p.id, p.colors[0].name)} alt="" sizes="120px" />
        ))}
      </div>
      <p className="vs-card__title">{title}</p>
      <p className="vs-card__names">
        {phones.map((p, i) => (
          <Fragment key={p.id}>
            {i > 0 && <span className="vs-card__vs"> vs </span>}
            <span className="vs-card__name">{p.name}</span>
          </Fragment>
        ))}
      </p>
    </Link>
  )
}
