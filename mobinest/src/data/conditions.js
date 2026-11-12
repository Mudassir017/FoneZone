// Every phone can be sold in one or more conditions. Price is derived from
// the launch price of the selected variant using `priceFactor`.
export let CONDITIONS = [
  {
    id: 'new',
    label: 'Brand New',
    short: 'New',
    priceFactor: 1,
    warranty: '1 year manufacturer warranty',
    description: 'Sealed box, untouched device with full brand warranty.',
    color: '#0f9d58',
  },
  {
    id: 'refurbished',
    label: 'Certified Refurbished',
    short: 'Refurbished',
    priceFactor: 0.78,
    warranty: '12 months Namma Mobiles warranty',
    description: 'Grade A, like new. Passed our 52-point quality check, new battery if health < 85%.',
    color: '#5b3df5',
  },
  {
    id: 'used',
    label: 'Pre-owned',
    short: 'Pre-owned',
    priceFactor: 0.64,
    warranty: '6 months Namma Mobiles warranty',
    description: 'Fully functional with light signs of use. Verified IMEI, data wiped, tested.',
    color: '#e8710a',
  },
  {
    id: 'recycled',
    label: 'Eco Recycled',
    short: 'Recycled',
    priceFactor: 0.52,
    warranty: '3 months Namma Mobiles warranty',
    description: 'Restored using reclaimed parts. Visible cosmetic wear, lowest price, lowest carbon footprint.',
    color: '#188038',
  },
]

export let CONDITION_MAP = Object.fromEntries(CONDITIONS.map((c) => [c.id, c]))

export function setConditions(list) {
  CONDITIONS = list
  CONDITION_MAP = Object.fromEntries(list.map((c) => [c.id, c]))
}

export const getCondition = (id) => CONDITION_MAP[id]
