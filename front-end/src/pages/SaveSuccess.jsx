import { Link, useLocation, Navigate } from 'react-router'

/**
 * Shown right after POST /api/saved-places succeeds.
 * Identifying.jsx puts the server's placeName, cityName, and cityId in router state.
 */
export default function SaveSuccess() {
  const location = useLocation()
  const { cityId, cityName, placeName } = location.state ?? {}

  if (!cityId || !placeName) {
    return <Navigate to="/create" replace />
  }
  return (
    <section className="p-4 pb-20">
      <h1 className="mb-4 text-[1.75rem]">Saved!</h1>
      <p className="mb-6 leading-normal">
        <strong>{placeName}</strong> was added to your {cityName} list. Your group can vote on it
        from the city page.
      </p>
      <Link
        className="btn-primary hover:btn-primary-hover mb-4 block w-full text-center"
        to={`/city/${cityId}`}
      >
        Open {cityName} list
      </Link>
      <Link className="block text-center text-muted underline" to="/create">
        Add another place
      </Link>
    </section>
  )
}
