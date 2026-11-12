// Spec rows for the comparison table. Every value is derived from catalogue
// data (no extra facts), so the table stays in sync with the API.
// `value` is used for difference detection and "best" ranking; `display`
// renders the cell. `best: 'min' | 'max'` marks the winning phone(s).
import { CONDITION_MAP } from '../data/conditions'
import { getStartingPrice } from './pricing'
import { formatCount, formatPrice, formatStorage } from './format'

const uniq = (arr) => [...new Set(arr)]
const num = (s) => {
  const m = String(s ?? '').match(/[\d.]+/)
  return m ? Number(m[0]) : null
}

export const SPEC_GROUPS = [
  {
    title: 'Overview',
    rows: [
      // Compare like with like: brand-new price first, then cheapest condition separately.
      {
        label: 'Price (brand new)',
        value: (p) => (p.conditions.includes('new') ? getStartingPrice(p, ['new'])?.price : null),
        display: (p) => (p.conditions.includes('new') ? formatPrice(getStartingPrice(p, ['new']).price) : 'Not sold new'),
        best: 'min',
      },
      {
        label: 'Lowest price (any condition)',
        value: (p) => getStartingPrice(p)?.price,
        display: (p) => {
          const s = getStartingPrice(p)
          return `${formatPrice(s.price)} · ${CONDITION_MAP[s.conditionId]?.short ?? s.conditionId}`
        },
        best: 'min',
      },
      { label: 'Customer rating', value: (p) => p.rating, display: (p) => `${p.rating.toFixed(1)} ★ (${formatCount(p.reviews)} reviews)`, best: 'max' },
      { label: 'Launched', value: (p) => p.year, display: (p) => String(p.year), best: 'max' },
      { label: 'Available as', value: (p) => p.conditions.join(','), display: (p) => p.conditions.map((c) => CONDITION_MAP[c]?.short ?? c).join(', ') },
      { label: 'Network', value: (p) => (p.is5G ? '5G' : '4G'), display: (p) => (p.is5G ? '5G' : '4G') },
    ],
  },
  {
    title: 'Display',
    rows: [
      { label: 'Screen size', value: (p) => num(p.specs.display), display: (p) => (num(p.specs.display) ? `${num(p.specs.display)}"` : '—') },
      { label: 'Display', value: (p) => p.specs.display, display: (p) => p.specs.display },
    ],
  },
  {
    title: 'Performance',
    rows: [
      { label: 'Processor', value: (p) => p.specs.processor, display: (p) => p.specs.processor },
      { label: 'RAM', value: (p) => Math.max(...p.variants.map((v) => v.ram)), display: (p) => uniq(p.variants.map((v) => `${v.ram}GB`)).join(' / '), best: 'max' },
      { label: 'Storage', value: (p) => Math.max(...p.variants.map((v) => v.storage)), display: (p) => uniq(p.variants.map((v) => formatStorage(v.storage))).join(' / '), best: 'max' },
    ],
  },
  {
    title: 'Camera',
    rows: [
      { label: 'Rear camera', value: (p) => p.specs.rearCamera, display: (p) => p.specs.rearCamera },
      { label: 'Front camera', value: (p) => p.specs.frontCamera, display: (p) => p.specs.frontCamera },
    ],
  },
  {
    title: 'Battery & charging',
    rows: [
      { label: 'Battery', value: (p) => p.specs.battery, display: (p) => p.specs.battery },
      { label: 'Charging', value: (p) => p.specs.charging, display: (p) => p.specs.charging },
    ],
  },
  {
    title: 'Design',
    rows: [
      { label: 'Weight', value: (p) => num(p.specs.weight), display: (p) => p.specs.weight, best: 'min' },
      { label: 'Colours', value: (p) => p.colors.map((c) => c.name).join(','), display: (p) => p.colors.map((c) => c.name).join(', '), swatches: true },
    ],
  },
  {
    title: 'Software',
    rows: [{ label: 'Operating system', value: (p) => p.specs.os, display: (p) => p.specs.os }],
  },
]

/** Indexes of the winning phones for a row (ties allowed); empty if not rankable. */
export function bestIndexes(row, phones) {
  if (!row.best || phones.length < 2) return []
  const vals = phones.map((p) => row.value(p))
  if (vals.some((v) => typeof v !== 'number' || Number.isNaN(v))) return []
  const target = row.best === 'min' ? Math.min(...vals) : Math.max(...vals)
  if (vals.every((v) => v === target)) return []
  return vals.flatMap((v, i) => (v === target ? [i] : []))
}

export const isDifferent = (row, phones) => new Set(phones.map((p) => String(row.value(p)))).size > 1

/** Curated head-to-heads shown on the compare page and home page. */
// Order matters: the home page shows the first four (base models, ultimate
// flagships, foldables, flagship vs everyday).
export const POPULAR_COMPARISONS = [
  { title: 'Base models, head-to-head', ids: ['iphone-17', 'galaxy-s25', 'pixel-10'] },
  { title: 'The ultimate flagships', ids: ['iphone-17-pro-max', 'galaxy-s25-ultra', 'pixel-10-pro'] },
  { title: 'Foldables face-off', ids: ['galaxy-z-fold7', 'galaxy-z-flip7'] },
  { title: 'Flagship vs everyday', ids: ['iphone-17-pro', 'iphone-17'] },
  { title: 'Value champions', ids: ['iphone-16', 'pixel-9a', 'galaxy-a56'] },
  { title: 'Thin & light', ids: ['iphone-air', 'galaxy-s25'] },
]
