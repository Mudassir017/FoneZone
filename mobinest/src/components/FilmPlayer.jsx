import { useState } from 'react'
import Icon from './Icon'
import { filmThumb } from '../data/media'

/**
 * "Lite" YouTube player: shows the official poster frame and only loads the
 * YouTube iframe (privacy-enhanced youtube-nocookie domain) when played.
 * Keeps pages fast and avoids third-party cookies until the user opts in.
 */
export default function FilmPlayer({ film, className = '', label }) {
  const [playing, setPlaying] = useState(false)
  if (!film) return null
  return (
    <div className={`film ${className}`}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={film.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button className="film__poster" onClick={() => setPlaying(true)} aria-label={`Play film: ${film.title}`}>
          <img src={filmThumb(film)} alt="" loading="lazy" decoding="async" />
          <span className="film__play">
            <Icon name="play" size={22} filled strokeWidth={0} />
          </span>
          <span className="film__caption">
            {label && <small>{label}</small>}
            {film.title}
          </span>
        </button>
      )}
    </div>
  )
}
