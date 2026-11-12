// Client for the Namma Mobiles admin API (/api/admin/**, see mobinest-api/context/ADMIN.md).
// Every call sends the signed-in user's Clerk session token; the server decides admin access
// from its own customer table (customer.role), so nothing here can grant access by itself.
import { api } from './api'

/** ?a=1&b=x from an object, skipping empty values. */
export function toQuery(params = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return
    sp.set(key, String(value))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

const enc = encodeURIComponent

export function createAdminApi(getToken) {
  const call = async (path, options = {}) => api(path, { timeout: 15000, ...options, token: await getToken() })

  return {
    // session
    me: () => call('/api/admin/me'),
    profile: () => call('/api/me'),

    // dashboard
    dashboard: (params) => call(`/api/admin/dashboard${toQuery(params)}`),

    // orders + payments
    orders: (params) => call(`/api/admin/orders${toQuery(params)}`),
    order: (orderNumber) => call(`/api/admin/orders/${enc(orderNumber)}`),
    setOrderStatus: (orderNumber, body) => call(`/api/admin/orders/${enc(orderNumber)}/status`, { method: 'POST', body }),
    setPaymentStatus: (orderNumber, body) => call(`/api/admin/orders/${enc(orderNumber)}/payment`, { method: 'POST', body }),
    payments: (params) => call(`/api/admin/payments${toQuery(params)}`),
    paymentSummary: (params) => call(`/api/admin/payments/summary${toQuery(params)}`),

    // catalogue
    brands: () => call('/api/admin/brands'),
    updateBrand: (slug, body) => call(`/api/admin/brands/${enc(slug)}`, { method: 'PATCH', body }),
    phones: (params) => call(`/api/admin/phones${toQuery(params)}`),
    updatePhone: (slug, body) => call(`/api/admin/phones/${enc(slug)}`, { method: 'PATCH', body }),
    skus: (params) => call(`/api/admin/skus${toQuery(params)}`),
    updateSku: (id, body) => call(`/api/admin/skus/${enc(id)}`, { method: 'PATCH', body }),
    accessories: (params) => call(`/api/admin/accessories${toQuery(params)}`),
    updateAccessory: (slug, body) => call(`/api/admin/accessories/${enc(slug)}`, { method: 'PATCH', body }),
    conditions: () => api('/api/conditions'),

    // coupons
    coupons: (params) => call(`/api/admin/coupons${toQuery(params)}`),
    createCoupon: (body) => call('/api/admin/coupons', { method: 'POST', body }),
    updateCoupon: (code, body) => call(`/api/admin/coupons/${enc(code)}`, { method: 'PUT', body }),
    deactivateCoupon: (code) => call(`/api/admin/coupons/${enc(code)}`, { method: 'DELETE' }),

    // customers + roles
    customers: (params) => call(`/api/admin/customers${toQuery(params)}`),
    setRole: (clerkUserId, role) => call(`/api/admin/customers/${enc(clerkUserId)}/role`, { method: 'PUT', body: { role } }),

    // audit
    audit: (params) => call(`/api/admin/audit${toQuery(params)}`),
  }
}
