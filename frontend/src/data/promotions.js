// Offers shown in the scrolling strip at the very top of every page (AnnouncementBar).
// Edit, add or remove entries here; the strip loops them forever.
//   icon:      any name from components/Icon.jsx
//   to:        optional internal link (the offer becomes clickable)
//   highlight: true = shown in the festive accent colour
// Later these can come from the API so they can be changed without a redeploy.
export const PROMOTIONS = [
  { id: 'hdfc', icon: 'card', text: 'Get 25% instant discount with HDFC Bank credit cards*' },
  { id: 'warranty', icon: 'shield', text: 'Up to 12 months warranty on refurbished phones', to: '/phones?condition=refurbished' },
  { id: 'delivery', icon: 'truck', text: 'Free delivery on orders above ₹499' },
  { id: 'emi', icon: 'zap', text: 'No-cost EMI on select cards' },
  { id: 'replacement', icon: 'refresh', text: '7-day replacement on every order' },
  { id: 'exchange', icon: 'recycle', text: 'Exchange your old phone for instant value', to: '/sell' },
]
