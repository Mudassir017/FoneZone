import Icon from './Icon'

/**
 * Responsive product photo. Uses the 480px file on small screens / small slots
 * and the 1000px file when the slot is large or the screen is high-density.
 */
export default function ProductImage({ image, alt, sizes = '(min-width: 960px) 22vw, 45vw', priority = false, eager = false, className = '' }) {
  if (!image) {
    return (
      <div className={`product-image product-image--empty ${className}`} role="img" aria-label={alt}>
        <Icon name="phone" size={40} strokeWidth={1.2} />
      </div>
    )
  }
  return (
    <img
      className={`product-image ${className}`}
      src={image.src}
      srcSet={`${image.srcSm} 480w, ${image.src} 1000w`}
      sizes={sizes}
      alt={alt}
      width="1000"
      height="1000"
      loading={priority || eager ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )
}
