import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import DuplicateWarning from '../components/DuplicateWarning'
import PlaceConfirmCard from '../components/PlaceConfirmCard'
import BackLink from '../components/BackLink'
import { useApi } from '../hooks/useApi'
import { getPlaceCard, searchPlaces } from '../api/createFlow'
import './SuggestedMatches.css'

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
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)

  const keywords = lookup?.keywords ?? []

  // Pre-select Best Match when the candidate list arrives
  useEffect(() => {
    const rows = candidates ?? []
    const best = rows.find((row) => row.bestMatch)
    setSelectedPlaceId(best?.placeId ?? rows[0]?.placeId ?? null)
  }, [candidates])

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
      <section className="flow-page">
        <p>Start by pasting a link on the Create screen.</p>
        <Link to="/create">Go to Create</Link>
      </section>
    )
  }

  function choosePlace(placeId) {
    setSelectedPlaceId(placeId)
  }

  function confirmChoice() {
    if (!selectedPlaceId || selectedCard.data?.duplicate) return
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
  // While searching, keep the previous results instead of flashing "No matches".
  const listToShow = searchText.trim() ? (search.data ?? []) : (candidates ?? [])

  const selectedName = selectedCard.data?.name
    ?? listToShow.find((row) => row.placeId === selectedPlaceId)?.name
    ?? (candidates ?? []).find((row) => row.placeId === selectedPlaceId)?.name

  return (
    <section className="flow-page">
      <BackLink to="/create" className="mb-6" />

      <h1 className="flow-title">Close. Which one is it?</h1>

      {keywords.length > 0 && (
        <>
          <p className="flow-keywords-intro">
            We couldn&apos;t pin down one place, but here&apos;s what the post mentioned:
          </p>
          <ul className="flow-keywords" aria-label="Words from the post">
            {keywords.map((word) => (
              <li key={word} className="flow-keyword">
                &quot;{word}&quot;
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flow-candidate-list">
        {searchText.trim() && search.error ? (
          <p className="flow-empty" role="alert">
            {search.error.message}{' '}
            <button type="button" onClick={search.retry}>Try again</button>
          </p>
        ) : searching ? (
          <p className="flow-empty">Searching…</p>
        ) : listToShow.length === 0 ? (
          <p className="flow-empty">No matches. Try another search.</p>
        ) : (
          listToShow.map((row) => (
            <PlaceConfirmCard
              key={row.placeId}
              thumbnailUrl={row.photoUrl}
              name={row.name}
              subtitle={row.subtitle}
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
        className="input-field flow-search-input"
        type="search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="None of these, search instead"
      />

      {selectedName && (
        <div className="flow-selected">
          <p>
            Selected: <strong>{selectedName}</strong>
          </p>
          {selectedCard.data?.duplicate && (
            <DuplicateWarning placeName={selectedName} placeId={selectedPlaceId} />
          )}
          {selectedCard.error && (
            <p role="alert">
              {selectedCard.error.message}{' '}
              <button type="button" onClick={selectedCard.retry}>Try again</button>
            </p>
          )}
          <button
            type="button"
            className="flow-primary"
            // Wait until the duplicate check comes back, so we don't save twice
            disabled={Boolean(selectedCard.data?.duplicate) || selectedCard.loading}
            onClick={confirmChoice}
          >
            Use this place
          </button>
        </div>
      )}
    </section>
  )
}
