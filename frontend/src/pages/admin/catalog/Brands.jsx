import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Pencil, X } from 'lucide-react'
import { useAdmin } from '../../../components/admin/context'
import { useAdminQuery } from '../../../components/admin/hooks'
import { count, errorText } from '../../../components/admin/format'
import { Badge, Card, ErrorBox, Loading, PageHeader, Switch } from '../../../components/admin/ui'

export default function Brands() {
  const { client, toast } = useAdmin()
  const { data, error, reload, setData } = useAdminQuery(() => client.brands(), 'brands')
  const [busy, setBusy] = useState(null)
  const [editing, setEditing] = useState(null) // { id, tagline }

  const save = async (brand, patch, message) => {
    setBusy(brand.id)
    try {
      const updated = await client.updateBrand(brand.id, patch)
      setData((rows) => rows.map((r) => (r.id === updated.id ? updated : r)))
      toast(message)
      return true
    } catch (e) {
      toast(errorText(e), { type: 'error', duration: 5000 })
      return false
    } finally {
      setBusy(null)
    }
  }

  const toggle = (brand, active) => {
    if (!active && !window.confirm(`Hide ${brand.name} from the store? Its ${brand.activePhones} phones disappear from listings and can't be ordered. Nothing is deleted.`)) return
    save(brand, { active }, `${brand.name} is now ${active ? 'visible in' : 'hidden from'} the store`)
  }

  const visible = data?.filter((b) => b.active).length ?? 0

  return (
    <>
      <PageHeader
        title="Brands"
        subtitle={data ? `${visible} of ${data.length} brands are visible in the store. Hidden brands keep all their phones and stock.` : 'Brand visibility and taglines'}
      />
      <ErrorBox error={error} onRetry={reload} />
      <Card flush>
        {!data ? (
          !error && <Loading />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Tagline</th>
                  <th className="right">Phones</th>
                  <th className="right">SKUs</th>
                  <th className="right">Units</th>
                  <th className="right">Low stock</th>
                  <th>In store</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="adm-cell-title">
                        <span className="adm-swatch" style={{ background: b.accent || 'var(--line)' }} />
                        {b.name}
                      </span>
                      <span className="adm-cell-sub mono">{b.id}</span>
                    </td>
                    <td style={{ minWidth: 260 }}>
                      {editing?.id === b.id ? (
                        <form
                          className="row"
                          onSubmit={async (e) => {
                            e.preventDefault()
                            if (await save(b, { tagline: editing.tagline }, 'Tagline saved')) setEditing(null)
                          }}
                        >
                          <input className="adm-input" style={{ flex: 1 }} autoFocus maxLength={255} value={editing.tagline}
                            onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} aria-label={`${b.name} tagline`} />
                          <button type="submit" className="adm-btn adm-btn--sm adm-btn--primary" disabled={busy === b.id} aria-label="Save tagline"><Check /></button>
                          <button type="button" className="adm-btn adm-btn--sm" onClick={() => setEditing(null)} aria-label="Cancel"><X /></button>
                        </form>
                      ) : (
                        <span className="row">
                          <span className={b.tagline ? '' : 'muted'}>{b.tagline || 'No tagline'}</span>
                          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing({ id: b.id, tagline: b.tagline || '' })} aria-label={`Edit ${b.name} tagline`}>
                            <Pencil />
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="right num">
                      <Link to={`/admin/catalog/phones?brand=${b.id}`}>{b.activePhones}/{b.phones}</Link>
                    </td>
                    <td className="right num">{count(b.skus)}</td>
                    <td className="right num">{count(b.units)}</td>
                    <td className="right">
                      {b.lowStockSkus > 0 ? (
                        <Link to={`/admin/catalog/skus?brand=${b.id}&lowStock=true&sort=stock,asc`}>
                          <Badge tone="amber">{b.lowStockSkus}</Badge>
                        </Link>
                      ) : (
                        <span className="muted">0</span>
                      )}
                    </td>
                    <td>
                      <Switch checked={b.active} disabled={busy === b.id} onChange={(v) => toggle(b, v)} label={b.active ? 'Visible' : 'Hidden'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
