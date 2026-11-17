// Scans public/images/phones/<phoneId>/<slug>.webp and writes
// src/data/imageManifest.json so the UI only references images that exist.
// Runs automatically before `npm run dev` / `npm run build`.
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = 'public/images/phones'
const manifest = {}
for (const phoneId of readdirSync(root)) {
  const dir = join(root, phoneId)
  if (!statSync(dir).isDirectory()) continue
  const slugs = readdirSync(dir)
    .filter((f) => f.endsWith('.webp') && !f.endsWith('-sm.webp'))
    .map((f) => f.replace(/\.webp$/, ''))
    .sort()
  manifest[phoneId] = {
    colors: slugs.filter((s) => !s.startsWith('gallery-')),
    gallery: slugs.filter((s) => s.startsWith('gallery-')),
  }
}
writeFileSync('src/data/imageManifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(`image manifest: ${Object.keys(manifest).length} phones`)
