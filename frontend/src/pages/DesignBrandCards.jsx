// Hidden design preview (not linked from navigation): five options for the home page
// "Pick your favourite" brand cards, side by side with live data, so one can be chosen.
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { BRANDS } from '../data/brands'
import SpotlightBrandCards from '../components/brand-options/SpotlightBrandCards'
import GlowBorderBrandCards from '../components/brand-options/GlowBorderBrandCards'
import TiltBrandCards from '../components/brand-options/TiltBrandCards'
import BentoBrandCards from '../components/brand-options/BentoBrandCards'
import LogoWallBrandCards from '../components/brand-options/LogoWallBrandCards'
import '../styles/brand-options.css'

const OPTIONS = [
  {
    id: 'spotlight',
    title: 'Card Spotlight',
    Component: SpotlightBrandCards,
    description: 'A fine dot texture is revealed in a circle that follows the cursor; a soft halo appears just outside the card.',
  },
  {
    id: 'glow-border',
    title: 'Glowing border',
    Component: GlowBorderBrandCards,
    description: 'A thin arc of the brand’s colours slides along the card border towards the cursor, with a soft outer halo; keyboard focus lights the whole border.',
  },
  {
    id: 'tilt',
    title: '3D tilt card',
    Component: TiltBrandCards,
    description: 'The card leans towards the cursor in 3D and the logo, name and chip lift off it at different depths, the logo the most; soft outer halo.',
  },
  {
    id: 'bento',
    title: 'Bento grid',
    Component: BentoBrandCards,
    description: 'Apple gets the large tile, Samsung and Google Pixel stack beside it, on a faint dot grid; hover adds a soft outer halo and nudges the text.',
  },
  {
    id: 'logo-wall',
    title: 'Logo wall',
    Component: LogoWallBrandCards,
    description: 'Calm tiles with big, bright logos centre stage and a model-count chip; hover adds a soft outer halo and a small lift.',
  },
]

export default function DesignBrandCards() {
  useDocumentTitle('Brand card options')
  const brands = BRANDS

  return (
    <div className="container page bo-page">
      <header className="bo-page__intro">
        <h1 className="page-title">Brand card options</h1>
        <p className="muted">
          Five designs for the home page “Pick your favourite” section, using live brand data. Hover the cards (and
          try the theme toggle) to compare; each option links to the real brand stores.
        </p>
        <nav aria-label="Options" className="bo-page__toc">
          {OPTIONS.map((o, i) => (
            <a key={o.id} href={`#option-${o.id}`}>
              {i + 1}. {o.title}
            </a>
          ))}
        </nav>
      </header>

      {OPTIONS.map(({ id, title, description, Component }, i) => (
        <section key={id} id={`option-${id}`} className="bo-option" aria-labelledby={`option-${id}-title`}>
          <div className="bo-option__head">
            <h2 id={`option-${id}-title`}>
              Option {i + 1}: {title}
            </h2>
            <p>{description}</p>
          </div>

          {/* What the home section would look like (its title is an h3 here only because this page has an h1/h2 above it) */}
          <div className="bo-demo">
            <div className="section-header bo-demo__head">
              <h3>Pick your favourite</h3>
              <Link to="/brands" className="link-arrow">
                All brands <Icon name="chevronRight" size={16} />
              </Link>
            </div>
            <Component brands={brands} titleAs="h4" />
          </div>
        </section>
      ))}
    </div>
  )
}
