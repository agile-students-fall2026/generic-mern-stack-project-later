import { Link } from 'react-router'
import { useApi } from '../hooks/useApi.js'
import { getMostSavedByFriends } from '../api/friends.js'
import CategoryTag from './CategoryTag.jsx'
import Button from './Button.jsx'

/**
 * home section (#80): places friends saved most, from GET /api/friends/most-saved.
 * each tile opens that place's detail page.
 * loads its own data so it never blocks the city cards above it.
 */
export default function MostSavedByFriends() {
  const { data, loading, error, retry } = useApi(getMostSavedByFriends)
  const places = data ?? []
  const status = loading ? 'loading' : error ? 'error' : 'ready'

  return (
    <section className="px-4 pb-6 pt-2" aria-labelledby="friends-saved-title">
      <h2 id="friends-saved-title" className="mb-3 text-lg font-semibold">Most saved by friends</h2>

      {status === 'loading' && <p className="text-muted" role="status">Loading…</p>}

      {status === 'error' && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-muted">Couldn&apos;t load what your friends are saving.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {status === 'ready' && places.length === 0 && (
        <p className="text-muted">Nothing yet. When your friends save places, the popular ones show up here.</p>
      )}

      {status === 'ready' && places.length > 0 && (
        <ul className="grid grid-cols-2 gap-3">
          {places.map((place) => (
            <li key={place.id}>
              <Link
                to={`/place/${place.id}`}
                className="flex h-full flex-col rounded-card border border-border bg-surface text-ink no-underline shadow-card hover:border-brand focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <div className="flex flex-1 flex-col items-start gap-2 p-4">
                  <CategoryTag categoryId={place.categoryId} label={place.categoryLabel} />
                  <span className="font-semibold leading-tight">{place.name}</span>
                  <span className="text-xs text-muted">{place.cityName} · {place.savedByLabel}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}