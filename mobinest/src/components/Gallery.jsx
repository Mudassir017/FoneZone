import { useRef, useState } from 'react'
import ProductImage from './ProductImage'

/**
 * Swipeable product gallery (CSS scroll-snap). On touch devices users swipe;
 * thumbnails / dots jump to a slide. Re-mount (key) when the colour changes.
 */
export default function Gallery({ images, alt, badge }) {
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)

  const goTo = (i) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })
    setIndex(i)
  }

  const onScroll = (e) => {
    const t = e.currentTarget
    const i = Math.round(t.scrollLeft / t.clientWidth)
    if (i !== index) setIndex(i)
  }

  return (
    <div className="gallery">
      <div className="gallery__stage">
        {badge}
        <div className="gallery__track" ref={trackRef} onScroll={onScroll} aria-label="Product images">
          {images.map((img, i) => (
            <div className="gallery__slide" key={img.src}>
              <ProductImage
                image={img}
                alt={i === 0 ? alt : `${alt} – view ${i + 1}`}
                sizes="(min-width: 960px) 50vw, 100vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="gallery__dots" aria-hidden="true">
            {images.map((img, i) => (
              <span key={img.src} className={i === index ? 'is-active' : ''} />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery__thumbs">
          {images.map((img, i) => (
            <button
              key={img.src}
              className={`gallery__thumb ${i === index ? 'is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
            >
              <ProductImage image={img} alt="" sizes="72px" eager />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
