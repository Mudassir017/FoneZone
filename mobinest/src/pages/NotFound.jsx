import EmptyState from '../components/EmptyState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound({ message = 'The page you’re looking for doesn’t exist or has moved.' }) {
  useDocumentTitle('Page not found')
  return (
    <div className="container page">
      <EmptyState icon="search" title="Page not found" message={message} actionLabel="Browse phones" actionTo="/phones" headingLevel={1} />
    </div>
  )
}
