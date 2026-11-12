import { NavLink, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import NotFound from './NotFound'
import { CONDITIONS } from '../data/conditions'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../utils/checkout'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Placeholder policy copy for the draft – have legal review before launch.
const TOPICS = {
  warranty: {
    title: 'Warranty & condition grading',
    body: (
      <>
        <p>Every phone sold on Namma Mobiles comes with a warranty. Pre-loved phones are inspected, graded and data-wiped before listing.</p>
        <table className="spec-table">
          <thead>
            <tr>
              <th>Condition</th>
              <th>What to expect</th>
              <th>Warranty</th>
            </tr>
          </thead>
          <tbody>
            {CONDITIONS.map((c) => (
              <tr key={c.id}>
                <th>{c.label}</th>
                <td>{c.description}</td>
                <td>{c.warranty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ),
  },
  returns: {
    title: 'Returns & replacement',
    body: (
      <>
        <p>Not happy with your purchase? Request a replacement or refund within 7 days of delivery from <em>My account → Orders</em>.</p>
        <ul>
          <li>The phone must be in the condition it was delivered in, with all box contents.</li>
          <li>Refunds are processed to the original payment method within 5–7 business days.</li>
          <li>Accessories that have been used (e.g. applied screen guards) are not returnable unless defective.</li>
        </ul>
      </>
    ),
  },
  shipping: {
    title: 'Shipping & delivery',
    body: (
      <>
        <p>
          Delivery is free on orders over ₹{FREE_SHIPPING_THRESHOLD}; below that a ₹{SHIPPING_FEE} fee applies. Metro cities usually
          receive orders in 1–2 days; other locations in 3–5 days.
        </p>
        <p>All phones are shipped insured, in tamper-proof packaging. An OTP is required at delivery.</p>
      </>
    ),
  },
}

export default function Help() {
  const { topic } = useParams()
  const page = TOPICS[topic]
  useDocumentTitle(page?.title)
  if (!page) return <NotFound />

  return (
    <div className="container page help">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Help' }, { label: page.title }]} />
      <div className="help__layout">
        <nav className="help__nav">
          {Object.entries(TOPICS).map(([key, t]) => (
            <NavLink key={key} to={`/help/${key}`}>
              {t.title}
            </NavLink>
          ))}
        </nav>
        <article className="card help__body">
          <h1>{page.title}</h1>
          {page.body}
        </article>
      </div>
    </div>
  )
}
