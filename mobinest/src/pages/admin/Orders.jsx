import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { useAdmin } from '../../components/admin/context'
import { useAdminQuery, useDebounced, useListParams } from '../../components/admin/hooks'
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, count, dateTime, money, titleCase } from '../../components/admin/format'
import { Badge, Card, EmptyRow, ErrorBox, Loading, PageHeader, Pager, PaymentBadge, SearchBox, SortHeader, StatusBadge } from '../../components/admin/ui'

const DEFAULTS = { sort: 'createdAt,desc', size: '20' }

export default function Orders() {
  const { client } = useAdmin()
  const navigate = useNavigate()
  const [f, setF, reset] = useListParams(DEFAULTS)
  const [q, setQ] = useState(f.q || '')
  const debouncedQ = useDebounced(q)

  useEffect(() => {
    if ((f.q || '') !== debouncedQ) setF({ q: debouncedQ })
  }, [debouncedQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const params = {
    status: f.status, paymentMethod: f.paymentMethod, paymentStatus: f.paymentStatus,
    from: f.from, to: f.to, q: f.q, page: f.page, size: f.size, sort: f.sort,
  }
  const { data, error, loading, reload } = useAdminQuery(() => client.orders(params), JSON.stringify(params))
  const filtered = Boolean(f.status || f.paymentMethod || f.paymentStatus || f.from || f.to || f.q)

  return (
    <>
      <PageHeader title="Orders" subtitle={data ? `${count(data.totalElements)} ${filtered ? 'matching' : 'in total'}` : 'All store orders'} />
      <ErrorBox error={error} onRetry={reload} />
      <Card flush>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Order no., email, phone or name" />
          <select className="adm-select" value={f.status || ''} onChange={(e) => setF({ status: e.target.value })} aria-label="Order status">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <select className="adm-select" value={f.paymentMethod || ''} onChange={(e) => setF({ paymentMethod: e.target.value })} aria-label="Payment method">
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="adm-select" value={f.paymentStatus || ''} onChange={(e) => setF({ paymentStatus: e.target.value })} aria-label="Payment status">
            <option value="">Any payment</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <label className="adm-inline">
            From <input className="adm-input" type="date" value={f.from || ''} max={f.to || undefined} onChange={(e) => setF({ from: e.target.value })} />
          </label>
          <label className="adm-inline">
            To <input className="adm-input" type="date" value={f.to || ''} min={f.from || undefined} onChange={(e) => setF({ to: e.target.value })} />
          </label>
          {filtered && (
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => { setQ(''); reset() }}>
              <RotateCcw /> Reset
            </button>
          )}
        </div>
        {!data && !error ? (
          <Loading />
        ) : (
          <div className="adm-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader field="orderNumber" label="Order" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <SortHeader field="createdAt" label="Placed" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <th>Customer</th>
                  <SortHeader field="itemCount" label="Items" sort={f.sort} onSort={(s) => setF({ sort: s })} className="right" />
                  <SortHeader field="total" label="Total" sort={f.sort} onSort={(s) => setF({ sort: s })} className="right" />
                  <th>Payment</th>
                  <SortHeader field="status" label="Status" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && <EmptyRow colSpan={7} />}
                {data?.content.map((o) => (
                  <tr key={o.orderNumber} className="is-link" onClick={() => navigate(`/admin/orders/${o.orderNumber}`)}>
                    <td>
                      <Link className="adm-cell-title mono" to={`/admin/orders/${o.orderNumber}`} onClick={(e) => e.stopPropagation()}>
                        {o.orderNumber}
                      </Link>
                      {o.couponCode && <span className="adm-cell-sub">Coupon {o.couponCode}</span>}
                    </td>
                    <td className="nowrap">{dateTime(o.createdAt)}</td>
                    <td>
                      <span className="adm-cell-title">
                        {o.customerName} {o.guest && <Badge plain tone="grey">Guest</Badge>}
                      </span>
                      <span className="adm-cell-sub">{o.email} · {o.phone} · {o.city}</span>
                    </td>
                    <td className="right num">{o.itemCount}</td>
                    <td className="right num ink">{money(o.total)}</td>
                    <td>
                      <span className="adm-cell-sub">{o.paymentMethodLabel}</span>
                      <PaymentBadge status={o.paymentStatus} />
                    </td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={data} size={Number(f.size)} onPage={(p) => setF({ page: p })} onSize={(s) => setF({ size: s })} />
      </Card>
    </>
  )
}
