import { Link } from 'react-router'
import { getMyCityLists } from '../api/cityLists'
import Button from '../components/Button'
import { useApi } from '../hooks/useApi.js'
import { useInvitations } from '../hooks/useInvitations.js'
import CityListCard from '../components/CityListCard.jsx'
import MostSavedByFriends from '../components/MostSavedByFriends.jsx'
import InviteBanner from '../components/InviteBanner.jsx'

export default function Home() {
  const { data: cities, loading, error, retry } = useApi(getMyCityLists)
  const invitations = useInvitations()
  const invites = invitations.invites

  async function handleJoin(invite) {
    const result = await invitations.answer(invite.id, 'accept')
    if (result) retry()
  }

  if (loading) return <p className="px-5 py-10 text-muted" role="status">Loading your lists…</p>

  if (error) {
    return (
      <div className="px-5 py-10">
        <p role="alert">{error.message}</p>
        <Button className="mt-4" onClick={retry}>Try again</Button>
      </div>
    )
  }

  return (
    <section>
      <header className="flex items-center justify-between px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-ink">Later?</h1>
        <Link
          to="/invites"
          className="relative inline-flex size-11 items-center justify-center rounded-full border border-border text-ink"
          aria-label={invites.length > 0 ? `Invitations, ${invites.length} new` : 'Invitations'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {/* dot only when something is waiting */}
          {invites.length > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand" aria-hidden="true" />}
        </Link>
      </header>

      {invitations.error && (
        <div className="mx-4 mb-4 rounded-card bg-peach px-4 py-3 text-sm">
          <p role="alert">{invitations.error}</p>
          <Button variant="secondary" onClick={invitations.retry}>Try again</Button>
        </div>
      )}

      {/* show the first pending invite; the rest live in the inbox */}
      {invites.length > 0 && (
        <fieldset className="m-0 min-w-0 border-0 p-0" disabled={invitations.busy}>
          <InviteBanner invite={invites[0]} onJoin={handleJoin} />
        </fieldset>
      )}
      {invites.length > 1 && (
        <Link to="/invites" className="mx-4 -mt-2 mb-4 block text-sm font-semibold text-brand">See all {invites.length} invites</Link>
      )}

      {/* empty state for new users who aren't on any lists yet */}
      {cities.length === 0 ? (
        <p className="px-5 py-6 text-muted">No lists yet. <Link className="font-semibold text-brand" to="/create">Paste a link</Link> to save your first place.</p>
      ) : (
        cities.map((city) => <CityListCard key={city.id} city={city} />)
      )}
      <MostSavedByFriends />
    </section>
  )
}
