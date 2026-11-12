/**
 * Product-level sticky navigation (like "iPhone 18 Pro · Explore · Buy" on
 * brand sites). Anchors scroll to sections on the product page.
 */
export default function LocalNav({ title, links, buyHref = '#buy' }) {
  return (
    <nav className="localnav" aria-label={`${title} sections`}>
      <div className="container localnav__inner">
        <strong className="localnav__title">{title}</strong>
        <div className="localnav__links">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <a href={buyHref} className="btn btn--primary btn--sm localnav__buy">
          Buy
        </a>
      </div>
    </nav>
  )
}
