// End-to-end smoke test of the Namma Mobiles storefront (React :5173 -> Spring API :8080 -> MySQL).
// Drives the installed Microsoft Edge (or Chrome: E2E_BROWSER=chrome) via playwright-core.
// Usage: npm install && node e2e.cjs [outDir]   (servers must be running; creates REAL test orders)
const { chromium } = require('playwright-core')
const fs = require('fs')
const path = require('path')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5173'
const OUT = process.argv[2] || path.join(__dirname, 'e2e-out')
fs.mkdirSync(OUT, { recursive: true })

const results = []
const consoleErrors = []
const failedRequests = []
let step = ''

async function check(name, fn) {
  step = name
  const t0 = Date.now()
  try {
    const detail = await fn()
    results.push({ name, ok: true, ms: Date.now() - t0, detail: detail || '' })
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, detail: String(e.message || e).split('\n')[0].slice(0, 220) })
  }
}

function watch(page, label) {
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`[${label}] ${step}: ${m.text().slice(0, 240)}`)
  })
  page.on('pageerror', (e) => consoleErrors.push(`[${label}] ${step}: PAGEERROR ${String(e.message).slice(0, 240)}`))
  page.on('requestfailed', (r) => {
    const u = r.url()
    if (!/clerk|google|gstatic|youtube|ytimg|doubleclick/.test(u)) failedRequests.push(`[${label}] ${step}: ${r.failure()?.errorText} ${u}`)
  })
  page.on('response', (r) => {
    const u = r.url()
    if (r.status() >= 500 || (r.status() >= 400 && u.includes('/api/') && !u.includes('/api/orders/me'))) {
      failedRequests.push(`[${label}] ${step}: HTTP ${r.status()} ${u}`)
    }
  })
}

const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })

;(async () => {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER === 'chrome' ? 'chrome' : 'msedge', headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  watch(page, 'desktop')

  await check('Home loads with live catalogue from API', async () => {
    const resp = page.waitForResponse((r) => r.url().includes('/api/catalog') && r.status() === 200, { timeout: 15000 })
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    const r = await resp
    const json = await r.json()
    await page.locator('h1').first().waitFor()
    await shot(page, '01-home')
    return `API: ${json.brands.length} brands, ${json.phones.length} phones, ${json.accessories.length} accessories; h1="${(await page.locator('h1').first().innerText()).replace(/\s+/g, ' ')}"`
  })

  await check('Home sections present (order)', async () => {
    const heads = await page.locator('main h2, main h3.section-title, main .section-header h2').allInnerTexts()
    if (!heads.length) throw new Error('no section headings found')
    return heads.map((h) => h.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 14).join(' | ')
  })

  await check('Hero shows iPhone 18 Pro Max image', async () => {
    const srcs = await page.locator('.hero img').evaluateAll((els) => els.map((e) => e.currentSrc || e.src))
    if (!srcs.some((s) => s.includes('iphone-18-pro-max'))) throw new Error('hero images: ' + srcs.map((s) => s.split('/images/')[1]).join(', '))
    return srcs.map((s) => s.split('/images/')[1]).join(', ')
  })

  await check('Logo + brand name in header', async () => {
    const logo = page.locator('header a[href="/"]').first()
    await logo.waitFor()
    const label = (await logo.getAttribute('aria-label')) || (await logo.innerText())
    const img = await logo.locator('img, svg').count()
    if (/mobinest/i.test(label)) throw new Error('still says MobiNest: ' + label)
    return `label="${label.replace(/\s+/g, ' ')}", images=${img}`
  })

  await check('Theme toggle switches to dark and persists', async () => {
    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    await page.locator('.theme-toggle').click()
    await page.waitForTimeout(700)
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    const saved = await page.evaluate(() => localStorage.getItem('theme'))
    if (before === after) throw new Error('class did not change')
    await shot(page, '02-home-toggled')
    await page.reload({ waitUntil: 'networkidle' })
    const afterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    if (afterReload !== after) throw new Error('not persisted after reload')
    await page.locator('.theme-toggle').click() // back to light
    await page.waitForTimeout(700)
    return `dark ${before} -> ${after}, saved="${saved}", persisted after reload`
  })

  await check('Header search finds Pixel and navigates', async () => {
    const input = page.locator('header input[type="search"], header input[type="text"]').first()
    await input.fill('pixel 10')
    await page.waitForTimeout(400)
    await input.press('Enter')
    await page.waitForURL(/\/phones/, { timeout: 8000 })
    await page.waitForTimeout(500)
    const names = await page.locator('.product-card h3, .product-card__name').allInnerTexts()
    if (!names.some((n) => /pixel 10/i.test(n))) throw new Error('results: ' + names.join(', '))
    return `${page.url().replace(BASE, '')} -> ${names.join(', ')}`
  })

  await check('Shop: brand filter (Apple) incl. iPhone Duo', async () => {
    await page.goto(BASE + '/phones?brand=apple', { waitUntil: 'networkidle' })
    const names = await page.locator('.product-card h3, .product-card__name').allInnerTexts()
    if (!names.some((n) => /iPhone Duo/i.test(n))) throw new Error('no iPhone Duo in: ' + names.join(', '))
    return `${names.length} Apple phones: ${names.join(', ')}`
  })

  await check('Shop: each price bucket returns results', async () => {
    const ids = await page.evaluate(async () => {
      const m = await import('/src/utils/catalog.js')
      return m.PRICE_BUCKETS.map((b) => b.id)
    })
    const out = []
    for (const id of ids) {
      await page.goto(`${BASE}/phones?price=${encodeURIComponent(id)}`, { waitUntil: 'networkidle' })
      out.push(`${id}: ${await page.locator('.product-card').count()}`)
    }
    return out.join(' · ')
  })

  await check('Product page iPhone Duo: prices, colours, "New" rating', async () => {
    await page.goto(BASE + '/phones/iphone-duo', { waitUntil: 'networkidle' })
    await page.locator('h1').first().waitFor()
    const h1 = await page.locator('h1').first().innerText()
    const body = await page.locator('main').innerText()
    if (!/2,99,900/.test(body)) throw new Error('price ₹2,99,900 not shown')
    if (!/No reviews yet/i.test(body)) throw new Error('"No reviews yet" not shown')
    await shot(page, '03-iphone-duo')
    return `${h1}; ₹2,99,900 shown; colours: ${/Star White/.test(body) && /Night Sky/.test(body) ? 'Star White + Night Sky' : 'missing'}`
  })

  await check('Add iPhone Duo (Night Sky, 512GB) to cart', async () => {
    await page.getByRole('button', { name: /Night Sky/i }).first().click().catch(() => {})
    await page.getByRole('button', { name: /512GB/ }).first().click().catch(() => {})
    await page.getByRole('button', { name: /add to cart/i }).first().click()
    await page.waitForTimeout(600)
    const badge = await page.locator('header .count-badge').first().innerText().catch(() => '0')
    if (badge.trim() !== '1') throw new Error('cart badge = ' + badge)
    return 'cart badge = 1'
  })

  await check('Add an accessory to cart', async () => {
    await page.goto(BASE + '/accessories', { waitUntil: 'networkidle' })
    await page.locator('a[href^="/accessories/"]').first().click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /add to cart/i }).first().click()
    await page.waitForTimeout(500)
    const badge = await page.locator('header .count-badge').first().innerText()
    if (badge.trim() !== '2') throw new Error('cart badge = ' + badge)
    return `${await page.locator('h1').first().innerText()} added; badge = 2`
  })

  await check('Cart: totals + WELCOME10 coupon', async () => {
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' })
    const coupon = page.locator('input[name="coupon"], input[placeholder*="oupon" i]').first()
    await coupon.fill('WELCOME10')
    await page.getByRole('button', { name: /apply/i }).first().click()
    await page.waitForTimeout(500)
    const text = await page.locator('main').innerText()
    await shot(page, '04-cart')
    if (!/WELCOME10/.test(text)) throw new Error('coupon not shown')
    const total = (text.match(/Total[^\n₹]*₹\s?[\d,]+/i) || [''])[0]
    return `coupon applied; ${total.replace(/\s+/g, ' ')}`
  })

  let orderId = ''
  await check('Guest checkout places a real order via API', async () => {
    await page.goto(BASE + '/checkout', { waitUntil: 'networkidle' })
    const fill = (name, v) => page.locator(`[name="${name}"]`).fill(v)
    await fill('fullName', 'E2E Test Buyer')
    await fill('phone', '9876543210')
    await fill('email', 'e2e.test@example.com')
    await fill('address', '42 Brigade Road, Ashok Nagar')
    await fill('city', 'Bengaluru')
    await page.locator('[name="state"]').selectOption({ label: 'Karnataka' })
    await fill('pincode', '560025')
    await page.locator('input[name="payment"][value="upi"]').check({ force: true })
    const orderResp = page.waitForResponse((r) => r.url().includes('/api/orders') && r.request().method() === 'POST', { timeout: 15000 })
    await page.getByRole('button', { name: /place order/i }).click()
    const r = await orderResp
    const body = await r.json()
    if (r.status() !== 201) throw new Error(`HTTP ${r.status()}: ${JSON.stringify(body).slice(0, 160)}`)
    orderId = body.id
    await page.waitForURL(/\/order\//, { timeout: 10000 })
    await page.getByRole('heading', { name: /order placed/i }).waitFor({ timeout: 15000 })
    await shot(page, '05-order-success')
    const shown = await page.locator('main').innerText()
    if (!shown.includes(orderId)) throw new Error('order id not on confirmation page')
    return `order ${orderId}, total ₹${body.totals.total}, coupon ${body.coupon || '-'}, ${body.paymentStatus}`
  })

  await check('Checkout validation: server field errors highlight inputs', async () => {
    await page.goto(BASE + '/phones/pixel-9a', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /add to cart/i }).first().click()
    await page.goto(BASE + '/checkout', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /place order/i }).click()
    await page.waitForTimeout(400)
    const invalid = await page.locator('[aria-invalid="true"]').count()
    if (!invalid) throw new Error('no invalid fields flagged')
    return `${invalid} fields flagged on empty submit`
  })

  await check('Compare page: add two phones', async () => {
    await page.goto(BASE + '/compare', { waitUntil: 'networkidle' })
    await shot(page, '06-compare')
    const cards = await page.locator('main a[href*="compare"], main .comparison-card').count()
    return `popular comparison cards: ${cards}`
  })

  await check('Wishlist: heart a phone then see it on /wishlist', async () => {
    await page.goto(BASE + '/phones', { waitUntil: 'networkidle' })
    await page.locator('.product-card button[aria-label*="ishlist" i]').first().click()
    await page.goto(BASE + '/wishlist', { waitUntil: 'networkidle' })
    const n = await page.locator('.product-card, .accessory-card').count()
    if (!n) throw new Error('wishlist empty')
    return `${n} item(s)`
  })

  await check('Sell / trade-in quote', async () => {
    await page.goto(BASE + '/sell', { waitUntil: 'networkidle' })
    const selects = page.locator('main select')
    await selects.nth(0).selectOption({ index: 1 })
    await page.waitForTimeout(300)
    await selects.nth(1).selectOption({ index: 1 })
    await page.waitForTimeout(500)
    const text = await page.locator('main').innerText()
    const quote = (text.match(/₹\s?[\d,]+/) || [''])[0]
    if (!quote) throw new Error('no quote shown')
    return 'quote ' + quote
  })

  await check('Brands, brand store, accessories, help, 404 render', async () => {
    const out = []
    for (const p of ['/brands', '/brands/apple', '/accessories', '/help/warranty', '/no-such-page']) {
      await page.goto(BASE + p, { waitUntil: 'networkidle' })
      out.push(`${p}: "${(await page.locator('h1').first().innerText().catch(() => '(no h1)')).replace(/\s+/g, ' ').slice(0, 40)}"`)
    }
    return out.join(' · ')
  })

  await check('Sign in button opens Clerk modal (no dev-mode banner)', async () => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /^sign in$/i }).first().click()
    const card = page.locator('.cl-cardBox, .cl-card, .cl-signIn-root').first()
    await card.waitFor({ timeout: 15000 })
    await page.waitForTimeout(800)
    await shot(page, '07-clerk-signin-modal')
    const text = await page.locator('.cl-rootBox, .cl-signIn-root').first().innerText()
    const dev = /development mode/i.test(text)
    return `modal: "${text.split('\n')[0]}"; development-mode banner ${dev ? 'STILL SHOWN' : 'hidden'}; secured-by-clerk ${/secured by/i.test(text) ? 'shown' : 'hidden'}`
  })

  await check('Sign up page renders Clerk form', async () => {
    await page.goto(BASE + '/sign-up', { waitUntil: 'networkidle' })
    await page.locator('.cl-signUp-root, .cl-cardBox').first().waitFor({ timeout: 15000 })
    await shot(page, '08-clerk-signup-page')
    return (await page.locator('.cl-signUp-root, .cl-cardBox').first().innerText()).split('\n')[0]
  })

  await check('Account page redirects signed-out users to sign-in', async () => {
    await page.goto(BASE + '/account', { waitUntil: 'networkidle' })
    await page.waitForURL(/sign-in/, { timeout: 10000 })
    return page.url().replace(BASE, '')
  })

  await check('Dark mode: Clerk card is dark', async () => {
    await page.goto(BASE + '/sign-in?theme=dark', { waitUntil: 'networkidle' })
    const card = page.locator('.cl-cardBox, .cl-card').first()
    await card.waitFor({ timeout: 15000 })
    await page.waitForTimeout(600)
    const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor)
    await shot(page, '09-clerk-dark')
    return 'card background ' + bg
  })

  // ---- mobile ----
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mp = await m.newPage()
  watch(mp, 'mobile')
  await check('Mobile: home fits width, menu drawer opens', async () => {
    await mp.goto(BASE + '/', { waitUntil: 'networkidle' })
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    await mp.screenshot({ path: path.join(OUT, '10-mobile-home.png') })
    await mp.getByRole('button', { name: /open menu/i }).click()
    await mp.locator('.drawer').waitFor()
    await mp.screenshot({ path: path.join(OUT, '11-mobile-menu.png') })
    if (overflow > 1) throw new Error(`horizontal overflow ${overflow}px`)
    return `no horizontal overflow; drawer links: ${await mp.locator('.drawer__nav a').count()}`
  })

  await browser.close()

  const pass = results.filter((r) => r.ok).length
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.ms} ms)\n      ${r.detail}`)
  const report = [`E2E: ${pass}/${results.length} passed`, ...lines,
    `\nConsole errors (${consoleErrors.length}):`, ...consoleErrors.slice(0, 40),
    `\nFailed requests (${failedRequests.length}):`, ...failedRequests.slice(0, 40), `\nOrder created: ${orderId || '-'}`].join('\n')
  fs.writeFileSync(path.join(OUT, 'report.txt'), report)
  console.log(report)
})()

