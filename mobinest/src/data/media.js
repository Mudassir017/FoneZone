// Official manufacturer films (YouTube embeds from the brands' own channels).
// Sourced 11 Nov 2026. Each entry was verified with YouTube's oEmbed endpoint (title + channel).
// Shape: { id: 'YouTubeVideoId', title, channel, thumb: 'maxresdefault' | 'hqdefault' }
export const FILMS = {
  phones: {
    "iphone-17-pro-max": [
      {
        id: "TNhX1uR2vO8",
        title: "iPhone 17 Pro: The most powerful iPhone ever",
        channel: "Apple",
        thumb: "maxresdefault"
      },
      {
        id: "dJObc0V6hJU",
        title: "iPhone 17 Pro: The Powerful A19 Pro Chip",
        channel: "Apple",
        thumb: "maxresdefault"
      }
    ],
    "iphone-17-pro": [
      {
        id: "TNhX1uR2vO8",
        title: "iPhone 17 Pro: The most powerful iPhone ever",
        channel: "Apple",
        thumb: "maxresdefault"
      },
      {
        id: "dJObc0V6hJU",
        title: "iPhone 17 Pro: The Powerful A19 Pro Chip",
        channel: "Apple",
        thumb: "maxresdefault"
      }
    ],
    "iphone-air": [
      {
        id: "sKJ0_NNcJzI",
        title: "iPhone Air: Incredibly light and thin with pro-level performance",
        channel: "Apple",
        thumb: "maxresdefault"
      }
    ],
    "iphone-17": [
      {
        id: "nXSd_TKW7_c",
        title: "iPhone 17: Built to last, and comes in five gorgeous colors",
        channel: "Apple",
        thumb: "maxresdefault"
      },
      {
        id: "PBrYMBacnyM",
        title: "iPhone 17: 3x More Scratch Resistant",
        channel: "Apple",
        thumb: "maxresdefault"
      }
    ],
    "galaxy-s25-ultra": [
      {
        id: "SvPMpkbj4NM",
        title: "Introducing Galaxy S25 Ultra | Samsung",
        channel: "Samsung India",
        thumb: "maxresdefault"
      },
      {
        id: "7eiT9wYKraQ",
        title: "Your new styling partner | Galaxy S25 Ultra | Samsung",
        channel: "Samsung India",
        thumb: "maxresdefault"
      }
    ],
    "galaxy-s25": [
      {
        id: "_9sBc08FYEU",
        title: "Unboxing Galaxy S25 Series | Samsung",
        channel: "Samsung",
        thumb: "maxresdefault"
      },
      {
        id: "gzTE_L83uIc",
        title: "Unfiltered vibes | Unrivalled Nightography | Galaxy S25 Series | Samsung",
        channel: "Samsung India",
        thumb: "maxresdefault"
      }
    ],
    "galaxy-z-fold7": [
      {
        id: "2HhrudHXaDs",
        title: "Introducing Galaxy Z Fold7 | Galaxy AI | Samsung",
        channel: "Samsung",
        thumb: "maxresdefault"
      },
      {
        id: "HYMzTHtEiNY",
        title: "Ultra Unfolds | Galaxy Z Fold7 | Samsung",
        channel: "Samsung India",
        thumb: "hqdefault"
      }
    ],
    "galaxy-z-flip7": [
      {
        id: "JEQaDne_E94",
        title: "Introducing Galaxy Z Flip7 | Galaxy AI | Samsung",
        channel: "Samsung",
        thumb: "maxresdefault"
      },
      {
        id: "G9Y92pfrIDQ",
        title: "Unboxing Galaxy Z Flip7 | Samsung",
        channel: "Samsung",
        thumb: "hqdefault"
      }
    ],
    "galaxy-a56": [
      {
        id: "UF7pWXEL3Ig",
        title: "Awesome Search, Camera & Performance, in the new #GalaxyA56 & #GalaxyA36 5G | #AwesomeIntelligence",
        channel: "Samsung India",
        thumb: "maxresdefault"
      },
      {
        id: "qhWsAoZoE98",
        title: "The #GalaxyA56 5G is crafted to perfection | Samsung",
        channel: "Samsung India",
        thumb: "maxresdefault"
      }
    ],
    "pixel-10-pro": [
      {
        id: "Z3lqOEM6Zig",
        title: "Meet Google Pixel 10 Pro With Gemini | The New Status Pro",
        channel: "Made by Google",
        thumb: "maxresdefault"
      },
      {
        id: "fHSZeZRqXmY",
        title: "The Design of Google Pixel 10 Pro",
        channel: "Made by Google",
        thumb: "maxresdefault"
      }
    ],
    "pixel-10": [
      {
        id: "vL5Lxsh1GUM",
        title: "Meet Google Pixel 10 With Gemini | Do Spectacular Things, Every Day",
        channel: "Made by Google",
        thumb: "maxresdefault"
      },
      {
        id: "AK91BPEWFpI",
        title: "The Design of Google Pixel 10",
        channel: "Made by Google",
        thumb: "maxresdefault"
      }
    ],
    "pixel-9a": [
      {
        id: "m4R7tP084j4",
        title: "Meet Google Pixel 9a With Gemini | Magic, Made Simple",
        channel: "Made by Google",
        thumb: "maxresdefault"
      },
      {
        id: "2XWw-Or3P4A",
        title: "The Design of Google Pixel 9a",
        channel: "Made by Google",
        thumb: "maxresdefault"
      }
    ]
  },
  brands: {
    samsung: [
      {
        id: "dDZsqpZTmz0",
        title: "All about Galaxy | Samsung",
        channel: "Samsung",
        thumb: "maxresdefault"
      },
      {
        id: "wVI33LWFVqE",
        title: "Innovation for All I Brand Story I Samsung",
        channel: "Samsung",
        thumb: "maxresdefault"
      }
    ],
    google: [
      {
        id: "G8R6rP34xI0",
        title: "Meet the New Pixel Lineup | Engineered by Google, For All You Do",
        channel: "Made by Google",
        thumb: "maxresdefault"
      },
      {
        id: "fw9E6lHgU50",
        title: "#MadeByGoogle ‘25 Recap: Top 10 Best Moments",
        channel: "Made by Google",
        thumb: "maxresdefault"
      }
    ]
  }
}

// Home page "Gallery": one official film per phone, grouped by brand in display
// order. Each id was re-checked with YouTube oEmbed on 12 Nov 2026 (title + channel
// below). The home page also de-duplicates by video id, so a film never shows twice.
export const GALLERY = [
  {
    brand: 'apple',
    films: [
      { phone: 'iphone-17-pro', id: 'TNhX1uR2vO8' }, // "iPhone 17 Pro: The most powerful iPhone ever" · Apple
      { phone: 'iphone-air', id: 'sKJ0_NNcJzI' }, // "iPhone Air: Incredibly light and thin with pro-level performance" · Apple
      { phone: 'iphone-17', id: 'nXSd_TKW7_c' }, // "iPhone 17: Built to last, and comes in five gorgeous colors" · Apple
    ],
  },
  {
    brand: 'samsung',
    films: [
      { phone: 'galaxy-s25-ultra', id: 'SvPMpkbj4NM' }, // "Introducing Galaxy S25 Ultra | Samsung" · Samsung India
      { phone: 'galaxy-z-fold7', id: '2HhrudHXaDs' }, // "Introducing Galaxy Z Fold7 | Galaxy AI | Samsung" · Samsung
      { phone: 'galaxy-z-flip7', id: 'JEQaDne_E94' }, // "Introducing Galaxy Z Flip7 | Galaxy AI | Samsung" · Samsung
    ],
  },
  {
    brand: 'google',
    films: [
      { phone: 'pixel-10-pro', id: 'Z3lqOEM6Zig' }, // "Meet Google Pixel 10 Pro With Gemini | The New Status Pro" · Made by Google
      { phone: 'pixel-10', id: 'vL5Lxsh1GUM' }, // "Meet Google Pixel 10 With Gemini | Do Spectacular Things, Every Day" · Made by Google
      { phone: 'pixel-9a', id: 'm4R7tP084j4' }, // "Meet Google Pixel 9a With Gemini | Magic, Made Simple" · Made by Google
    ],
  },
]

const ALL_FILMS = Object.values(FILMS.phones).flat()
/** Full film record (title, channel, thumb) for a gallery entry; falls back to the entry itself. */
export const galleryFilm = (entry) => ({ ...(ALL_FILMS.find((f) => f.id === entry.id) || {}), ...entry })

export const filmsForPhone = (phoneId) => FILMS.phones[phoneId] || []
export const filmsForBrand = (brandId) => FILMS.brands[brandId] || []
export const filmThumb = (film) => `https://i.ytimg.com/vi/${film.id}/${film.thumb || 'hqdefault'}.jpg`

/**
 * Privacy-enhanced (youtube-nocookie) embed URL.
 * - default: the visitor pressed play, so start with sound and the normal controls.
 * - ambient: muted, looping, inline preview with the least player UI YouTube allows.
 *   (YouTube still shows its own logo / title overlays; those must not be hidden.)
 */
export function filmEmbedUrl(id, { ambient = false, start = 0 } = {}) {
  const p = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0', modestbranding: '1', iv_load_policy: '3' })
  if (ambient) {
    p.set('mute', '1')
    p.set('controls', '0')
    p.set('disablekb', '1')
    p.set('fs', '0')
    p.set('loop', '1')
    p.set('playlist', id) // loop only works for a single video when it is also its own playlist
    p.set('enablejsapi', '1') // lets the page know when playback has really started
    if (typeof window !== 'undefined') p.set('origin', window.location.origin)
  }
  if (start > 0) p.set('start', String(start))
  return `https://www.youtube-nocookie.com/embed/${id}?${p}`
}
