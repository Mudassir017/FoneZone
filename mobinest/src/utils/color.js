const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))

const parse = (hex) => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

/** amt in [-1, 1]: negative darkens, positive lightens. */
export function shade(hex, amt) {
  const [r, g, b] = parse(hex)
  const t = amt < 0 ? 0 : 255
  const p = Math.abs(amt)
  return `rgb(${clamp(r + (t - r) * p)}, ${clamp(g + (t - g) * p)}, ${clamp(b + (t - b) * p)})`
}

export function luminance(hex) {
  const [r, g, b] = parse(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const isLight = (hex) => luminance(hex) > 0.45
