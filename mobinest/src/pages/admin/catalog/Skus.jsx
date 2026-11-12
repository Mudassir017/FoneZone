import { useEffect, useState } from 'react'
import { useAdmin } from '../../../components/admin/context'
import { useAdminQuery, useDebounced, useListParams } from '../../../components/admin/hooks'
import { count, errorText } from '../../../components/admin/format'
import PriceStockCells from '../../../components/admin/PriceStockCells'
import { Badge, Card, EmptyRow, ErrorBox, Loading, PageHeader, Pager, SearchBox, SortHeader } from '../../../components/admin/ui'

const DEFAULTS = { size: '50' }

export default function Skus() {
  const { client, toast } = useAdmin()
  const [f, setF] = useListParams(DEFAULTS)
  const [q, setQ] = useState(f.q || '')
  const debouncedQ = useDebounced(q)
  useEffect(() => {
    if ((f.q || '') !== debouncedQ) setF({ q: debouncedQ })
  }, [debouncedQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const phones = useAdminQuery(() => client.phones({ size: 100, sort: 'name' }), 'phone-options')
  const conditions = useAdminQuery(() => client.conditions(), 'conditions')
  const brands = useAdminQuery(() => client.brands(), 'brands')

  const params = {
    phone: f.phone, brand: f.brand, condition: f.condition, lowStock: f.lowStock === 'true', threshold: f.threshold,
    visible: f.visible, q: f.q, page: f.page, size: f.size, sort: f.sort,
  }
  const { data, error, loading, reload, setData } = useAdminQuery(() => client.skus(params), JSON.stringify(params))

  const save = async (sku, patch) => {
    try {
      const updated = await client.updateSku(sku.id, patch)
      setData((page) => ({ ...page, content: page.content.map((s) => (s.id === updated.id ? updated : s)) }))
      toast(`Saved ${sku.skuCode}`)
    } catch (e) {
      toast(errorText(e), { type: 'error', duration: 6000 })
      if (e.code === 'STOCK_CHANGED') reload()
    }
  }

  return (
    <>
      <PageHeader
        title="SKUs & stock"
        subtitle="Every sellable phone unit (model · RAM/storage · colour · condition). Edit price, MRP or stock and press Enter or Save."
      />
      <ErrorBox error={error} onRetry={reload} />
      <Card flush>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="SKU code or phone" />
          <select className="adm-select" value={f.brand || ''} onChange={(e) => setF({ brand: e.target.value, phone: '' })} aria-label="Brand">
            <option value="">All brands</option>
            {brands.data?.map((b) => <option key={b.id} value={b.id}>{b.name}{b.active ? '' : ' (hidden)'}</option>)}
          </select>
          <select className="adm-select" value={f.phone || ''} onChange={(e) => setF({ phone: e.target.value })} aria-label="Phone">
            <option value="">All phones</option>
            {phones.data?.content
              .filter((p) => !f.brand || p.brand === f.brand)
              .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="adm-select" value={f.condition || ''} onChange={(e) => setF({ condition: e.target.value })} aria-label="Condition">
            <option value="">All conditions</option>
            {conditions.data?.map((c) => <option key={c.id} value={c.id}>{c.short || c.label}</option>)}
          </select>
          <select className="adm-select" value={f.visible || ''} onChange={(e) => setF({ visible: e.target.value })} aria-label="Visibility">
            <option value="">In store or hidden</option>
            <option value="true">In store</option>
            <option value="false">Hidden</option>
          </select>
          <label className="adm-check">
            <input type="checkbox" checked={f.lowStock === 'true'} onChange={(e) => setF({ lowStock: e.target.checked ? 'true' : '' })} />
            Low stock only (≤ {f.threshold || 5})
          </label>
        </div>
        {!data && !error ? (
          <Loading />
        ) : (
          <div className="adm-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader field="phone" label="Phone" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <th>Variant</th>
                  <th>Condition</th>
                  <SortHeader field="price" label="Price ₹" sort={f.sort} onSort={(s) => setF({ sort: s })} className="right" />
                  <SortHeader field="mrp" label="MRP ₹" sort={f.sort} onSort={(s) => setF({ sort: s })} className="right" />
                  <SortHeader field="stock" label="Stock" sort={f.sort} onSort={(s) => setF({ sort: s })} className="right" />
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && <EmptyRow colSpan={7} />}
                {data?.content.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="adm-cell-title">
                        {s.phoneName} {!s.visible && <Badge plain tone="grey">Hidden</Badge>}
                      </span>
                      <span className="adm-cell-sub mono">{s.skuCode}</span>
                    </td>
                    <td className="nowrap">
                      <span className="adm-swatch" style={{ background: s.colorHex }} />
                      {s.color}
                      <span className="adm-cell-sub">{s.variant}</span>
                    </td>
                    <td>
                      <Badge plain tone={s.condition === 'new' ? 'blue' : 'violet'}>{s.conditionLabel}</Badge>
                      {s.stock <= 5 && (
                        <span className="adm-cell-sub" style={{ color: s.stock === 0 ? 'var(--error)' : 'var(--adm-warn)' }}>
                          {s.stock === 0 ? 'Sold out' : 'Low stock'}
                        </span>
                      )}
                    </td>
                    <PriceStockCells key={`${s.id}:${s.price}:${s.mrp}:${s.stock}`} item={s} label={s.skuCode} onSave={(patch) => save(s, patch)} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={data} size={Number(f.size)} onPage={(n) => setF({ page: n })} onSize={(s) => setF({ size: s })} />
      </Card>
      {data && <p className="small muted" style={{ marginTop: 10 }}>{count(data.totalElements)} SKUs match. Prices are what customers pay; MRP is shown struck through.</p>}
    </>
  )
}
