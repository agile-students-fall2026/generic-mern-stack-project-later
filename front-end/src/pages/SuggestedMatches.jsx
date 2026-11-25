import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import DuplicateWarning from '../components/DuplicateWarning'
import PlaceConfirmCard from '../components/PlaceConfirmCard'
import BackLink from '../components/BackLink'
import { useApi } from '../hooks/useApi'
import { getPlaceCard, searchPlaces } from '../api/createFlow'
import Button from '../components/Button'


/**
 * Did you mean?
 * From Create, when lookup.status is "ambiguous":
 *   { state: { lookup, candidates, cityId } }
 * candidates and cityId are the extra fields on POST /api/links/lookup.
 * From Place Found ("Not it"): the same state, with this place's cityId.
 */
export default function SuggestedMatches() {
  const location = useLocation()
  const navigate = useNavigate()
  const lookup = location.state?.lookup
  const cityId = location.state?.cityId
  // Already shaped for the cards: { placeId, name, subtitle, photoUrl, bestMatch }
  const candidates = location.state?.candidates

  const [searchText, setSearchText] = useState('')
  const [selection, setSelection] = useState(null)
  const selectedPlaceId = selection && selection.candidates === candidates
    ? selection.placeId
    : candidates?.find((row) => row.bestMatch)?.placeId ?? candidates?.[0]?.placeId ?? null

  const keywords = lookup?.keywords ?? []

  // Empty box: do not search. The candidate list stays on screen.
  const search = useApi(
    (options) => {
      if (!cityId || !searchText.trim()) return Promise.resolve(null)
      return searchPlaces(cityId, searchText, options)
    },
    [cityId, searchText],
  )

  // The card call is how we know whether the selected place is already saved.
  const selectedCard = useApi(
    (options) => {
      if (!selectedPlaceId) return Promise.resolve(null)
      return getPlaceCard(selectedPlaceId, lookup?.id, options)
    },
    [selectedPlaceId, lookup?.id],
  )

  if (!lookup || !cityId) {
    return (
      <section className="p-4 pb-20">
        <p>Start by pasting a link on the Create screen.</p>
        <Link to="/create">Go to Create</Link>
      </section>
    )
  }

  function choosePlace(placeId) {
    setSelection({ candidates, placeId })
  }

  function confirmChoice() {
    if (!selectedPlaceId || !selectedCard.data || selectedCard.error || selectedCard.data.duplicate) return
    navigate('/create/identifying', {
      state: {
        lookup,
        placeId: selectedPlaceId,
        candidates: candidates ?? [],
        cityId,
      },
    })
  }

  const searching = Boolean(searchText.trim()) && search.loading
  // The loading branch keeps a new search from flashing "No matches".
  const listToShow = searchText.trim() ? (search.data ?? []) : (candidates ?? [])

  const selectedName = selectedCard.data?.name
    ?? listToShow.find((row) => row.placeId === selectedPlaceId)?.name
    ?? (candidates ?? []).find((row) => row.placeId === selectedPlaceId)?.name

  return (
    <section className="p-4 pb-20">
      <BackLink to="/create" className="mb-6" />

      <h1 className="mb-4 text-2xl font-bold">Close. Which one is it?</h1>

      {keywords.length > 0 && (
        <>
          <p className="mb-3 text-sm leading-[1.4] text-muted">
            We couldn&apos;t pin down one place, but here&apos;s what the post mentioned:
          </p>
          <ul className="mb-4 flex flex-wrap gap-2" aria-label="Words from the post">
            {keywords.map((word) => (
              <li key={word} className="rounded-input bg-subtle px-2.5 py-1.5 text-sm">
                &quot;{word}&quot;
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mb-4 flex flex-col gap-2">
        {searchText.trim() && search.error ? (
          <p className="text-sm text-error" role="alert">
            {search.error.message}{' '}
            <Button variant="link" onClick={search.retry}>Try again</Button>
          </p>
        ) : searching ? (
          <p className="text-sm text-muted">Searching…</p>
        ) : listToShow.length === 0 ? (
          <p className="text-sm text-muted">No matches. Try another search.</p>
        ) : (
          listToShow.map((row) => (
            <PlaceConfirmCard
              key={row.placeId}
              thumbnailUrl={row.photoUrl}
              name={row.name}
              subtitle={row.neighborhood}
              categoryId={row.categoryId}
              categoryLabel={row.categoryLabel}
              bestMatch={row.bestMatch}
              isSelected={row.placeId === selectedPlaceId}
              selectable
              onSelect={() => choosePlace(row.placeId)}
            />
          ))
        )}
      </div>

      <input
        id="place-search"
        className="input-field mb-4"
        type="search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="None of these, search instead"
      />

      <Link
        to="/create/search"
        state={{ lookup, cityId, sourceUrl: lookup.url }}
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline"
      >
        None of these? Search manually
      </Link>

      {selectedName && (
        <div className="border-t border-border pt-4">
          <p>
            Selected: <strong>{selectedName}</strong>
          </p>
          {selectedCard.data?.duplicate && (
            <DuplicateWarning placeName={selectedName} placeId={selectedPlaceId} />
          )}
          {selectedCard.error && (
            <p className="text-sm text-error" role="alert">
              {selectedCard.error.message}{' '}
              <Button variant="link" onClick={selectedCard.retry}>Try again</Button>
            </p>
          )}
          <Button
            className="mb-3 w-full"
            // Wait until the duplicate check comes back, so we don't save twice
            disabled={!selectedCard.data || Boolean(selectedCard.data.duplicate) || Boolean(selectedCard.error) || selectedCard.loading}
            onClick={confirmChoice}
            >
            Use this place
          </Button>
        </div>
      )}
    </section>
  )
}
