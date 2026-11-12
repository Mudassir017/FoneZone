import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FilterPanel from '../components/FilterPanel'
import ProductCard from '../components/ProductCard'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import { queryPhones, SORT_OPTIONS, getPriceBucket } from '../utils/catalog'
import { BRAND_MAP } from '../data/brands'
import { CONDITION_MAP } from '../data/conditions'
import { formatStorage, pluralize } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const list = (params, key) => (params.get(key) || '').split(',').filter(Boolean)

/** All filter state lives in the URL so results are shareable & back-button friendly. */
function parseFilters(params) {
  return {
    q: params.get('q') || '',
    brands: list(params, 'brand'),
    conditions: list(params, 'condition'),
    storage: list(params, 'storage').map(Number),
    ram: list(params, 'ram').map(Number),
    price: params.get('price') || '',
    minRating: Number(params.get('rating')) || 0,
    sort: params.get('sort') || 'relevance',
  }
}

function pageTitle(f) {
  if (f.q) return `Results for “${f.q}”`
  const brand = f.brands.length === 1 ? BRAND_MAP[f.brands[0]]?.name : ''
  const cond = f.conditions.length === 1 ? CONDITION_MAP[f.conditions[0]]?.label : ''
  if (brand || cond) return `${cond ? `${cond} ` : ''}${brand ? `${brand} ` : ''}Phones`.trim()
  return 'All Mobile Phones'
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filters = useMemo(() => parseFilters(params), [params])
  const results = useMemo(() => queryPhones(filters), [filters])
  const title = pageTitle(filters)
  useDocumentTitle(title)

  const update = (mutate) => {
    const next = new URLSearchParams(params)
    mutate(next)
    setParams(next, { replace: true })
  }

  const onToggle = (key, value) =>
    update((next) => {
      const values = list(next, key)
      const updated = values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
      if (updated.length) next.set(key, updated.join(','))
      else next.delete(key)
    })

  const onSet = (key, value) =>
    update((next) => {
      if (value && value !== 'relevance') next.set(key, value)
      else next.delete(key)
    })

  const onClear = () => setParams(filters.q ? { q: filters.q } : {}, { replace: true })

  // Chips for currently applied filters
  const chips = [
    ...filters.conditions.map((c) => ({ key: 'condition', value: c, label: CONDITION_MAP[c]?.label })),
    ...filters.brands.map((b) => ({ key: 'brand', value: b, label: BRAND_MAP[b]?.name })),
    ...filters.storage.map((s) => ({ key: 'storage', value: String(s), label: formatStorage(s) })),
    ...filters.ram.map((r) => ({ key: 'ram', value: String(r), label: `${r}GB RAM` })),
    ...(filters.price ? [{ key: 'price', single: true, label: getPriceBucket(filters.price)?.label }] : []),
    ...(filters.minRating ? [{ key: 'rating', single: true, label: `${filters.minRating}★ & above` }] : []),
  ].filter((c) => c.label)

  const removeChip = (c) => (c.single ? onSet(c.key, '') : onToggle(c.key, c.value))

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Phones', to: '/phones' }, ...(title !== 'All Mobile Phones' ? [{ label: title }] : [])]} />

      <div className="shop">
        <aside className={`shop__filters ${filtersOpen ? 'is-open' : ''}`} aria-label="Filters">
          <div className="shop__filters-head">
            <button className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <Icon name="close" />
            </button>
          </div>
          <FilterPanel filters={filters} onToggle={onToggle} onSet={onSet} onClear={onClear} activeCount={chips.length} />
          <button className="btn btn--primary btn--block shop__apply" onClick={() => setFiltersOpen(false)}>
            Show {pluralize(results.length, 'phone')}
          </button>
        </aside>
        {filtersOpen && <div className="shop__backdrop" onClick={() => setFiltersOpen(false)} />}

        <section className="shop__results">
          <div className="shop__toolbar">
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="muted">{pluralize(results.length, 'phone')} found</p>
            </div>
            <div className="shop__controls">
              <button className="btn btn--outline btn--sm shop__filter-btn" onClick={() => setFiltersOpen(true)}>
                <Icon name="filter" size={16} /> Filters {chips.length > 0 && `(${chips.length})`}
              </button>
              <label className="select">
                <span className="visually-hidden">Sort by</span>
                <select value={filters.sort} onChange={(e) => onSet('sort', e.target.value)}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      Sort: {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {(chips.length > 0 || filters.q) && (
            <div className="chips">
              {filters.q && (
                <span className="chip">
                  “{filters.q}”
                  <button onClick={() => onSet('q', '')} aria-label="Clear search">
                    <Icon name="close" size={14} />
                  </button>
                </span>
              )}
              {chips.map((c) => (
                <span key={`${c.key}-${c.value ?? ''}`} className="chip">
                  {c.label}
                  <button onClick={() => removeChip(c)} aria-label={`Remove ${c.label}`}>
                    <Icon name="close" size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {results.length ? (
            <div className="product-grid product-grid--3">
              {results.map(({ phone, from }) => (
                <ProductCard key={phone.id} phone={phone} from={from} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="search"
              title="No phones match these filters"
              message="Try removing a filter or searching for a different model."
            >
              <button className="btn btn--primary" onClick={() => setParams({}, { replace: true })}>
                Reset all filters
              </button>
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  )
}
