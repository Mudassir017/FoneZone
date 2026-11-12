import { useDeferredValue, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../Icon'
import { searchCatalog } from '../../utils/catalog'
import { getBrand } from '../../data/brands'
import ProductImage from '../ProductImage'
import { phoneImage } from '../../utils/images'
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'

// Example searches that rotate in the empty search box (all return results).
const PLACEHOLDERS = [
  'Search “iPhone 18 Pro Max”',
  'Search “Galaxy S25 Ultra”',
  'Search “Pixel 10 Pro”',
  'Search “iPhone Duo”',
  'Search “Galaxy Z Fold7”',
  'Search “MagSafe case”',
]

export default function SearchBar({ onNavigate }) {
  const [params] = useSearchParams()
  const initial = params.get('q') || ''
  const [query, setQuery] = useState(initial)
  const [open, setOpen] = useState(false)
  const deferred = useDeferredValue(query)
  const results = useMemo(() => searchCatalog(deferred), [deferred])
  const navigate = useNavigate()
  const listId = useId()
  const wrapRef = useRef(null)

  const hasResults = results.phones.length + results.accessories.length > 0
  const close = () => {
    setOpen(false)
    onNavigate?.()
  }

  const goToResults = (text) => {
    const q = (text ?? query).trim()
    if (!q) return
    close()
    navigate(`/phones?q=${encodeURIComponent(q)}`)
  }

  return (
    <div
      className="search"
      ref={wrapRef}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <PlaceholdersAndVanishInput
        placeholders={PLACEHOLDERS}
        defaultValue={initial}
        label="Search phones and accessories"
        icon={<Icon name="search" size={18} />}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onSubmit={goToResults}
        inputProps={{
          'aria-controls': listId,
          'aria-expanded': open && hasResults,
          'aria-autocomplete': 'list',
          onFocus: () => setOpen(true),
          onKeyDown: (e) => e.key === 'Escape' && setOpen(false),
        }}
      />

      {open && hasResults && (
        <div className="search__panel" id={listId}>
          {results.phones.length > 0 && (
            <>
              <p className="search__group">Phones</p>
              {results.phones.map((p) => (
                <Link key={p.id} to={`/phones/${p.id}`} className="search__item" onClick={close}>
                  <ProductImage image={phoneImage(p.id, p.colors[0].name)} alt="" className="search__thumb" sizes="40px" />
                  <span>
                    {p.name}
                    <small>{getBrand(p.brand)?.name}</small>
                  </span>
                </Link>
              ))}
            </>
          )}
          {results.accessories.length > 0 && (
            <>
              <p className="search__group">Accessories</p>
              {results.accessories.map((a) => (
                <Link key={a.id} to={`/accessories/${a.id}`} className="search__item" onClick={close}>
                  <Icon name="box" size={16} />
                  <span>
                    {a.name}
                    <small>{a.brand}</small>
                  </span>
                </Link>
              ))}
            </>
          )}
          <button type="button" className="search__all" onClick={() => goToResults()}>
            See all phone results for “{query.trim()}”
          </button>
        </div>
      )}
    </div>
  )
}
