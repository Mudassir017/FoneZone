import { AuthProvider } from './AuthContext'
import { CartProvider } from './CartContext'
import { ShortlistProvider } from './ShortlistContext'
import { ToastProvider } from './ToastContext'

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <ShortlistProvider>{children}</ShortlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
