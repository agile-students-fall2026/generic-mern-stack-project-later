import { Link } from 'react-router'

/**
 * Shown when the place is already on the user's city list.
 * Links to Place Detail using placeId (matches App route /place/:placeId).
 */
export default function DuplicateWarning({ placeName, placeId }) {
  return (
    <p className="mb-4 border border-warning-border bg-warning p-3 text-sm" role="status">
      {placeName} is already on this list.{' '}
      <Link to={`/place/${placeId}`}>View existing place</Link>
    </p>
  )
}
