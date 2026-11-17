// Catalogue queries. These are synchronous over local data for the draft;
// swap the implementations for API calls (keeping the same signatures) when
// the backend is ready.
import { PHONES, getPhone } from '../data/phones'
import { ACCESSORIES, getAccessory } from '../data/accessories'
import { BRAND_MAP } from '../data/brands'
import { CONDITION_MAP } from '../data/conditions'
import { getPhonePrice, getStartingPrice } from './pricing'
import { formatStorage } from './format'

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Customer Rating' },
  { id: 'newest', label: 'Newest First' },
  { id: 'discount', label: 'Biggest Discount' },
]

export const PRICE_BUCKETS = [
  { id: '0-20000', label: 'Under ₹20,000', min: 0, max: 20000 },
  { id: '20000-40000', label: '₹20,000 – ₹40,000', min: 20000, max: 40000 },
  { id: '40000-70000', label: '₹40,000 – ₹70,000', min: 40000, max: 70000 },
  { id: '70000-100000', label: '₹70,000 – ₹1,00,000', min: 70000, max: 100000 },
  { id: '100000-', label: 'Above ₹1,00,000', min: 100000, max: Infinity },
]

// Extra ranges used by the home page "Shop by price" cards. They work in the
// `?price=` URL like any bucket, but are only listed in the filter panel while
// one of them is the active filter (so the panel's own options don't overlap).
export const EXTRA_PRICE_BUCKETS = [
  { id: '10000-20000', label: '₹10,000 – ₹20,000', min: 10000, max: 20000 },
  { id: '70000-', label: '₹70,000 and above', min: 70000, max: Infinity },
]

export const getPriceBucket = (id) =>
  id ? PRICE_BUCKETS.find((b) => b.id === id) ?? EXTRA_PRICE_BUCKETS.find((b) => b.id === id) : undefined

/** Price options for the filter panel: the standard buckets plus the active extra range, if any. */
export const priceBucketOptions = (activeId) => {
  const extra = EXTRA_PRICE_BUCKETS.find((b) => b.id === activeId)
  return extra ? [...PRICE_BUCKETS, extra].sort((a, b) => a.min - b.min || a.max - b.max) : PRICE_BUCKETS
}

export const STORAGE_OPTIONS = [128, 256, 512, 1024]
export const RAM_OPTIONS = [6, 8, 12, 16]

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const phoneHaystack = (p) =>
  normalize(`${BRAND_MAP[p.brand]?.name} ${p.name} ${p.specs.processor} ${p.colors.map((c) => c.name).join(' ')}`)

export function matchesQuery(text, q) {
  if (!q) return true
  const terms = normalize(q).split(' ').filter(Boolean)
  return terms.every((t) => text.includes(t))
}

/**
 * Filter + sort phones.
 * @param {object} f { q, brands[], conditions[], price (bucket id), storage[], ram[], minRating, fiveG, sort }
 */
export function queryPhones(f = {}) {
  const bucket = getPriceBucket(f.price)

  let results = PHONES.filter((p) => {
    if (f.brands?.length && !f.brands.includes(p.brand)) return false
    if (f.conditions?.length && !p.conditions.some((c) => f.conditions.includes(c))) return false
    if (f.storage?.length && !p.variants.some((v) => f.storage.includes(v.storage))) return false
    if (f.ram?.length && !p.variants.some((v) => f.ram.includes(v.ram))) return false
    if (f.minRating && p.rating < f.minRating) return false
    if (f.fiveG && !p.is5G) return false
    if (f.q && !matchesQuery(phoneHaystack(p), f.q)) return false
    return true
  }).map((p) => ({ phone: p, from: getStartingPrice(p, f.conditions) }))

  if (bucket) results = results.filter((r) => r.from.price >= bucket.min && r.from.price < bucket.max)

  const sorters = {
    'price-asc': (a, b) => a.from.price - b.from.price,
    'price-desc': (a, b) => b.from.price - a.from.price,
    rating: (a, b) => b.phone.rating - a.phone.rating || b.phone.reviews - a.phone.reviews,
    newest: (a, b) => b.phone.year - a.phone.year,
    discount: (a, b) => b.from.discountPct - a.from.discountPct,
  }
  if (sorters[f.sort]) results.sort(sorters[f.sort])
  return results
}

export const phonesByTag = (tag, limit = 8) =>
  PHONES.filter((p) => p.tags.includes(tag))
    .slice(0, limit)
    .map((p) => ({ phone: p, from: getStartingPrice(p) }))

export const phonesByCondition = (conditionId, limit = 8) =>
  PHONES.filter((p) => p.conditions.includes(conditionId))
    .slice(0, limit)
    .map((p) => ({ phone: p, from: getStartingPrice(p, [conditionId]) }))

export const similarPhones = (phone, limit = 4) => {
  const base = getStartingPrice(phone).price
  return PHONES.filter((p) => p.id !== phone.id)
    .map((p) => ({ phone: p, from: getStartingPrice(p) }))
    .sort((a, b) => {
      const brandBias = (x) => (x.phone.brand === phone.brand ? -0.15 : 0)
      return Math.abs(a.from.price - base) / base + brandBias(a) - (Math.abs(b.from.price - base) / base + brandBias(b))
    })
    .slice(0, limit)
}

export const countPhonesByBrand = (brandId) => PHONES.filter((p) => p.brand === brandId).length
export const countPhonesByCondition = (conditionId) => PHONES.filter((p) => p.conditions.includes(conditionId)).length

// ---------------- Accessories ----------------
export function queryAccessories({ q, category, brand, sort } = {}) {
  let list = ACCESSORIES.filter((a) => {
    if (category && a.category !== category) return false
    if (brand && !(a.compatibleBrands.includes('all') || a.compatibleBrands.includes(brand))) return false
    if (q && !matchesQuery(normalize(`${a.name} ${a.brand} ${a.category}`), q)) return false
    return true
  })
  const sorters = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    discount: (a, b) => b.mrp - b.price - (a.mrp - a.price),
  }
  if (sorters[sort]) list = [...list].sort(sorters[sort])
  return list
}

export const compatibleAccessories = (phone, limit = 4) =>
  ACCESSORIES.filter((a) => a.compatibleBrands.includes(phone.brand))
    .concat(ACCESSORIES.filter((a) => a.compatibleBrands.includes('all')))
    .slice(0, limit)

// ---------------- Search ----------------
export function searchCatalog(q, limit = 6) {
  if (!q || q.trim().length < 2) return { phones: [], accessories: [] }
  return {
    phones: PHONES.filter((p) => matchesQuery(phoneHaystack(p), q)).slice(0, limit),
    accessories: ACCESSORIES.filter((a) => matchesQuery(normalize(`${a.name} ${a.brand}`), q)).slice(0, 3),
  }
}

// ---------------- Cart line resolution ----------------
/**
 * Cart items store only the customer's selection; price and display data are
 * always resolved from the catalogue so they never go stale.
 */
export function resolveLine(item) {
  if (item.type === 'phone') {
    const phone = getPhone(item.productId)
    if (!phone) return null
    const variant = phone.variants[item.variantIndex] ?? phone.variants[0]
    const color = phone.colors.find((c) => c.name === item.color) ?? phone.colors[0]
    const condition = CONDITION_MAP[item.condition] ?? CONDITION_MAP.new
    const { price, mrp } = getPhonePrice(phone, item.variantIndex, condition.id)
    return {
      ...item,
      product: phone,
      name: phone.name,
      details: `${variant.ram}GB RAM · ${formatStorage(variant.storage)} · ${color.name}`,
      condition,
      color,
      unitPrice: price,
      unitMrp: mrp,
      href: `/phones/${phone.id}`,
    }
  }
  const a = getAccessory(item.productId)
  if (!a) return null
  const color = a.colors.find((c) => c.name === item.color) ?? a.colors[0]
  return {
    ...item,
    product: a,
    name: a.name,
    details: [a.brand, color?.name].filter(Boolean).join(' · '),
    color,
    unitPrice: a.price,
    unitMrp: a.mrp,
    href: `/accessories/${a.id}`,
  }
}

export const lineKey = ({ type, productId, variantIndex = 0, color = '', condition = '' }) =>
  [type, productId, variantIndex, color, condition].join('|')
