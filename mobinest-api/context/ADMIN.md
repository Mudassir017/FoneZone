# Namma Mobiles: Admin (back office)

> Built 12 Nov 2026. Backend: `com.mobinest.admin.*` + `com.mobinest.customer` (role logic), Flyway **V7**.
> Frontend: `mobinest/src/pages/admin/**`, `src/components/admin/**`, `src/services/adminApi.js`, `src/styles/admin.css`.
> UI: **http://localhost:5173/admin** · API: **/api/admin/\*\*** (Swagger groups "Admin: ...").

## 1. How admin access works

```
Browser (Clerk session) --Bearer JWT--> Spring Security
   1. verify JWT (Clerk JWKS, issuer, expiry, azp)                      -> 401 if invalid/missing
   2. ClerkRoleJwtConverter: role = customer.role WHERE clerk_user_id = sub
        (CustomerRoleService, cached 30 s; bootstrap ids are promoted here)
        CUSTOMER -> [ROLE_CUSTOMER]      ADMIN -> [ROLE_CUSTOMER, ROLE_ADMIN]
   3. /api/admin/** requires ROLE_ADMIN                                  -> 403 if not admin
```

- **Admin = a signed-in Clerk user whose row in our `customer` table has `role = 'ADMIN'`.**
- The role is **never** read from the token or from anything the browser sends. A forged `role` claim is ignored (unit-tested).
- If the database can't be reached during the role lookup, the user is treated as a CUSTOMER (fail closed).
- Role lookups are cached in memory for `mobinest.admin.role-cache-ttl` (default **30 s**). Changes made through the admin UI clear the cache at once; a change made directly in SQL takes effect within 30 s.
- Every signed-in user also keeps `ROLE_CUSTOMER`, so the store endpoints (`/api/me`, `/api/orders/me`...) work exactly as before.

### Frontend guard (`/admin/*`)
| Visitor | What they see |
|---|---|
| Signed out | Redirected to `/sign-in?redirect=/admin/...`; after signing in, Clerk sends them back |
| Signed in, not admin (API answers 403) | A friendly **"No admin access"** page with their Clerk user ID (copy button) and the steps below |
| Signed in, admin | The back office (its own sidebar + top bar layout, no store header/footer) |
| API down / session rejected | "Admin unavailable" with a Retry button |

The guard calls `GET /api/admin/me`, so the UI uses the same rule as every admin endpoint. Admins also get an **Admin** button on the **Account** page (`/account`); it is rendered only when `GET /api/me` says `role: "ADMIN"`. (The store header was not changed; add a header link later if wanted.)

## 2. How to make someone an admin

The user must have a Clerk account (signed up on the store). Their **Clerk user ID** looks like `user_2abc...`; they can see it on the "No admin access" page at `/admin` (copy button), or you can find it in the Clerk dashboard → Users.

**Option A: the first admin (owner), via server config (recommended)**
1. Set the environment variable before starting the API (comma-separated for several):
   ```powershell
   $env:ADMIN_CLERK_USER_IDS = "user_2abc..."
   .\mvnw.cmd spring-boot:run
   ```
   or add `mobinest.admin.clerk-user-ids=user_2abc...` to `config/application.properties` (git-ignored) and restart.
2. Sign in on the store and open `/admin`. On that first call the API creates/promotes the profile to ADMIN and saves it.

Users in this list are always admin: they show "via server config" in the UI and can't be demoted there (remove them from the list first). Removing someone from the list does **not** demote them automatically (the ADMIN role was saved); demote them in the UI afterwards.

**Option B: SQL** (as the app user; see DATABASE.md for the shell command)
```sql
-- preferred: by Clerk user id (unique, can't be faked)
UPDATE customer SET role = 'ADMIN' WHERE clerk_user_id = 'user_2abc...';
-- if they have never used the shop yet, create the profile:
INSERT INTO customer (clerk_user_id, role) VALUES ('user_2abc...', 'ADMIN');
-- by email (only if you are sure; see the note below)
UPDATE customer SET role = 'ADMIN' WHERE email = 'owner@example.com';
```
> ⚠️ `customer.email` is **not verified**: it is copied from the checkout form (and from the token's `email` claim if Clerk sends one). Two profiles could share an email, and someone could type another person's email at checkout. Prefer `clerk_user_id`.

**Option C: in the admin UI (once there is one admin)**
Admin → **Customers & admins** → **Make admin** on a row, or paste a Clerk user ID in "Add an admin by user ID" (works even before that person has used the shop). **Remove admin** demotes. Rules: you can't demote yourself (`CANNOT_DEMOTE_SELF`), config admins can't be demoted (`BOOTSTRAP_ADMIN`), and the last admin can't be removed (`LAST_ADMIN`). Every change is in the audit log.

## 3. Database (Flyway `V7__admin_back_office.sql`)

| Table | Purpose |
|---|---|
| `order_status_history` | `id, order_id (FK, cascade), kind (STATUS/PAYMENT), from_value, to_value, note, changed_by (Clerk id), changed_by_name, created_at`. One row per admin change of an order's status or payment status. |
| `admin_audit_log` | `id, actor_clerk_user_id, actor_name, action, entity_type, entity_id, details (≤1000 chars), created_at`. Append-only log of every admin write (orders, brands, phones, SKUs, accessories, coupons, roles). |
| indexes | `orders(created_at)`, `orders(status, created_at)`, `sku(stock)` for the admin filters and low-stock queries. |

No existing table changed. Admin access uses `customer.role`, which exists since V2. The order timeline's first entry ("Order placed") is derived from `orders.created_at`, so checkout code was not touched.

## 4. Business rules

| Rule | Behaviour |
|---|---|
| Order status | `CONFIRMED → SHIPPED → DELIVERED`; `CONFIRMED` or `SHIPPED → CANCELLED`. DELIVERED and CANCELLED are final. Anything else is **409 `INVALID_TRANSITION`**. |
| Cancelling | Puts every line's quantity back into `sku.stock` / `accessory.stock`, in the same transaction. The order row is locked (`SELECT ... FOR UPDATE`), so a double click or two admins can't restock twice. |
| COD delivered | Marking a Cash-on-Delivery order DELIVERED also marks its payment PAID ("Cash collected on delivery", recorded in the timeline). |
| Payment status | `PENDING → PAID/FAILED`, `FAILED → PAID/PENDING`, `PAID → REFUNDED`; optional reference (UTR/refund id). Cancelled + paid orders show a "refund the customer" hint; refunds themselves are manual for now. |
| Revenue | Sum of `total` for orders that are **not cancelled** and are **PAID** or **COD still PENDING** (cash to collect). AOV = revenue / number of those orders. Refunded and failed payments are excluded. |
| Days | "Today", 7 / 30 days and the daily chart use **IST** calendar days; the DB stores UTC. Date filters (`from`, `to`) are IST days, `to` inclusive. |
| Low stock | `stock <= 5` by default (`threshold` parameter). Dashboard counts only store-visible SKUs and active accessories. |
| Prices | `price` ≥ ₹1, `price ≤ mrp`, ≤ ₹1,00,00,000. Stock 0–100,000. |
| Stale edits | SKU/accessory edits may send `expectedStock` (the value the admin saw). If an order changed the stock meanwhile: **409 `STOCK_CHANGED`**, nothing saved. The row is locked while saving. |
| Visibility | Unchanged from the store: a phone is shown only when the phone **and** its brand are active. Hiding a brand hides its phones; nothing is deleted. Changes are live immediately (the storefront loads the catalogue on page load). |
| Coupons | Never deleted (orders reference them); `DELETE` deactivates. Code can't change after creation. PERCENT 1–100 with optional max discount; FLAT has no max discount; `maxSubtotal ≥ minSubtotal`; `validUntil` must be in the future when set or changed. |

## 5. API reference (all require an admin's Clerk token)

All errors are RFC 9457 problem details, as in API.md. Admin-specific: **400** `VALIDATION_FAILED` (with `fields`, also for bad query parameters, unknown sort fields, `size > 100`, bad dates) and `MALFORMED_REQUEST` (invalid JSON); **401** no/invalid token; **403** not an admin; **404** `NOT_FOUND`; **409** `INVALID_TRANSITION`, `STOCK_CHANGED`, `COUPON_EXISTS`; **422** `CANNOT_DEMOTE_SELF`, `BOOTSTRAP_ADMIN`, `LAST_ADMIN`.

**Paging** (every list except brands): `page` (0-based), `size` (1–100, default 20), `sort=field,asc|desc` (whitelisted per endpoint). Response: `{ content: [...], page, size, totalElements, totalPages }`.

### Session
`GET /api/admin/me` → `{ "userId": "user_2abc", "email": "owner@example.com", "name": null, "role": "ADMIN", "bootstrapAdmin": true, "adminCount": 1 }` (403 for non-admins: the UI uses this as its guard).

### Dashboard
`GET /api/admin/dashboard?days=30&threshold=5` (`days` 7–90; values below are illustrative)
```json
{
  "generatedAt": "2026-11-12T10:40:00Z", "timeZone": "Asia/Kolkata",
  "revenue": { "total": 258291, "paid": 179096, "codPending": 79195, "refunded": 0, "orders": 6, "averageOrderValue": 43049 },
  "ordersByStatus": { "CONFIRMED": 6, "SHIPPED": 0, "DELIVERED": 0, "CANCELLED": 0 },
  "orders": { "today": 2, "last7Days": 6, "last30Days": 6, "total": 6 },
  "daily": [ { "date": "2026-11-12", "orders": 2, "revenue": 79195 } ],
  "topPhones": [ { "productId": "pixel-9a", "name": "Pixel 9a", "units": 3, "revenue": 134997 } ],
  "lowStock": { "threshold": 5, "skuCount": 120, "accessoryCount": 0,
                "items": [ { "type": "sku", "id": "412", "skuCode": "galaxy-s25/12-256/navy/recycled", "name": "Galaxy S25",
                             "details": "12GB · 256GB · Navy · Recycled", "stock": 4 } ] },
  "recentOrders": [ /* order summaries, see below */ ],
  "catalog": { "activeBrands": 3, "brands": 12, "visiblePhones": 17, "phones": 33, "visibleSkus": 292,
               "unitsInStock": 4100, "customers": 1, "admins": 1, "activeCoupons": 3 }
}
```

### Orders
| Method & path | Body / params | Returns |
|---|---|---|
| `GET /api/admin/orders` | `status`, `paymentMethod` (UPI/CARD/EMI/NETBANKING/COD), `paymentStatus`, `from`, `to` (yyyy-mm-dd, IST), `q` (order no., email, phone, name), paging; `sort` = createdAt, updatedAt, total, orderNumber, status, itemCount | page of order summaries |
| `GET /api/admin/orders/{orderNumber}` | | order detail |
| `POST /api/admin/orders/{orderNumber}/status` | `{ "status": "SHIPPED", "note": "Bluedart AWB 123" }` | updated detail |
| `POST /api/admin/orders/{orderNumber}/payment` | `{ "status": "REFUNDED", "reference": "rfnd_123", "note": "..." }` | updated detail |

Order summary:
```json
{ "orderNumber": "MNMWBZJEATG1IG", "createdAt": "2026-11-11T10:41:02Z", "status": "CONFIRMED", "statusLabel": "Confirmed",
  "paymentMethod": "UPI", "paymentMethodLabel": "UPI", "paymentStatus": "PAID", "total": 44999, "itemCount": 1,
  "customerName": "Test Buyer", "email": "test@example.com", "phone": "9876543210", "city": "Bengaluru",
  "couponCode": null, "guest": true }
```
Order detail (abridged):
```json
{ "orderNumber": "MNMWBZJEATG1IG", "createdAt": "...", "updatedAt": "...", "estimatedDelivery": "2026-11-15",
  "status": "CONFIRMED", "statusLabel": "Confirmed",
  "allowedStatuses": ["SHIPPED", "CANCELLED"], "allowedPaymentStatuses": ["REFUNDED"],
  "customer": null, "guest": true, "email": "test@example.com",
  "address": { "fullName": "Test Buyer", "phone": "9876543210", "email": "...", "address": "...", "landmark": null,
               "city": "Bengaluru", "state": "Karnataka", "pincode": "560038" },
  "payment": { "method": "UPI", "methodLabel": "UPI", "status": "PAID", "reference": "DEMO-1a2b3c4d", "amount": 44999 },
  "couponCode": null,
  "totals": { "subtotal": 44999, "mrpTotal": 49999, "productSavings": 5000, "couponDiscount": 0, "shipping": 0, "total": 44999, "itemCount": 1 },
  "items": [ { "type": "phone", "productId": "pixel-9a", "name": "Pixel 9a", "details": "8GB RAM · 256GB · Iris",
               "condition": "Brand New", "colorName": "Iris", "colorHex": "#8c8fd6", "qty": 1, "unitPrice": 44999,
               "unitMrp": 49999, "lineTotal": 44999, "skuId": 101, "skuCode": "pixel-9a/8-256/iris/new",
               "accessoryId": null, "currentStock": 22 } ],
  "timeline": [
    { "kind": "PLACED", "from": null, "to": "CONFIRMED", "note": "Order placed · UPI", "by": "test@example.com (guest)", "byId": null, "at": "..." },
    { "kind": "STATUS", "from": "CONFIRMED", "to": "SHIPPED", "note": "Bluedart AWB 123", "by": "owner@example.com", "byId": "user_2abc", "at": "..." } ] }
```

### Transactions (payments)
| Method & path | Params | Returns |
|---|---|---|
| `GET /api/admin/payments` | `method`, `status` (payment), `orderStatus`, `from`, `to`, `q`, paging; `sort` = createdAt, updatedAt, amount, method, status | page of `{ orderNumber, createdAt, updatedAt, method, methodLabel, status, reference, amount, orderStatus, customerName, email }` |
| `GET /api/admin/payments/summary` | same filters | `{ "count": 6, "amount": 258291, "byMethod": [{ "key": "UPI", "label": "UPI", "count": 4, "amount": 179096 }], "byStatus": [{ "key": "PAID", "label": "Paid", "count": 4, "amount": 179096 }] }` |

Today each order has exactly one payment (stored on `orders`), so these read from `orders`. When Razorpay is added with its own payments table, only `AdminPaymentService` needs to change; the response shape can stay. No Razorpay code exists in the admin.

### Catalogue
| Method & path | Body / params | Returns |
|---|---|---|
| `GET /api/admin/brands` | | all 12 brands: `{ id, name, tagline, accent, active, sortOrder, heroPhone, heroColor, phones, activePhones, skus, units, lowStockSkus }` |
| `PATCH /api/admin/brands/{slug}` | `{ "active": false }` and/or `{ "tagline": "..." }` (≤255) | brand row |
| `GET /api/admin/phones` | `brand`, `active`, `visible`, `q`, paging; `sort` = name, year, updatedAt, createdAt, brand | page of `{ id, name, brand, brandName, brandActive, active, visible, year, fiveG, skus, units, minPrice, maxPrice, lowStockSkus, updatedAt }` |
| `PATCH /api/admin/phones/{slug}` | `{ "active": true }` | phone row |
| `GET /api/admin/skus` | `phone`, `brand`, `condition` (new/refurbished/used/recycled), `lowStock=true`, `threshold`, `visible`, `q`, paging; `sort` = stock, price, mrp, skuCode, phone | page of `{ id, skuCode, phoneId, phoneName, brand, variant, ramGb, storageGb, color, colorHex, condition, conditionLabel, price, mrp, stock, visible }` |
| `PATCH /api/admin/skus/{id}` | `{ "price": 42999, "mrp": 49999, "stock": 20, "expectedStock": 22 }` (any subset) | SKU row |
| `GET /api/admin/accessories` | `category`, `active`, `lowStock`, `threshold`, `q`, paging; `sort` = name, price, stock, updatedAt, category | page of `{ id, name, brandLabel, category, categoryName, price, mrp, stock, active, updatedAt }` |
| `PATCH /api/admin/accessories/{slug}` | `{ "price", "mrp", "stock", "expectedStock", "active" }` (any subset) | accessory row |

### Coupons
| Method & path | Body / params | Returns |
|---|---|---|
| `GET /api/admin/coupons` | `active`, `q`, paging; `sort` = code, validUntil, discountValue, active | page of coupon rows |
| `GET /api/admin/coupons/{code}` | | coupon row |
| `POST /api/admin/coupons` | see below | **201** + coupon row (409 `COUPON_EXISTS`) |
| `PUT /api/admin/coupons/{code}` | same body (code can't change) | coupon row |
| `DELETE /api/admin/coupons/{code}` | | coupon row with `active: false` (soft delete) |

```json
// request
{ "code": "DIWALI5", "description": "5% off this Diwali (up to ₹1,500)", "discountType": "PERCENT",
  "discountValue": 5, "maxDiscount": 1500, "minSubtotal": 0, "maxSubtotal": null,
  "validUntil": "2026-11-20T18:29:59Z", "active": true }
// coupon row
{ "code": "DIWALI5", "description": "...", "discountType": "PERCENT", "discountValue": 5, "maxDiscount": 1500,
  "minSubtotal": 0, "maxSubtotal": null, "active": true, "validUntil": "2026-11-20T18:29:59Z",
  "expired": false, "usable": true, "timesUsed": 0, "discountGiven": 0 }
```

### Customers & roles
| Method & path | Body / params | Returns |
|---|---|---|
| `GET /api/admin/customers` | `q` (name, email, user id), `role`, paging; `sort` = createdAt, email, name, role | page of `{ id, clerkUserId, email, name, role, bootstrapAdmin, orderCount, totalSpent, lastOrderAt, createdAt }` |
| `PUT /api/admin/customers/{clerkUserId}/role` | `{ "role": "ADMIN" }` or `{ "role": "CUSTOMER" }` | customer row |

`orderCount`/`totalSpent` count the customer's signed-in orders (guest orders aren't linked to an account); `totalSpent` excludes cancelled orders.

### Audit log
`GET /api/admin/audit?entityType=ORDER&entityId=MN...&q=...` (paging, `sort` = createdAt, action) → page of
`{ "id": 7, "at": "...", "actorId": "user_2abc", "actor": "owner@example.com", "action": "ORDER_STATUS", "entityType": "ORDER", "entityId": "MNMWBZJEATG1IG", "details": "CONFIRMED -> CANCELLED; restocked 1 unit; note: customer called" }`

Actions: `ORDER_STATUS`, `PAYMENT_STATUS`, `BRAND_UPDATE`, `PHONE_UPDATE`, `SKU_UPDATE`, `ACCESSORY_UPDATE`, `COUPON_CREATE`, `COUPON_UPDATE`, `COUPON_DEACTIVATE`, `ROLE_CHANGE`.

## 6. Admin UI pages

| Route | Page |
|---|---|
| `/admin` | Dashboard: revenue, orders today/7d/30d, AOV, low stock, revenue/orders per day chart (CSS bars, 7/30/90 days), orders by status, recent orders, top phones, low-stock list |
| `/admin/orders`, `/admin/orders/:orderNumber` | Filterable, sortable order list (filters live in the URL, so views can be bookmarked); detail with items, address, totals, payment, customer, timeline and status/payment actions (with note, confirmation and restock warning) |
| `/admin/payments` | Transactions: totals per status and per method, filters, list |
| `/admin/coupons` | List with usage, create/edit dialog, deactivate |
| `/admin/catalog/brands` | Show/hide brands, edit taglines |
| `/admin/catalog/phones` | All phones incl. hidden, activate/deactivate, link to their SKUs |
| `/admin/catalog/skus` | Inline price/MRP/stock editing (Enter to save, Esc to undo), filters by brand, phone, condition, visibility, low stock |
| `/admin/catalog/accessories` | Inline price/MRP/stock, active toggle |
| `/admin/customers` | Customers with order count and total spent; make/remove admin; add an admin by Clerk user ID |
| `/admin/audit` | Audit log with filters |

Light/dark mode follows the store's toggle (`<html class="dark">`); the admin has its own toggle in the top bar.

### Dev-only preview
`http://localhost:5173/admin?preview=1` (only under `npm run dev`) renders the admin with **fake sample data** from `src/pages/admin/preview/previewApi.js`, without signing in or calling the API, for UI review. It is behind `import.meta.env.DEV`, which Vite replaces with `false` in production builds, so the branch and the sample-data module are removed from the bundle (verified: no preview strings in `vite build` output). A yellow banner marks preview mode.

### Screenshots (`context/screenshots/admin/`)
| File | Shows |
|---|---|
| `01-signed-out-redirects-to-sign-in.png` | `/admin` while signed out → Clerk sign-in (redirects back after sign-in) |
| `02-dashboard-preview.png` | Dashboard (preview data) |
| `03-orders-preview.png` | Orders list |
| `04-order-detail-preview.png` | Order detail with actions and timeline |
| `05-skus-preview.png` | SKU inline editing |
| `06-customers-preview-dark.png` | Customers & admins, dark mode |
| `07-payments-preview.png` | Transactions |
| `08-brands-preview-dark.png` | Brands, dark mode |
| `09-coupons-preview.png` | Coupons |

## 7. Code map

| Area | Files |
|---|---|
| Role + security | `customer/AdminProperties`, `customer/CustomerRoleService` (cache, bootstrap), `customer/ClerkRoleJwtConverter`; `config/SecurityConfig` (plugs the converter in) |
| Shared | `admin/common/` AdminPaging (sort whitelist), Params (IST days, enum parsing, LIKE escaping), CurrentAdmin/AdminActor, FieldValidationException, AdminExceptionHandler (400s instead of 500s, admin controllers only) |
| Features | `admin/dashboard`, `admin/order` (orders, payments, workflow, history), `admin/catalog`, `admin/coupon`, `admin/customer`, `admin/audit` |
| Tests | `customer/CustomerRoleServiceTest` (7: role from DB, cache/TTL/invalidation, bootstrap, fail-closed, forged claim ignored), `admin/AdminRulesTest` (5), `admin/AdminApiSecurityTest` (11, MockMvc through the real security chain with a mocked JwtDecoder so the real role converter runs; writes are rolled back) |

## 8. Limitations / next steps

- **No Clerk webhook sync:** a customer profile (and email) only exists after the user's first API call; emails come from checkout and are unverified. Adding the `email` claim to the Clerk session token (Clerk dashboard → Sessions → customize token) or a `user.created` webhook would fill names/emails reliably.
- **Refunds are manual** (mark REFUNDED after refunding outside the app). Razorpay refunds can plug into `changePayment` later.
- Guest orders aren't linked to customers, so customer totals exclude them.
- Role cache is per API instance (fine for one server; with several instances a demotion takes up to 30 s to apply everywhere).
- No product creation/deletion or image upload in the admin yet (catalogue is still seeded); phones can be hidden, not created.
- The admin link is on the Account page, not in the store header.
- Store endpoints still return 500 (not 400) for malformed JSON; the admin API handles this with its own advice. A global fix belongs in `common/error/GlobalExceptionHandler`.
