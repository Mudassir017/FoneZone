import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { useAdmin } from '../../components/admin/context'
import { useAdminQuery, useDebounced, useListParams } from '../../components/admin/hooks'
import { PAYMENT_METHODS, PAYMENT_STATUSES, count, dateTime, money, titleCase } from '../../components/admin/format'
import { Card, EmptyRow, ErrorBox, KpiCard, Loading, PageHeader, Pager, PaymentBadge, SearchBox, SortHeader, StatusBadge } from '../../components/admin/ui'

const DEFAULTS = { sort: 'createdAt,desc', size: '20' }

export default function Payments() {
  const { client } = useAdmin()
  const [f, setF, reset] = useListParams(DEFAULTS)
  const [q, setQ] = useState(f.q || '')
  const debouncedQ = useDebounced(q)
  useEffect(() => {
    if ((f.q || '') !== debouncedQ) setF({ q: debouncedQ })
  }, [debouncedQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const filters = { method: f.method, status: f.status, from: f.from, to: f.to, q: f.q }
  const listParams = { ...filters, page: f.page, size: f.size, sort: f.sort }
  const list = useAdminQuery(() => client.payments(listParams), JSON.stringify(listParams))
  const summary = useAdminQuery(() => client.paymentSummary(filters), JSON.stringify(filters))
  const filtered = Object.values(filters).some(Boolean)
  const s = summary.data

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="One payment record per order: method, status, reference and amount. Razorpay payments will appear here once it is connected."
      />
      <ErrorBox error={list.error || summary.error} onRetry={() => { list.reload(); summary.reload() }} />

      {s && (
        <div className="adm-grid adm-grid--kpi" style={{ marginBottom: 16 }}>
          <KpiCard label={filtered ? 'Matching payments' : 'All payments'} value={money(s.amount)} sub={`${count(s.count)} orders`} />
          {s.byStatus.map((b) => (
            <KpiCard key={b.key} label={b.label} value={money(b.amount)} sub={`${count(b.count)} ${b.count === 1 ? 'order' : 'orders'}`} />
          ))}
        </div>
      )}

      {s && s.byMethod.length > 0 && (
        <Card title="By payment method">
          {s.byMethod.map((b) => {
            const max = Math.max(...s.byMethod.map((x) => Number(x.amount)), 1)
            return (
              <button key={b.key} type="button" className="adm-hbar" style={{ all: 'unset', display: 'grid', gridTemplateColumns: '140px 1fr 160px', gap: 10, alignItems: 'center', width: '100%', cursor: 'pointer', marginBottom: 10 }}
                onClick={() => setF({ method: f.method === b.key ? '' : b.key })} aria-pressed={f.method === b.key}>
                <span className={f.method === b.key ? 'ink' : ''}>{b.label}</span>
                <span className="adm-hbar__track">
                  <span className="adm-hbar__fill" style={{ display: 'block', width: `${(Number(b.amount) / max) * 100}%` }} />
                </span>
                <span className="right num small"><strong className="ink">{money(b.amount)}</strong> · {count(b.count)}</span>
              </button>
            )
          })}
          <p className="small muted">Click a method to filter the list.</p>
        </Card>
      )}

      <div style={{ height: 16 }} />
      <Card flush>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Order no., email, phone or name" />
          <select className="adm-select" value={f.method || ''} onChange={(e) => setF({ method: e.target.value })} aria-label="Payment method">
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="adm-select" value={f.status || ''} onChange={(e) => setF({ status: e.target.value })} aria-label="Payment status">
            <option value="">Any status</option>
            {PAYMENT_STATUSES.map((st) => <option key={st} value={st}>{titleCase(st)}</option>)}
          </select>
          <label className="adm-inline">
            From <input className="adm-input" type="date" value={f.from || ''} onChange={(e) => setF({ from: e.target.value })} />
          </label>
          <label className="adm-inline">
            To <input className="adm-input" type="date" value={f.to || ''} onChange={(e) => setF({ to: e.target.value })} />
          </label>
          {filtered && (
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => { setQ(''); reset() }}>
              <RotateCcw /> Reset
            </button>
          )}
        </div>
        {!list.data && !list.error ? (
          <Loading />
        ) : (
          <div className="adm-table-wrap" style={{ opacity: list.loading ? 0.6 : 1 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader field="createdAt" label="Date" sort={f.sort} onSort={(v) => setF({ sort: v })} />
                  <th>Order</th>
                  <SortHeader field="method" label="Method" sort={f.sort} onSort={(v) => setF({ sort: v })} />
                  <th>Reference</th>
                  <SortHeader field="status" label="Payment" sort={f.sort} onSort={(v) => setF({ sort: v })} />
                  <SortHeader field="amount" label="Amount" sort={f.sort} onSort={(v) => setF({ sort: v })} className="right" />
                  <th>Order status</th>
                </tr>
              </thead>
              <tbody>
                {list.data?.content.length === 0 && <EmptyRow colSpan={7} />}
                {list.data?.content.map((p) => (
                  <tr key={p.orderNumber}>
                    <td className="nowrap">{dateTime(p.createdAt)}</td>
                    <td>
                      <Link className="adm-cell-title mono" to={`/admin/orders/${p.orderNumber}`}>{p.orderNumber}</Link>
                      <span className="adm-cell-sub">{p.customerName} · {p.email}</span>
                    </td>
                    <td>{p.methodLabel}</td>
                    <td className="mono small">{p.reference || '—'}</td>
                    <td>
                      <PaymentBadge status={p.status} />
                      {p.updatedAt !== p.createdAt && <span className="adm-cell-sub">updated {dateTime(p.updatedAt)}</span>}
                    </td>
                    <td className="right num ink">{money(p.amount)}</td>
                    <td><StatusBadge status={p.orderStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={list.data} size={Number(f.size)} onPage={(p) => setF({ page: p })} onSize={(v) => setF({ size: v })} />
      </Card>
    </>
  )
}
