import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CircleCheck, CircleX, Copy, Truck } from 'lucide-react'
import { useAdmin } from '../../components/admin/context'
import { useAdminQuery } from '../../components/admin/hooks'
import { PAYMENT_ACTION, STATUS_ACTION, count, dateOnly, dateTime, errorText, money, titleCase } from '../../components/admin/format'
import { Badge, Card, Dialog, ErrorBox, Field, Loading, PageHeader, PaymentBadge, StatusBadge } from '../../components/admin/ui'

const STATUS_ICON = { SHIPPED: Truck, DELIVERED: CircleCheck, CANCELLED: CircleX }

export default function OrderDetail() {
  const { orderNumber } = useParams()
  const { client, toast } = useAdmin()
  const { data: order, error, reload, setData } = useAdminQuery(() => client.order(orderNumber), orderNumber)
  const [pending, setPending] = useState(null) // { kind: 'status'|'payment', to }

  if (error?.status === 404) {
    return (
      <>
        <PageHeader title="Order not found" back={{ to: '/admin/orders', label: 'Orders' }} />
        <p className="muted">There is no order {orderNumber}.</p>
      </>
    )
  }
  if (!order) return error ? <ErrorBox error={error} onRetry={reload} /> : <Loading />

  const restockUnits = order.items.filter((i) => i.skuId || i.accessoryId).reduce((s, i) => s + i.qty, 0)

  return (
    <>
      <PageHeader
        back={{ to: '/admin/orders', label: 'Orders' }}
        title={
          <span className="row" style={{ gap: 12 }}>
            <span className="mono" style={{ fontSize: 22 }}>{order.orderNumber}</span>
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.payment.status} />
          </span>
        }
        subtitle={`Placed ${dateTime(order.createdAt)} · last updated ${dateTime(order.updatedAt)} · ETA ${dateOnly(order.estimatedDelivery)}`}
        actions={
          <button type="button" className="adm-btn" onClick={() => navigator.clipboard?.writeText(order.orderNumber).then(() => toast('Order number copied'))}>
            <Copy /> Copy no.
          </button>
        }
      />
      <ErrorBox error={error} onRetry={reload} />

      <div className="adm-grid adm-grid--detail">
        <div className="stack">
          <Card title="Fulfilment">
            {order.allowedStatuses.length === 0 ? (
              <p className="muted">
                This order is <strong>{titleCase(order.status)}</strong>. That is a final status, so it can't be changed.
              </p>
            ) : (
              <div className="stack" style={{ gap: 12 }}>
                <p className="muted small">Next steps for a {titleCase(order.status).toLowerCase()} order:</p>
                <div className="row">
                  {order.allowedStatuses.map((s) => {
                    const Icon = STATUS_ICON[s]
                    return (
                      <button key={s} type="button" className={`adm-btn ${s === 'CANCELLED' ? 'adm-btn--danger' : 'adm-btn--primary'}`}
                        onClick={() => setPending({ kind: 'status', to: s })}>
                        {Icon && <Icon />} {STATUS_ACTION[s] || titleCase(s)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card flush title={`Items (${count(order.totals.itemCount)})`}>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="right">Qty</th>
                    <th className="right">Unit price</th>
                    <th className="right">Line total</th>
                    <th className="right">In stock now</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i, idx) => (
                    <tr key={`${i.productId}-${idx}`}>
                      <td>
                        <span className="adm-cell-title">
                          {i.colorHex && <span className="adm-swatch" style={{ background: i.colorHex }} />}
                          {i.name} {i.condition && <Badge plain tone="blue">{i.condition}</Badge>}
                        </span>
                        <span className="adm-cell-sub">{i.details}</span>
                        <span className="adm-cell-sub mono">{i.skuCode || i.productId}</span>
                      </td>
                      <td className="right num">{i.qty}</td>
                      <td className="right num">
                        {money(i.unitPrice)}
                        {Number(i.unitMrp) > Number(i.unitPrice) && <span className="adm-cell-sub"><s>{money(i.unitMrp)}</s></span>}
                      </td>
                      <td className="right num ink">{money(i.lineTotal)}</td>
                      <td className="right num">{i.currentStock ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Timeline">
            <ol className="adm-timeline">
              {order.timeline.map((t, idx) => (
                <li key={idx} className={t.kind === 'PAYMENT' ? 'is-payment' : ''}>
                  <div className="row">
                    <strong className="ink">
                      {t.kind === 'PLACED' ? 'Order placed' : t.kind === 'PAYMENT' ? `Payment ${titleCase(t.from)} → ${titleCase(t.to)}` : `${titleCase(t.from)} → ${titleCase(t.to)}`}
                    </strong>
                    <span className="small muted">{dateTime(t.at)}</span>
                  </div>
                  <div className="small muted">
                    by {t.by || 'unknown'}
                    {t.note && t.kind !== 'PLACED' && <> · “{t.note}”</>}
                    {t.kind === 'PLACED' && t.note && <> · {t.note.replace('Order placed · ', '')}</>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="stack">
          <Card title="Payment">
            <dl className="adm-dl">
              <dt>Method</dt>
              <dd>{order.payment.methodLabel}</dd>
              <dt>Status</dt>
              <dd><PaymentBadge status={order.payment.status} /></dd>
              <dt>Reference</dt>
              <dd className="mono">{order.payment.reference || '—'}</dd>
              <dt>Amount</dt>
              <dd className="num">{money(order.payment.amount)}</dd>
            </dl>
            {order.allowedPaymentStatuses.length > 0 && (
              <div className="row" style={{ marginTop: 14 }}>
                {order.allowedPaymentStatuses.map((s) => (
                  <button key={s} type="button" className={`adm-btn adm-btn--sm ${s === 'PAID' ? 'adm-btn--success' : s === 'FAILED' ? 'adm-btn--danger' : ''}`}
                    onClick={() => setPending({ kind: 'payment', to: s })}>
                    {PAYMENT_ACTION[s] || titleCase(s)}
                  </button>
                ))}
              </div>
            )}
            {order.status === 'CANCELLED' && order.payment.status === 'PAID' && (
              <p className="small" style={{ marginTop: 10, color: 'var(--adm-warn)' }}>
                Cancelled but paid: refund the customer, then mark it refunded.
              </p>
            )}
          </Card>

          <Card title="Totals">
            <dl className="adm-dl">
              <dt>MRP total</dt>
              <dd className="num">{money(order.totals.mrpTotal)}</dd>
              <dt>Product savings</dt>
              <dd className="num">−{money(order.totals.productSavings)}</dd>
              <dt>Subtotal</dt>
              <dd className="num">{money(order.totals.subtotal)}</dd>
              <dt>Coupon {order.couponCode && <Badge plain tone="violet">{order.couponCode}</Badge>}</dt>
              <dd className="num">−{money(order.totals.couponDiscount)}</dd>
              <dt>Shipping</dt>
              <dd className="num">{Number(order.totals.shipping) === 0 ? 'Free' : money(order.totals.shipping)}</dd>
              <dt className="ink">Total</dt>
              <dd className="num total">{money(order.totals.total)}</dd>
            </dl>
          </Card>

          <Card title="Customer">
            <dl className="adm-dl">
              <dt>Account</dt>
              <dd>
                {order.guest ? (
                  <Badge plain tone="grey">Guest checkout</Badge>
                ) : (
                  <Link to={`/admin/customers?q=${encodeURIComponent(order.customer.clerkUserId)}`}>
                    {order.customer.name || order.customer.email || 'Customer'}
                  </Link>
                )}
              </dd>
              {!order.guest && (
                <>
                  <dt>User ID</dt>
                  <dd className="mono">{order.customer.clerkUserId}</dd>
                </>
              )}
              <dt>Email</dt>
              <dd><a href={`mailto:${order.email}`}>{order.email}</a></dd>
              <dt>Phone</dt>
              <dd><a href={`tel:+91${order.address.phone}`}>+91 {order.address.phone}</a></dd>
            </dl>
          </Card>

          <Card title="Ship to">
            <address style={{ fontStyle: 'normal', lineHeight: 1.6 }}>
              <strong className="ink">{order.address.fullName}</strong>
              <br />
              {order.address.address}
              {order.address.landmark && (
                <>
                  <br />
                  Near {order.address.landmark}
                </>
              )}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
            </address>
          </Card>
        </div>
      </div>

      <ChangeDialog
        pending={pending}
        order={order}
        restockUnits={restockUnits}
        onClose={() => setPending(null)}
        onDone={(updated, message) => {
          setData(updated)
          setPending(null)
          toast(message)
        }}
      />
    </>
  )
}

function ChangeDialog({ pending, order, restockUnits, onClose, onDone }) {
  const { client } = useAdmin()
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const isStatus = pending?.kind === 'status'

  const close = () => {
    setNote('')
    setReference('')
    setErr(null)
    onClose()
  }

  const submit = async () => {
    setBusy(true)
    setErr(null)
    try {
      const updated = isStatus
        ? await client.setOrderStatus(order.orderNumber, { status: pending.to, note: note || undefined })
        : await client.setPaymentStatus(order.orderNumber, { status: pending.to, reference: reference || undefined, note: note || undefined })
      setNote('')
      setReference('')
      onDone(updated, isStatus ? `Order marked ${titleCase(pending.to).toLowerCase()}` : `Payment marked ${titleCase(pending.to).toLowerCase()}`)
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(false)
    }
  }

  const title = !pending ? '' : isStatus ? STATUS_ACTION[pending.to] || 'Change status' : PAYMENT_ACTION[pending.to] || 'Change payment'
  const danger = pending?.to === 'CANCELLED' || pending?.to === 'FAILED'

  return (
    <Dialog
      open={Boolean(pending)}
      title={`${title} · ${order.orderNumber}`}
      onClose={close}
      footer={
        <>
          <button type="button" className="adm-btn" onClick={close} disabled={busy}>Keep as is</button>
          <button type="button" className={`adm-btn ${danger ? 'adm-btn--danger' : 'adm-btn--primary'}`} onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : title}
          </button>
        </>
      }
    >
      {pending?.to === 'CANCELLED' && (
        <div className="adm-alert adm-alert--warn">
          <CircleX />
          <div>
            Cancelling is final. {restockUnits} {restockUnits === 1 ? 'unit goes' : 'units go'} back into stock.
            {order.payment.status === 'PAID' && ' The customer has paid: remember to refund them and then mark the payment refunded.'}
          </div>
        </div>
      )}
      {pending?.to === 'DELIVERED' && order.payment.method === 'COD' && order.payment.status === 'PENDING' && (
        <div className="adm-alert adm-alert--info">
          <CircleCheck />
          <div>Cash on Delivery: the payment will also be marked paid (cash collected).</div>
        </div>
      )}
      {!isStatus && (
        <Field label="Payment reference (optional)" hint="UTR, transaction or refund id. Letters, digits and . _ : / - only.">
          <input className="adm-input" value={reference} maxLength={80} onChange={(e) => setReference(e.target.value)} />
        </Field>
      )}
      <Field label="Note (optional)" hint="Saved in the order timeline and the audit log.">
        <textarea className="adm-textarea" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={isStatus && pending?.to === 'SHIPPED' ? 'e.g. Bluedart AWB 1234567890' : ''} />
      </Field>
      {err && <div className="adm-alert adm-alert--error">{errorText(err)}</div>}
    </Dialog>
  )
}
