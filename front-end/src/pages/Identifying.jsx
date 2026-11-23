import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import DuplicateWarning from '../components/DuplicateWarning'
import PlaceConfirmCard from '../components/PlaceConfirmCard'
import BackLink from '../components/BackLink'
import { LoadingState, ErrorState } from '../components/LoadState'
import { useApi } from '../hooks/useApi'
import { getPlaceCard, savePlace } from '../api/createFlow'
import './Identifying.css'

/**
 * Place Found screen.
 * From Create: { state: { lookup, candidates, cityId } }
 * From Did you mean: { state: { lookup, placeId, candidates, cityId } }
 */
export default function Identifying() {
  const location = useLocation()
  const navigate = useNavigate()
  const lookup = location.state?.lookup
  // Which place we are confirming (from the lookup, or the row picked on Did you mean)
  const placeId = location.state?.placeId ?? lookup?.placeId
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  // useApi has to run before any return. When there is no place yet, skip the request.
  const cardRequest = useApi(
    (options) => {
      if (!placeId) return Promise.resolve(null)
      return getPlaceCard(placeId, lookup?.id, options)
    },
    [placeId, lookup?.id],
  )
  // Opened the URL directly, with no link to work from
  if (!lookup || !placeId) {
    return (
      <section className="flow-page">
        <p>Start by pasting a link on the Create screen.</p>
        <Link to="/create">Go to Create</Link>
      </section>
    )
  }
  if (cardRequest.loading) {
    return (
      <section className="flow-page">
        <BackLink to="/create" className="mb-6" />
        <LoadingState message="Finding this place…" />
      </section>
    )
  }
  if (cardRequest.error) {
    return (
      <section className="flow-page">
        <BackLink to="/create" className="mb-6" />
        <ErrorState message={cardRequest.error.message} onRetry={cardRequest.retry} />
      </section>
    )
  }
  const card = cardRequest.data
  async function handleSave() {
    setSaveError('')
    setSaving(true)
    try {
      // The server only stores platform, url, and thumbnailUrl from lookup.
      const result = await savePlace({ placeId, lookup })
      navigate('/create/success', {
        state: {
          placeId: result.placeId,
          cityId: result.cityId,
          cityName: result.cityName,
          placeName: result.placeName,
        },
      })
    } catch (err) {
      // 409 means it is already on the list. Other failures use the same message spot.
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }
  function handleNotIt() {
    // Same link, but let the user pick another place in this city.
    // candidates came from the lookup response and are passed along again.
    navigate('/create/matches', {
      state: {
        lookup,
        candidates: location.state?.candidates ?? [],
        cityId: card.cityId,
        fromPlaceFound: true,
      },
    })
  }
  return (
    <section className="flow-page">
      <BackLink to="/create" className="mb-6" />
      <p className="flow-eyebrow">Found it</p>
      <h1 className="flow-title">Is this the place?</h1>
      <PlaceConfirmCard
        thumbnailUrl={card.thumbnailUrl}
        name={card.name}
        subtitle={card.neighborhood}
        categoryId={card.categoryId}
        categoryLabel={card.categoryLabel}
        sourceTag={card.sourceTag}
      />
      <p className="flow-info-box">{card.sharingMessage}</p>
      {card.duplicate && (
        <DuplicateWarning placeName={card.name} placeId={card.placeId} />
      )}
      {saveError && (
        <p className="flow-empty" role="alert">{saveError}</p>
      )}
      <button
        type="button"
        className="btn-primary hover:btn-primary-hover"
        disabled={Boolean(card.duplicate) || saving}
        onClick={handleSave}
      >
        {saving ? 'Saving…' : `Save to ${card.cityName}`}
      </button>
      <button type="button" className="flow-link-button" onClick={handleNotIt}>
        Not it? See other matches
      </button>
    </section>
  )
}
