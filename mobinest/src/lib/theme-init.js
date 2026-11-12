// Applies the colour theme before React renders, so the page never flashes the wrong theme.
// Order of preference: ?theme=dark|light in the URL (for tests/screenshots, not saved)
// -> the visitor's saved choice (localStorage "theme", written by the header toggle)
// -> the operating-system setting (prefers-color-scheme), which is also followed live.
const KEY = 'theme'
const root = document.documentElement
const media = window.matchMedia('(prefers-color-scheme: dark)')

function read(fn) {
  try {
    return fn()
  } catch {
    return null
  }
}

const fromUrl = read(() => new URLSearchParams(window.location.search).get('theme'))
const saved = read(() => localStorage.getItem(KEY))
const pick = (v) => (v === 'dark' || v === 'light' ? v : null)

const initial = pick(fromUrl) || pick(saved) || (media.matches ? 'dark' : 'light')
root.classList.toggle('dark', initial === 'dark')

// Follow OS changes only while the visitor hasn't chosen a theme themselves.
media.addEventListener('change', (e) => {
  if (!pick(read(() => localStorage.getItem(KEY))) && !pick(fromUrl)) {
    root.classList.toggle('dark', e.matches)
  }
})
