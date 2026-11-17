import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, Search, TriangleAlert, X } from 'lucide-react'
import { PAYMENT_TONE, STATUS_TONE, count, errorText, titleCase } from './format'

export function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div className="adm-page-head">
      <div>
        {back && (
          <Link className="adm-back" to={back.to}>
            <ChevronLeft size={15} /> {back.label}
          </Link>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="adm-page-head__actions">{actions}</div>}
    </div>
  )
}

export function Card({ title, action, children, className = '', bodyClass = 'adm-card__body', flush = false }) {
  return (
    <section className={`adm-card ${className}`}>
      {(title || action) && (
        <header className="adm-card__head">
          {typeof title === 'string' ? <h2>{title}</h2> : title}
          {action}
        </header>
      )}
      {flush ? children : <div className={bodyClass}>{children}</div>}
    </section>
  )
}

export function Badge({ tone = 'grey', children, plain = false, title }) {
  return (
    <span className={`adm-badge adm-badge--${tone}${plain ? ' adm-badge--plain' : ''}`} title={title}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] || 'grey'}>{titleCase(status)}</Badge>
}

export function PaymentBadge({ status }) {
  return <Badge tone={PAYMENT_TONE[status] || 'grey'}>{titleCase(status)}</Badge>
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="adm-loading" role="status">
      <span className="adm-spin" />
      <span className="small">{label}</span>
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="adm-alert adm-alert--error" role="alert">
      <TriangleAlert />
      <div className="spacer">{errorText(error)}</div>
      {onRetry && (
        <button type="button" className="adm-btn adm-btn--sm" onClick={onRetry}>
          <RefreshCw /> Retry
        </button>
      )}
    </div>
  )
}

export function Switch({ checked, onChange, disabled, label, title }) {
  return (
    <label className="adm-switch" title={title}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-switch__track" aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  )
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="adm-search">
      <Search />
      <input className="adm-input" type="search" value={value} placeholder={placeholder} aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

/** Column header that toggles sort=field,asc|desc. */
export function SortHeader({ field, label, sort, onSort, className }) {
  const [current, dir] = (sort || '').split(',')
  const active = current === field
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  const next = active && dir === 'desc' ? `${field},asc` : `${field},desc`
  return (
    <th className={className} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={`adm-sort${active ? ' is-active' : ''}`} onClick={() => onSort(next)}>
        {label} <Icon />
      </button>
    </th>
  )
}

export function Pager({ page, onPage, size, onSize }) {
  if (!page) return null
  const { page: n, totalPages, totalElements, content } = page
  const from = totalElements === 0 ? 0 : n * page.size + 1
  const to = n * page.size + content.length
  return (
    <div className="adm-pager">
      <span>
        {count(from)}–{count(to)} of {count(totalElements)}
      </span>
      <span className="spacer" />
      {onSize && (
        <label className="row small">
          Rows
          <select className="adm-select" value={size} onChange={(e) => onSize(Number(e.target.value))}>
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      )}
      <button type="button" className="adm-btn adm-btn--sm" disabled={n <= 0} onClick={() => onPage(n - 1)} aria-label="Previous page">
        <ChevronLeft />
      </button>
      <span className="num">
        Page {n + 1} of {Math.max(totalPages, 1)}
      </span>
      <button type="button" className="adm-btn adm-btn--sm" disabled={n + 1 >= totalPages} onClick={() => onPage(n + 1)} aria-label="Next page">
        <ChevronRight />
      </button>
    </div>
  )
}

export function EmptyRow({ colSpan, children = 'Nothing matches these filters.' }) {
  return (
    <tr>
      <td className="adm-table__empty" colSpan={colSpan}>{children}</td>
    </tr>
  )
}

export function KpiCard({ icon: Icon, label, value, sub, alert = false }) {
  return (
    <div className={`adm-card adm-kpi${alert ? ' adm-kpi--alert' : ''}`}>
      <span className="adm-kpi__label">
        {Icon && <Icon />} {label}
      </span>
      <span className="adm-kpi__value">{value}</span>
      {sub && <span className="adm-kpi__sub">{sub}</span>}
    </div>
  )
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {children}
      {error ? <span className="err">{error}</span> : hint ? <small>{hint}</small> : null}
    </label>
  )
}

/** Modal built on the native <dialog> element (focus trap, Esc to close, backdrop). */
export function Dialog({ open, title, onClose, children, footer }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className="adm-dialog" onClose={onClose} onCancel={onClose} aria-label={title}>
      {open && (
        <>
          <div className="adm-dialog__head">
            <h2>{title}</h2>
            <span className="spacer" />
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--icon" onClick={onClose} aria-label="Close">
              <X />
            </button>
          </div>
          <div className="adm-dialog__body">{children}</div>
          {footer && <div className="adm-dialog__foot">{footer}</div>}
        </>
      )}
    </dialog>
  )
}
