import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../ProductCard'
import Icon from '../Icon'
import { BRANDS } from '../../data/brands'
import { PHONES } from '../../data/phones'
import { getStartingPrice } from '../../utils/pricing'

// Up to 12 phones per tab: three swipes on a phone, three "pages" of four on desktop.
const LIMIT = 12

/**
 * Rank phones, then deal them out brand by brand (Apple, Samsung, Pixel, Apple…)
 * so every brand's top models appear near the front of the rail.
 */
function pickByBrand(phones, rank, limit = LIMIT) {
  const queues = BRANDS.map((b) => phones.filter((p) => p.brand === b.id).sort(rank))
  const picked = []
  while (picked.length < limit && queues.some((q) => q.length)) {
    for (const q of queues) if (q.length && picked.length < limit) picked.push(q.shift())
  }
  return picked.map((p) => ({ phone: p, from: getStartingPrice(p) }))
}

const tagged = (p, tag) => (p.tags.includes(tag) ? 1 : 0)

// Recent launches: tagged launches first, then the newest models.
const byLaunch = (a, b) => tagged(b, 'new-launch') - tagged(a, 'new-launch') || b.year - a.year || b.reviews - a.reviews
// Best sellers: tagged best sellers first, then by number of customer reviews (our sales proxy).
const bySales = (a, b) => tagged(b, 'bestseller') - tagged(a, 'bestseller') || b.reviews - a.reviews

// "Recent" = tagged as a launch, or from the latest two model years in the catalogue.
const recent = () => {
  const latest = Math.max(...PHONES.map((p) => p.year))
  return PHONES.filter((p) => p.tags.includes('new-launch') || p.year >= latest - 1)
}

const TABS = [
  {
    id: 'launches',
    label: 'Recent launches',
    linkTo: '/phones?sort=newest',
    note: 'The newest iPhone, Galaxy and Pixel models, in stock now.',
    pick: () => pickByBrand(recent(), byLaunch),
  },
  {
    id: 'bestsellers',
    label: 'Best sellers',
    linkTo: '/phones?sort=rating',
    note: 'What customers are buying most from each brand.',
    pick: () => pickByBrand(PHONES, bySales),
  },
]

/** Prev/next state for a horizontally scrolling rail. */
function useRailScroll(railRef, resetKey) {
  const [edges, setEdges] = useState({ start: true, end: true })

  const update = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 })
  }, [railRef])

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    el.scrollLeft = 0
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [railRef, update, resetKey])

  const page = (dir) => {
    const el = railRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
  }

  return { ...edges, page }
}

/** "Recent launches" + "Best sellers" in one section, as accessible tabs. */
export default function TrendingPhones() {
  const [active, setActive] = useState(TABS[0].id)
  const tabRefs = useRef({})
  const railRef = useRef(null)
  const uid = useId()
  const activeIndex = TABS.findIndex((t) => t.id === active)
  const current = TABS[activeIndex]
  const items = current.pick()
  const rail = useRailScroll(railRef, active)

  const onKeyDown = (e) => {
    let next = null
    if (e.key === 'ArrowRight') next = TABS[(activeIndex + 1) % TABS.length]
    if (e.key === 'ArrowLeft') next = TABS[(activeIndex - 1 + TABS.length) % TABS.length]
    if (e.key === 'Home') next = TABS[0]
    if (e.key === 'End') next = TABS[TABS.length - 1]
    if (!next) return
    e.preventDefault()
    setActive(next.id)
    tabRefs.current[next.id]?.focus()
  }

  return (
    <section className="section section--tint trending" aria-labelledby={`${uid}-title`}>
      <div className="container">
        <div className="section-header trending__header">
          <div>
            <h2 id={`${uid}-title`}>New &amp; trending phones</h2>
            <p className="section-header__sub">{current.note}</p>
          </div>
          <Link to={current.linkTo} className="link-arrow">
            View all <span className="visually-hidden">{current.label.toLowerCase()}</span>
            <Icon name="chevronRight" size={16} />
          </Link>
        </div>

        <div className="trending__bar">
          {/* Segmented control: equal-width segments with a sliding "thumb" behind the active one */}
          <div
            className="segmented"
            role="tablist"
            aria-label="Phone collections"
            onKeyDown={onKeyDown}
            style={{ '--count': TABS.length, '--index': activeIndex }}
          >
            <span className="segmented__thumb" aria-hidden="true" />
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${t.id}`}
                aria-controls={`${uid}-panel`}
                aria-selected={t.id === active}
                tabIndex={t.id === active ? 0 : -1}
                className={`segmented__option ${t.id === active ? 'is-active' : ''}`}
                onClick={() => setActive(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Hidden when everything already fits (CSS hides it on touch-size screens too) */}
          <div className={`rail-nav ${rail.start && rail.end ? 'is-idle' : ''}`}>
            <button
              type="button"
              className="rail-nav__btn"
              onClick={() => rail.page(-1)}
              disabled={rail.start}
              aria-label="Previous phones"
            >
              <Icon name="chevronLeft" size={18} />
            </button>
            <button
              type="button"
              className="rail-nav__btn"
              onClick={() => rail.page(1)}
              disabled={rail.end}
              aria-label="More phones"
            >
              <Icon name="chevronRight" size={18} />
            </button>
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${uid}-panel`}
          aria-labelledby={`${uid}-tab-${active}`}
          className="trending__panel"
        >
          <div ref={railRef} className="rail home-rail trending__rail">
            {items.map(({ phone, from }) => (
              <ProductCard key={phone.id} phone={phone} from={from} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
