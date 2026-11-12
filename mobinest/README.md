# MobiNest — Every Phone. Every Brand. One Destination.

A phone-only e-commerce storefront built with **React 19 + JavaScript + Vite** and **React Router 7**.
Customers can buy branded phones as **New**, **Certified Refurbished**, **Pre-owned** or **Eco Recycled**, plus accessories, and sell or recycle their old phone.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build
npm run lint
```

## Features (first draft)

- **Home**: hero, shop by condition, brand tiles, new launches, bestsellers, refurbished deals, accessories, trust strip
- **Phone listing** (`/phones`): filters for condition, brand, price, storage, RAM and rating, plus sorting and search. All filter state lives in the URL, so links can be shared.
- **Product page** (`/phones/:id`): condition, colour and storage pickers with live pricing, EMI, pincode delivery check, offers, specs, condition guide, compatible accessories and similar phones
- **Accessories**: categories, phone-brand compatibility filter, detail pages
- **Compare** up to 3 phones, **Wishlist**, **Brands** page
- **Cart**: quantity, undo remove, coupons (`WELCOME10`, `MOBI1000`, `ACCESS20`), free-delivery threshold
- **Checkout**: validated address form, payment method (COD limit), order confirmation, order history
- **Sell / Recycle**: instant trade-in quote, recycle voucher for dead phones, pickup booking
- **Authentication with [Clerk](https://clerk.com)**: sign in / sign up (`/sign-in`, `/sign-up`), `UserButton` in the header, and a signed-in-only Account page with order history. Keys are in `.env.local` (git-ignored). Run `npx -y clerk@latest doctor` to check the setup.
- Responsive down to mobile, accessible markup, lazy-loaded routes, error boundary

## Project structure

```
src/
  components/        shared UI (cards, PhoneArt renderer, icons, layout/)
  context/           Cart, Shortlist (wishlist + compare), Auth, Toast providers
  data/              brands, phones, accessories, conditions (sample catalogue)
  hooks/             useLocalStorage, useDocumentTitle, useShortlistActions
  pages/             one file per route
  styles/global.css  design tokens + all styles
  utils/             catalog queries, pricing, checkout rules, formatting
```

## Swapping in a real backend

- `src/utils/catalog.js` is the only place pages query catalogue data. Keep its function signatures and call your API from it.
- Prices for each condition come from `priceFactor` in `data/conditions.js`. In production, store the real price for each SKU and condition.
- Coupons and totals in `utils/checkout.js` are for client feedback only. **Always re-validate on the server.**
- Product images are drawn as vector art (`PhoneArt`). Replace them with licensed product photos from a CDN.
- Cart, wishlist, orders and user are stored in `localStorage` under `mobinest:*` keys.

> The catalogue data (specs and prices) is indicative sample data. Verify it before launch. Brand names are trademarks of their owners.
