import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import ProductImage from './ProductImage'
import { PHONES } from '../data/phones'
import { BRANDS, getBrand } from '../data/brands'
import { phoneImage } from '../utils/images'
import { getStartingPrice } from '../utils/pricing'
import { matchesQuery } from '../utils/catalog'
import { formatPrice } from '../utils/format'

/** Modal to pick a phone for comparison (search + brand filter). */
export default function PhonePicker({ exclude = [], onPick, onClose }) {
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const list = useMemo(
    () =>
      PHONES.filter(
        (p) =>
          (!brand || p.brand === brand) &&
          matchesQuery(`${getBrand(p.brand)?.name} ${p.name}`.toLowerCase(), q),
      ),
    [q, brand],
  )

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Choose a phone to compare">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel picker">
        <div className="picker__head">
          <h2>Add a phone</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="search picker__search">
          <Icon name="search" size={18} className="search__icon" />
          <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by model, e.g. S25 Ultra" aria-label="Search phones" />
        </div>
        <div className="picker__brands">
          {[{ id: '', name: 'All' }, ...BRANDS].map((b) => (
            <button key={b.id || 'all'} className={`pill ${brand === b.id ? 'is-active' : ''}`} onClick={() => setBrand(b.id)}>
              {b.name}
            </button>
          ))}
        </div>
        <ul className="picker__list">
          {list.map((p) => {
            const taken = exclude.includes(p.id)
            return (
              <li key={p.id}>
                <button className="picker__item" disabled={taken} onClick={() => onPick(p.id)}>
                  <ProductImage image={phoneImage(p.id, p.colors[0].name)} alt="" sizes="56px" className="picker__img" />
                  <span className="picker__text">
                    <small>{getBrand(p.brand)?.name}</small>
                    <strong>{p.name}</strong>
                    <span>From {formatPrice(getStartingPrice(p).price)}</span>
                  </span>
                  <span className="picker__action">{taken ? 'Added' : <Icon name="plus" size={18} />}</span>
                </button>
              </li>
            )
          })}
          {!list.length && <li className="muted center picker__empty">No phones match “{q}”.</li>}
        </ul>
      </div>
    </div>
  )
}
