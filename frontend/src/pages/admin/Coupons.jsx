import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useAdmin } from '../../components/admin/context'
import { useAdminQuery, useListParams } from '../../components/admin/hooks'
import { count, dateTime, errorText, money } from '../../components/admin/format'
import { Badge, Card, Dialog, EmptyRow, ErrorBox, Field, Loading, PageHeader, Pager } from '../../components/admin/ui'

const DEFAULTS = { size: '50' }
const EMPTY = { code: '', description: '', discountType: 'PERCENT', discountValue: '', maxDiscount: '', minSubtotal: '', maxSubtotal: '', validUntil: '', active: true }

/** ISO instant <-> value of <input type="datetime-local"> in IST. */
const toLocalInput = (iso) => {
  if (!iso) return ''
  const ist = new Date(new Date(iso).getTime() + 330 * 60000)
  return ist.toISOString().slice(0, 16)
}
const fromLocalInput = (v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null)

function describe(c) {
  return c.discountType === 'PERCENT'
    ? `${Number(c.discountValue)}% off${c.maxDiscount ? ` (max ${money(c.maxDiscount)})` : ''}`
    : `${money(c.discountValue)} off`
}

function conditions(c) {
  const parts = []
  if (Number(c.minSubtotal) > 0) parts.push(`from ${money(c.minSubtotal)}`)
  if (c.maxSubtotal) parts.push(`up to ${money(c.maxSubtotal)}`)
  return parts.length ? parts.join(' · ') : 'Any order value'
}

export default function Coupons() {
  const { client, toast } = useAdmin()
  const [f, setF] = useListParams(DEFAULTS)
  const params = { active: f.active, page: f.page, size: f.size, sort: f.sort }
  const { data, error, loading, reload } = useAdminQuery(() => client.coupons(params), JSON.stringify(params))
  const [editing, setEditing] = useState(null) // { mode: 'create'|'edit', form }

  const deactivate = async (c) => {
    if (!window.confirm(`Deactivate ${c.code}? Customers can't use it any more. Past orders keep their discount.`)) return
    try {
      await client.deactivateCoupon(c.code)
      toast(`${c.code} deactivated`)
      reload()
    } catch (e) {
      toast(errorText(e), { type: 'error', duration: 5000 })
    }
  }

  const openEdit = (c) =>
    setEditing({
      mode: 'edit',
      form: {
        code: c.code, description: c.description, discountType: c.discountType, discountValue: String(c.discountValue),
        maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', minSubtotal: Number(c.minSubtotal) ? String(c.minSubtotal) : '',
        maxSubtotal: c.maxSubtotal ? String(c.maxSubtotal) : '', validUntil: toLocalInput(c.validUntil), active: c.active,
      },
    })

  return (
    <>
      <PageHeader
        title="Coupons"
        subtitle="Codes customers enter at checkout. The server checks every rule again when the order is placed."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing({ mode: 'create', form: EMPTY })}>
            <Plus /> New coupon
          </button>
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      <Card flush>
        <div className="adm-toolbar">
          <select className="adm-select" value={f.active || ''} onChange={(e) => setF({ active: e.target.value })} aria-label="Status">
            <option value="">Active and inactive</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        {!data && !error ? (
          <Loading />
        ) : (
          <div className="adm-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Order value</th>
                  <th>Valid until</th>
                  <th className="right">Used</th>
                  <th className="right">Given away</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && <EmptyRow colSpan={8}>No coupons yet.</EmptyRow>}
                {data?.content.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <span className="adm-cell-title mono">{c.code}</span>
                      <span className="adm-cell-sub">{c.description}</span>
                    </td>
                    <td className="nowrap">{describe(c)}</td>
                    <td className="small">{conditions(c)}</td>
                    <td className="nowrap small">{c.validUntil ? dateTime(c.validUntil) : 'No expiry'}</td>
                    <td className="right num">{count(c.timesUsed)}</td>
                    <td className="right num">{money(c.discountGiven)}</td>
                    <td>
                      {c.usable ? <Badge tone="green">Active</Badge> : c.active && c.expired ? <Badge tone="amber">Expired</Badge> : <Badge tone="grey">Inactive</Badge>}
                    </td>
                    <td className="right nowrap">
                      <button type="button" className="adm-btn adm-btn--sm" onClick={() => openEdit(c)}>
                        <Pencil /> Edit
                      </button>{' '}
                      {c.active && (
                        <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => deactivate(c)}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={data} size={Number(f.size)} onPage={(n) => setF({ page: n })} onSize={(s) => setF({ size: s })} />
      </Card>

      {editing && (
        <CouponDialog
          key={editing.mode + editing.form.code}
          mode={editing.mode}
          initial={editing.form}
          onClose={() => setEditing(null)}
          onSaved={(c) => {
            setEditing(null)
            toast(`${c.code} saved`)
            reload()
          }}
        />
      )}
    </>
  )
}

function CouponDialog({ mode, initial, onClose, onSaved }) {
  const { client } = useAdmin()
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const fieldErr = (k) => err?.fields?.[k]
  const num = (v) => (v === '' ? null : Number(v))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const body = {
      code: form.code.trim(), description: form.description.trim(), discountType: form.discountType,
      discountValue: num(form.discountValue), maxDiscount: form.discountType === 'PERCENT' ? num(form.maxDiscount) : null,
      minSubtotal: num(form.minSubtotal) ?? 0, maxSubtotal: num(form.maxSubtotal), validUntil: fromLocalInput(form.validUntil), active: form.active,
    }
    try {
      const saved = mode === 'create' ? await client.createCoupon(body) : await client.updateCoupon(initial.code, body)
      onSaved(saved)
    } catch (ex) {
      setErr(ex)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      title={mode === 'create' ? 'New coupon' : `Edit ${initial.code}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="coupon-form" className="adm-btn adm-btn--primary" disabled={busy}>
            {busy ? 'Saving…' : mode === 'create' ? 'Create coupon' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={submit} className="stack" style={{ gap: 14 }}>
        <div className="adm-form-grid">
          <Field label="Code" hint="3–30 letters, digits, - or _. Saved in capitals." error={fieldErr('code')}>
            <input className="adm-input mono" value={form.code} onChange={set('code')} disabled={mode === 'edit'} required maxLength={30}
              style={{ textTransform: 'uppercase' }} />
          </Field>
          <Field label="Type" error={fieldErr('discountType')}>
            <select className="adm-select" value={form.discountType} onChange={set('discountType')}>
              <option value="PERCENT">Percentage off</option>
              <option value="FLAT">Flat ₹ off</option>
            </select>
          </Field>
        </div>
        <Field label="Description (shown to customers)" error={fieldErr('description')}>
          <input className="adm-input" value={form.description} onChange={set('description')} required maxLength={200}
            placeholder="e.g. 5% off this Diwali (up to ₹1,500)" />
        </Field>
        <div className="adm-form-grid">
          <Field label={form.discountType === 'PERCENT' ? 'Discount %' : 'Discount ₹'} error={fieldErr('discountValue')}>
            <input className="adm-input" inputMode="decimal" value={form.discountValue} onChange={set('discountValue')} required />
          </Field>
          {form.discountType === 'PERCENT' && (
            <Field label="Max discount ₹ (optional)" error={fieldErr('maxDiscount')}>
              <input className="adm-input" inputMode="decimal" value={form.maxDiscount} onChange={set('maxDiscount')} />
            </Field>
          )}
        </div>
        <div className="adm-form-grid">
          <Field label="Min order value ₹" hint="Leave empty for any amount" error={fieldErr('minSubtotal')}>
            <input className="adm-input" inputMode="decimal" value={form.minSubtotal} onChange={set('minSubtotal')} />
          </Field>
          <Field label="Max order value ₹ (optional)" error={fieldErr('maxSubtotal')}>
            <input className="adm-input" inputMode="decimal" value={form.maxSubtotal} onChange={set('maxSubtotal')} />
          </Field>
        </div>
        <div className="adm-form-grid">
          <Field label="Valid until (IST, optional)" hint="Empty = no expiry" error={fieldErr('validUntil')}>
            <input className="adm-input" type="datetime-local" value={form.validUntil} onChange={set('validUntil')} />
          </Field>
          <Field label="Status">
            <label className="adm-check" style={{ height: 34 }}>
              <input type="checkbox" checked={form.active} onChange={set('active')} /> Active (usable at checkout)
            </label>
          </Field>
        </div>
        {err && !err.fields && <div className="adm-alert adm-alert--error">{errorText(err)}</div>}
        {err?.fields && <div className="adm-alert adm-alert--error">Please fix the highlighted fields.</div>}
      </form>
    </Dialog>
  )
}
