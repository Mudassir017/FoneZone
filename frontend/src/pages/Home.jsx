import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import AccessoryCard from '../components/AccessoryCard'
import SectionHeader from '../components/SectionHeader'
import ProductImage from '../components/ProductImage'
import BrandHoverRow from '../components/BrandHoverRow'
import { Spotlight } from '@/components/ui/spotlight'
import Icon from '../components/Icon'
import { BRANDS } from '../data/brands'
import { CONDITIONS } from '../data/conditions'
import { ACCESSORIES, ACCESSORY_CATEGORIES } from '../data/accessories'
import { PHONES } from '../data/phones'
import { countPhonesByBrand, phonesByCondition } from '../utils/catalog'
import { getStartingPrice } from '../utils/pricing'
import { phoneImage } from '../utils/images'
import { formatPrice } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import ComparisonCard from '../components/ComparisonCard'
import TrendingPhones from '../components/home/TrendingPhones'
import ShopByPrice from '../components/home/ShopByPrice'
import BrandGallery from '../components/home/BrandGallery'
import { POPULAR_COMPARISONS } from '../utils/specs'
import '../styles/home-sections.css'

const CONDITION_ICONS = { new: 'sparkle', refurbished: 'shield', used: 'refresh', recycled: 'leaf' }

const lowestFor = (conditionId) => {
  const prices = PHONES.filter((p) => p.conditions.includes(conditionId)).map((p) => getStartingPrice(p, [conditionId]).price)
  return prices.length ? Math.min(...prices) : null
}

const TRUST = [
  { icon: 'shield', title: '52-point quality check', text: 'Every pre-loved phone is inspected, graded and data-wiped.' },
  { icon: 'refresh', title: '7-day replacement', text: 'Not happy? Replacement or full refund within 7 days.' },
  { icon: 'card', title: 'No-cost EMI', text: 'Easy EMIs on major credit cards and pay-later options.' },
  { icon: 'leaf', title: 'Greener choice', text: 'Refurbished saves up to 80% of a phone’s carbon footprint.' },
]

const HERO = [
  { phone: 'galaxy-s25-ultra', color: 'Titanium Silverblue', cls: 'hero__img--left' },
  // Apple's newest flagship, in its new Burgundy finish
  { phone: 'iphone-18-pro-max', color: 'Burgundy', cls: 'hero__img--main' },
  { phone: 'pixel-10-pro', color: 'Moonstone', cls: 'hero__img--right' },
]

function Rail({ items }) {
  return (
    <div className="rail home-rail">
      {items.map(({ phone, from }) => (
        <ProductCard key={phone.id} phone={phone} from={from} />
      ))}
    </div>
  )
}

export default function Home() {
  useDocumentTitle()
  const refurbished = phonesByCondition('refurbished', 8)

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        {/* Aceternity "Spotlight": a soft glare that sweeps in behind the headline */}
        <Spotlight className="hero__spotlight" fill="#a9d4ff" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <h1>
              Every phone. Every brand. <span className="gradient-text">One destination.</span>
            </h1>
            <p className="hero__lead">
              The latest iPhone, Galaxy and Pixel, brand new or certified refurbished, with warranty and fast delivery.
            </p>
            <div className="hero__ctas">
              <Link to="/phones?condition=new" className="btn btn--primary btn--lg">
                Shop new phones
              </Link>
              <Link to="/phones?condition=refurbished" className="btn btn--light btn--lg">
                Explore refurbished
              </Link>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            {HERO.map((h) => (
              <ProductImage
                key={h.phone}
                image={phoneImage(h.phone, h.color)}
                alt=""
                className={`hero__img ${h.cls}`}
                sizes="(min-width: 960px) 30vw, 70vw"
                priority={h.cls.includes('hero__img--main')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Brands ---------- */}
      <section className="section">
        <div className="container">
          <SectionHeader title="Pick your favourite" linkTo="/brands" linkLabel="All brands" />
          <BrandHoverRow brands={BRANDS} countFor={countPhonesByBrand} />
        </div>
      </section>

      {/* ---------- Recent launches + Best sellers ---------- */}
      <TrendingPhones />

      {/* ---------- Shop by price ---------- */}
      <ShopByPrice />

      {/* ---------- Gallery: official brand films, Apple → Samsung → Pixel ---------- */}
      <BrandGallery />

      {/* ---------- Popular comparisons ---------- */}
      <section className="section home-vs">
        <div className="container">
          <SectionHeader
           
            title="Compare head-to-head"
            subtitle="Specs, cameras, battery and prices side by side."
            linkTo="/compare"
            linkLabel="Compare any phones"
          />
          <div className="vs-grid">
            {POPULAR_COMPARISONS.slice(0, 4).map((c) => (
              <ComparisonCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Refurbished ---------- */}
      <section className="section section--tint">
        <div className="container">
          <SectionHeader
           
            title="Certified refurbished"
            subtitle="Grade A, 12-month warranty, up to 30% below new."
            linkTo="/phones?condition=refurbished"
          />
          <Rail items={refurbished} />
        </div>
      </section>

      {/* ---------- Shop by condition ---------- */}
      <section className="section">
        <div className="container">
          <SectionHeader
           
            title="Shop by condition"
            subtitle="Same phone, four price points. Every option comes with a warranty."
          />
          <div className="condition-grid">
            {CONDITIONS.map((c) => {
              const from = lowestFor(c.id)
              return (
                <Link key={c.id} to={`/phones?condition=${c.id}`} className="condition-card" style={{ '--c': c.color }}>
                  <span className="condition-card__icon">
                    <Icon name={CONDITION_ICONS[c.id]} size={20} />
                  </span>
                  <h3>{c.label}</h3>
                  <p>{c.description}</p>
                  {from && (
                    <p className="condition-card__from">
                      From <strong>{formatPrice(from)}</strong>
                    </p>
                  )}
                  <span className="condition-card__warranty">
                    <Icon name="shield" size={14} /> {c.warranty}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- Sell / recycle banner ---------- */}
      <section className="section">
        <div className="container">
          <div className="promo-banner">
            <div className="promo-banner__copy">
              <h2>Sell or recycle your old phone</h2>
              <p>Instant quote, free doorstep pickup and instant payment. Not working? We recycle it responsibly.</p>
              <Link to="/sell" className="btn btn--light">
                Get instant quote <Icon name="chevronRight" size={16} />
              </Link>
            </div>
            <ProductImage image={phoneImage('iphone-15', 'Green')} alt="" className="promo-banner__img" sizes="240px" />
          </div>
        </div>
      </section>

      {/* ---------- Accessories ---------- */}
      <section className="section section--tint">
        <div className="container">
          <SectionHeader title="Accessories" linkTo="/accessories" />
          <div className="category-chips">
            {ACCESSORY_CATEGORIES.map((c) => (
              <Link key={c.id} to={`/accessories?category=${c.id}`} className="category-chip">
                <Icon name={c.icon} size={22} />
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
          <div className="rail home-rail">
            {ACCESSORIES.filter((a) => a.rating >= 4.5)
              .slice(0, 4)
              .map((a) => (
                <AccessoryCard key={a.id} accessory={a} />
              ))}
          </div>
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section className="section">
        <div className="container trust-grid">
          {TRUST.map((t) => (
            <div key={t.title} className="trust-item">
              <span className="trust-item__icon">
                <Icon name={t.icon} size={22} />
              </span>
              <div>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
