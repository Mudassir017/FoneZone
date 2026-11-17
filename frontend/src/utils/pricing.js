import { CONDITION_MAP } from '../data/conditions'

// Retail-style rounding: 23456 -> 23499
export const roundPrice = (value) => Math.max(99, Math.round(value / 100) * 100 - 1)

/**
 * Price of a phone for a given variant + condition.
 * `mrp` is the launch price of the variant; `price` is what the customer pays.
 */
export function getPhonePrice(phone, variantIndex = 0, conditionId = 'new') {
  // Prefer the server's authoritative price & stock when the catalogue came from the API.
  const server = phone.prices?.[`${variantIndex}:${conditionId}`]
  if (server) {
    return {
      price: server.price,
      mrp: server.mrp,
      savings: server.mrp - server.price,
      discountPct: Math.round(((server.mrp - server.price) / server.mrp) * 100),
      stock: server.stock,
    }
  }
  const variant = phone.variants[variantIndex] ?? phone.variants[0]
  const condition = CONDITION_MAP[conditionId] ?? CONDITION_MAP.new
  const mrp = variant.price
  const raw = mrp * (1 - (phone.discount || 0)) * condition.priceFactor
  const price = raw === mrp ? mrp : roundPrice(raw)
  return {
    price,
    mrp,
    savings: mrp - price,
    discountPct: Math.round(((mrp - price) / mrp) * 100),
  }
}

/** Lowest price across variants for the allowed conditions. */
export function getStartingPrice(phone, allowedConditions) {
  const conditions = allowedConditions?.length
    ? phone.conditions.filter((c) => allowedConditions.includes(c))
    : phone.conditions
  let best = null
  for (const conditionId of conditions) {
    // variant 0 is always the cheapest variant
    const p = getPhonePrice(phone, 0, conditionId)
    if (!best || p.price < best.price) best = { ...p, conditionId }
  }
  return best
}

export const accessoryDiscountPct = (a) => Math.round(((a.mrp - a.price) / a.mrp) * 100)

export const emiPerMonth = (price, months = 6) => Math.ceil(price / months)
