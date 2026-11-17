import { SignIn, SignUp } from '@clerk/react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Only allow internal redirects (prevents open-redirect via ?redirect=https://evil.example)
const safeRedirect = (r) => (r && r.startsWith('/') && !r.startsWith('//') ? r : '/')

/** Hosts Clerk's prebuilt <SignIn/> or <SignUp/> (routes are /sign-in/* and /sign-up/*). */
export default function AuthPage({ mode = 'sign-in' }) {
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const isSignIn = mode === 'sign-in'
  useDocumentTitle(isSignIn ? 'Sign in' : 'Create account')

  return (
    <div className="container page auth">
      <div className="auth__aside">
        <h1>{isSignIn ? 'Welcome back' : 'Join FoneZone'}</h1>
        <p>Track orders, save your wishlist and get early access to launches and refurbished restocks.</p>
        <ul>
          <li>
            <Icon name="check" size={16} /> Order tracking & easy returns
          </li>
          <li>
            <Icon name="check" size={16} /> Exclusive member coupons
          </li>
          <li>
            <Icon name="check" size={16} /> Faster checkout
          </li>
        </ul>
      </div>

      <div className="auth__clerk">
        {isSignIn ? (
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl={redirect} />
        ) : (
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl={redirect} />
        )}
      </div>
    </div>
  )
}
