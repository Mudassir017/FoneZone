# End-to-end test (E2E)

Clicks through the running storefront like a customer, using your installed **Microsoft Edge**
(or Chrome) via `playwright-core`. No browser download is needed.

```powershell
# servers must be running: API on :8080, shop on :5173
cd mobinest-api\context\tools\e2e
npm install
node e2e.cjs            # or: $env:E2E_BROWSER="chrome"; node e2e.cjs
```

**What it checks (23 checks):** home loads the live catalogue from the API; section order; hero image; logo; theme toggle persists; header search; brand filter; price buckets; product page; add to cart (phone + accessory); cart + WELCOME10 coupon; **real guest checkout through the API**; checkout validation; compare; wishlist; sell/trade-in quote; brand/accessory/help/404 pages; Clerk sign-in modal and sign-up page; account redirect; dark-mode Clerk card; mobile layout + menu. It also records **console errors** and **failed network requests**.

**Output:** `e2e-out/report.txt` + screenshots. **Note:** it places real (guest) test orders in the database; delete them afterwards if needed (`DELETE FROM orders;`, stock is not restored automatically).
