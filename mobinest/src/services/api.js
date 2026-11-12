// Thin client for the MobiNest Spring Boot API (see mobinest-api/context/API.md).
// In dev, Vite proxies /api -> http://localhost:8080. For production set
// VITE_API_BASE_URL to the API origin.
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status, code, fields } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status // undefined => network/timeout (API unreachable)
    this.code = code
    this.fields = fields
  }
  get isNetwork() {
    return this.status === undefined
  }
}

export async function api(path, { method = 'GET', body, token, timeout = 8000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Could not reach the Namma Mobiles server. Please try again.')
  } finally {
    clearTimeout(timer)
  }

  const text = await res.text()
  const data = text ? safeJson(text) : null
  if (!res.ok) {
    // RFC 9457 problem details: { status, title, detail, fields }
    const message =
      data?.detail ||
      (res.status === 401 ? 'Please sign in again.' : `Request failed (${res.status})`)
    throw new ApiError(message, { status: res.status, code: data?.title, fields: data?.fields })
  }
  // Vite's dev server answers unknown paths with index.html – treat as "API unavailable".
  if (text && data === null) throw new ApiError('Unexpected response from server')
  return data
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const endpoints = {
  catalog: () => api('/api/catalog', { timeout: 4000 }),
  placeOrder: (payload, token) => api('/api/orders', { method: 'POST', body: payload, token }),
  myOrders: (token) => api('/api/orders/me', { token }),
  order: (id, token) => api(`/api/orders/${encodeURIComponent(id)}`, { token }),
}
