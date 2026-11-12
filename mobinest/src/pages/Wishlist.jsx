import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import ProductCard from '../components/ProductCard'
import AccessoryCard from '../components/AccessoryCard'
import { useShortlist } from '../context/ShortlistContext'
import { getPhone } from '../data/phones'
import { getAccessory } from '../data/accessories'
import { getStartingPrice } from '../utils/pricing'
import { pluralize } from '../utils/format'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Wishlist() {
  useDocumentTitle('Wishlist')
  const { wishlist } = useShortlist()

  const items = wishlist
    .map((entry) => {
      const [type, id] = entry.split(':')
      const product = type === 'phone' ? getPhone(id) : getAccessory(id)
      return product ? { type, product } : null
    })
    .filter(Boolean)

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]} />
      <h1 className="page-title">My wishlist</h1>
      {items.length ? (
        <>
          <p className="muted">{pluralize(items.length, 'item')} saved</p>
          <div className="product-grid">
            {items.map(({ type, product }) =>
              type === 'phone' ? (
                <ProductCard key={`p-${product.id}`} phone={product} from={getStartingPrice(product)} />
              ) : (
                <AccessoryCard key={`a-${product.id}`} accessory={product} />
              ),
            )}
          </div>
        </>
      ) : (
        <EmptyState
          icon="heart"
          title="Your wishlist is empty"
          message="Tap the heart on any phone or accessory to save it for later."
          actionLabel="Explore phones"
          actionTo="/phones"
        />
      )}
    </div>
  )
}
