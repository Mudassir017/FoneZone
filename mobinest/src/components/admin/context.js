import { createContext, useContext } from 'react'

/**
 * What every admin page needs: { client, me, preview, toast }.
 *  - client: the admin API client (real one, or the fake sample-data client in dev preview)
 *  - me: GET /api/admin/me (the signed-in admin)
 *  - toast(message, { type }): small notifications
 */
export const AdminContext = createContext(null)

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside the admin app')
  return ctx
}
