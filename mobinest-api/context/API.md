# MobiNest: API Reference

Base URL (local): **http://localhost:8080** · Interactive docs: **/swagger-ui.html** · OpenAPI JSON: **/v3/api-docs**

All responses are JSON. Money values are rupees (numbers, e.g. `149900`). Timestamps are ISO-8601 UTC.

## Authentication

- Users sign in on the React app with **Clerk**. The app gets a session token with `await getToken()` (from `useAuth()` in `@clerk/react`) and sends it as
  `Authorization: Bearer <token>`.
- The API verifies the token's signature (Clerk JWKS), issuer, expiry and `azp` (must be `http://localhost:5173` in development).
- Public endpoints need no token. Protected ones return **401** without a valid token. `/api/admin/**` needs role ADMIN (not built yet).

| Access | Endpoints |
|---|---|
| Public | `GET /api/catalog`, `/api/brands`, `/api/conditions`, `/api/phones/**`, `/api/accessories/**`; `POST /api/orders`, `/api/coupons/validate`; `/actuator/health`; Swagger |
| Signed-in | `GET /api/me`, `/api/orders/me`, `/api/orders/{orderNumber}` |

## Error format (RFC 9457 problem details)

```json
{ "status": 422, "title": "COD_LIMIT", "detail": "Cash on Delivery is available only up to ₹50,000", "instance": "/api/orders" }
```

| Status | `title` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` (+ `fields` map) | Invalid request body. Address fields use the form names (`phone`, `pincode`, `fullName`...), without the `address.` prefix; other fields keep their path (e.g. `items[0].qty`) |
| 401 | (no body) | Missing or invalid token on a protected endpoint |
| 404 | `NOT_FOUND` | Unknown phone, accessory or order (also for someone else's order) |
| 409 | `OUT_OF_STOCK` | Not enough stock for a line |
| 422 | `COUPON_INVALID`, `COD_LIMIT`, `VARIANT_INVALID`, `COLOR_INVALID`, `CONDITION_UNAVAILABLE`, `PAYMENT_METHOD_INVALID` | Business rule broken |
| 500 | `INTERNAL_ERROR` | Unexpected (details only in the server log) |

---

## Catalogue

### `GET /api/catalog`
Everything the storefront needs in one call:
`{ brands[], conditions[], phones[], accessoryCategories[], accessories[] }`. Field names match the React app's `src/data/*.js`.

**Phone object**
```json
{
  "id": "iphone-17-pro-max", "brand": "apple", "name": "iPhone 17 Pro Max", "year": 2025, "camera": "plateau",
  "colors": [{ "name": "Cosmic Orange", "hex": "#e2733a" }],
  "variants": [{ "ram": 12, "storage": 256, "price": 149900 }],
  "conditions": ["new"],
  "discount": 0, "rating": 4.7, "reviews": 3480, "is5G": true,
  "tags": ["new-launch", "bestseller"],
  "specs": { "display": "6.9\" Super Retina XDR OLED, 120Hz ProMotion", "processor": "A19 Pro" },
  "highlights": ["Aluminium unibody with vapor chamber"],
  "prices": { "0:new": { "price": 149900, "mrp": 149900, "stock": 75 } }
}
```
- `variants[].price` is the **launch price (MRP)**.
- `prices["<variantIndex>:<conditionId>"]` is the **selling price** (lowest across colours), the MRP and the total stock across colours. Use this for display instead of recomputing.

**Visibility:** only **active brands** (currently apple, samsung, google) and their phones are returned. Phones of inactive brands return **404** on `/api/phones/{id}`, are excluded from search, and can't be ordered (404). Their data stays in the DB.

**Brand object**: `{ "id": "google", "name": "Google Pixel", "tagline": "Pixel 10 Pro, Pixel 10 & Pixel 9a", "accent": "#4285f4", "hero": { "phone": "pixel-10-pro", "color": "Moonstone" }, "active": true }` (`hero` may be null).

**Condition object**: `{ "id": "refurbished", "label": "Certified Refurbished", "short": "Refurbished", "priceFactor": 0.78, "warranty": "12 months MobiNest warranty", "description": "...", "color": "#5b3df5" }`

**Accessory object**: `{ "id", "name", "brand", "category", "price", "mrp", "rating", "reviews", "colors": [{name,hex}], "compatibleBrands": ["apple"] | ["all"], "description", "features": [], "stock" }`

### Other catalogue endpoints
| Endpoint | Returns |
|---|---|
| `GET /api/brands` | active brands: `[{ id, name, tagline, accent, hero, active }]` |
| `GET /api/conditions` | condition objects |
| `GET /api/phones?brand=samsung&q=ultra&fiveG=true&page=0&size=20` | `{ content: [phone], page, size, totalElements, totalPages }` (size 1–100) |
| `GET /api/phones/{id}` | one phone (404 if unknown) |
| `GET /api/accessories?category=cases` | accessory list |
| `GET /api/accessories/{id}` | one accessory |

---

## Coupons

### `POST /api/coupons/validate`
```json
// request
{ "code": "mobi1000", "subtotal": 20000 }
// response
{ "code": "MOBI1000", "valid": false, "message": "Add items worth ₹5,000 more to use this code", "description": null, "discount": 0 }
```

---

## Orders

### `POST /api/orders`: place an order (guest, or signed-in with a Bearer token)
The client sends **only the selection**. All prices and totals are computed by the server.
```json
{
  "address": {
    "fullName": "Test Buyer", "phone": "9876543210", "email": "test@example.com",
    "address": "12 MG Road, Indiranagar", "landmark": "", "city": "Bengaluru",
    "state": "Karnataka", "pincode": "560038"
  },
  "paymentMethod": "upi",
  "couponCode": "WELCOME10",
  "items": [
    { "type": "phone", "productId": "pixel-9a", "variantIndex": 0, "color": "Iris", "condition": "new", "qty": 2 },
    { "type": "accessory", "productId": "magsafe-clear-case-17", "color": "Clear", "qty": 1 }
  ]
}
```
| Field | Rules |
|---|---|
| `paymentMethod` | `upi` · `card` · `emi` · `netbanking` · `cod` (COD only if total ≤ ₹50,000) |
| `items` | 1–20 lines; `qty` 1–5; `type` `phone`/`accessory`; phone `variantIndex` defaults to 0, `color` to the first colour, `condition` to `new` |
| `address.phone` | `^[6-9]\d{9}$` · `pincode` `^[1-9]\d{5}$` · `fullName` ≥ 3 · `address` ≥ 8 chars |

**201 Created** (`Location: /api/orders/{id}`). Same shape as the React app's order object:
```json
{
  "id": "MNMWBYYOZCWMIP", "createdAt": "2026-11-11T10:21:38.428Z", "eta": "2026-11-15",
  "status": "Confirmed", "paymentStatus": "PAID", "userId": null, "email": "test@example.com",
  "address": { "fullName": "Test Buyer", "...": "..." },
  "payment": "UPI", "paymentMethod": "upi", "coupon": "WELCOME10",
  "totals": { "subtotal": 91497, "mrpTotal": 102497, "productSavings": 11000, "couponDiscount": 2000,
              "couponValid": true, "shipping": 0, "total": 89497, "itemCount": 3 },
  "items": [
    { "key": "phone|pixel-9a|0|Iris|new", "type": "phone", "productId": "pixel-9a", "name": "Pixel 9a",
      "details": "8GB RAM · 256GB · Iris", "condition": "Brand New", "colorHex": "#...", "colorName": "Iris",
      "qty": 2, "unitPrice": 44999, "unitMrp": 49999 }
  ]
}
```

### `GET /api/orders/me` 🔒
The signed-in user's orders, newest first (array of the object above).

### `GET /api/orders/{orderNumber}` 🔒
One of the user's own orders. Returns 404 if it doesn't exist **or belongs to someone else**.

### `GET /api/me` 🔒
`{ "userId": "user_...", "email": "...", "name": "...", "role": "CUSTOMER" }`. Creates the local customer profile on first call.

---

## Frontend integration (live since 11 Nov 2026)

The React app (`mobinest/`) uses this API through a Vite dev proxy (`/api` → `http://localhost:8080`):
- At startup it loads `GET /api/catalog`; if the API is down it falls back to its bundled sample data.
- Prices and stock come from `phone.prices["<variantIndex>:<condition>"]`. Buying is blocked when stock is 0.
- Checkout sends `POST /api/orders` (selection only) plus `Authorization: Bearer <Clerk getToken()>` when signed in. On 4xx it shows `detail` and the per-field `fields`.
- The Account page uses `GET /api/orders/me`.
- Product photos are still served by the frontend (`/images/phones/<phoneId>/<colourSlug>.webp` and `-sm.webp`, plus `gallery-1/2`) via its `imageManifest.json`; they're not in the API yet.

## Quick tests (PowerShell)

```powershell
Invoke-RestMethod http://localhost:8080/api/brands
(Invoke-RestMethod http://localhost:8080/api/catalog).phones.Count      # 32
Invoke-RestMethod http://localhost:8080/api/coupons/validate -Method Post -ContentType 'application/json' `
  -Body '{"code":"WELCOME10","subtotal":15000}'
```
