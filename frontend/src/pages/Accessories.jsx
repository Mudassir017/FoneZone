import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import AccessoryCard from '../components/AccessoryCard'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import { ACCESSORY_CATEGORIES, ACCESSORY_CATEGORY_MAP } from '../data/accessories'
import { BRANDS, BRAND_MAP } from '../data/brands'
import { queryAccessories } from '../utils/catalog'
import { pluralize } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const SORTS = [
  ['relevance', 'Relevance'],
  ['price-asc', 'Price: Low to High'],
  ['price-desc', 'Price: High to Low'],
  ['rating', 'Customer Rating'],
  ['discount', 'Biggest Discount'],
]

export default function Accessories() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || ''
  const brand = params.get('brand') || ''
  const sort = params.get('sort') || 'relevance'
  const items = useMemo(() => queryAccessories({ category, brand, sort }), [category, brand, sort])
  const title = ACCESSORY_CATEGORY_MAP[category]?.name || 'Mobile Accessories'
  useDocumentTitle(title)

  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'relevance') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Accessories', to: '/accessories' }, ...(category ? [{ label: title }] : [])]} />

      <div className="shop__toolbar">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="muted">
            {pluralize(items.length, 'product')}
            {brand && ` compatible with ${BRAND_MAP[brand]?.name} phones`}
          </p>
        </div>
        <div className="shop__controls">
          <label className="select">
            <span className="visually-hidden">Compatible with</span>
            <select value={brand} onChange={(e) => set('brand', e.target.value)}>
              <option value="">For: All phones</option>
              {BRANDS.map((b) => (
                <option key={b.id} value={b.id}>
                  For: {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="select">
            <span className="visually-hidden">Sort by</span>
            <select value={sort} onChange={(e) => set('sort', e.target.value)}>
              {SORTS.map(([id, label]) => (
                <option key={id} value={id}>
                  Sort: {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="category-chips category-chips--tabs">
        <button className={`category-chip ${!category ? 'is-active' : ''}`} onClick={() => set('category', '')}>
          <Icon name="box" size={20} />
          <span>All</span>
        </button>
        {ACCESSORY_CATEGORIES.map((c) => (
          <button key={c.id} className={`category-chip ${category === c.id ? 'is-active' : ''}`} onClick={() => set('category', c.id)}>
            <Icon name={c.icon} size={20} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {items.length ? (
        <div className="product-grid">
          {items.map((a) => (
            <AccessoryCard key={a.id} accessory={a} />
          ))}
        </div>
      ) : (
        <EmptyState icon="box" title="Nothing here yet" message="We’re adding more accessories every week. Try another category.">
          <button className="btn btn--primary" onClick={() => setParams({}, { replace: true })}>
            Show all accessories
          </button>
        </EmptyState>
      )}
    </div>
  )
}
