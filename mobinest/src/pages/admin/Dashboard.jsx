import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, IndianRupee, Receipt, RefreshCw, ShoppingBag, TriangleAlert } from 'lucide-react'
import { useAdmin } from '../../components/admin/context'
import { useAdminQuery } from '../../components/admin/hooks'
import { ORDER_STATUSES, STATUS_TONE, count, dateTime, money, moneyShort, shortDay, titleCase } from '../../components/admin/format'
import { Badge, Card, EmptyRow, ErrorBox, KpiCard, Loading, PageHeader, PaymentBadge, StatusBadge } from '../../components/admin/ui'

export default function Dashboard() {
  const { client } = useAdmin()
  const [days, setDays] = useState(30)
  const { data, error, loading, reload } = useAdminQuery(() => client.dashboard({ days }), `dash:${days}`)

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={data ? `Updated ${dateTime(data.generatedAt)} · all times in IST` : 'Sales, orders and stock at a glance'}
        actions={
          <button type="button" className="adm-btn" onClick={reload} disabled={loading}>
            <RefreshCw /> Refresh
          </button>
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      {!data ? (
        !error && <Loading />
      ) : (
        <div className="stack">
          <div className="adm-grid adm-grid--kpi">
            <KpiCard icon={IndianRupee} label="Revenue" value={money(data.revenue.total)}
              sub={`${money(data.revenue.paid)} paid · ${money(data.revenue.codPending)} COD to collect`} />
            <KpiCard icon={ShoppingBag} label="Orders today" value={count(data.orders.today)}
              sub={`${count(data.orders.last7Days)} in 7 days · ${count(data.orders.last30Days)} in 30 days`} />
            <KpiCard icon={Receipt} label="Average order value" value={money(data.revenue.averageOrderValue)}
              sub={`${count(data.revenue.orders)} revenue orders · ${count(data.orders.total)} orders in total`} />
            <KpiCard icon={TriangleAlert} label="Low stock" alert={data.lowStock.skuCount + data.lowStock.accessoryCount > 0}
              value={count(data.lowStock.skuCount + data.lowStock.accessoryCount)}
              sub={`${count(data.lowStock.skuCount)} SKUs · ${count(data.lowStock.accessoryCount)} accessories at ≤ ${data.lowStock.threshold} units`} />
          </div>

          <div className="adm-grid adm-grid--2">
            <SalesChart daily={data.daily} days={days} onDays={setDays} />
            <Card title="Orders by status">
              <StatusBars counts={data.ordersByStatus} />
              <dl className="adm-dl" style={{ marginTop: 18 }}>
                <dt>Refunded</dt>
                <dd className="num">{money(data.revenue.refunded)}</dd>
                <dt>Store</dt>
                <dd>
                  {data.catalog.activeBrands}/{data.catalog.brands} brands · {data.catalog.visiblePhones}/{data.catalog.phones} phones
                </dd>
                <dt>Stock</dt>
                <dd className="num">{count(data.catalog.unitsInStock)} units in {count(data.catalog.visibleSkus)} SKUs</dd>
                <dt>People</dt>
                <dd>
                  {count(data.catalog.customers)} customers · {count(data.catalog.admins)} admins
                </dd>
                <dt>Coupons</dt>
                <dd>{count(data.catalog.activeCoupons)} active</dd>
              </dl>
            </Card>
          </div>

          <div className="adm-grid adm-grid--2">
            <RecentOrders orders={data.recentOrders} />
            <Card title="Top-selling phones" flush>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Phone</th>
                      <th className="right">Units</th>
                      <th className="right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPhones.length === 0 && <EmptyRow colSpan={3}>No phone sales yet.</EmptyRow>}
                    {data.topPhones.map((p) => (
                      <tr key={p.productId}>
                        <td>
                          <Link to={`/admin/catalog/skus?phone=${encodeURIComponent(p.productId)}`} className="adm-cell-title">{p.name}</Link>
                          <span className="adm-cell-sub mono">{p.productId}</span>
                        </td>
                        <td className="right num">{count(p.units)}</td>
                        <td className="right num">{money(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <Card
            flush
            title={<h2>Low stock (≤ {data.lowStock.threshold} units)</h2>}
            action={<Link className="adm-link" to="/admin/catalog/skus?lowStock=true&visible=true&sort=stock,asc">Restock SKUs →</Link>}
          >
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Details</th>
                    <th className="right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStock.items.length === 0 && <EmptyRow colSpan={3}>Everything is well stocked.</EmptyRow>}
                  {data.lowStock.items.map((i) => (
                    <tr key={`${i.type}:${i.id}`}>
                      <td>
                        <span className="adm-cell-title">{i.name}</span>
                        <span className="adm-cell-sub mono">{i.skuCode || i.id}</span>
                      </td>
                      <td className="muted">
                        <Badge plain tone={i.type === 'sku' ? 'blue' : 'violet'}>{i.type === 'sku' ? 'Phone' : 'Accessory'}</Badge> {i.details}
                      </td>
                      <td className="right">
                        <Badge tone={i.stock === 0 ? 'red' : 'amber'}>{i.stock === 0 ? 'Sold out' : `${i.stock} left`}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

function SalesChart({ daily, days, onDays }) {
  const [metric, setMetric] = useState('revenue')
  const values = daily.map((d) => Number(metric === 'revenue' ? d.revenue : d.orders))
  const max = Math.max(...values, 1)
  const total = values.reduce((a, b) => a + b, 0)
  return (
    <Card
      title={
        <div>
          <h2>{metric === 'revenue' ? 'Revenue' : 'Orders'} per day</h2>
          <span className="small muted">
            {metric === 'revenue' ? money(total) : `${count(total)} orders`} in the last {days} days
          </span>
        </div>
      }
      action={
        <div className="row" style={{ marginLeft: 'auto' }}>
          <div className="adm-seg" role="group" aria-label="Metric">
            <button type="button" aria-pressed={metric === 'revenue'} onClick={() => setMetric('revenue')}>Revenue</button>
            <button type="button" aria-pressed={metric === 'orders'} onClick={() => setMetric('orders')}>Orders</button>
          </div>
          <label className="row small muted">
            <CalendarDays size={15} />
            <select className="adm-select" value={days} onChange={(e) => onDays(Number(e.target.value))} aria-label="Period">
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
        </div>
      }
    >
      <div className="adm-chart">
        <div className="adm-chart__bars" role="img" aria-label={`${metric} per day, last ${days} days`}>
          {daily.map((d, i) => (
            <div key={d.date} className="adm-chart__col" tabIndex={0}>
              <div className={`adm-chart__bar${values[i] === 0 ? ' is-zero' : ''}`} style={{ height: `${(values[i] / max) * 100}%` }} />
              <span className="adm-chart__tip">
                {shortDay(d.date)}: {money(d.revenue)} · {d.orders} {d.orders === 1 ? 'order' : 'orders'}
              </span>
            </div>
          ))}
        </div>
        <div className="adm-chart__axis">
          <span>{shortDay(daily[0].date)}</span>
          <span>max {metric === 'revenue' ? moneyShort(max) : count(max)}</span>
          <span>{shortDay(daily[daily.length - 1].date)}</span>
        </div>
      </div>
    </Card>
  )
}

function StatusBars({ counts }) {
  const max = Math.max(...ORDER_STATUSES.map((s) => counts[s] || 0), 1)
  const colour = { blue: 'var(--primary)', amber: 'var(--adm-warn)', green: 'var(--success)', red: 'var(--error)' }
  return (
    <div>
      {ORDER_STATUSES.map((s) => (
        <Link key={s} to={`/admin/orders?status=${s}`} className="adm-hbar" style={{ color: 'inherit' }}>
          <span>{titleCase(s)}</span>
          <span className="adm-hbar__track">
            <span className="adm-hbar__fill" style={{ display: 'block', width: `${((counts[s] || 0) / max) * 100}%`, background: colour[STATUS_TONE[s]] }} />
          </span>
          <span className="right num ink">{count(counts[s] || 0)}</span>
        </Link>
      ))}
    </div>
  )
}

function RecentOrders({ orders }) {
  const navigate = useNavigate()
  return (
    <Card flush title="Recent orders" action={<Link className="adm-link" to="/admin/orders">All orders →</Link>}>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th className="right">Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <EmptyRow colSpan={5}>No orders yet.</EmptyRow>}
            {orders.map((o) => (
              <tr key={o.orderNumber} className="is-link" onClick={() => navigate(`/admin/orders/${o.orderNumber}`)}>
                <td>
                  <Link to={`/admin/orders/${o.orderNumber}`} className="adm-cell-title mono" onClick={(e) => e.stopPropagation()}>
                    {o.orderNumber}
                  </Link>
                  <span className="adm-cell-sub">{dateTime(o.createdAt)}</span>
                </td>
                <td>
                  <span className="adm-cell-title">{o.customerName}</span>
                  <span className="adm-cell-sub">{o.city}</span>
                </td>
                <td className="right num ink">{money(o.total)}</td>
                <td>
                  <span className="adm-cell-sub">{o.paymentMethodLabel}</span>
                  <PaymentBadge status={o.paymentStatus} />
                </td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

