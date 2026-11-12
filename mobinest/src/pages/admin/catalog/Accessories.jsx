import { useEffect, useState } from 'react'
import { useAdmin } from '../../../components/admin/context'
import { useAdminQuery, useDebounced, useListParams } from '../../../components/admin/hooks'
import { errorText } from '../../../components/admin/format'
import PriceStockCells from '../../../components/admin/PriceStockCells'
import { Card, EmptyRow, ErrorBox, Loading, PageHeader, Pager, SearchBox, SortHeader, Switch } from '../../../components/admin/ui'

const DEFAULTS = { size: '50' }
const CATEGORIES = [
  ['cases', 'Cases'], ['screen-guards', 'Screen protection'], ['chargers', 'Chargers'], ['cables', 'Cables'],
  ['audio', 'Audio'], ['power-banks', 'Power banks'], ['wearables', 'Wearables'], ['mounts', 'Mounts'],
]

export default function Accessories() {
  const { client, toast } = useAdmin()
  const [f, setF] = useListParams(DEFAULTS)
  const [q, setQ] = useState(f.q || '')
  const debouncedQ = useDebounced(q)
  useEffect(() => {
    if ((f.q || '') !== debouncedQ) setF({ q: debouncedQ })
  }, [debouncedQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const params = { category: f.category, active: f.active, lowStock: f.lowStock === 'true', q: f.q, page: f.page, size: f.size, sort: f.sort }
  const { data, error, loading, reload, setData } = useAdminQuery(() => client.accessories(params), JSON.stringify(params))
  const [busy, setBusy] = useState(null)

  const update = async (a, patch, message) => {
    setBusy(a.id)
    try {
      const updated = await client.updateAccessory(a.id, patch)
      setData((page) => ({ ...page, content: page.content.map((x) => (x.id === updated.id ? updated : x)) }))
      toast(message)
    } catch (e) {
      toast(errorText(e), { type: 'error', duration: 6000 })
      if (e.code === 'STOCK_CHANGED') reload()
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader title="Accessories" subtitle="Price, stock and visibility of cases, chargers, audio and more. Inactive accessories are hidden from the store." />
      <ErrorBox error={error} onRetry={reload} />
      <Card flush>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Name or brand" />
          <select className="adm-select" value={f.category || ''} onChange={(e) => setF({ category: e.target.value })} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="adm-select" value={f.active || ''} onChange={(e) => setF({ active: e.target.value })} aria-label="Active">
            <option value="">Active and inactive</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <label className="adm-check">
            <input type="checkbox" checked={f.lowStock === 'true'} onChange={(e) => setF({ lowStock: e.target.checked ? 'true' : '' })} />
            Low stock only (≤ 5)
          </label>
        </div>
        {!data && !error ? (
          <Loading />
        ) : (
          <div className="adm-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader field="name" label="Accessory" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <SortHeader field="category" label="Category" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <SortHeader field="price" label="Price ₹" sort={f.sort} onSort={(s) => setF({ sort: s })} className="right" />
                  <th className="right">MRP ₹</th>
                  <SortHeader field="stock" label="Stock" sort={f.sort} onSort={(s) => setF({ sort: s })} className="right" />
                  <th />
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && <EmptyRow colSpan={7} />}
                {data?.content.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="adm-cell-title">{a.name}</span>
                      <span className="adm-cell-sub">{a.brandLabel} · <span className="mono">{a.id}</span></span>
                    </td>
                    <td>{a.categoryName}</td>
                    <PriceStockCells key={`${a.id}:${a.price}:${a.mrp}:${a.stock}`} item={a} label={a.name}
                      onSave={(patch) => update(a, patch, `Saved ${a.name}`)} />
                    <td>
                      <Switch checked={a.active} disabled={busy === a.id}
                        onChange={(v) => update(a, { active: v }, `${a.name} ${v ? 'is back in' : 'hidden from'} the store`)} />
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
