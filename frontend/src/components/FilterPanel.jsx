import { BRANDS } from '../data/brands'
import { CONDITIONS } from '../data/conditions'
import { priceBucketOptions, RAM_OPTIONS, STORAGE_OPTIONS } from '../utils/catalog'
import { formatStorage } from '../utils/format'

function Group({ title, children }) {
  return (
    <fieldset className="filter-group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  )
}

/**
 * Controlled filter panel. `filters` is the parsed URL state, `onToggle(key, value)`
 * toggles a multi-value filter, `onSet(key, value)` sets a single-value one.
 */
export default function FilterPanel({ filters, onToggle, onSet, onClear, activeCount }) {
  return (
    <div className="filters">
      <div className="filters__head">
        <h2>Filters</h2>
        {activeCount > 0 && (
          <button className="link-btn" onClick={onClear}>
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <Group title="Condition">
        {CONDITIONS.map((c) => (
          <label key={c.id} className="check">
            <input type="checkbox" checked={filters.conditions.includes(c.id)} onChange={() => onToggle('condition', c.id)} />
            <span className="dot" style={{ background: c.color }} />
            {c.label}
          </label>
        ))}
      </Group>

      <Group title="Brand">
        <div className="filter-scroll">
          {BRANDS.map((b) => (
            <label key={b.id} className="check">
              <input type="checkbox" checked={filters.brands.includes(b.id)} onChange={() => onToggle('brand', b.id)} />
              {b.name}
            </label>
          ))}
        </div>
      </Group>

      <Group title="Price">
        {priceBucketOptions(filters.price).map((b) => (
          <label key={b.id} className="check">
            <input
              type="radio"
              name="price"
              checked={filters.price === b.id}
              onChange={() => onSet('price', b.id)}
            />
            {b.label}
          </label>
        ))}
        {filters.price && (
          <button className="link-btn" onClick={() => onSet('price', '')}>
            Any price
          </button>
        )}
      </Group>

      <Group title="Storage">
        <div className="pill-options">
          {STORAGE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`pill ${filters.storage.includes(s) ? 'is-active' : ''}`}
              aria-pressed={filters.storage.includes(s)}
              onClick={() => onToggle('storage', String(s))}
            >
              {formatStorage(s)}
            </button>
          ))}
        </div>
      </Group>

      <Group title="RAM">
        <div className="pill-options">
          {RAM_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`pill ${filters.ram.includes(r) ? 'is-active' : ''}`}
              aria-pressed={filters.ram.includes(r)}
              onClick={() => onToggle('ram', String(r))}
            >
              {r}GB
            </button>
          ))}
        </div>
      </Group>

      <Group title="Customer rating">
        {[4.5, 4].map((r) => (
          <label key={r} className="check">
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === r}
              onChange={() => onSet('rating', String(r))}
            />
            {r}★ & above
          </label>
        ))}
      </Group>
    </div>
  )
}
