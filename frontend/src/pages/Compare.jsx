import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductImage from '../components/ProductImage'
import PhonePicker from '../components/PhonePicker'
import Icon from '../components/Icon'
import { useShortlist, MAX_COMPARE } from '../context/ShortlistContext'
import { useToast } from '../context/ToastContext'
import { getPhone } from '../data/phones'
import { getBrand } from '../data/brands'
import { getStartingPrice } from '../utils/pricing'
import { CONDITION_MAP } from '../data/conditions'
import { phoneImage } from '../utils/images'
import { formatPrice } from '../utils/format'
import { POPULAR_COMPARISONS, SPEC_GROUPS, bestIndexes, isDifferent } from '../utils/specs'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import ComparisonCard from '../components/ComparisonCard'

export default function Compare() {
  const [params, setParams] = useSearchParams()
  const { compare, setCompareList } = useShortlist()
  const { toast } = useToast()
  const [picking, setPicking] = useState(null) // slot index being filled/replaced
  const [onlyDiff, setOnlyDiff] = useState(false)

  // URL (?phones=a,b) wins so comparisons are shareable; otherwise use the saved tray.
  const fromUrl = params.get('phones')
  const ids = (fromUrl !== null ? fromUrl.split(',') : compare).filter((id) => getPhone(id)).slice(0, MAX_COMPARE)
  const phones = ids.map(getPhone)
  useDocumentTitle(phones.length >= 2 ? phones.map((p) => p.name).join(' vs ') : 'Compare phones')

  const setIds = useCallback(
    (next) => {
      setCompareList(next)
      setParams(next.length ? { phones: next.join(',') } : {}, { replace: true })
    },
    [setCompareList, setParams],
  )

  const pick = (id) => {
    const next = [...ids]
    if (picking < next.length) next[picking] = id
    else next.push(id)
    setIds(next)
    setPicking(null)
  }
  const remove = (i) => setIds(ids.filter((_, j) => j !== i))
  const closePicker = useCallback(() => setPicking(null), [])

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast('Comparison link copied')
    } catch {
      toast('Copy the address bar link to share', { type: 'info' })
    }
  }

  const slots = [...phones, ...Array(Math.max(0, Math.min(MAX_COMPARE, Math.max(2, phones.length + 1)) - phones.length)).fill(null)]
  const cols = { '--cols': slots.length }

  return (
    <div className="container page compare">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Compare' }]} />
      <div className="compare__head">
        <div>
          <h1 className="page-title">Compare phones</h1>
          <p className="muted">Pick up to {MAX_COMPARE} phones from any brand and see every difference side by side.</p>
        </div>
        {phones.length >= 2 && (
          <div className="compare__tools">
            <label className="switch">
              <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
              <span className="switch__track" aria-hidden="true" />
              Show only differences
            </label>
            <button className="btn btn--ghost btn--sm" onClick={share}>
              Share
            </button>
          </div>
        )}
      </div>

      {/* Sticky product header */}
      <div className="compare__slots" style={cols}>
        {slots.map((p, i) =>
          p ? (
            <div key={p.id} className="slot">
              <button className="icon-btn slot__remove" onClick={() => remove(i)} aria-label={`Remove ${p.name}`}>
                <Icon name="close" size={16} />
              </button>
              <Link to={`/phones/${p.id}`} className="slot__img">
                <ProductImage image={phoneImage(p.id, p.colors[0].name)} alt={p.name} sizes="(min-width: 960px) 200px, 30vw" />
              </Link>
              <p className="slot__brand">{getBrand(p.brand)?.name}</p>
              <Link to={`/phones/${p.id}`} className="slot__name">
                {p.name}
              </Link>
              <p className="slot__price">
                From {formatPrice(getStartingPrice(p).price)}
                {getStartingPrice(p).conditionId !== 'new' && <span className="slot__cond"> · {CONDITION_MAP[getStartingPrice(p).conditionId]?.short}</span>}
              </p>
              <div className="slot__actions">
                <Link to={`/phones/${p.id}#buy`} className="btn btn--primary btn--sm">
                  Buy
                </Link>
                <button className="link-btn small" onClick={() => setPicking(i)}>
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button key={`empty-${i}`} className="slot slot--empty" onClick={() => setPicking(i)}>
              <span className="slot__plus">
                <Icon name="plus" size={26} />
              </span>
              Add a phone
            </button>
          ),
        )}
      </div>

      {phones.length >= 2 ? (
        <div className="spec-compare" style={cols}>
          {SPEC_GROUPS.map((group) => {
            const rows = group.rows.filter((r) => !onlyDiff || isDifferent(r, phones))
            if (!rows.length) return null
            return (
              <section key={group.title} className="spec-group">
                <h2 className="spec-group__title">{group.title}</h2>
                {rows.map((row) => {
                  const best = bestIndexes(row, phones)
                  const diff = isDifferent(row, phones)
                  return (
                    <div key={row.label} className={`spec-row ${diff ? 'is-diff' : ''}`}>
                      <div className="spec-row__label">{row.label}</div>
                      <div className="spec-row__values">
                        {slots.map((p, i) => (
                          <div key={p?.id || i} className={`spec-row__cell ${best.includes(i) ? 'is-best' : ''}`}>
                            {p ? (
                              <>
                                {row.swatches && (
                                  <span className="spec-swatches">
                                    {p.colors.map((c) => (
                                      <span key={c.name} className="swatch-dot" style={{ background: c.hex }} title={c.name} />
                                    ))}
                                  </span>
                                )}
                                {row.display(p)}
                                {best.includes(i) && <span className="best-tag">Best</span>}
                              </>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </section>
            )
          })}
          {onlyDiff && SPEC_GROUPS.every((g) => g.rows.every((r) => !isDifferent(r, phones))) && (
            <p className="muted center">These phones are identical on every listed spec.</p>
          )}
        </div>
      ) : (
        <p className="compare__hint">
          <Icon name="compare" size={18} /> Add {phones.length ? 'one more phone' : 'two or more phones'} to see the full spec comparison.
        </p>
      )}

      <section className="section compare__popular">
        <h2 className="section-title">Popular comparisons</h2>
        <div className="vs-grid">
          {POPULAR_COMPARISONS.map((c) => (
            <ComparisonCard key={c.title} {...c} />
          ))}
        </div>
      </section>

      {picking !== null && <PhonePicker exclude={ids} onPick={pick} onClose={closePicker} />}
    </div>
  )
}
