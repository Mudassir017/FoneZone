import { useEffect, useState } from 'react'
import { ShieldCheck, UserMinus, UserPlus } from 'lucide-react'
import { useAdmin } from '../../components/admin/context'
import { useAdminQuery, useDebounced, useListParams } from '../../components/admin/hooks'
import { count, dateOnly, errorText, money } from '../../components/admin/format'
import { Badge, Card, EmptyRow, ErrorBox, Field, Loading, PageHeader, Pager, SearchBox, SortHeader } from '../../components/admin/ui'

const DEFAULTS = { sort: 'createdAt,desc', size: '20' }

export default function Customers() {
  const { client, toast, me } = useAdmin()
  const [f, setF] = useListParams(DEFAULTS)
  const [q, setQ] = useState(f.q || '')
  const debouncedQ = useDebounced(q)
  useEffect(() => {
    if ((f.q || '') !== debouncedQ) setF({ q: debouncedQ })
  }, [debouncedQ]) // eslint-disable-line react-hooks/exhaustive-deps

  const params = { q: f.q, role: f.role, page: f.page, size: f.size, sort: f.sort }
  const { data, error, loading, reload, setData } = useAdminQuery(() => client.customers(params), JSON.stringify(params))
  const [busy, setBusy] = useState(null)
  const [newId, setNewId] = useState('')

  const changeRole = async (clerkUserId, role, who) => {
    const verb = role === 'ADMIN' ? 'Give admin access to' : 'Remove admin access from'
    if (!window.confirm(`${verb} ${who}?${role === 'ADMIN' ? ' They will be able to change orders, prices, stock, coupons and admins.' : ''}`)) return false
    setBusy(clerkUserId)
    try {
      const updated = await client.setRole(clerkUserId, role)
      setData((page) => {
        if (!page) return page
        const exists = page.content.some((c) => c.clerkUserId === updated.clerkUserId)
        return { ...page, content: exists ? page.content.map((c) => (c.clerkUserId === updated.clerkUserId ? updated : c)) : [updated, ...page.content] }
      })
      toast(`${updated.email || updated.clerkUserId} is now ${updated.role === 'ADMIN' ? 'an admin' : 'a customer'}`)
      return true
    } catch (e) {
      toast(errorText(e), { type: 'error', duration: 6000 })
      return false
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Customers & admins"
        subtitle="Everyone who has signed in to the shop. Admins can use this back office; you can't remove your own access."
      />
      <ErrorBox error={error} onRetry={reload} />

      <Card title={<h2 className="row"><ShieldCheck size={18} /> Add an admin by user ID</h2>} className="" >
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault()
            if (await changeRole(newId.trim(), 'ADMIN', newId.trim())) setNewId('')
          }}
        >
          <Field label="Clerk user ID" hint="They see it on the “No admin access” page at /admin. Works even before their first sign-in.">
            <input className="adm-input mono" style={{ width: 340, maxWidth: '100%' }} value={newId} placeholder="user_2abc…"
              pattern="user_[A-Za-z0-9]{8,60}" onChange={(e) => setNewId(e.target.value)} required />
          </Field>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={!newId.trim() || busy}>
            <UserPlus /> Make admin
          </button>
        </form>
      </Card>

      <div style={{ height: 16 }} />
      <Card flush>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Name, email or user ID" />
          <select className="adm-select" value={f.role || ''} onChange={(e) => setF({ role: e.target.value })} aria-label="Role">
            <option value="">All roles</option>
            <option value="ADMIN">Admins</option>
            <option value="CUSTOMER">Customers</option>
          </select>
        </div>
        {!data && !error ? (
          <Loading />
        ) : (
          <div className="adm-table-wrap" style={{ opacity: loading ? 0.6 : 1 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader field="name" label="Customer" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <th>User ID</th>
                  <th className="right">Orders</th>
                  <th className="right">Total spent</th>
                  <th>Last order</th>
                  <SortHeader field="createdAt" label="Joined" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <SortHeader field="role" label="Role" sort={f.sort} onSort={(s) => setF({ sort: s })} />
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && (
                  <EmptyRow colSpan={8}>No customers yet. A profile is created the first time a signed-in user uses the shop.</EmptyRow>
                )}
                {data?.content.map((c) => {
                  const self = c.clerkUserId === me?.userId
                  const who = c.email || c.name || c.clerkUserId
                  return (
                    <tr key={c.clerkUserId}>
                      <td>
                        <span className="adm-cell-title">{c.name || c.email || 'No name yet'} {self && <Badge plain tone="blue">You</Badge>}</span>
                        <span className="adm-cell-sub">{c.email || '—'}</span>
                      </td>
                      <td className="mono small">{c.clerkUserId}</td>
                      <td className="right num">{count(c.orderCount)}</td>
                      <td className="right num">{money(c.totalSpent)}</td>
                      <td className="small nowrap">{c.lastOrderAt ? dateOnly(c.lastOrderAt) : '—'}</td>
                      <td className="small nowrap">{dateOnly(c.createdAt)}</td>
                      <td>
                        {c.role === 'ADMIN' ? <Badge tone="violet">Admin</Badge> : <Badge tone="grey">Customer</Badge>}
                        {c.bootstrapAdmin && <span className="adm-cell-sub">via server config</span>}
                      </td>
                      <td className="right">
                        {c.role === 'ADMIN' ? (
                          <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" disabled={self || c.bootstrapAdmin || busy === c.clerkUserId}
                            title={self ? "You can't remove your own admin access" : c.bootstrapAdmin ? 'Listed in ADMIN_CLERK_USER_IDS on the server' : undefined}
                            onClick={() => changeRole(c.clerkUserId, 'CUSTOMER', who)}>
                            <UserMinus /> Remove admin
                          </button>
                        ) : (
                          <button type="button" className="adm-btn adm-btn--sm" disabled={busy === c.clerkUserId} onClick={() => changeRole(c.clerkUserId, 'ADMIN', who)}>
                            <UserPlus /> Make admin
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={data} size={Number(f.size)} onPage={(n) => setF({ page: n })} onSize={(s) => setF({ size: s })} />
      </Card>
      <p className="small muted" style={{ marginTop: 10 }}>
        Orders and total spent count signed-in orders only (guest checkouts aren't linked to an account); cancelled orders don't count towards the total.
      </p>
    </>
  )
}
