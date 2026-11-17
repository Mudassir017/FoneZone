import { formatPrice } from '../utils/format'

export default function Price({ price, mrp, size = 'md', prefix }) {
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  return (
    <div className={`price price--${size}`}>
      {prefix && <span className="price__prefix">{prefix}</span>}
      <span className="price__now">{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <span className="price__mrp">{formatPrice(mrp)}</span>
          <span className="price__off">{off}% off</span>
        </>
      )}
    </div>
  )
}
