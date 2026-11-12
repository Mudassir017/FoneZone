// Loads the live catalogue from the API once at startup and swaps it into the
// data modules. If the API is unreachable, the bundled sample data is used so
// the storefront still works (offline / demo mode).
import { endpoints } from './api'
import { setBrands } from '../data/brands'
import { setPhones } from '../data/phones'
import { setConditions } from '../data/conditions'
import { setAccessories, setAccessoryCategories } from '../data/accessories'

let source = 'local'
export const catalogSource = () => source

export async function loadCatalog() {
  try {
    const c = await endpoints.catalog()
    if (!Array.isArray(c?.phones) || !c.phones.length) throw new Error('Empty catalogue')
    if (c.conditions?.length) setConditions(c.conditions)
    setBrands(c.brands)
    if (c.accessoryCategories?.length) setAccessoryCategories(c.accessoryCategories)
    setAccessories(c.accessories || [])
    setPhones(c.phones)
    source = 'api'
  } catch (err) {
    source = 'local'
    console.warn('[catalog] API unavailable, using bundled sample data:', err.message)
  }
  return source
}
