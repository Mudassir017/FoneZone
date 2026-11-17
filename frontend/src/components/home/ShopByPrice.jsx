import { Link } from 'react-router-dom'
import SectionHeader from '../SectionHeader'
import ProductImage from '../ProductImage'
import Icon from '../Icon'
import { getPriceBucket, queryPhones } from '../../utils/catalog'
import { phoneImage } from '../../utils/images'
import { formatPrice, pluralize } from '../../utils/format'

// Each card is one `?price=` bucket (see PRICE_BUCKETS / EXTRA_PRICE_BUCKETS in utils/catalog).
// `tone` picks the card's subtle tint (see .price-card--<tone> in home-sections.css).
const RANGES = [
  { id: '10000-20000', tier: 'Budget', range: '₹10,000 – ₹20,000', tone: 'budget' },
  { id: '20000-40000', tier: 'Mid-range', range: '₹20,000 – ₹40,000', tone: 'mid' },
  { id: '40000-70000', tier: 'Premium', range: '₹40,000 – ₹70,000', tone: 'premium' },
  { id: '70000-', tier: 'Flagship', range: '₹70,000 & above', tone: 'flagship' },
]

/** Three real product shots, fanned out; the middle one is the hero. */
function Stage({ phones }) {
  // Put the best-known model in the middle: [2nd, 1st, 3rd]
  const order = phones.length === 3 ? [phones[1], phones[0], phones[2]] : phones
  return (
    <div className="price-card__stage" aria-hidden="true">
      {order.map((phone) => (
        <ProductImage
          key={phone.id}
          image={phoneImage(phone.id, phone.colors[0].name)}
          alt=""
          sizes="(min-width: 960px) 120px, 96px"
          className="price-card__phone"
        />
      ))}
    </div>
  )
}

function PriceCard({ id, tier, range, tone, cheapest }) {
  // Same query the Shop page runs for /phones?price=<id>, so the count always matches.
  const results = queryPhones({ price: id, sort: 'price-asc' })
  const empty = results.length === 0

  if (empty) {
    // Nothing in this range yet: show our most affordable phones instead, clearly labelled.
    return (
      <Link to="/phones?sort=price-asc" className={`price-card price-card--${tone} is-empty`}>
        <Stage phones={cheapest.map((r) => r.phone)} />
        <div className="price-card__body">
          <h3 className="price-card__tier">{tier}</h3>
          <p className="price-card__range">{range}</p>
          <p className="price-card__meta">
            None in this range right now. Our most affordable phones start at{' '}
            <strong>{formatPrice(cheapest[0]?.from.price)}</strong>.
          </p>
          <span className="price-card__cta">
            See most affordable <Icon name="chevronRight" size={16} />
          </span>
        </div>
      </Link>
    )
  }

  const from = results[0].from.price
  const faces = [...results].sort((a, b) => b.phone.reviews - a.phone.reviews).slice(0, 3)

  return (
    <Link to={`/phones?price=${id}`} className={`price-card price-card--${tone}`}>
      <Stage phones={faces.map((r) => r.phone)} />
      <div className="price-card__body">
        <h3 className="price-card__tier">{tier}</h3>
        <p className="price-card__range">{range}</p>
        <p className="price-card__meta">
          <strong>{pluralize(results.length, 'phone')}</strong>
          <span aria-hidden="true"> · </span>
          <span className="visually-hidden">, </span>from <strong>{formatPrice(from)}</strong>
        </p>
        <span className="price-card__cta">
          Shop {tier.toLowerCase()} <Icon name="chevronRight" size={16} />
        </span>
      </div>
    </Link>
  )
}

export default function ShopByPrice() {
  const ranges = RANGES.filter((r) => getPriceBucket(r.id))
  const cheapest = queryPhones({ sort: 'price-asc' }).slice(0, 3)

  return (
    <section className="section shop-by-price">
      <div className="container">
        <SectionHeader
          title="Phones for every budget"
          subtitle="Starting prices across new, refurbished and pre-owned stock."
          linkTo="/phones?sort=price-asc"
          linkLabel="All phones"
        />
        <div className="price-grid">
          {ranges.map((r) => (
            <PriceCard key={r.id} {...r} cheapest={cheapest} />
          ))}
        </div>
      </div>
    </section>
  )
}
