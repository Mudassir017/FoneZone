import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes } from 'lucide-react'
import { useAdmin } from '../../../components/admin/context'
import { useAdminQuery, useDebounced, useListParams } from '../../../components/admin/hooks'
import { count, errorText, money } from '../../../components/admin/format'
import { Badge, Card, EmptyRow, ErrorBox, Loading, PageHeader, Pager, SearchBox, SortHeader, Switch } from '../../../components/admin/ui'

const DEFAULTS = { size: '50' }

export default function Phones() {
  const { client, toast } = useAdmin()
  const [f, setF] = useListParams(DEFAULTS)
  const [q, setQ] = useState(f.q || '')
  const debouncedQ = useDebounced(q)
  useEffect(() => {
    if ((f.q || '') !== debouncedQ) setF({ q: debouncedQ })
  }, [debouncedQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const brands = useAdminQuery(() => client.brands(), 'brands')
  const visibility = f.show === 'visible' ? { visible: true } : f.show === 'hidden' ? { visible: false } : {}
  const params = { brand: f.brand, q: f.q, page: f.page, size: f.size, sort: f.sort, ...visibility }
  const { data, error, loading, reload, setData } = useAdminQuery(() => client.phones(params), JSON.stringify(params))
  const [busy, setBusy] = useState(null)

  const toggle = async (phone, active) => {
    setBusy(phone.id)
    try {
      const updated = await client.updatePhone(phone.id, { active })
      setData((page) => ({ ...page, content: page.content.map((p) => (p.id === updated.id ? updated : p)) }))
      toast(`${phone.name} ${active ? 'activated' : 'deactivated'}${active && !updated.brandActive ? ' (still hidden: its brand is hidden)' : ''}`)
    } catch (e) {
      toast(errorText(e), { type: 'error', duration: 5000 })
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader title="Phones" subtitle="All models, including hidden ones. A phone is in the store only when it and its brand are both active." />
      <ErrorBox error={error} onRetry={reload} />
      <Card flush>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Phone name" />
          <select className="adm-select" value={f.brand || ''} onChange={(e) => setF({ brand: e.target.value })} aria-label="Brand">
            <option value="">All brands</option>
            {brands.data?.map((b) => (
              <option key={b.id} value={b.id}>{b.name}{b.active ? '' : ' (hidden)'}</option>
            ))}
          </select>
          <select className="adm-select" value={f.show || ''} onChange={(e) => setF({ show: e.target.value })} aria-label="Visibility">
            <option value="">Visible and hidden</option>
            <option value="visible">Visible in store</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        {!data && !error ? (
          <Loading />
        ) : (
          <div className="adm-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader field="name" label="Phone" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <SortHeader field="brand" label="Brand" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <SortHeader field="year" label="Year" sort={f.sort} onSort={(s) => setF({ sort: s })} className="right" />
                  <th className="right">SKUs</th>
                  <th className="right">Units</th>
                  <th className="right">Price range</th>
                  <th>Store</th>
                  <th>Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && <EmptyRow colSpan={9} />}
                {data?.content.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="adm-cell-title">{p.name}</span>
                      <span className="adm-cell-sub mono">{p.id}</span>
                    </td>
                    <td>{p.brandName}</td>
                    <td className="right num">{p.year ?? '—'}</td>
                    <td className="right num">
                      {count(p.skus)}
                      {p.lowStockSkus > 0 && <span className="adm-cell-sub" style={{ color: 'var(--adm-warn)' }}>{p.lowStockSkus} low</span>}
                    </td>
                    <td className="right num">{count(p.units)}</td>
                    <td className="right num nowrap">{p.minPrice ? `${money(p.minPrice)} – ${money(p.maxPrice)}` : '—'}</td>
                    <td>
                      {p.visible ? <Badge tone="green">Visible</Badge> : !p.active ? <Badge tone="grey">Inactive</Badge> : <Badge tone="amber" title="The phone is active but its brand is hidden">Brand hidden</Badge>}
                    </td>
                    <td>
                      <Switch checked={p.active} disabled={busy === p.id} onChange={(v) => toggle(p, v)} title={p.active ? 'Deactivate' : 'Activate'} />
                    </td>
                    <td className="right">
                      <Link className="adm-btn adm-btn--sm" to={`/admin/catalog/skus?phone=${p.id}`}>
                        <Boxes /> Stock &amp; prices
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={data} size={Number(f.size)} onPage={(n) => setF({ page: n })} onSize={(s) => setF({ size: s })} />
      </Card>
    </>
  )
}
