import { useState } from 'react'
import ProductImage from './ProductImage'
import FilmPlayer from './FilmPlayer'
import { phoneGallery, phoneImage } from '../utils/images'
import { filmsForPhone } from '../data/media'
import { getBrand } from '../data/brands'

const num = (s) => String(s ?? '').match(/[\d.]+/)?.[0]

/** Big-number "stat" tiles derived from the phone's specs (no invented data). */
function statsFor(p) {
  const s = p.specs
  const stats = []
  if (num(s.display)) stats.push({ big: `${num(s.display)}″`, small: s.display.replace(/^[\d.]+"\s*,?\s*/, '') || 'display' })
  const mp = s.rearCamera?.match(/(\d+)\s*MP/)
  if (mp) stats.push({ big: `${mp[1]}MP`, small: 'main camera' })
  const mah = s.battery?.match(/(\d{4,5})\s*mAh/)
  const hrs = s.battery?.match(/(\d+)\s*hrs?/)
  if (mah) stats.push({ big: `${mah[1]}`, unit: 'mAh', small: 'battery' })
  else if (hrs) stats.push({ big: `${hrs[1]}`, unit: 'hrs', small: 'video playback' })
  if (num(s.weight)) stats.push({ big: num(s.weight), unit: 'g', small: 'weight' })
  return stats
}

/**
 * Cinematic overview section for the product page (dark storytelling band,
 * official film, big-number highlights, colour showcase).
 */
export default function ProductShowcase({ phone }) {
  const [color, setColor] = useState(phone.colors[0])
  const films = filmsForPhone(phone.id)
  const brand = getBrand(phone.brand)
  const stats = statsFor(phone)
  const gallery = phoneGallery(phone, phone.colors[0].name).slice(1)

  return (
    <section className="showcase" id="overview" aria-labelledby="overview-title">
      <div className="container">
        <p className="showcase__eyebrow">{brand?.name}</p>
        <h2 className="showcase__title" id="overview-title">
          {phone.name}
        </h2>
        <p className="showcase__lead">{phone.highlights.join(' · ')}</p>

        {films.length > 0 && (
          <div className={`showcase__films ${films.length > 1 ? 'showcase__films--two' : ''}`}>
            {films.slice(0, 2).map((f) => (
              <FilmPlayer key={f.id} film={f} label={`Official film · ${f.channel}`} />
            ))}
          </div>
        )}

        {stats.length > 0 && (
          <div className="stats">
            {stats.map((s) => (
              <div key={s.small + s.big} className="stat">
                <p className="stat__big">
                  {s.big}
                  {s.unit && <span>{s.unit}</span>}
                </p>
                <p className="stat__small">{s.small}</p>
              </div>
            ))}
            <div className="stat stat--wide">
              <p className="stat__chip">{phone.specs.processor}</p>
              <p className="stat__small">the chip that powers it all</p>
            </div>
          </div>
        )}

        {/* Colour showcase */}
        <div className="colour-stage" style={{ '--tint': color.hex }}>
          <h3 className="colour-stage__title">Pick your finish.</h3>
          <div className="colour-stage__img">
            <ProductImage key={color.name} image={phoneImage(phone.id, color.name)} alt={`${phone.name} in ${color.name}`} sizes="(min-width: 960px) 40vw, 80vw" />
          </div>
          <div className="colour-stage__picker">
            <div className="swatches">
              {phone.colors.map((c) => (
                <button
                  key={c.name}
                  className={`swatch ${c.name === color.name ? 'is-active' : ''}`}
                  style={{ '--swatch': c.hex }}
                  onClick={() => setColor(c)}
                  aria-label={c.name}
                  aria-pressed={c.name === color.name}
                />
              ))}
            </div>
            <p>{color.name}</p>
          </div>
        </div>

        {gallery.length > 0 && (
          <div className="showcase__gallery">
            {gallery.map((img) => (
              <div key={img.src} className="showcase__tile">
                <ProductImage image={img} alt={`${phone.name} design detail`} sizes="(min-width: 960px) 40vw, 90vw" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
