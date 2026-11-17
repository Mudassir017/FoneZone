import { useEffect, useState } from 'react'
import { ClerkProvider } from '@clerk/react'
import { dark } from '@clerk/themes'

const isDarkNow = () => document.documentElement.classList.contains('dark')

/**
 * ClerkProvider whose sign-in / sign-up / user cards follow the site's light/dark theme
 * (watches <html class="dark">, which the header toggle and theme-init.js set).
 */
export default function ThemedClerkProvider({ children, ...props }) {
  const [isDark, setIsDark] = useState(isDarkNow)

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(isDarkNow()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <ClerkProvider
      {...props}
      appearance={{
        theme: isDark ? dark : undefined,
        variables: {
          colorPrimary: isDark ? '#3d8bff' : '#0b5bd3',
          fontFamily: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, sans-serif",
          borderRadius: '10px',
        },
        // Official Clerk option: hides the "Development mode" banner on the dev instance
        // (it never shows on a production instance anyway).
        options: { unsafe_disableDevelopmentModeWarnings: true },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
