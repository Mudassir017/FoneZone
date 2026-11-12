# MobiNest: Project Context & Conversation Log

_Last updated: **12 Nov 2026, 16:00 IST** · Status: **Full stack working, redesigned and rebranded as Namma Mobiles: React (:5173) → Spring Boot API (:8080) → MySQL `mobinest` (Flyway v6). In progress (subagents): admin side, payments guide, brand-section design options.**_

This file records every request from the product owner, the decisions made, and where the project stands, so any developer or AI assistant can pick it up without the original chat.

---

## 1. Current status (snapshot)

| Area | State |
|---|---|
| Frontend (`mobinest/`) | React 19 + Vite + Clerk, owned by the separate frontend Claude session **`admin-73`** (see `mobinest/CONTEXT.md`). **Connected to this API** since 11 Nov 2026: catalogue from `/api/catalog` (falls back to bundled data if the API is down), checkout via `POST /api/orders`, Account via `/api/orders/me`. Product photos are served by the frontend. |
| Backend (`mobinest-api/`) | Spring Boot 4.1.2 on Java 25, owned by this session **`admin-b4`**: catalogue APIs (active brands only), checkout with server-side pricing, coupons, stock reservation, orders, Clerk JWT verification, Swagger UI |
| Database | MySQL 8.0.45, schema `mobinest` at Flyway **v3**: 12 brands (**3 active**: Apple, Samsung, Google Pixel), 32 phones (16 visible), 470 SKUs (284 visible), 17 accessories, 3 coupons, 2 test orders. See DATABASE.md |
| Sessions | Backend `admin-b4` and frontend `admin-73` coordinate by direct messages. Shared contract: `context/API.md` |
| Tests | 7 unit tests pass (pricing, coupons, shipping). Manual end-to-end checks passed (section 5). |
| Payments | **Demo only:** online methods are marked PAID immediately; COD stays PENDING. Razorpay is the next phase. |
| Version control | Not yet a git repository |

---

## 2. Timeline of requests and what was done

### Request 1: plan the full stack application
> "I'm building an e-commerce application dedicated to mobiles (only mobiles will be sold)... another session is building the front end using React and JavaScript... plan how it should be a full stack application."

**Done:** reviewed the React draft in `C:\Users\admin\mobinest` (routes, data shapes, cart and checkout logic) and proposed a full stack plan: Spring Boot REST API + MySQL, SKU-based catalogue, server-side pricing, JWT auth, Razorpay, admin panel, and a phased build order.

### Request 2: tech stack, installation, architecture first
> "Front end React, back end Java and Spring Boot (you can also use Spring AI / the Java ecosystem), database MySQL. Install all the dependencies... Apache Tomcat... set it up. First plan how the project should look: design patterns, the architecture."

**Done:**
- Found MySQL 8.0.45 already installed and running, Eclipse (JRE only, no JDK), and Node 24. Installed **Eclipse Temurin JDK 25** via winget.
- **Maven:** the project uses the Maven wrapper (no global install). **Tomcat:** embedded in Spring Boot (no separate install). Both are explained in the README.
- Generated the project from start.spring.io: Boot **4.1.2**, Java **25**, with web, data-jpa, mysql, flyway, validation, security, oauth2-resource-server, actuator, lombok and devtools, plus springdoc-openapi 3.2.0.
- Architecture and design patterns are documented in PROJECT.md.

### Request 3 (mid-task): the frontend context file
> "C:\Users\admin\mobinest\CONTEXT.md has the complete context of the frontend..."

**Effect:** the frontend now uses **Clerk** for sign-in (app "NammaMobiles", dev instance `unique-glider-3348.clerk.accounts.dev`). **Decision:** the backend does not issue its own logins. It acts as an OAuth2 resource server that verifies Clerk session JWTs (JWKS signature, issuer, expiry, `azp` claim).

### Request 4 (mid-task): open the app when done
> "Once the complete setup is done, open the first draft of my full stack application in the browser."

### Request 5 (mid-task): backend and database only
> "Completely focus on the backend and the database. The frontend part I'll be dealing with separately."

**Decision:** no frontend files were changed. Wiring the React app to the API is left to the owner (see open items). "Open in browser" became **Swagger UI** at http://localhost:8080/swagger-ui.html.

### Requests 6 to 8: database credentials
The owner first asked which option was recommended (run the root script themselves vs. let the assistant do it), then authorised the assistant to do it ("it's just a demo project") and provided the MySQL root password.

**Done:** the root password was used **once** to create the database `mobinest` (utf8mb4) and the least-privilege user `mobinest_app` with a generated password stored only in `mobinest-api/config/application.properties` (git-ignored). The root password is **not stored anywhere** in the project. The app never connects as root.

**Then:** started the API. Flyway applied V1 and V2, the seeder loaded the catalogue, all checks passed (section 5), and Swagger UI was opened.

### Request 9: database stats + a maintained context folder
> "I want to know the stats of the backend database... maintain a context folder with a README, CONTEXT.md, project details and documentation... all necessary files to understand this project and re-execute it. If I unzip it and ask any AI model to run this application, it should be capable of running it. It can be shared with other people. Hereafter any changes... should get updated in that folder."

**Done:** created `mobinest-api/context/` with README.md, CONTEXT.md (this file), PROJECT.md, DATABASE.md (including live stats), API.md and CHANGELOG.md, plus `setup/setup-database.ps1` (tested on a throwaway database, then removed), an SQL template, a config template, and the seed export tool. **Standing rule:** every future change is logged here (see the README section "Rule for maintaining this folder").

### Request 10: connect this (backend) session with the frontend session
> "Is there any way that I can connect this session with my frontend session... so that you can get the context of that?"

**Findings:** this backend session is `admin-b4`. Three other local Claude Code sessions were visible (`admin-0e`, `admin-73`, `admin-9e`), and it wasn't yet known which one is the frontend. Sessions can message each other directly. Both projects are on the same disk, so the backend session can also read `mobinest/CONTEXT.md` and the frontend code at any time.
**Proposed way of working:** each side keeps its own context file current (`mobinest/CONTEXT.md` for the frontend, `mobinest-api/context/` for the backend), and direct messages handle coordination (API contract changes, catalogue changes).

### Request 11: sessions linked, continue the work
> "I have already shared that message with my frontend session... continue to work wherever you left off."

**Done:**
- The frontend session identified itself as **`admin-73`**. The backend sent it the API contract and asked about brands, photos and other needs. Its answers:
  1. The 3-brand catalogue is the owner's **current focus** ("focus on only Apple, Samsung and Pixel by Google first; later we will include other brands once the design is good"). It's not permanent, so the other brands' data is kept.
  2. Photos are official renders converted to WebP in `mobinest/public/images/phones/<phoneId>/<colourSlug>.webp` (1000px) and `-sm.webp` (480px), plus `gallery-1/2` in the first colour, for all 16 active phones. They're served by the frontend at `/images/phones/...`, and `imageManifest.json` is generated by its `scripts/build-image-manifest.mjs`. Colour slug = lowercase, non-alphanumerics → `-`. The folder `C:\Users\admin\mobile-phone-images` was **not** made by the frontend session (origin unknown).
  3. No other API needs requested yet.
- **Implemented Flyway V3 (brand visibility)**: `brand.active` + `hero_phone_slug`/`hero_color`, only apple/samsung/google active, new taglines, "Google Pixel". The API returns only active brands and their phones; hidden phones return 404 and can't be ordered. Verified: the API equals the frontend's `BRANDS`/`PHONES` exactly, and a **fresh install** (throwaway DB, removed afterwards) gives the same catalogue as the upgraded live DB.
- The seed export tool now exports all brands and phones with `active`. `seed/brands.json` was updated.
- **The frontend session connected the React app to the API**, at the owner's request ("show the full stack working"). Its browser end-to-end test created guest order `MNMWBZJEATG1IG` (kept as test data). The signed-in flow with a real Clerk token is still to be tried by the owner.
- Told the frontend session that V3 is live and how the contract changed.
- **Frontend confirmed V3 on the live site** (3 brands with matching names, taglines and hero images; 16 phones). It keeps local names for hidden brands so old carts and orders still resolve, so **no `includeInactive` endpoint is needed**. It also fixed a bug V3 exposed (blank brand names in accessory "compatible with" lists now show only active brands). **Image URLs in the API aren't needed for now.**

### Request 12 (12 Nov 2026): open the Spring project
> "Open that Spring project. I just wanted to see how much it has been built so far."

**Done:** the API had stopped with the previous session; it was restarted (data intact) and Swagger UI opened, with a walkthrough of what's built.

### Request 13 (12 Nov 2026): is the frontend integrated with the backend?
> "Have you integrated the frontend with the backend? If not, please do it. Or if you are facing any challenges, please let me know."

**Findings:** the integration was already done by the frontend session (Vite proxy, `services/api.js`, `services/catalog.js` loading `/api/catalog` at startup with a fallback to bundled data, checkout `POST /api/orders` with the Clerk token, Account → `/api/orders/me`). The real problem was that **both servers had stopped**, because they ran as background tasks of earlier Claude sessions.
**Done:** added `context/setup/start-mobinest.ps1` and started both servers in their own windows. Verified the integration through the proxy (catalogue, a real COD order `MNMWDCH4O7KZS7`, auth 401). Fixed one integration bug **on the backend**: validation field names now match the checkout form (`phone`, not `address.phone`). Opened the storefront.
**Still open:** the owner should test the **signed-in** flow in the browser (sign in → order → Account page).

### Request 14 (12 Nov 2026): infinite offers carousel in the top banner
> "Instead of 'Free Delivery / ₹499'... an infinity-scrollable carousel: 'Diwali sale is live right now', '25% discount on HDFC credit card', 'Up to 12 months of warranty'..."

**Done** (first frontend change made by this session, at the owner's direct request): `AnnouncementBar` ticker with offers kept in `src/data/promotions.js`. See CHANGELOG. Coordinated with the current frontend Claude session (`react-js-f9`) to avoid edit clashes.

### Request 15 (12 Nov 2026): shadcn / Aceternity UI, header redesign, light/dark mode, new logo
> "`npx shadcn@latest init`: this is a command for the dependency of our Aternity UI. Are you able to fetch it and install it by yourself?" · "`npx shadcn@latest mcp init --client claude`" · "Focus on the header: a toggle for light and dark mode, include a search bar, modernise it... we are going to design a dedicated logo right now."

**Owner's choices:** safe install (no visual change), the logo for **NammaMobiles**, dark mode for the whole site, and the shadcn MCP. **Done:** see CHANGELOG 2026-11-12 (afternoon). The owner then supplied their own logo (PNG and SVG in Downloads); the PNG was used because the SVG is a simplified redraw.

### Requests 16–24 (12 Nov 2026, afternoon), summarised
- **Hero:** remove the "India's phone-only store" caption and the 4-stat row, add an Aceternity glare. **Done** (Spotlight).
- **Hero phone:** first "use the latest iPhone Fold". Research showed Apple's foldable is called **iPhone Duo**, and it was added. Then: "it looks odd, use the **iPhone 18 Pro Max in burgundy**". Research confirmed **Burgundy** is Apple's official name. **Done**; the Duo stays in the catalogue.
- **"Shop by brand":** logos instead of phone photos, with a correct Pixel logo; no left border; bright logos; a subtle gradient glow on hover. **Done.** "Give me 5 options (Aceternity-style) for the brand section": a subagent is building a preview page at `/design/brand-cards`; the owner will pick one.
- **Typography** "not updated": Plus Jakarta Sans is now used across the whole UI (previously body text was still Inter).
- **Colours:** purple buttons → logo blue. **Done.**
- **Remove all small labels above section titles** ("Shop by brand", "Just landed & most loved", ...). **Done**, site-wide.
- **Clerk:** remove the "Development mode" banner and the Clerk logo. The banner is **done**. "Secured by Clerk" can only be removed in the Clerk Dashboard (Settings → Branding); free on the dev instance, Pro plan for production. **Awaiting the owner's go-ahead** to change their Clerk setting.
- **Home sections** (subagent): Recent launches / Best sellers, Shop by price (4 ranges), Gallery (official Apple/Samsung/Pixel films, no duplicates), "Can't decide?" order: base models → ultimate flagships → foldables (→ flagship vs everyday), then certified refurbished. **Done.**
- **"Test the entire application end to end":** done with a 23-check Playwright suite; all user flows pass, with 0 console errors (see CHANGELOG).
- **"Can we fill the database with real data from 91mobiles.com (specs, prices, Amazon/Flipkart links)?"** Answered: technically possible, but **copying 91mobiles' database is not OK**. Their robots.txt blocks crawlers from `/api_mobile`, price/spec-score pages and affiliate redirects, and their terms page refuses automated access; republishing their compiled data publicly risks copyright/terms violations. The recommended path is official sources: manufacturer spec pages, **Amazon Associates PA-API** and the **Flipkart Affiliate API** (official product data, prices and affiliate links), plus admin-curated entries. Awaiting the owner's decision on the business model (own store vs price-comparison with affiliate links vs hybrid).
- **Razorpay + UPI:** the owner asked whether Razorpay alone is enough, and how it relates to UPI QR / UPI apps. A subagent is writing `context/PAYMENTS.md`.
- **Admin side** (orders, transactions, catalogue, coupons, customers, roles) with Clerk auth: a subagent is building it (API `/api/admin/**` + `/admin` UI); docs will be in `context/ADMIN.md`.

---

## 3. Key decisions (and why)

| Decision | Why |
|---|---|
| Spring Boot 4.1.2 + Java 25 (latest LTS) | Owner's Java/Spring background; current stable versions as of Nov 2026 |
| Separate project `mobinest-api` next to `mobinest` | Frontend and backend evolve independently; no file clashes with the frontend session |
| Package-by-feature (`catalog`, `order`, `customer`, `config`, `common`) | Each feature is self-contained; easier to grow and to explain |
| Clerk JWT verification (resource server) instead of custom login | Frontend already uses Clerk; avoids storing passwords |
| Local `customer` table keyed by Clerk user id, created on first API call | Orders need an owner; Clerk remains the identity source |
| **SKU = phone + variant + colour + condition** with its own price and stock | Real stock control per sellable unit; admin can override any single price |
| SKU prices generated with the **same formula as the frontend** (`MRP x (1 - discount) x conditionFactor`, rounded to ₹..99) | Draft prices stay identical in both apps (verified: 144 of 144 combinations match) |
| API JSON field names mirror the React data model (`id`=slug, `is5G`, `variants[].price`, `prices["0:new"]`) | The frontend can switch to the API with minimal changes |
| All totals computed server-side; client sends only the selection | Prevents price tampering |
| Atomic `UPDATE ... WHERE stock >= qty` + DB `CHECK (stock >= 0)` | No overselling under concurrent checkouts |
| Order items store name and price snapshots | Past orders never change when the catalogue does |
| Guest checkout allowed; order history requires sign-in | Matches the frontend (checkout works signed-out) |
| Flyway owns the schema (`ddl-auto: none`) | Versioned, repeatable migrations; safe for teams and production |
| Money as `DECIMAL(12,2)` / `BigDecimal` | No floating-point rounding errors |
| Timestamps stored in **UTC** (`hibernate.jdbc.time_zone=UTC`); delivery dates use Asia/Kolkata | Standard practice; convert for display |
| Secrets in git-ignored `config/application.properties` or env vars | Never commit passwords |
| Spring AI postponed to a later phase ("AI phone advisor") | Needs an LLM API key and a stable catalogue API first |

---

## 4. Open items / next steps

0. ~~Frontend catalogue drift (3 active brands, hero, taglines)~~: **resolved by V3** (see request 11).
1. ~~Connect the frontend~~: **done by the frontend session.** Still open: the owner should test the **signed-in** flow (sign in → place order → Account shows it) to confirm Clerk token verification end to end.
1a. **Product photos in the API:** parked. The frontend keeps its own image manifest until the owner decides otherwise. If needed later: per-colour and gallery URLs following `/images/phones/<phoneId>/<colourSlug>(-sm).webp`.
1b. Test data: 3 guest test orders (`MNMWBYYOZCWMIP`, `MNMWBZJEATG1IG`, `MNMWDCH4O7KZS7`). Remove them before any demo if needed (see DATABASE.md).
2. **Payments:** a `RazorpayGateway` (create order, verify signature, webhook, auto-cancel unpaid orders after 15 min).
3. **Server-side cart and wishlist**, saved addresses.
4. **Admin APIs** (`/api/admin/**` is already restricted to the ADMIN role): products, SKU price and stock, orders, coupons.
5. **Trade-in (Sell page) API**, reviews, order emails.
6. **Spring AI phone advisor** (chat with tool calling over the catalogue).
7. Integration tests with Testcontainers, Docker, deployment, **git repository**.
8. Brand name: the code says **MobiNest**, but the Clerk app is **NammaMobiles**. The owner decides.

---

## 5. Verification done (11 Nov 2026)

| Check | Result |
|---|---|
| `/actuator/health` | UP |
| `/api/catalog` | 12 brands, 4 conditions, 32 phones, 8 categories, 17 accessories |
| Server vs. frontend prices | 144/144 variant x condition combinations identical |
| Guest order (2 x Pixel 9a new + 1 case, WELCOME10, UPI) | Order `MNMWBYYOZCWMIP`: subtotal ₹91,497, coupon -₹2,000 (capped), shipping ₹0, total ₹89,497, PAID; stock 75 → 73 |
| COD order over ₹50,000 | 422 `COD_LIMIT` |
| Qty 5 of a recycled SKU with stock 4 | 409 `OUT_OF_STOCK`, no stock taken (transaction rolled back) |
| Invalid checkout form | 400 `VALIDATION_FAILED` with per-field messages |
| `/api/orders/me` with no token or a bad token | 401 |
| Swagger UI and `/v3/api-docs` | 200 |
| Unit tests | 7/7 pass |

---

## 6. Environment of the original machine

Windows 11 Pro · JDK Temurin 25.0.5 · MySQL Server 8.0.45 (service `MySQL80`) + Workbench 8.0 · Node 24.19 · Git installed · Maven via wrapper · Frontend dev server on :5173, API on :8080.
