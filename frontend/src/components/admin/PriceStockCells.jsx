import { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'

const same = (a, b) => Number(a) === Number(b)

/**
 * Inline editor cells (price, MRP, stock, save) for a SKU or accessory row.
 * Render it with key={`${id}:${price}:${mrp}:${stock}`} so a fresh server value resets the draft.
 * onSave(patch) receives only the changed fields plus expectedStock (the stock the admin saw), so
 * the server can refuse the edit if an order changed the stock in the meantime.
 */
export default function PriceStockCells({ item, onSave, label }) {
  const [draft, setDraft] = useState({ price: String(item.price), mrp: String(item.mrp), stock: String(item.stock) })
  const [busy, setBusy] = useState(false)

  const errors = {
    price: !(Number(draft.price) >= 1) ? 'Enter a price' : Number(draft.price) > Number(draft.mrp) ? 'Price is above MRP' : null,
    mrp: !(Number(draft.mrp) >= 1) ? 'Enter the MRP' : null,
    stock: !/^\d+$/.test(draft.stock) || Number(draft.stock) > 100000 ? 'Whole number 0–100000' : null,
  }
  const dirty = {
    price: !same(draft.price, item.price),
    mrp: !same(draft.mrp, item.mrp),
    stock: !same(draft.stock, item.stock),
  }
  const anyDirty = dirty.price || dirty.mrp || dirty.stock
  const invalid = Object.values(errors).some(Boolean)

  const save = async () => {
    const patch = { expectedStock: item.stock }
    if (dirty.price) patch.price = Number(draft.price)
    if (dirty.mrp) patch.mrp = Number(draft.mrp)
    if (dirty.stock) patch.stock = Number(draft.stock)
    setBusy(true)
    try {
      await onSave(patch)
    } finally {
      setBusy(false)
    }
  }

  const input = (field, cls) => (
    <input
      className={`adm-input ${cls}${dirty[field] ? ' is-dirty' : ''}${errors[field] && dirty[field] ? ' is-invalid' : ''}`}
      inputMode={field === 'stock' ? 'numeric' : 'decimal'}
      value={draft[field]}
      title={errors[field] || undefined}
      aria-label={`${label} ${field}`}
      aria-invalid={Boolean(errors[field])}
      onChange={(e) => setDraft({ ...draft, [field]: e.target.value.replace(/[^\d.]/g, '') })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && anyDirty && !invalid) save()
        if (e.key === 'Escape') setDraft({ price: String(item.price), mrp: String(item.mrp), stock: String(item.stock) })
      }}
    />
  )

  return (
    <>
      <td className="right">{input('price', 'adm-input--sm')}</td>
      <td className="right">{input('mrp', 'adm-input--sm')}</td>
      <td className="right">{input('stock', 'adm-input--xs')}</td>
      <td className="right nowrap">
        {anyDirty ? (
          <span className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
            <button type="button" className="adm-btn adm-btn--sm adm-btn--primary" onClick={save} disabled={busy || invalid}
              title={invalid ? Object.values(errors).filter(Boolean).join(', ') : 'Save (Enter)'}>
              <Save /> {busy ? '…' : 'Save'}
            </button>
            <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" aria-label="Undo changes" disabled={busy}
              onClick={() => setDraft({ price: String(item.price), mrp: String(item.mrp), stock: String(item.stock) })}>
              <RotateCcw />
            </button>
          </span>
        ) : (
          <span className="muted small">—</span>
        )}
      </td>
    </>
  )
}
