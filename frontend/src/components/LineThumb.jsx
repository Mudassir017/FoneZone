import ProductImage from './ProductImage'
import AccessoryArt from './AccessoryArt'
import { phoneImage } from '../utils/images'

/** Small product image for cart / order lines. */
export default function LineThumb({ line }) {
  return (
    <div className="line-thumb">
      {line.type === 'phone' ? (
        <ProductImage image={phoneImage(line.product.id, line.color.name)} alt="" sizes="96px" />
      ) : (
        <AccessoryArt accessory={line.product} color={line.color} />
      )}
    </div>
  )
}
