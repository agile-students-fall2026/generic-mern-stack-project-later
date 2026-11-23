import { useState } from 'react'
import Avatar from '../components/Avatar'
import { useApi } from '../hooks/useApi'
import { LoadingState, ErrorState } from '../components/LoadState'
import { getFriends } from '../api/friends'
import { searchUsers } from '../api/users'
import { Link } from 'react-router'

// "Paris" / "Paris, New York" / "No shared lists yet"
function sharedCitiesLabel(cities) {
  return cities.length > 0 ? cities.join(', ') : 'No shared lists yet'
}

export default function Friends() {
  // Load all friends once, then filter locally so typing doesn't hit the server
  const { data, loading, error, retry } = useApi(getFriends)
  const friends = data ?? []
  const [query, setQuery] = useState('')

  // Same rule as the back-end: ignore case and a leading @
  const wanted = query.trim().replace(/^@/, '').toLowerCase()
  const visibleFriends = friends.filter((friend) => friend.username.toLowerCase().includes(wanted))
  const isSearching = wanted !== ''

  // Non-friends come from the server, re-fetched whenever the query changes
  const people = useApi(
    (options) => (wanted ? searchUsers(wanted, options) : Promise.resolve([])),
    [wanted],
  )

  return (
    <section className="flex flex-col gap-6 p-4">
      <h1 className="text-3xl">Friends</h1>

      <label className="flex flex-col gap-1.5">
        <span className="sr-only">Find by @username</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find by @username"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="min-h-11 input-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
      </label>

      <section aria-labelledby="your-friends-heading" className="flex flex-col gap-2">
        <h2 id="your-friends-heading" className="text-lg">Your friends</h2>

        {loading ? (
          <LoadingState message="Loading friends…" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={retry} />
        ) : friends.length === 0 ? (
          <p className="text-sm text-muted">You haven't added any friends yet.</p>
        ) : visibleFriends.length === 0 ? (
          // role="status" so screen readers hear that the search found nothing
          <p role="status" className="text-sm text-muted">
            No friends match "@{query.trim().replace(/^@/, '')}".
          </p>
        ) : (
          <ul aria-label="Your friends" className="divide-y divide-border">
            {visibleFriends.map((friend) => (
              <li key={friend.id}>
                <Link to={`/friends/${friend.id}`} className="-mx-2 flex items-center gap-3 rounded-input px-2 py-3 hover:bg-subtle focus-visible:outline-3 focus-visible:outline-brand">
                  <Avatar user={friend} size="md" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{friend.name}</span>
                    <span className="truncate text-sm text-muted">
                      @{friend.username} · {sharedCitiesLabel(friend.sharedCities)}
                    </span>
                  </div>
                  <span aria-hidden="true" className="text-muted">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {isSearching && visibleFriends.length > 0 && (
          <p role="status" className="sr-only">
            {visibleFriends.length} friend{visibleFriends.length === 1 ? '' : 's'} found
          </p>
        )}
      </section>

      {isSearching && (
        <section aria-labelledby="other-people-heading" className="flex flex-col gap-2">
          <h2 id="other-people-heading" className="text-lg">Other people</h2>

          {people.loading ? (
            <LoadingState message="Searching…" />
          ) : people.error ? (
            <ErrorState message={people.error.message} onRetry={people.retry} />
          ) : people.data.length === 0 ? (
            <p role="status" className="text-sm text-muted">
              No one else matches "@{query.trim().replace(/^@/, '')}".
            </p>
          ) : (
            <ul aria-label="Other people" className="divide-y divide-border">
              {people.data.map((person) => (
                <li key={person.id} className="flex items-center gap-3 py-3">
                  <Avatar user={person} size="md" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{person.name}</span>
                    <span className="truncate text-sm text-muted">@{person.username}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  )
}