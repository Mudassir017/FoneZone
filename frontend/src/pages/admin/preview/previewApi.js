// DEV-ONLY fake admin API with made-up sample data (marker: NAMMA_ADMIN_PREVIEW_SAMPLE).
// Loaded only behind `import.meta.env.DEV` (see AdminApp.jsx), so it never ships in a production
// build. It lets the admin UI be reviewed without an admin account or a running API.
// None of these names, emails or numbers are real.

const DAY = 86400000
const now = Date.now()
const iso = (msAgo) => new Date(now - msAgo).toISOString()
const page = (all, p = {}) => {
  const size = Number(p.size || 20)
  const n = Number(p.page || 0)
  return { content: all.slice(n * size, n * size + size), page: n, size, totalElements: all.length, totalPages: Math.max(1, Math.ceil(all.length / size)) }
}
const delay = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 120))
const match = (q, ...fields) => !q || fields.some((f) => String(f || '').toLowerCase().includes(String(q).toLowerCase()))

const NAMES = ['Aarav Sharma', 'Diya Iyer', 'Kabir Reddy', 'Meera Nair', 'Rohan Gupta', 'Ananya Rao', 'Vikram Singh', 'Ishita Menon', 'Arjun Pillai', 'Sneha Kulkarni', 'Farhan Khan', 'Priya Das']
const CITIES = [['Bengaluru', 'Karnataka', '560038'], ['Chennai', 'Tamil Nadu', '600017'], ['Mumbai', 'Maharashtra', '400050'], ['Hyderabad', 'Telangana', '500081'], ['Kochi', 'Kerala', '682016'], ['Pune', 'Maharashtra', '411001']]
const PRODUCTS = [
  { id: 'iphone-17-pro', name: 'iPhone 17 Pro', price: 134900, details: '12GB RAM · 256GB · Cosmic Orange', cond: 'Brand New' },
  { id: 'galaxy-s25-ultra', name: 'Galaxy S25 Ultra', price: 109999, details: '12GB RAM · 256GB · Titanium Silverblue', cond: 'Brand New' },
  { id: 'pixel-9a', name: 'Pixel 9a', price: 44999, details: '8GB RAM · 256GB · Iris', cond: 'Brand New' },
  { id: 'pixel-10-pro', name: 'Pixel 10 Pro', price: 85799, details: '16GB RAM · 256GB · Moonstone', cond: 'Certified Refurbished' },
  { id: 'iphone-16', name: 'iPhone 16', price: 51099, details: '8GB RAM · 128GB · Ultramarine', cond: 'Pre-owned' },
  { id: 'galaxy-a56', name: 'Galaxy A56', price: 36999, details: '8GB RAM · 256GB · Awesome Graphite', cond: 'Brand New' },
]
const METHODS = [['UPI', 'UPI'], ['CARD', 'Credit / Debit Card'], ['COD', 'Cash on Delivery'], ['NETBANKING', 'Net Banking'], ['EMI', 'EMI']]
const STATUS_LABEL = { CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' }
const NEXT = { CONFIRMED: ['SHIPPED', 'CANCELLED'], SHIPPED: ['DELIVERED', 'CANCELLED'], DELIVERED: [], CANCELLED: [] }
const NEXT_PAY = { PENDING: ['PAID', 'FAILED'], FAILED: ['PAID', 'PENDING'], PAID: ['REFUNDED'], REFUNDED: [] }

function buildOrders() {
  const out = []
  for (let i = 0; i < 46; i++) {
    const p = PRODUCTS[(i * 7) % PRODUCTS.length]
    const qty = i % 9 === 0 ? 2 : 1
    const [method, methodLabel] = METHODS[i % 5 === 2 ? 2 : (i * 3) % METHODS.length]
    const ageDays = Math.floor((i * i * 0.31 + i * 0.7) % 29) + (i % 4 === 0 ? 0 : 0.3)
    const status = ageDays < 1 ? 'CONFIRMED' : ageDays < 3 ? (i % 3 ? 'SHIPPED' : 'CONFIRMED') : i % 11 === 0 ? 'CANCELLED' : 'DELIVERED'
    let pay = method === 'COD' ? (status === 'DELIVERED' ? 'PAID' : 'PENDING') : 'PAID'
    if (status === 'CANCELLED' && method !== 'COD') pay = 'REFUNDED'
    const name = NAMES[i % NAMES.length]
    const [city, state, pin] = CITIES[i % CITIES.length]
    const subtotal = p.price * qty
    const coupon = i % 6 === 0 ? 'WELCOME10' : null
    const couponDiscount = coupon ? Math.min(2000, Math.round(subtotal * 0.1)) : 0
    const createdAt = iso(ageDays * DAY + (i % 7) * 3600000)
    out.push({
      orderNumber: `MN${(9_000_000_000 - i * 7_919_311).toString(36).toUpperCase()}${'QWERTYUIOPAS'[i % 12]}${i % 10}`,
      createdAt, updatedAt: createdAt, status, statusLabel: STATUS_LABEL[status], paymentMethod: method, paymentMethodLabel: methodLabel,
      paymentStatus: pay, total: subtotal - couponDiscount, itemCount: qty, customerName: name,
      email: `${name.split(' ')[0].toLowerCase()}@example.com`, phone: `98${String(45678901 + i * 37).slice(0, 8)}`, city,
      couponCode: coupon, guest: i % 4 === 3,
      _detail: { p, qty, state, pin, subtotal, couponDiscount, reference: method === 'COD' ? null : `DEMO-${(0x1a2b3c + i * 977).toString(16)}` },
    })
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const state = {
  orders: buildOrders(),
  history: {},
  audit: [],
  brands: [
    ['apple', 'Apple', 'iPhone 17 Pro, iPhone Air & more', '#1d1d1f', true, 8, 145, 2026, 4],
    ['samsung', 'Samsung', 'Galaxy S, Z Fold, Z Flip & A series', '#1428a0', true, 6, 114, 1582, 3],
    ['google', 'Google Pixel', 'Pixel 10 Pro, Pixel 10 & Pixel 9a', '#4285f4', true, 3, 25, 443, 1],
    ['oneplus', 'OnePlus', 'Never Settle', '#eb0028', false, 3, 44, 687, 0],
    ['xiaomi', 'Xiaomi', 'Flagship specs, smart prices', '#ff6900', false, 2, 33, 405, 2],
    ['nothing', 'Nothing', 'Transparent by design', '#000000', false, 2, 26, 336, 0],
  ].map(([id, name, tagline, accent, active, phones, skus, units, low], i) => ({
    id, name, tagline, accent, active, sortOrder: i, heroPhone: null, heroColor: null, phones, activePhones: phones, skus, units, lowStockSkus: low,
  })),
  coupons: [
    { code: 'WELCOME10', description: '10% off your first order (up to ₹2,000)', discountType: 'PERCENT', discountValue: 10, maxDiscount: 2000, minSubtotal: 0, maxSubtotal: null, active: true, validUntil: null, expired: false, usable: true, timesUsed: 8, discountGiven: 14250 },
    { code: 'MOBI1000', description: 'Flat ₹1,000 off on orders above ₹25,000', discountType: 'FLAT', discountValue: 1000, maxDiscount: null, minSubtotal: 25000, maxSubtotal: null, active: true, validUntil: iso(-20 * DAY), expired: false, usable: true, timesUsed: 3, discountGiven: 3000 },
    { code: 'ACCESS20', description: '20% off when your order is under ₹5,000', discountType: 'PERCENT', discountValue: 20, maxDiscount: null, minSubtotal: 0, maxSubtotal: 5000, active: true, validUntil: null, expired: false, usable: true, timesUsed: 0, discountGiven: 0 },
    { code: 'DIWALI5', description: 'Diwali 5% off', discountType: 'PERCENT', discountValue: 5, maxDiscount: 1500, minSubtotal: 0, maxSubtotal: null, active: true, validUntil: iso(2 * DAY), expired: true, usable: false, timesUsed: 5, discountGiven: 6120 },
  ],
  customers: NAMES.slice(0, 9).map((name, i) => ({
    id: i + 1, clerkUserId: i === 0 ? 'user_preview' : `user_2demo${(1e9 + i * 7_654_321).toString(36)}`,
    email: i === 0 ? 'owner@example.com' : `${name.split(' ')[0].toLowerCase()}@example.com`, name: i === 0 ? 'Shop Owner' : name,
    role: i < 2 ? 'ADMIN' : 'CUSTOMER', bootstrapAdmin: i === 0, orderCount: (i * 3) % 5, totalSpent: ((i * 3) % 5) * 47999,
    lastOrderAt: (i * 3) % 5 ? iso(i * DAY) : null, createdAt: iso((40 - i * 3) * DAY),
  })),
  phones: [
    ['iphone-17-pro', 'iPhone 17 Pro', 'apple', 'Apple', 2025, 24, 412, 104999, 154900, 1, true, true],
    ['iphone-air', 'iPhone Air', 'apple', 'Apple', 2025, 16, 280, 89999, 139900, 0, true, true],
    ['galaxy-s25-ultra', 'Galaxy S25 Ultra', 'samsung', 'Samsung', 2025, 30, 455, 71599, 129999, 2, true, true],
    ['galaxy-a56', 'Galaxy A56', 'samsung', 'Samsung', 2025, 12, 210, 23599, 41999, 0, true, true],
    ['pixel-10-pro', 'Pixel 10 Pro', 'google', 'Google Pixel', 2025, 10, 160, 56599, 109999, 1, true, true],
    ['pixel-9a', 'Pixel 9a', 'google', 'Google Pixel', 2025, 8, 140, 25899, 49999, 0, true, true],
    ['oneplus-13', 'OnePlus 13', 'oneplus', 'OnePlus', 2025, 18, 300, 44799, 76999, 0, true, false],
    ['nothing-phone-3', 'Nothing Phone (3)', 'nothing', 'Nothing', 2025, 12, 190, 41499, 79999, 0, false, false],
  ].map(([id, name, brand, brandName, year, skus, units, minPrice, maxPrice, low, active, brandActive]) => ({
    id, name, brand, brandName, brandActive, active, visible: active && brandActive, year, fiveG: true, skus, units, minPrice, maxPrice, lowStockSkus: low, updatedAt: iso(3 * DAY),
  })),
  skus: [],
  accessories: [
    ['magsafe-clear-case-17', 'ClearGuard MagSafe Case', 'Fone Basics', 'cases', 'Cases', 1499, 2499, 3],
    ['tempered-glass-s25u', 'Edge Glass for S25 Ultra', 'ArmorX', 'screen-guards', 'Screen protection', 799, 1299, 48],
    ['gan-65w-charger', '65W GaN Fast Charger', 'VoltUp', 'chargers', 'Chargers', 2299, 3499, 0],
    ['usb-c-braided-2m', 'Braided USB-C Cable 2m', 'VoltUp', 'cables', 'Cables', 599, 999, 120],
    ['buds-anc-pro', 'BassLine ANC Earbuds', 'SoundNest', 'audio', 'Audio', 3999, 5999, 22],
    ['powerbank-20k', '20,000 mAh Power Bank', 'VoltUp', 'power-banks', 'Power banks', 2499, 3999, 5],
  ].map(([id, name, brandLabel, category, categoryName, price, mrp, stock], i) => ({ id, name, brandLabel, category, categoryName, price, mrp, stock, active: i !== 4 || true, updatedAt: iso(i * DAY) })),
}
{
  const variants = [['12GB RAM · 256GB', 12, 256], ['12GB RAM · 512GB', 12, 512], ['8GB RAM · 128GB', 8, 128]]
  const colours = [['Cosmic Orange', '#e2733a'], ['Deep Blue', '#2f3e5c'], ['Silver', '#d9d9de'], ['Iris', '#8c8fd6']]
  const conds = [['new', 'New', 1], ['refurbished', 'Refurbished', 0.78], ['used', 'Pre-owned', 0.64], ['recycled', 'Recycled', 0.52]]
  let id = 1
  state.phones.forEach((p, pi) => {
    for (let k = 0; k < 6; k++) {
      const [variant, ram, storage] = variants[(pi + k) % 3]
      const [color, colorHex] = colours[(pi + k) % 4]
      const [condition, conditionLabel, factor] = conds[k % 4]
      const mrp = p.maxPrice
      state.skus.push({
        id: id++, skuCode: `${p.id}/${ram}-${storage}/${color.toLowerCase().replace(/ /g, '-')}/${condition}`, phoneId: p.id, phoneName: p.name, brand: p.brand,
        variant, ramGb: ram, storageGb: storage, color, colorHex, condition, conditionLabel, mrp,
        price: Math.max(99, Math.round((mrp * factor) / 100) * 100 - 1), stock: [25, 8, 5, 2, 0, 14][(pi + k) % 6], visible: p.visible,
      })
    }
  })
}

function summary(o) {
  const { _detail, ...rest } = o
  return rest
}

function detail(o) {
  const d = o._detail
  const placed = { kind: 'PLACED', from: null, to: 'CONFIRMED', note: `Order placed · ${o.paymentMethodLabel}`, by: o.guest ? `${o.email} (guest)` : o.email, byId: null, at: o.createdAt }
  const customer = o.guest ? null : { id: 3, clerkUserId: 'user_2demo3f9k2l', name: o.customerName, email: o.email, role: 'CUSTOMER' }
  return {
    orderNumber: o.orderNumber, createdAt: o.createdAt, updatedAt: o.updatedAt, estimatedDelivery: new Date(Date.parse(o.createdAt) + 4 * DAY).toISOString().slice(0, 10),
    status: o.status, statusLabel: o.statusLabel, allowedStatuses: NEXT[o.status], allowedPaymentStatuses: NEXT_PAY[o.paymentStatus],
    customer, guest: o.guest, email: o.email,
    address: { fullName: o.customerName, phone: o.phone, email: o.email, address: '12, 4th Cross, MG Road', landmark: 'Opp. City Mall', city: o.city, state: d.state, pincode: d.pin },
    payment: { method: o.paymentMethod, methodLabel: o.paymentMethodLabel, status: o.paymentStatus, reference: d.reference, amount: o.total },
    couponCode: o.couponCode,
    totals: { subtotal: d.subtotal, mrpTotal: d.subtotal + 5000 * d.qty, productSavings: 5000 * d.qty, couponDiscount: d.couponDiscount, shipping: 0, total: o.total, itemCount: d.qty },
    items: [{ type: 'phone', productId: d.p.id, name: d.p.name, details: d.p.details, condition: d.p.cond, colorName: d.p.details.split(' · ')[2], colorHex: '#e2733a', qty: d.qty, unitPrice: d.p.price, unitMrp: d.p.price + 5000, lineTotal: d.subtotal, skuId: 7, skuCode: `${d.p.id}/12-256/cosmic-orange/new`, accessoryId: null, currentStock: 12 }],
    timeline: [placed, ...(state.history[o.orderNumber] || [])],
  }
}

function filterOrders(p = {}) {
  return state.orders.filter((o) =>
    (!p.status || o.status === p.status) && (!(p.paymentMethod || p.method) || o.paymentMethod === (p.paymentMethod || p.method)) &&
    (!p.paymentStatus || o.paymentStatus === p.paymentStatus) && (!p.from || o.createdAt.slice(0, 10) >= p.from) && (!p.to || o.createdAt.slice(0, 10) <= p.to) &&
    match(p.q, o.orderNumber, o.email, o.phone, o.customerName))
}

function sortBy(list, sort, map = {}) {
  if (!sort) return list
  const [field, dir] = sort.split(',')
  const key = map[field] || field
  return [...list].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (dir === 'desc' ? -1 : 1))
}

function record(action, entityType, entityId, details) {
  state.audit.unshift({ id: state.audit.length + 1, at: new Date().toISOString(), actorId: 'user_preview', actor: 'owner@example.com', action, entityType, entityId, details })
}

export function createPreviewApi() {
  return {
    me: () => delay({ userId: 'user_preview', email: 'owner@example.com', name: 'Shop Owner', role: 'ADMIN', bootstrapAdmin: true, adminCount: 2 }),
    profile: () => delay({ userId: 'user_preview', role: 'ADMIN' }),

    dashboard: ({ days = 30 } = {}) => {
      const revenueOrders = state.orders.filter((o) => o.status !== 'CANCELLED' && (o.paymentStatus === 'PAID' || (o.paymentStatus === 'PENDING' && o.paymentMethod === 'COD')))
      const paid = revenueOrders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.total, 0)
      const cod = revenueOrders.filter((o) => o.paymentStatus === 'PENDING').reduce((s, o) => s + o.total, 0)
      const byStatus = { CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 }
      state.orders.forEach((o) => { byStatus[o.status] += 1 })
      const daily = Array.from({ length: days }, (_, i) => {
        const date = new Date(now - (days - 1 - i) * DAY).toISOString().slice(0, 10)
        const list = state.orders.filter((o) => o.createdAt.slice(0, 10) === date)
        return { date, orders: list.length, revenue: list.filter((o) => revenueOrders.includes(o)).reduce((s, o) => s + o.total, 0) }
      })
      const ago = (d) => state.orders.filter((o) => Date.parse(o.createdAt) >= now - d * DAY).length
      const low = state.skus.filter((s) => s.stock <= 5 && s.visible)
      return delay({
        generatedAt: new Date().toISOString(), timeZone: 'Asia/Kolkata',
        revenue: { total: paid + cod, paid, codPending: cod, refunded: state.orders.filter((o) => o.paymentStatus === 'REFUNDED').reduce((s, o) => s + o.total, 0), orders: revenueOrders.length, averageOrderValue: Math.round((paid + cod) / Math.max(1, revenueOrders.length)) },
        ordersByStatus: byStatus,
        orders: { today: ago(1), last7Days: ago(7), last30Days: ago(30), total: state.orders.length },
        daily,
        topPhones: PRODUCTS.slice(0, 5).map((p, i) => ({ productId: p.id, name: p.name, units: 14 - i * 2, revenue: (14 - i * 2) * p.price })),
        lowStock: { threshold: 5, skuCount: low.length, accessoryCount: 3, items: [...low.slice(0, 8).map((s) => ({ type: 'sku', id: String(s.id), skuCode: s.skuCode, name: s.phoneName, details: `${s.variant} · ${s.color} · ${s.conditionLabel}`, stock: s.stock })), { type: 'accessory', id: 'gan-65w-charger', skuCode: null, name: '65W GaN Fast Charger', details: 'VoltUp', stock: 0 }] },
        recentOrders: state.orders.slice(0, 8).map(summary),
        catalog: { activeBrands: 3, brands: 12, visiblePhones: 17, phones: 33, visibleSkus: 292, unitsInStock: 4051, customers: state.customers.length, admins: 2, activeCoupons: 3 },
      })
    },

    orders: (p) => delay(page(sortBy(filterOrders(p), p.sort).map(summary), p)),
    order: (n) => {
      const o = state.orders.find((x) => x.orderNumber === n)
      return o ? delay(detail(o)) : Promise.reject(Object.assign(new Error('Order not found'), { status: 404 }))
    },
    setOrderStatus: (n, { status, note }) => {
      const o = state.orders.find((x) => x.orderNumber === n)
      ;(state.history[n] ||= []).push({ kind: 'STATUS', from: o.status, to: status, note: note || null, by: 'owner@example.com', byId: 'user_preview', at: new Date().toISOString() })
      if (status === 'DELIVERED' && o.paymentMethod === 'COD' && o.paymentStatus === 'PENDING') {
        o.paymentStatus = 'PAID'
        state.history[n].push({ kind: 'PAYMENT', from: 'PENDING', to: 'PAID', note: 'Cash collected on delivery', by: 'owner@example.com', byId: 'user_preview', at: new Date().toISOString() })
      }
      record('ORDER_STATUS', 'ORDER', n, `${o.status} -> ${status}`)
      o.status = status
      o.statusLabel = STATUS_LABEL[status]
      o.updatedAt = new Date().toISOString()
      return delay(detail(o))
    },
    setPaymentStatus: (n, { status, reference, note }) => {
      const o = state.orders.find((x) => x.orderNumber === n)
      ;(state.history[n] ||= []).push({ kind: 'PAYMENT', from: o.paymentStatus, to: status, note: note || (reference ? `Reference ${reference}` : null), by: 'owner@example.com', byId: 'user_preview', at: new Date().toISOString() })
      record('PAYMENT_STATUS', 'ORDER', n, `${o.paymentStatus} -> ${status}`)
      o.paymentStatus = status
      if (reference) o._detail.reference = reference
      return delay(detail(o))
    },
    payments: (p) => delay(page(sortBy(filterOrders(p), p.sort, { amount: 'total', method: 'paymentMethod', status: 'paymentStatus' }).map((o) => ({
      orderNumber: o.orderNumber, createdAt: o.createdAt, updatedAt: o.updatedAt, method: o.paymentMethod, methodLabel: o.paymentMethodLabel,
      status: o.paymentStatus, reference: o._detail.reference, amount: o.total, orderStatus: o.status, customerName: o.customerName, email: o.email,
    })), p)),
    paymentSummary: (p) => {
      const list = filterOrders(p)
      const group = (key, label) => Object.values(list.reduce((acc, o) => {
        const k = o[key]
        acc[k] ||= { key: k, label: label(o), count: 0, amount: 0 }
        acc[k].count += 1
        acc[k].amount += o.total
        return acc
      }, {})).sort((a, b) => b.amount - a.amount)
      return delay({
        count: list.length, amount: list.reduce((s, o) => s + o.total, 0),
        byMethod: group('paymentMethod', (o) => o.paymentMethodLabel),
        byStatus: group('paymentStatus', (o) => o.paymentStatus.charAt(0) + o.paymentStatus.slice(1).toLowerCase()),
      })
    },

    brands: () => delay(state.brands),
    updateBrand: (slug, patch) => {
      const b = state.brands.find((x) => x.id === slug)
      Object.assign(b, patch)
      record('BRAND_UPDATE', 'BRAND', slug, JSON.stringify(patch))
      return delay(b)
    },
    phones: (p = {}) => delay(page(sortBy(state.phones.filter((x) => (!p.brand || x.brand === p.brand) && (p.visible === undefined || x.visible === p.visible) && match(p.q, x.name, x.id)), p.sort), p)),
    updatePhone: (slug, { active }) => {
      const x = state.phones.find((y) => y.id === slug)
      x.active = active
      x.visible = active && x.brandActive
      record('PHONE_UPDATE', 'PHONE', slug, `active -> ${active}`)
      return delay(x)
    },
    skus: (p = {}) => delay(page(sortBy(state.skus.filter((s) =>
      (!p.phone || s.phoneId === p.phone) && (!p.brand || s.brand === p.brand) && (!p.condition || s.condition === p.condition) &&
      (!p.lowStock || s.stock <= 5) && (!p.visible || String(s.visible) === p.visible) && match(p.q, s.skuCode, s.phoneName)), p.sort, { phone: 'phoneName' }), p)),
    updateSku: (id, patch) => {
      const s = state.skus.find((x) => x.id === Number(id))
      const { expectedStock, ...changes } = patch // eslint-disable-line no-unused-vars
      Object.assign(s, changes)
      record('SKU_UPDATE', 'SKU', s.skuCode, JSON.stringify(changes))
      return delay(s)
    },
    accessories: (p = {}) => delay(page(sortBy(state.accessories.filter((a) => (!p.category || a.category === p.category) && (!p.active || String(a.active) === p.active) && (!p.lowStock || a.stock <= 5) && match(p.q, a.name, a.brandLabel)), p.sort), p)),
    updateAccessory: (slug, patch) => {
      const a = state.accessories.find((x) => x.id === slug)
      const { expectedStock, ...changes } = patch // eslint-disable-line no-unused-vars
      Object.assign(a, changes)
      record('ACCESSORY_UPDATE', 'ACCESSORY', slug, JSON.stringify(changes))
      return delay(a)
    },
    conditions: () => delay([{ id: 'new', short: 'New' }, { id: 'refurbished', short: 'Refurbished' }, { id: 'used', short: 'Pre-owned' }, { id: 'recycled', short: 'Recycled' }]),

    coupons: (p = {}) => delay(page(state.coupons.filter((c) => !p.active || String(c.active) === p.active), p)),
    createCoupon: (body) => {
      const c = { ...body, code: body.code.toUpperCase(), expired: false, usable: body.active, timesUsed: 0, discountGiven: 0 }
      state.coupons.push(c)
      record('COUPON_CREATE', 'COUPON', c.code, body.description)
      return delay(c)
    },
    updateCoupon: (code, body) => {
      const c = state.coupons.find((x) => x.code === code)
      Object.assign(c, body, { code, usable: body.active })
      record('COUPON_UPDATE', 'COUPON', code, body.description)
      return delay(c)
    },
    deactivateCoupon: (code) => {
      const c = state.coupons.find((x) => x.code === code)
      c.active = false
      c.usable = false
      record('COUPON_DEACTIVATE', 'COUPON', code, 'active true -> false')
      return delay(c)
    },

    customers: (p = {}) => delay(page(sortBy(state.customers.filter((c) => (!p.role || c.role === p.role) && match(p.q, c.name, c.email, c.clerkUserId)), p.sort, { name: 'name' }), p)),
    setRole: (clerkUserId, role) => {
      let c = state.customers.find((x) => x.clerkUserId === clerkUserId)
      if (!c) {
        c = { id: state.customers.length + 1, clerkUserId, email: null, name: null, role, bootstrapAdmin: false, orderCount: 0, totalSpent: 0, lastOrderAt: null, createdAt: new Date().toISOString() }
        state.customers.unshift(c)
      }
      record('ROLE_CHANGE', 'CUSTOMER', clerkUserId, `${c.role} -> ${role}`)
      c.role = role
      return delay(c)
    },

    audit: (p = {}) => delay(page(state.audit.filter((a) => (!p.entityType || a.entityType === p.entityType) && match(p.q, a.details, a.actor, a.entityId)), p)),
  }
}

// Seed a few audit entries so the page isn't empty in the preview.
record('SKU_UPDATE', 'SKU', 'pixel-9a/8-256/iris/new', 'stock 3 -> 25')
record('COUPON_CREATE', 'COUPON', 'DIWALI5', "PERCENT 5, max 1500, min 0, active true, 'Diwali 5% off'")
record('BRAND_UPDATE', 'BRAND', 'oneplus', 'active true -> false')
