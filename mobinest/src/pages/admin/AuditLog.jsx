import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../../components/admin/context'
import { useAdminQuery, useDebounced, useListParams } from '../../components/admin/hooks'
import { dateTime } from '../../components/admin/format'
import { Badge, Card, EmptyRow, ErrorBox, Loading, PageHeader, Pager, SearchBox } from '../../components/admin/ui'

const DEFAULTS = { size: '50' }
const TYPES = ['ORDER', 'BRAND', 'PHONE', 'SKU', 'ACCESSORY', 'COUPON', 'CUSTOMER']
const TONE = { ORDER: 'blue', COUPON: 'violet', CUSTOMER: 'amber' }

function entityLink(e) {
  switch (e.entityType) {
    case 'ORDER': return `/admin/orders/${e.entityId}`
    case 'COUPON': return '/admin/coupons'
    case 'CUSTOMER': return `/admin/customers?q=${encodeURIComponent(e.entityId)}`
    case 'SKU': return `/admin/catalog/skus?q=${encodeURIComponent(e.entityId)}`
    case 'PHONE': return `/admin/catalog/phones?q=${encodeURIComponent(e.entityId)}`
    case 'BRAND': return '/admin/catalog/brands'
    case 'ACCESSORY': return `/admin/catalog/accessories?q=${encodeURIComponent(e.entityId)}`
    default: return null
  }
}

export default function AuditLog() {
  const { client } = useAdmin()
  const [f, setF] = useListParams(DEFAULTS)
  const [q, setQ] = useState(f.q || '')
  const debouncedQ = useDebounced(q)
  useEffect(() => {
    if ((f.q || '') !== debouncedQ) setF({ q: debouncedQ })
  }, [debouncedQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const params = { entityType: f.entityType, q: f.q, page: f.page, size: f.size }
  const { data, error, loading, reload } = useAdminQuery(() => client.audit(params), JSON.stringify(params))

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every change made in the admin: who did it, when, and what changed. Entries can't be edited or deleted." />
      <ErrorBox error={error} onRetry={reload} />
      <Card flush>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Search details, admin or id" />
          <select className="adm-select" value={f.entityType || ''} onChange={(e) => setF({ entityType: e.target.value })} aria-label="Type">
            <option value="">Everything</option>
            {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        {!data && !error ? (
          <Loading />
        ) : (
          <div className="adm-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>On</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && <EmptyRow colSpan={5}>No admin changes recorded yet.</EmptyRow>}
                {data?.content.map((e) => {
                  const to = entityLink(e)
                  return (
                    <tr key={e.id}>
                      <td className="nowrap small">{dateTime(e.at)}</td>
                      <td>
                        <span className="adm-cell-title">{e.actor}</span>
                        <span className="adm-cell-sub mono">{e.actorId}</span>
                      </td>
                      <td><Badge plain tone={TONE[e.entityType] || 'grey'}>{e.action.replaceAll('_', ' ').toLowerCase()}</Badge></td>
                      <td className="mono small">{to ? <Link to={to}>{e.entityId}</Link> : e.entityId}</td>
                      <td className="small" style={{ maxWidth: 520 }}>{e.details}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={data} size={Number(f.size)} onPage={(n) => setF({ page: n })} onSize={(s) => setF({ size: s })} />
      </Card>
    </>
  )
}
