import { useEffect } from 'react'

const BASE = 'Namma Mobiles'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : `${BASE} — Every Phone. Every Brand. One Destination.`
  }, [title])
}
