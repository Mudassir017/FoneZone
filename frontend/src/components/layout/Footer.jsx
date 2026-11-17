import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from '../Icon'
import { BRANDS } from '../../data/brands'
import { useToast } from '../../context/ToastContext'
import { catalogSource } from '../../services/catalog'

export default function Footer() {
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  const subscribe = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Please enter a valid email', { type: 'error' })
    toast('Subscribed! Watch your inbox for launch alerts & deals.')
    setEmail('')
  }

  return (
    <footer className="footer">
      <div className="container footer__newsletter">
        <div>
          <h3>Never miss a launch or price drop</h3>
          <p>Get new phone launches, refurbished restocks and exclusive coupons.</p>
        </div>
        <form onSubmit={subscribe} className="newsletter-form">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
          />
          <button className="btn btn--primary">Subscribe</button>
        </form>
      </div>

      <div className="container footer__grid">
        <div className="footer__about">
          <Logo />
          <p>
            India’s phone-only store. New, certified refurbished, pre-owned and eco-recycled smartphones from every
            major brand, plus the accessories that go with them.
          </p>
          <p className="footer__contact">
            <Icon name="headset" size={16} /> 1800-000-0000 (9am – 9pm)
          </p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/phones?condition=new">New phones</Link>
          <Link to="/phones?condition=refurbished">Certified refurbished</Link>
          <Link to="/phones?condition=used">Pre-owned</Link>
          <Link to="/phones?condition=recycled">Eco recycled</Link>
          <Link to="/accessories">Accessories</Link>
          <Link to="/compare">Compare phones</Link>
        </div>
        <div>
          <h4>Top brands</h4>
          {BRANDS.slice(0, 6).map((b) => (
            <Link key={b.id} to={`/phones?brand=${b.id}`}>
              {b.name}
            </Link>
          ))}
        </div>
        <div>
          <h4>Help</h4>
          <Link to="/sell">Sell / recycle your phone</Link>
          <Link to="/account">Track order</Link>
          <Link to="/help/warranty">Warranty & grading</Link>
          <Link to="/help/returns">Returns & replacement</Link>
          <Link to="/help/shipping">Shipping & delivery</Link>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>© {new Date().getFullYear()} FoneZone. All rights reserved.</span>
          <span>
            Brand names are trademarks of their respective owners. ·{' '}
            {catalogSource() === 'api' ? 'Live catalogue (FoneZone API)' : 'Offline demo catalogue'}
          </span>
        </div>
      </div>
    </footer>
  )
}
