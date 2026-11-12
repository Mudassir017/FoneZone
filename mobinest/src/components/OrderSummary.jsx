import { formatPrice, pluralize } from '../utils/format'

export default function OrderSummary({ totals, coupon, children }) {
  return (
    <div className="summary card">
      <h2>Price details</h2>
      <dl>
        <div>
          <dt>Price ({pluralize(totals.itemCount, 'item')})</dt>
          <dd>{formatPrice(totals.mrpTotal)}</dd>
        </div>
        {totals.productSavings > 0 && (
          <div className="text-success">
            <dt>Discount</dt>
            <dd>− {formatPrice(totals.productSavings)}</dd>
          </div>
        )}
        {totals.couponDiscount > 0 && (
          <div className="text-success">
            <dt>Coupon ({coupon})</dt>
            <dd>− {formatPrice(totals.couponDiscount)}</dd>
          </div>
        )}
        <div>
          <dt>Delivery</dt>
          <dd>{totals.shipping ? formatPrice(totals.shipping) : <span className="text-success">FREE</span>}</dd>
        </div>
        <div className="summary__total">
          <dt>Total amount</dt>
          <dd>{formatPrice(totals.total)}</dd>
        </div>
      </dl>
      {totals.productSavings + totals.couponDiscount > 0 && (
        <p className="summary__savings">
          You save {formatPrice(totals.productSavings + totals.couponDiscount)} on this order
        </p>
      )}
      {children}
    </div>
  )
}
