import { useNavigate } from 'react-router-dom'
import { useShortlist, MAX_COMPARE } from '../context/ShortlistContext'
import { useToast } from '../context/ToastContext'

/** Wishlist / compare toggles with user feedback toasts. */
export function useShortlistActions() {
  const shortlist = useShortlist()
  const { toast } = useToast()
  const navigate = useNavigate()

  const toggleWishlist = (type, id, name) => {
    const added = shortlist.toggleWishlist(type, id)
    toast(added ? `${name} added to wishlist` : `${name} removed from wishlist`, {
      type: added ? 'success' : 'info',
      action: added ? { label: 'View', onClick: () => navigate('/wishlist') } : undefined,
    })
  }

  const toggleCompare = (id, name) => {
    const result = shortlist.toggleCompare(id)
    if (result === 'full') toast(`You can compare up to ${MAX_COMPARE} phones`, { type: 'error' })
    else if (result === 'added')
      toast(`${name} added to compare`, { action: { label: 'Compare', onClick: () => navigate('/compare') } })
    else toast(`${name} removed from compare`, { type: 'info' })
  }

  return { ...shortlist, toggleWishlist, toggleCompare }
}
