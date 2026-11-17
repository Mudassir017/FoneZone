// Coupon + order total rules. In production these must be validated on the
// server; the client copy is only for instant feedback.
export const COUPONS = {
  WELCOME10: {
    code: 'WELCOME10',
    description: '10% off your first order (up to ₹2,000)',
    apply: (subtotal) => Math.min(Math.round(subtotal * 0.1), 2000),
    minSubtotal: 0,
  },
  MOBI1000: {
    code: 'MOBI1000',
    description: 'Flat ₹1,000 off on orders above ₹25,000',
    apply: () => 1000,
    minSubtotal: 25000,
  },
  ACCESS20: {
    code: 'ACCESS20',
    description: '20% off when your order is under ₹5,000 (great for accessories)',
    apply: (subtotal) => Math.round(subtotal * 0.2),
    minSubtotal: 0,
    maxSubtotal: 5000,
  },
}

export function validateCoupon(code, subtotal) {
  const coupon = COUPONS[code?.trim().toUpperCase()]
  if (!coupon) return { ok: false, message: 'Invalid coupon code' }
  if (subtotal < coupon.minSubtotal)
    return { ok: false, message: `Add items worth ₹${(coupon.minSubtotal - subtotal).toLocaleString('en-IN')} more to use this code` }
  if (coupon.maxSubtotal && subtotal > coupon.maxSubtotal)
    return { ok: false, message: `Valid only on orders up to ₹${coupon.maxSubtotal.toLocaleString('en-IN')}` }
  return { ok: true, coupon }
}

export const FREE_SHIPPING_THRESHOLD = 499
export const SHIPPING_FEE = 49

export function computeTotals(lines, couponCode) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const mrpTotal = lines.reduce((s, l) => s + l.unitMrp * l.qty, 0)
  const itemCount = lines.reduce((s, l) => s + l.qty, 0)
  const check = couponCode ? validateCoupon(couponCode, subtotal) : null
  const couponDiscount = check?.ok ? Math.min(check.coupon.apply(subtotal), subtotal) : 0
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal - couponDiscount + shipping
  return {
    subtotal,
    mrpTotal,
    productSavings: mrpTotal - subtotal,
    couponDiscount,
    couponValid: Boolean(check?.ok),
    couponMessage: check && !check.ok ? check.message : '',
    shipping,
    total,
    itemCount,
  }
}

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', hint: 'Google Pay, PhonePe, Paytm & more' },
  { id: 'card', label: 'Credit / Debit Card', hint: 'Visa, Mastercard, RuPay, Amex' },
  { id: 'emi', label: 'EMI', hint: 'No-cost EMI on select cards' },
  { id: 'netbanking', label: 'Net Banking', hint: 'All major banks' },
  { id: 'cod', label: 'Cash on Delivery', hint: 'Available on orders up to ₹50,000' },
]

export const COD_LIMIT = 50000

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
]

export const generateOrderId = () =>
  `MN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
