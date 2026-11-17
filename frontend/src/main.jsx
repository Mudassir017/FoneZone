import './lib/theme-init' // light/dark theme before first paint (must stay first)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ThemedClerkProvider from './lib/ThemedClerkProvider'
import App from './App'
import { loadCatalog } from './services/catalog'
import '@fontsource-variable/plus-jakarta-sans' // the UI typeface (self-hosted variable font, 200–800)
import './styles/tailwind.css' // Tailwind + shadcn/ui theme (layered, loaded first so the app's own CSS wins)
import './styles/global.css'
import './styles/compare.css'
import './styles/showcase.css'

// Written to .env.local by `clerk init` (only VITE_-prefixed vars reach the browser).
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Run `npx -y clerk@latest env pull` to restore development keys.')
}

// Fetch the live catalogue (falls back to bundled data), then render.
loadCatalog().finally(() => createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Clerk appearance (light/dark aware, no dev-mode banner) lives in ThemedClerkProvider */}
    <ThemedClerkProvider publishableKey={PUBLISHABLE_KEY} signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/">
      <App />
    </ThemedClerkProvider>
  </StrictMode>,
))
