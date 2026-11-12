import { Link, useParams } from 'react-router-dom'
import ProductImage from '../components/ProductImage'
import FilmPlayer from '../components/FilmPlayer'
import Icon from '../components/Icon'
import NotFound from './NotFound'
import ComparisonCard from '../components/ComparisonCard'
import { BRAND_MAP } from '../data/brands'
import { PHONES } from '../data/phones'
import { filmsForBrand, filmsForPhone } from '../data/media'
import { useShortlistActions } from '../hooks/useShortlistActions'
import { getStartingPrice, emiPerMonth } from '../utils/pricing'
import { phoneImage } from '../utils/images'
import { formatPrice } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function LineupCard({ phone }) {
  const { isCompared, toggleCompare } = useShortlistActions()
  const from = getStartingPrice(phone)
  const isNew = phone.tags.includes('new-launch')
  return (
    <article className="lineup-card">
      <Link to={`/phones/${phone.id}`} className="lineup-card__media" tabIndex={-1} aria-hidden="true">
        {isNew && <span className="lineup-card__new">New</span>}
        <ProductImage image={phoneImage(phone.id, phone.colors[0].name)} alt="" sizes="(min-width: 960px) 25vw, 70vw" />
      </Link>
      <div className="lineup-card__body">
        <div className="lineup-card__dots" aria-label={`${phone.colors.length} colours`}>
          {phone.colors.map((c) => (
            <span key={c.name} className="swatch-dot" style={{ background: c.hex }} title={c.name} />
          ))}
        </div>
        <h3>
          <Link to={`/phones/${phone.id}`}>{phone.name}</Link>
        </h3>
        <p className="lineup-card__tag">{phone.highlights[0]}</p>
        <p className="lineup-card__price">
          From {formatPrice(from.price)} <span>or {formatPrice(emiPerMonth(from.price))}/mo.</span>
        </p>
        <div className="lineup-card__actions">
          <Link to={`/phones/${phone.id}#buy`} className="btn btn--primary btn--sm">
            Buy
          </Link>
          <Link to={`/phones/${phone.id}#overview`} className="btn btn--outline btn--sm">
            Learn more
          </Link>
        </div>
        <label className="compare-check">
          <input type="checkbox" checked={isCompared(phone.id)} onChange={() => toggleCompare(phone.id, phone.name)} />
          Compare
        </label>
      </div>
    </article>
  )
}

export default function BrandStore() {
  const { id } = useParams()
  const brand = BRAND_MAP[id]
  const phones = PHONES.filter((p) => p.brand === id)
  useDocumentTitle(brand ? `${brand.name} phones` : 'Brand')
  if (!brand || !phones.length) return <NotFound message="We don’t sell this brand yet." />

  const brandFilm = filmsForBrand(id)[0] || phones.map((p) => filmsForPhone(p.id)[0]).find(Boolean)
  // One film per phone, skipping videos already used by another model (e.g. 17 Pro and 17 Pro Max share films)
  const films = phones
    .flatMap((p) => filmsForPhone(p.id).slice(0, 1).map((f) => ({ ...f, phone: p })))
    .filter((f, i, all) => all.findIndex((g) => g.id === f.id) === i)
  const hero = phones.find((p) => p.id === brand.hero?.phone) ?? phones[0]
  const compareIds = phones.slice(0, Math.min(3, phones.length)).map((p) => p.id)

  return (
    <div className="brand-store">
      <section className="brand-hero">
        <div className="container brand-hero__inner">
          <div className="brand-hero__copy">
            <h1>{brand.name}</h1>
            <p>{brand.tagline}. Brand new with full warranty, or certified refurbished for less.</p>
            <div className="hero__ctas">
              <a href="#lineup" className="btn btn--light btn--lg">
                Explore the line-up
              </a>
              <Link to={`/compare?phones=${compareIds.join(',')}`} className="btn btn--ghost-light btn--lg">
                Compare models
              </Link>
            </div>
          </div>
          <div className="brand-hero__media">
            {brandFilm ? (
              <FilmPlayer film={brandFilm} label={`Official film · ${brandFilm.channel}`} />
            ) : (
              <ProductImage image={phoneImage(hero.id, brand.hero?.color || hero.colors[0].name)} alt={hero.name} priority sizes="(min-width: 960px) 45vw, 90vw" />
            )}
          </div>
        </div>
      </section>

      <section className="section" id="lineup">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Explore the full line-up.</h2>
              <p className="section-header__sub">{phones.length} models · every colour · new & refurbished</p>
            </div>
            <Link to={`/phones?brand=${id}`} className="link-arrow">
              Shop all <Icon name="chevronRight" size={16} />
            </Link>
          </div>
          <div className="rail rail--lineup">
            {phones.map((p) => (
              <LineupCard key={p.id} phone={p} />
            ))}
          </div>
        </div>
      </section>

      {films.length > 0 && (
        <section className="section section--dark">
          <div className="container">
            <div className="section-header">
              <div>
                <h2>Watch the films.</h2>
                <p className="section-header__sub">Official films from {brand.name}.</p>
              </div>
            </div>
            <div className="rail rail--films">
              {films.map((f) => (
                <FilmPlayer key={f.id} film={f} label={f.phone.name} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section--tint">
        <div className="container">
          <div className="section-header">
            <h2>Which {brand.name} is right for you?</h2>
            <Link to={`/compare?phones=${compareIds.join(',')}`} className="link-arrow">
              Compare all <Icon name="chevronRight" size={16} />
            </Link>
          </div>
          <div className="vs-grid">
            {phones.length >= 2 && <ComparisonCard title={`${brand.name} line-up compared`} ids={compareIds} />}
            {phones.slice(0, 2).map((p) => {
              const rival = PHONES.find((o) => o.brand !== id && Math.abs(getStartingPrice(o).price - getStartingPrice(p).price) < 25000)
              return rival ? <ComparisonCard key={p.id} title={`${p.name} vs ${rival.name}`} ids={[p.id, rival.id]} /> : null
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
