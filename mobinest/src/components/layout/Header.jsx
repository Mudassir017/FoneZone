import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'
import Icon from '../Icon'
import SearchBar from './SearchBar'
import Logo from './Logo'
import AnnouncementBar from './AnnouncementBar'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { useCart } from '../../context/CartContext'
import { useShortlist } from '../../context/ShortlistContext'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { to: '/phones', label: 'All Phones' },
  { to: '/phones?condition=new', label: 'New' },
  { to: '/phones?condition=refurbished', label: 'Refurbished' },
  { to: '/phones?condition=used', label: 'Pre-owned' },
  { to: '/phones?condition=recycled', label: 'Eco Recycled' },
  { to: '/brands', label: 'Brands' },
  { to: '/compare', label: 'Compare' },
  { to: '/accessories', label: 'Accessories' },
  { to: '/sell', label: 'Sell / Recycle' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { count } = useCart()
  const { wishlist } = useShortlist()
  const { user } = useAuth()
  const location = useLocation()
  const closeMenu = () => setMenuOpen(false)

  // NavLink can't see query strings, so match "path + search" ourselves.
  const current = location.pathname + location.search
  const isActive = (to) => (to.includes('?') ? current === to : location.pathname === to && !location.search)

  return (
    <header className="header">
      <AnnouncementBar />

      <div className="container header__main">
        <button className="icon-btn header__burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Icon name="menu" />
        </button>
        <Logo />
        <div className="header__search">
          <SearchBar key={location.search} />
        </div>
        <nav className="header__actions" aria-label="Account">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="header__action header__action--btn">
                <Icon name="user" />
                <span className="hide-md">Sign in</span>
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn--primary btn--sm hide-sm">Sign up</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link to="/account" className="header__action">
              <Icon name="box" />
              <span className="hide-md">Orders</span>
            </Link>
          </Show>
          <Link to="/wishlist" className="header__action" aria-label={`Wishlist, ${wishlist.length} items`}>
            <span className="badge-wrap">
              <Icon name="heart" />
              {wishlist.length > 0 && <span className="count-badge">{wishlist.length}</span>}
            </span>
            <span className="hide-md">Wishlist</span>
          </Link>
          <Link to="/cart" className="header__action" aria-label={`Cart, ${count} items`}>
            <span className="badge-wrap">
              <Icon name="cart" />
              {count > 0 && <span className="count-badge">{count}</span>}
            </span>
            <span className="hide-md">Cart</span>
          </Link>
          <AnimatedThemeToggler
            className="icon-btn theme-toggle"
            aria-label="Switch between light and dark mode"
            title="Light / dark mode"
          />
          <Show when="signed-in">
            <span className="header__user">
              <UserButton />
            </span>
          </Show>
        </nav>
      </div>

      <nav className="navbar" aria-label="Main">
        <div className="container navbar__inner">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={() => `navbar__link ${isActive(l.to) ? 'active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Rendered into <body>: the header's backdrop-filter would otherwise make this
          full-screen drawer size itself to the header (it was cut off at ~195px). */}
      {menuOpen && createPortal(
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="drawer__backdrop" onClick={closeMenu} />
          <div className="drawer__panel">
            <div className="drawer__head">
              <Logo />
              <button className="icon-btn" onClick={closeMenu} aria-label="Close menu">
                <Icon name="close" />
              </button>
            </div>
            <SearchBar onNavigate={closeMenu} />
            <nav className="drawer__nav">
              {NAV_LINKS.map((l) => (
                <Link key={l.to} to={l.to} onClick={closeMenu}>
                  {l.label} <Icon name="chevronRight" size={16} />
                </Link>
              ))}
              <Link to="/compare" onClick={closeMenu}>
                Compare phones <Icon name="chevronRight" size={16} />
              </Link>
              {user ? (
                <Link to="/account" onClick={closeMenu}>
                  My account & orders <Icon name="chevronRight" size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/sign-in" onClick={closeMenu}>
                    Sign in <Icon name="chevronRight" size={16} />
                  </Link>
                  <Link to="/sign-up" onClick={closeMenu}>
                    Create account <Icon name="chevronRight" size={16} />
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>,
        document.body,
      )}
    </header>
  )
}
