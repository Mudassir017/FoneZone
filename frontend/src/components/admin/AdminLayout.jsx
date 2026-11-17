import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import {
  Boxes, CreditCard, Headphones, History, LayoutDashboard, Menu, ShoppingBag, Smartphone, Store, Tags,
  TicketPercent, Users,
} from 'lucide-react'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { useAdmin } from './context'
import '../../styles/brand.css'

const NAV = [
  { group: null, items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    group: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { to: '/admin/payments', label: 'Transactions', icon: CreditCard },
      { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
    ],
  },
  {
    group: 'Catalogue',
    items: [
      { to: '/admin/catalog/brands', label: 'Brands', icon: Tags },
      { to: '/admin/catalog/phones', label: 'Phones', icon: Smartphone },
      { to: '/admin/catalog/skus', label: 'SKUs & stock', icon: Boxes },
      { to: '/admin/catalog/accessories', label: 'Accessories', icon: Headphones },
    ],
  },
  {
    group: 'People',
    items: [
      { to: '/admin/customers', label: 'Customers & admins', icon: Users },
      { to: '/admin/audit', label: 'Audit log', icon: History },
    ],
  },
]

const TITLES = [
  ['/admin/orders/', 'Order'],
  ['/admin/orders', 'Orders'],
  ['/admin/payments', 'Transactions'],
  ['/admin/coupons', 'Coupons'],
  ['/admin/catalog/brands', 'Brands'],
  ['/admin/catalog/phones', 'Phones'],
  ['/admin/catalog/skus', 'SKUs & stock'],
  ['/admin/catalog/accessories', 'Accessories'],
  ['/admin/customers', 'Customers & admins'],
  ['/admin/audit', 'Audit log'],
]

/** Back-office shell: sidebar navigation + top bar (no store header/footer). */
export default function AdminLayout({ children }) {
  const { pathname } = useLocation()
  const { me, preview } = useAdmin()
  const [open, setOpen] = useState(false)
  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] || 'Dashboard'

  return (
    <div className="adm tw">
      <aside className={`adm-sidebar${open ? ' is-open' : ''}`} aria-label="Admin navigation">
<div className="adm-sidebar__brand">
          <Link to="/admin" className="logo site-logo" aria-label="FoneZone admin home" onClick={() => setOpen(false)}>
            <span className="site-logo__text" aria-hidden="true">
              <span className="site-logo__name" style={{fontSize: '14px', fontWeight: 700}}>FoneZone</span>
            </span>
          </Link>
          <span className="adm-sidebar__tag">Admin</span>
        </div>
        <nav className="adm-nav">
          {NAV.map((section) => (
            <div key={section.group || 'main'} className={section.group ? 'adm-nav__group' : ''}>
              {section.group && <div className="adm-nav__label">{section.group}</div>}
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
                  <Icon /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-sidebar__foot">
          Signed in as <strong className="ink">{me?.email || me?.name || 'admin'}</strong>
          {me?.bootstrapAdmin && <div>Admin via server config</div>}
        </div>
      </aside>
      {open && <button type="button" className="adm-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <div className="adm-main">
        {preview && <div className="adm-preview-banner">Dev preview with fake sample data (not connected to the API)</div>}
        <header className="adm-topbar">
          <button type="button" className="adm-btn adm-btn--icon adm-menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <span className="adm-topbar__title">{title}</span>
          <span className="spacer" />
          <Link to="/" className="adm-btn adm-btn--ghost">
            <Store /> <span>View store</span>
          </Link>
          <AnimatedThemeToggler className="theme-toggle" aria-label="Switch between light and dark mode" title="Light / dark mode" />
          {!preview && <UserButton />}
        </header>
        <main className="adm-content" id="main">
          {children}
        </main>
      </div>
    </div>
  )
}
