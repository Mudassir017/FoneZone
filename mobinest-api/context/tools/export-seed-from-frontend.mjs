// Regenerates the backend seed data (src/main/resources/seed/*.json) from the React
// draft's sample catalogue (mobinest/src/data/*.js).
//
// Usage (from the mobinest-api folder; Node 22.15+ / 23.5+):
//   node context/tools/export-seed-from-frontend.mjs [path-to-frontend] [output-dir]
// Defaults: ../mobinest  and  src/main/resources/seed
//
// Exports ALL brands and ALL phones, including brands the storefront currently hides
// (`active` not set), so their data is kept in the database with brand.active = false.
//
// The seeder only runs on an EMPTY database, so after re-exporting either drop and
// recreate the database or add a Flyway migration for the changed data.
import { mkdirSync, writeFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Extra exports appended to the frontend modules so we can read their private full lists.
const EXTRA_EXPORTS = {
  '/src/data/brands.js': 'ALL_BRANDS',
  '/src/data/phones.js': 'ALL_PHONES',
}

registerHooks({
  // The React code imports without extensions (`from './brands'`), which Vite allows but Node doesn't.
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      if (err.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\//.test(specifier) && !/\.[cm]?jsx?$/.test(specifier)) {
        return nextResolve(specifier + '.js', context)
      }
      throw err
    }
  },
  load(url, context, nextLoad) {
    const result = nextLoad(url, context)
    const key = Object.keys(EXTRA_EXPORTS).find((k) => url.replaceAll('\\', '/').endsWith(k))
    if (!key) return result
    const name = EXTRA_EXPORTS[key]
    const source = String(result.source)
    if (!new RegExp(`\\b(const|let|var)\\s+${name}\\b`).test(source)) return result
    return { ...result, source: `${source}\nexport { ${name} as __${name} };\n` }
  },
})

const frontend = resolve(process.argv[2] ?? '../mobinest')
const out = resolve(process.argv[3] ?? 'src/main/resources/seed')
const load = (f) => import(pathToFileURL(resolve(frontend, 'src/data', f)).href)

const brandsModule = await load('brands.js')
const phonesModule = await load('phones.js')
const { ACCESSORIES, ACCESSORY_CATEGORIES } = await load('accessories.js')
const { CONDITIONS } = await load('conditions.js')

const brands = (brandsModule.__ALL_BRANDS ?? brandsModule.BRANDS).map((b) => ({ ...b, active: Boolean(b.active) }))
const phones = phonesModule.__ALL_PHONES ?? phonesModule.PHONES

mkdirSync(out, { recursive: true })
const write = (name, data) => {
  writeFileSync(resolve(out, name), JSON.stringify(data, null, 2))
  console.log(`${name}: ${data.length} records`)
}
write('brands.json', brands)
write('conditions.json', CONDITIONS)
write('phones.json', phones)
write('accessory-categories.json', ACCESSORY_CATEGORIES)
write('accessories.json', ACCESSORIES)
console.log(`active brands: ${brands.filter((b) => b.active).map((b) => b.id).join(', ')}`)
