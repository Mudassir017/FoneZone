// Display helpers for the admin. Times are shown in IST (the shop's time zone), whatever the
// admin's computer is set to.
import { formatPrice } from '../../utils/format'

export const money = (v) => (v === null || v === undefined ? '—' : formatPrice(Number(v)))

const compactInr = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
export const moneyShort = (v) => `₹${compactInr.format(Number(v || 0))}`

const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
})
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
const dayFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export const dateTime = (v) => (v ? dateTimeFmt.format(new Date(v)) : '—')
export const dateOnly = (v) => (v ? dateFmt.format(new Date(v)) : '—')
/** For yyyy-mm-dd strings (already IST days). */
export const shortDay = (isoDay) => dayFmt.format(new Date(`${isoDay}T00:00:00Z`))

export const count = (v) => new Intl.NumberFormat('en-IN').format(Number(v || 0))

/** Today's date in IST as yyyy-mm-dd (for date inputs). */
export const todayIst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

export const ORDER_STATUSES = ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
export const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'EMI', label: 'EMI' },
  { value: 'NETBANKING', label: 'Net Banking' },
  { value: 'COD', label: 'Cash on Delivery' },
]

export const titleCase = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '')

export const STATUS_TONE = { CONFIRMED: 'blue', SHIPPED: 'amber', DELIVERED: 'green', CANCELLED: 'red' }
export const PAYMENT_TONE = { PAID: 'green', PENDING: 'amber', FAILED: 'red', REFUNDED: 'violet' }

/** Verb shown on the button that moves an order to this status. */
export const STATUS_ACTION = { SHIPPED: 'Mark shipped', DELIVERED: 'Mark delivered', CANCELLED: 'Cancel order' }
export const PAYMENT_ACTION = { PAID: 'Mark paid', FAILED: 'Mark failed', PENDING: 'Back to pending', REFUNDED: 'Mark refunded' }

/** Error object (ApiError) to a readable line, with field details if any. */
export function errorText(err) {
  if (!err) return ''
  const fields = err.fields ? Object.entries(err.fields).map(([k, v]) => `${k}: ${v}`).join(' · ') : ''
  return fields ? `${err.message} (${fields})` : err.message || 'Something went wrong'
}
