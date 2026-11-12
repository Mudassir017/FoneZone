// Brand catalogue. Only `active` brands are shown in the store; the rest stay
// here so they can be switched on later without re-entering data.
// Logos are intentionally not bundled (use officially licensed brand assets).
const ALL_BRANDS = [
  { id: 'apple', name: 'Apple', tagline: 'iPhone 17 Pro, iPhone Air & more', accent: '#1d1d1f', hero: { phone: 'iphone-17-pro', color: 'Cosmic Orange' }, active: true },
  { id: 'samsung', name: 'Samsung', tagline: 'Galaxy S, Z Fold, Z Flip & A series', accent: '#1428a0', hero: { phone: 'galaxy-s25-ultra', color: 'Titanium Silverblue' }, active: true },
  { id: 'google', name: 'Google Pixel', tagline: 'Pixel 10 Pro, Pixel 10 & Pixel 9a', accent: '#4285f4', hero: { phone: 'pixel-10-pro', color: 'Moonstone' }, active: true },
  { id: 'oneplus', name: 'OnePlus', tagline: 'Flagship & Nord', accent: '#eb0028' },
  { id: 'xiaomi', name: 'Xiaomi', tagline: 'Xiaomi & Redmi', accent: '#ff6900' },
  { id: 'vivo', name: 'Vivo', tagline: 'X & V series', accent: '#415fff' },
  { id: 'oppo', name: 'OPPO', tagline: 'Find & Reno', accent: '#1f8a4c' },
  { id: 'nothing', name: 'Nothing', tagline: 'Glyph interface', accent: '#111111' },
  { id: 'motorola', name: 'Motorola', tagline: 'Edge & Razr', accent: '#5c6bc0' },
  { id: 'realme', name: 'realme', tagline: 'GT & Number series', accent: '#d4a800' },
  { id: 'iqoo', name: 'iQOO', tagline: 'Performance phones', accent: '#f5a400' },
  { id: 'poco', name: 'POCO', tagline: 'Value flagships', accent: '#ffcc00' },
]

// `let` exports are live bindings: setBrands() swaps in API data at startup.
export let BRANDS = ALL_BRANDS.filter((b) => b.active)
export let ACTIVE_BRAND_IDS = BRANDS.map((b) => b.id)
export let BRAND_MAP = Object.fromEntries(ALL_BRANDS.map((b) => [b.id, b]))

/** Merge brands from the API with local presentation config (hero image, active flag). */
export function setBrands(serverBrands) {
  const local = Object.fromEntries(ALL_BRANDS.map((b) => [b.id, b]))
  const merged = serverBrands.map((b) => {
    const l = local[b.id] || {}
    return { ...l, ...b, hero: l.hero, active: typeof b.active === 'boolean' ? b.active : Boolean(l.active), name: l.active ? l.name : b.name, tagline: l.tagline || b.tagline }
  })
  // Keep local entries for brands the API no longer returns (hidden brands) so
  // lookups for old carts/orders and accessory compatibility still resolve.
  BRAND_MAP = { ...local, ...Object.fromEntries(merged.map((b) => [b.id, b])) }
  BRANDS = merged.filter((b) => b.active)
  ACTIVE_BRAND_IDS = BRANDS.map((b) => b.id)
}

export const getBrand = (id) => BRAND_MAP[id]
