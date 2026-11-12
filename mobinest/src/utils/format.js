const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatPrice = (value) => inr.format(Math.round(value || 0))

export const formatStorage = (gb) => (gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`)

export const formatCount = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n)

export const formatDate = (date, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(date).toLocaleDateString('en-IN', opts)

export const addDays = (days, from = new Date()) => {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

export const pluralize = (count, word, plural = `${word}s`) => `${count} ${count === 1 ? word : plural}`
