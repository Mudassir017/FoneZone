# Namma Mobiles: Project Context & Conversation Log

_Last updated: 11 Nov 2026 · Status: **Version 2: mobile-first redesign, real product photos, 3 brands (Apple, Samsung, Google Pixel). Clerk auth integrated. Running on http://localhost:5173**_

> **Version 2 changes** are summarised in section 8 at the end of this file.

This file records everything decided and built so far, so any developer (or AI assistant) can pick up the project without the original chat.

---

## 1. The brief (from the product owner)

> Build a **production-level React application** (React + **JavaScript**, not TypeScript): an **e-commerce store for electronics focused purely on mobile phones**.

Key points from the request:

- **Phones only:** unlike general e-commerce sites that sell all electronics, this brand sells only **branded mobile phones**. The goal is a **one-stop destination for anyone buying a phone**.
- **Many brands and models**, each with **colour options** (and storage variants).
- **Every way to buy a phone:** **new, used, recycled and refurbished**.
- **Corresponding accessories** for the phones.
- Build a **first draft**; the owner will request changes afterwards.

Follow-up requests in the same conversation:

1. **Add Clerk authentication.** The owner pasted Clerk's setup guide. The Clerk Dashboard had already selected application **`app_3M9UHHbVJ4gImWiqcwdIhkseKLV`** (named **"NammaMobiles"** in Clerk), framework **React**.
2. **Open the app on localhost** to review the first draft.
3. **Provide this context file** covering the whole conversation.

---

## 2. Decisions made

| Topic | Decision | Why |
| --- | --- | --- |
| Tooling | **Vite 8 + React 19 + JavaScript (JSX)**, **React Router 7** (data router), ESLint 10 | Fast, current, standard for React SPAs |
| Working brand name | **Namma Mobiles**, tagline “Every phone. Every brand. One destination.” | Placeholder brand; the Clerk app is called **NammaMobiles**, so the final name is the owner's call |
| Currency / market | **India (₹ INR)**, Indian states, 6-digit pincodes, 10-digit mobile numbers, UPI/COD payments | Matches the owner's context |
| Buying conditions | **Brand New**, **Certified Refurbished** (12-mo warranty), **Pre-owned** (6-mo), **Eco Recycled** (3-mo) | Covers the four ways to buy that were requested |
| Condition pricing | Derived from launch price × `priceFactor` (1 / 0.78 / 0.64 / 0.52) × per-phone discount | Simple and configurable for the draft; use real per-SKU prices in production |
| Product images | **Drawn in code (`PhoneArt`)** in the selected colour, with camera-module styles per phone | No licensing issues and no broken links; swap in licensed photos later |
| Brand logos | Not used; brands are shown as text | Trademark safety; use licensed assets before launch |
| Data layer | Local sample catalogue; every query goes through **`src/utils/catalog.js`** | One file to replace with API calls later |
| State | React Context: Cart (useReducer), Shortlist (wishlist + compare), Auth (wraps Clerk + order history), Toasts. Saved in `localStorage` under `Namma Mobiles:*` keys | No backend yet |
| Cart design | Cart stores only the selection (product, variant, colour, condition, qty); **prices are always recalculated from the catalogue** | Prevents stale prices |
| Filters | Stored in the **URL query string** | Shareable, works with the back button, SEO-friendly |
| Styling | One `global.css` with design tokens; no CSS framework | Simple to theme; responsive down to 360px |
| Auth | **Clerk** (`@clerk/react` 6.x), replacing the original stand-in login | Owner's request |

---

## 3. What was built

### Pages / routes

| Route | Page | Highlights |
| --- | --- | --- |
| `/` | Home | Hero; shop by condition (4 cards with “from” price and warranty); brand tiles; new launches; sell/recycle banner; bestsellers; refurbished deals; accessory categories; trust strip |
| `/phones` | Shop | Filters: condition, brand, price range, storage, RAM, rating. Sorting: relevance, price ↑↓, rating, newest, discount. Search (`?q=`), removable filter chips, filter drawer on mobile |
| `/phones/:id` | Product page | Condition selector with live price for each condition, colour swatches (image recolours), storage/RAM variants, qty, Add to cart / Buy now, wishlist, compare, EMI, pincode delivery check, offers, highlights, tabs (Specs / In the box / Condition guide), compatible accessories, similar phones |
| `/accessories`, `/accessories/:id` | Accessories | 8 categories, “compatible with” brand filter, sort, detail page with colours |
| `/brands` | Brands | 12 brands with model count and starting price |
| `/compare` | Compare | Up to 3 phones side by side; sticky compare tray across the site |
| `/wishlist` | Wishlist | Phones and accessories |
| `/cart` | Cart | Qty (max 5 per line), remove with **Undo**, coupons, free-delivery bar (₹499), price breakdown |
| `/checkout` | Checkout | Validated address form, payment methods (UPI/Card/EMI/Net banking/COD up to ₹50,000), review, place order (demo, no real payment) |
| `/order/:id` | Order confirmation | ETA, items, totals, address |
| `/sign-in/*`, `/sign-up/*` | **Clerk** prebuilt `<SignIn/>` / `<SignUp/>` | Supports `?redirect=`; only internal paths are allowed (no open redirect) |
| `/login` | Legacy | Redirects to `/sign-in` |
| `/account` | Account (requires sign-in) | Clerk profile, **Manage account** (Clerk user profile), Sign out, order history |
| `/sell` | Sell / Recycle | Brand → model → variant → condition questions → **instant trade-in quote**; dead phones get a ₹500 recycling voucher; pickup booking |
| `/help/:topic` | Help | `warranty`, `returns`, `shipping` (placeholder policy text) |
| `*` | 404 | |

### Catalogue (sample data in `src/data/`)

- **12 brands:** Apple, Samsung, Google, OnePlus, Xiaomi, Vivo, OPPO, Nothing, Motorola, realme, iQOO, POCO
- **31 phones**, e.g. iPhone 17 Pro Max / 17 Pro / Air / 17 / 16 / 15 / 14, Galaxy S25 Ultra / S25 / Z Fold7 / Z Flip7 / S24 FE / A56, Pixel 10 Pro / 10 / 9a, OnePlus 13 / 13R / Nord 5, Xiaomi 15, Redmi Note 14 Pro+, vivo X200 Pro / V50, OPPO Find X8 Pro / Reno14 Pro, Nothing Phone (3) / (3a), Motorola Edge 60 Pro / razr 60 ultra, realme GT 7 Pro, iQOO 13, POCO F7. Each phone has colours, RAM/storage variants with prices, available conditions, specs, highlights and tags.
- **17 accessories** in 8 categories: cases, screen protection, chargers, cables, audio, power banks, smartwatches, mounts. Accessory brands are fictional house brands (Namma Mobiles Essentials, VoltEdge, ArmorShield, ZipLine, AuraSound).
- **Coupons:** `WELCOME10` (10%, max ₹2,000), `MOBI1000` (₹1,000 off above ₹25,000), `ACCESS20` (20% off orders up to ₹5,000).

> ⚠️ Specs and prices are **approximate sample data**. Verify them before launch.

### Cross-cutting quality

- Route-level code splitting (`React.lazy` + `Suspense`), error boundary (resets on navigation), scroll restoration
- Accessibility: skip link, labelled controls, `aria-pressed`/`aria-invalid`, live-region toasts, keyboard focus styles, reduced-motion support
- Responsive: 4 → 3 → 2-column grids, mobile menu drawer, filter drawer
- ESLint passes with no warnings; `vite build` passes

---

## 4. Clerk authentication: what was done

1. Ran `npx -y clerk@latest init --app app_3M9UHHbVJ4gImWiqcwdIhkseKLV` in the project root.
   - Installed `@clerk/react` and wrote `.env.local` with `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (development instance). **Never commit this file; it is git-ignored.** Only `VITE_`-prefixed variables reach the browser, so the secret key is not exposed.
   - Installed Clerk agent skills globally (`~/.agents/skills/clerk-*`).
2. `npx -y clerk@latest doctor`: all checks passed. It is logged in, linked to **NammaMobiles** (`app_3M9UHHbVJ4gImWiqcwdIhkseKLV`), with development instance `ins_3M9UHKuwQdw8PVVbkAAwxV8Jyb5`. **Production is not configured yet.**
3. Code changes:
   - `src/main.jsx`: `<ClerkProvider publishableKey signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/" appearance={{ brand colours }}>` wraps the app (outside the router, as Clerk recommends).
   - `src/context/AuthContext.jsx`: the stand-in login was removed. It now uses Clerk's `useUser`/`useClerk` and exposes `{ isLoaded, user: { id, email, name, imageUrl }, logout, openUserProfile, orders, addOrder, getOrder }`. Orders are tagged with the Clerk `userId`.
   - `src/components/layout/Header.jsx`: `<Show when="signed-out">` shows **Sign in** / **Sign up** (modal); `<Show when="signed-in">` shows **Orders** and Clerk's **`<UserButton/>`**. The mobile menu has matching links.
   - `src/pages/Login.jsx`: now hosts Clerk's `<SignIn/>` / `<SignUp/>` with path routing.
   - `src/pages/Account.jsx`: waits for `isLoaded`, then redirects signed-out users to `/sign-in?redirect=/account`.
   - `src/App.jsx`: adds the `sign-in/*` and `sign-up/*` routes; `/login` redirects to `/sign-in`.
   - `src/pages/Checkout.jsx`: “Sign in” link and `userId` on orders.

### Still to do for Clerk

- **Sign up as the first test user** on http://localhost:5173. The profile icon should then appear in the header.
- Decide the **sign-in methods** (email, phone OTP, Google, etc.) in the Clerk Dashboard or with `npx -y clerk@latest config pull` / `config patch`. Phone OTP is popular in India.
- **For production:** run `npx -y clerk@latest deploy --mode agent --domain <your-domain>` with a domain you own, then copy the production keys to your host.
- Optional: Clerk **Organizations** (B2B, e.g. corporate bulk orders).

---

## 5. How to run

```bash
cd C:\Users\admin\Namma Mobiles
npm install          # first time only
npm run dev          # http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serve the production build
npm run lint
npx -y clerk@latest doctor   # check the Clerk setup
```

---

## 6. Project structure

```
Namma Mobiles/
├─ index.html, vite.config.js, eslint.config.js, package.json
├─ .env.local                 # Clerk keys (git-ignored, never commit)
├─ README.md, CONTEXT.md
└─ src/
   ├─ main.jsx                # ClerkProvider + App
   ├─ App.jsx                 # router + lazy routes
   ├─ components/
   │  ├─ layout/              # Header, SearchBar, Logo, Footer, CompareBar, Layout
   │  ├─ PhoneArt.jsx         # vector phone render (colour + camera style)
   │  ├─ AccessoryArt.jsx, ProductCard.jsx, AccessoryCard.jsx, FilterPanel.jsx
   │  ├─ Price, Rating, ConditionBadge, QuantityStepper, Breadcrumbs, EmptyState,
   │  ├─ OrderSummary, OrderItems, LineThumb, SectionHeader, Icon, PageLoader,
   │  └─ ScrollToTop, ErrorBoundary
   ├─ context/                # AppProviders, AuthContext (Clerk), CartContext, ShortlistContext, ToastContext
   ├─ data/                   # brands.js, phones.js, accessories.js, conditions.js
   ├─ hooks/                  # useLocalStorage, useDocumentTitle, useShortlistActions
   ├─ pages/                  # Home, Shop, ProductDetail, Accessories, AccessoryDetail, Brands, Compare,
   │                          # Wishlist, Cart, Checkout, OrderSuccess, Login (Clerk), Account, Sell, Help, NotFound
   ├─ styles/global.css
   └─ utils/                  # catalog.js, pricing.js, checkout.js, format.js, color.js
```

---

## 7. Known limitations & suggested next steps

1. **Backend/API:** catalogue, inventory, orders, coupons and trade-in quotes are client-side only. Next: Node/Express (or Next.js API routes) with a database. Verify Clerk session tokens (`getToken()` → `Authorization: Bearer`) on the server.
2. **Payments:** checkout is a demo. Integrate Razorpay, Cashfree or Stripe, with server-side order creation and signature verification.
3. **Real product media:** licensed photos and 360° views from a CDN.
4. **Inventory per unit** for refurbished/used phones (IMEI, grade, battery health, photos of the actual unit).
5. **Admin panel** for catalogue, pricing, orders and trade-in pickups.
6. **Reviews & Q&A**, order tracking timeline, returns flow, notifications (email/SMS/WhatsApp).
7. **SEO:** consider moving to Next.js or React Router framework mode for SSR, product structured data and a sitemap.
8. **Brand name:** the code now says **Namma Mobiles** and the Clerk app is **NammaMobiles** (`app_3M9UHHbVJ4gImWiqcwdIhkseKLV`). All references updated.
9. **Tests:** unit tests (Vitest) for pricing, cart and coupons; E2E tests (Playwright plus `@clerk/testing`) for the purchase flow.
10. `npm audit` shows 4 moderate advisories in **ESLint's dev dependencies only**; they don't affect the shipped app.

---

## 8. Version 2 (11 Nov 2026): owner feedback and changes

### Feedback from the owner
1. "The UI doesn't look that great and the page is not responsive." Use a **mobile-first** approach with proper margins and padding.
2. "I want actual images." Replace the drawn (SVG) phones with **real, high-quality photos**. The owner suggested Pinterest or other e-commerce sites.
3. "First focus on only 2 or 3 brands: **Apple, Samsung and Pixel by Google**." Add more brands once the design is approved.

### Decisions
- **Image source:** official product renders from **each brand's own online store** (Apple Store CDN, images.samsung.com, Google Store). Pinterest and other retailers' photos were not used: they're owned by third parties, and those sites block downloads. Before launch, get formal image rights through each brand's partner or reseller programme.
- Images are **stored in the project** (`public/images/phones/<phoneId>/<colour-slug>.webp`), not linked from the brands' sites. Each colour has a 1000px and a 480px (`-sm`) version. The background is removed and the phone is centred on a transparent square canvas, so all photos look consistent. **78 photos across 16 phones; every colour of every phone is covered.** Extra angles (`gallery-1`, `gallery-2`) exist for Samsung and Google phones and are shown only in the phone's first colour.
- `scripts/build-image-manifest.mjs` runs automatically before `npm run dev` / `npm run build`. It writes `src/data/imageManifest.json`, so the site never references a missing image.
- **Brands:** `brands.js` keeps all 12 brands, but only those marked `active: true` (Apple, Samsung, Google Pixel) are shown. `phones.js` keeps all 32 phones and shows the 16 from active brands. To add a brand back later, set `active: true` and add its images.
- **Newer models not added:** Apple's store now sells iPhone 18 Pro and 17e, and Samsung has newer models. Their specs are beyond my knowledge, so they weren't added rather than guessed. Add them with the owner's verified data.

### What changed in the code
- **CSS fully rewritten mobile-first** (`src/styles/global.css`): base styles target phones, with breakpoints at 600 / 960 / 1200px.
  - Spacing scale (`--s1`…`--s16`) and a page gutter that grows from 16 → 24 → 32px.
  - Touch targets of at least 44px; 16px inputs so iOS doesn't zoom.
  - `overflow-x: clip` as a safety net. **Measured: no page scrolls sideways at 390, 768 or 1280px.**
- **Mobile header:** menu button, logo and icons on top, a full-width search bar, and swipeable category chips.
- **Home:** real-photo hero, brand cards with product photos, swipeable rows for conditions, new launches, refurbished and bestsellers (a grid on desktop), and a sell/recycle banner with a photo.
- **Product page:** swipeable photo gallery that follows the selected colour (dots on mobile, thumbnails on larger screens), a buy bar fixed to the bottom of the screen on mobile (price, Add to cart, Buy now), and a 2×2 condition picker.
- **Product card:** colour dots switch the photo in place; the link carries `?color=` to the product page.
- **New components:** `ProductImage` (responsive `srcset`, lazy loading), `Gallery`. **Removed:** `PhoneArt`. Accessories still use icon tiles; real accessory photos are a next step.

### Other sessions
- **Backend session `admin-b4`** builds a Spring Boot + MySQL API in `C:\Users\admin\Namma Mobiles-api` (docs: `context/README.md`, `context/API.md`). It mirrors `src/data` (`GET /api/catalog`, `POST /api/orders`, `GET /api/orders/me` with the Clerk Bearer token). **The frontend does not call this API yet**; that waits for the owner's go-ahead. This session is `admin-73`.

---

## 9. Full-stack version 1 (11 Nov 2026): frontend connected to the API

The owner asked to "see a glimpse of the full stack application working". The React app now talks to the Spring Boot + MySQL backend (`C:\Users\admin\Namma Mobiles-api`, built by session `admin-b4`).

| Piece | How it works |
| --- | --- |
| Dev proxy | `vite.config.js` proxies `/api` → `http://localhost:8080`. For production, set `VITE_API_BASE_URL`. |
| API client | `src/services/api.js`: fetch with a timeout; turns RFC 9457 problem details into `ApiError` (`message` = `detail`, plus `code` and `fields`). |
| Catalogue | `src/services/catalog.js` calls `GET /api/catalog` **before the app first renders** and swaps the data into the `src/data/*` modules through their setters, so no page code changed. **If the API is down, the bundled sample data is used.** The footer shows which source is active. |
| Prices & stock | `getPhonePrice` uses the server's `prices["<variant>:<condition>"]` (price, MRP, stock). The product page shows "In stock", "Only N left" or "Out of stock", and disables buying at zero stock. |
| Checkout | `POST /api/orders` sends **only the selection**; the server calculates totals. Signed-in users send `Authorization: Bearer <Clerk getToken()>`. Server errors (stock, coupon, COD limit, validation) appear as messages and field errors. **If the server can't be reached,** a "demo" order is saved on the device instead. |
| Orders | Signed-in order history comes from `GET /api/orders/me`. Placed orders are also cached in `localStorage` so the confirmation page shows instantly. |

**Verified:** a browser test bought a Pixel 9a as a guest. The footer showed the live catalogue, the server's price (₹44,999) and stock were displayed, and `POST /api/orders` returned **201** with server-generated order number `MNMWBZJEATG1IG`, which the confirmation page displayed. This test order is now in MySQL (admin-b4 has been told).

**Not yet verified:** a signed-in order with a real Clerk token, followed by checking the Account page. The owner should sign in and place one order to confirm.

**To run the full stack:** start MySQL and the API (see `Namma Mobiles-api/context/README.md`), then run `npm run dev` here. Open http://localhost:5173.

**Update (backend V3):** the API now owns brand visibility. `/api/catalog` and `/api/brands` return only active brands (Apple, Samsung, Google Pixel) and their 16 phones. Hidden brands' phones return 404 and are rejected at checkout; their data is kept in MySQL (`brand.active = 0`). The frontend checked this match and keeps local names for hidden brands so old carts and orders still display. Fixed the accessory "Compatible with" list showing blank names for hidden brands; it now lists only active brands.

---

## 10. Brand-store experience + compare (11 Nov 2026)

### The owner's request
The owner shared a screen recording of the official Google Pixel, Samsung and Apple sites and asked for:
- similar quality, assets and videos, and the same interface;
- a one-stop destination covering every top brand;
- a 91mobiles-style comparison of any phones, with images and spec tables.

### What the recording showed (and what we built from it)
| Seen on brand sites | Built in Namma Mobiles |
| --- | --- |
| Pixel "Explore the full line-up" carousel; Samsung cards with colour dots, Buy / Learn more, Compare | **Brand store pages** `/brands/:id`: dark hero with an official film, a line-up carousel (colour dots, price and EMI, Buy / Learn more, Compare), "Watch the films" and "Which is right for you?" sections |
| Apple / Samsung sticky product menu ("iPhone 18 Pro · Explore · Buy") | **`LocalNav`**: sticky product menu on every product page (Overview · Specs · Compare · Buy) |
| Cinematic dark sections, large type, big stats ("215g"), colour viewer | **`ProductShowcase`**: gradient title, official films, stat panels derived from the specs, "Pick your finish" viewer with colour-tinted glow, design-angle tiles |
| Video tiles with play/pause | **`FilmPlayer`**: lite YouTube player that shows the official thumbnail and loads `youtube-nocookie.com` only when you press play |
| Pixel compare table with images | **Compare page** (below) |

### Compare page (`/compare`)
- Up to **4 phones** from any brand. A searchable picker with brand filters opens as a bottom sheet on mobile and a dialog on desktop.
- A **shareable URL**: `/compare?phones=iphone-17-pro,galaxy-s25-ultra,pixel-10-pro`.
- The phone header row is sticky. Specs are grouped (Overview, Display, Performance, Camera, Battery, Design, Software).
- **"Best" highlighting** on rankable rows. **Price (brand new)** and **Lowest price (any condition)** are separate rows, so new prices are compared with new prices.
- A **"Show only differences"** switch, a Share button that copies the link, and **Popular comparisons** (also on the home page and each product page).
- Every value comes from catalogue/API data (`src/utils/specs.js`); no specs were invented.

### Assets: what's possible and what's not
- **Official films:** 26 YouTube films from the official Apple, Samsung, Samsung India and Made by Google channels, for 12 phones plus Samsung and Google brand films. Each ID was **verified twice with YouTube's oEmbed endpoint**. They're stored in `src/data/media.js`.
  - Missing: no official iPhone 16 film is still online.
  - Apple's current brand film covers the iPhone 18 / Duo, which we don't sell, so it isn't used.
- **Not done:** downloading or re-hosting videos and lifestyle images from apple.com, samsung.com or store.google.com. They're copyrighted, and the videos are delivered as protected streams. The proper route is each brand's **retailer / partner asset programme**, which licenses those exact assets to sellers.
- **Newer models:** the recording shows the current line-up (iPhone 18 Pro, iPhone Duo, Pixel 11 series, Galaxy S26, Z Fold8 Ultra). These are beyond my knowledge, so **they're not added yet**. Next step: add them from the brands' official spec pages.

### Verification
- No sideways overflow at 390px or 1280px on the compare, brand store and product pages.
- Visual check of every new section. Pressing play creates the YouTube player with the correct film.
