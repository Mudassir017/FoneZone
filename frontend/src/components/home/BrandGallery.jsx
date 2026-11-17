import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../BrandLogo'
import Icon from '../Icon'
import { BRAND_MAP } from '../../data/brands'
import { getPhone } from '../../data/phones'
import { GALLERY, filmThumb, galleryFilm, filmEmbedUrl } from '../../data/media'

const YT_ORIGIN = /^https:\/\/www\.youtube(-nocookie)?\.com$/
const PLAYING = 1 // YouTube player state

/** Autoplay is skipped for visitors who ask for less motion or less data. */
function useAmbientAllowed() {
  const query = '(prefers-reduced-motion: reduce)'
  const [allowed, setAllowed] = useState(() => {
    if (typeof window === 'undefined') return false
    return !window.matchMedia(query).matches && !navigator.connection?.saveData
  })
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setAllowed(!mq.matches && !navigator.connection?.saveData)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return allowed
}

/**
 * Muted, looping, chrome-less embed of the brand's own film. It talks to the player
 * with YouTube's documented postMessage interface (enablejsapi=1) only to learn when
 * playback has really started, so the poster can stay up until then.
 */
function AmbientPlayer({ film, title, onStarted, onTime }) {
  const ref = useRef(null)

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return
    let heard = false
    const send = (msg) => iframe.contentWindow?.postMessage(JSON.stringify(msg), '*')
    const command = (func, args = []) => send({ event: 'command', func, args })

    const onMessage = (e) => {
      if (e.source !== iframe.contentWindow || !YT_ORIGIN.test(e.origin)) return
      let data
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return
      }
      heard = true
      if (data?.event === 'onReady') {
        command('mute')
        command('playVideo')
      }
      const state = data?.event === 'onStateChange' ? data.info : data?.info?.playerState
      if (state === PLAYING) onStarted()
      if (typeof data?.info?.currentTime === 'number') onTime(data.info.currentTime)
    }
    // Handshake: ask the player to start sending events (repeated until it answers).
    const hello = () => !heard && send({ event: 'listening', id: film.id, channel: 'widget' })
    window.addEventListener('message', onMessage)
    iframe.addEventListener('load', hello)
    const timer = setInterval(hello, 400)
    const stop = setTimeout(() => clearInterval(timer), 8000)
    return () => {
      window.removeEventListener('message', onMessage)
      iframe.removeEventListener('load', hello)
      clearInterval(timer)
      clearTimeout(stop)
    }
  }, [film.id, onStarted, onTime])

  return (
    <iframe
      ref={ref}
      src={filmEmbedUrl(film.id, { ambient: true })}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture"
      tabIndex={-1}
    />
  )
}

/**
 * One film tile. Modes:
 *  - idle:    official poster frame + play button (no YouTube request at all)
 *  - ambient: featured film playing muted and looped while it's on screen
 *  - user:    the visitor pressed play: normal player with sound and controls
 */
function GalleryFilm({ film, label, mode, onPlay }) {
  const [started, setStarted] = useState(false)
  const [startAt, setStartAt] = useState(0) // seconds: resume where the muted preview was
  const timeRef = useRef(0)
  // Reset the "started" flag whenever the ambient player is (re)mounted.
  const [lastMode, setLastMode] = useState(mode)
  if (mode !== lastMode) {
    setLastMode(mode)
    setStarted(false)
  }
  const startedCb = useCallback(() => setStarted(true), [])
  const timeCb = useCallback((t) => {
    timeRef.current = t
  }, [])
  const playWithSound = () => {
    setStartAt(mode === 'ambient' ? Math.floor(timeRef.current) : 0)
    onPlay(film.id)
  }

  const name = `${label}: ${film.title}`
  // While a muted preview loads, the poster stays on top; it fades out once playback has started.
  const hidePoster = mode === 'ambient' && started

  return (
    <figure className={`gallery-item ${mode === 'ambient' ? 'is-ambient' : ''}`} data-film={film.id}>
      <div className="film">
        {mode === 'ambient' && <AmbientPlayer film={film} title={name} onStarted={startedCb} onTime={timeCb} />}
        {mode === 'user' && (
          <iframe
            src={filmEmbedUrl(film.id, { start: startAt })}
            title={name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        {mode !== 'user' && (
          <button
            type="button"
            className={`film__poster ${hidePoster ? 'is-hidden' : ''}`}
            inert={hidePoster || undefined}
            onClick={playWithSound}
            aria-label={`Play ${label} film with sound: ${film.title}`}
          >
            <img src={filmThumb(film)} alt="" loading="lazy" decoding="async" />
            <span className="film__play">
              <Icon name="play" size={22} filled strokeWidth={0} />
            </span>
          </button>
        )}
      </div>
      <figcaption className="gallery-item__caption">
        <span className="gallery-item__phone">{label}</span>
        <span className="gallery-item__title">{film.title}</span>
        {mode === 'ambient' && started && (
          <button type="button" className="gallery-item__sound" onClick={playWithSound}>
            <Icon name="volume" size={16} /> Watch with sound
          </button>
        )}
      </figcaption>
    </figure>
  )
}

/** Build the brand groups: active brands only, phones we sell only, every video id at most once. */
function buildGroups() {
  const seen = new Set()
  return GALLERY.map(({ brand, films }) => ({
    brand: BRAND_MAP[brand],
    films: films
      .filter((f) => getPhone(f.phone) && !seen.has(f.id) && seen.add(f.id))
      .map((f) => ({ ...galleryFilm(f), label: getPhone(f.phone).name })),
  })).filter((g) => g.brand?.active !== false && g.brand && g.films.length)
}

// A featured film starts once 60% of it is on screen and keeps playing until less than 25% is.
const START_AT = 0.6
const STOP_BELOW = 0.25

export default function BrandGallery() {
  const groups = buildGroups()
  const featured = groups.map((g) => g.films[0].id)
  const featuredKey = featured.join(',')
  const ambientAllowed = useAmbientAllowed()
  const [userPlaying, setUserPlaying] = useState(null) // film the visitor chose to watch with sound
  const [ambient, setAmbient] = useState(null) // the one featured film playing muted
  const rootRef = useRef(null)
  const ratios = useRef({})

  // One observer for every film tile: decides which single featured film may play muted,
  // and unloads a film the visitor started once it has been scrolled away.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ids = featuredKey.split(',')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.current[e.target.dataset.film] = e.isIntersecting ? e.intersectionRatio : 0
        const r = ratios.current
        setUserPlaying((u) => (u && (r[u] ?? 0) === 0 ? null : u))
        setAmbient((cur) => {
          if (!ambientAllowed) return null
          if (cur && (r[cur] ?? 0) >= STOP_BELOW) return cur
          // most visible wins; on a tie the earlier brand (Apple, then Samsung, then Pixel)
          let best = null
          let bestRatio = 0
          for (const id of ids) {
            const ratio = r[id] ?? 0
            if (ratio >= START_AT && ratio > bestRatio) [best, bestRatio] = [id, ratio]
          }
          return best
        })
      },
      { threshold: [0, STOP_BELOW, 0.4, START_AT, 0.8, 1] },
    )
    root.querySelectorAll('[data-film]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [featuredKey, ambientAllowed])

  // Pause muted previews while the tab is hidden.
  useEffect(() => {
    const onVis = () => document.hidden && setAmbient(null)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (!groups.length) return null

  const modeFor = (id) => {
    if (userPlaying) return userPlaying === id ? 'user' : 'idle'
    return ambientAllowed && ambient === id ? 'ambient' : 'idle'
  }

  return (
    <section ref={rootRef} className="section section--dark gallery" aria-labelledby="home-gallery-title">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 id="home-gallery-title">Gallery</h2>
            <p className="section-header__sub">Product films from Apple, Samsung and Google, brand by brand.</p>
          </div>
        </div>

        {groups.map(({ brand, films }, gi) => (
          <div key={brand.id} className={`gallery-brand ${gi % 2 ? 'gallery-brand--flip' : ''}`}>
            <div className="gallery-brand__head">
              <span className="gallery-brand__logo" aria-hidden="true">
                <BrandLogo id={brand.id} title="" />
              </span>
              {/* Samsung's mark is already the wordmark, so its name is for screen readers only */}
              <h3 className={brand.id === 'samsung' ? 'visually-hidden' : undefined}>{brand.name}</h3>
              <Link to={`/brands/${brand.id}`} className="link-arrow gallery-brand__link">
                Shop {brand.name} <Icon name="chevronRight" size={16} />
              </Link>
            </div>
            <div className={`gallery-grid gallery-grid--${Math.min(films.length, 3)}`}>
              {films.map((f) => (
                <GalleryFilm key={f.id} film={f} label={f.label} mode={modeFor(f.id)} onPlay={setUserPlaying} />
              ))}
            </div>
          </div>
        ))}
        <p className="gallery__credit">Official films from each brand’s own channel.</p>
      </div>
    </section>
  )
}
