import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductImage from '../components/ProductImage'
import { phoneImage } from '../utils/images'
import { BRANDS } from '../data/brands'
import { PHONES } from '../data/phones'
import { getStartingPrice } from '../utils/pricing'
import { formatPrice, pluralize } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Brands() {
  useDocumentTitle('All Brands')
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Brands' }]} />
      <h1 className="page-title">Shop by brand</h1>
      <p className="muted">Every major smartphone brand, in every condition.</p>

      <div className="brand-cards">
        {BRANDS.map((b) => {
          const phones = PHONES.filter((p) => p.brand === b.id)
          if (!phones.length) return null
          const from = Math.min(...phones.map((p) => getStartingPrice(p).price))
          const hero = phones.find((p) => p.id === b.hero?.phone) ?? phones[0]
          return (
            <Link key={b.id} to={`/brands/${b.id}`} className="brand-card" style={{ '--brand': b.accent }}>
              <div className="brand-card__text">
                <h2>{b.name}</h2>
                <p className="muted">{b.tagline}</p>
                <p className="small">
                  {pluralize(phones.length, 'model')} · from <strong>{formatPrice(from)}</strong>
                </p>
              </div>
              <ProductImage image={phoneImage(hero.id, hero.colors[0].name)} alt="" className="brand-card__img" sizes="160px" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
