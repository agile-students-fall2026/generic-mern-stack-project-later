import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { getSearchCities, searchPlaces } from '../api/createFlow'
import { useApi } from '../hooks/useApi'
import TextField from '../components/TextField'
import Button from '../components/Button'
import { ErrorState, LoadingState } from '../components/LoadState'

export default function SearchPlace() {
  const location = useLocation()
  const context = location.state
  const sourceUrl = context?.sourceUrl ?? context?.lookup?.url

  if (!sourceUrl) {
    return (
      <section className="px-5 py-8">
        <h1 className="text-2xl font-semibold">Search for a place</h1>
        <p className="mt-3 text-muted">Start by pasting a link on the Create screen.</p>
        <Link to="/create" className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand underline">Go to Create</Link>
      </section>
    )
  }

  return <PlaceSearch key={location.key} context={context} sourceUrl={sourceUrl} />
}

function PlaceSearch({ context, sourceUrl }) {
  const navigate = useNavigate()
  const cities = useApi(getSearchCities)
  const [cityId, setCityId] = useState(context.cityId ?? '')
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const search = useApi(
    (options) => submitted
      ? searchPlaces(submitted.cityId, submitted.query, options)
      : Promise.resolve(null),
    [submitted],
  )
  const selectedCity = cities.data?.find((city) => city.id === cityId)

  function handleSearch(event) {
    event.preventDefault()
    if (!selectedCity || !text.trim()) return
    setSubmitted({ cityId, query: text.trim() })
  }

  function choosePlace(placeId) {
    // An unmatched link has no lookup ID. Preserve its source without inventing one.
    const lookup = context.lookup ?? sourceFromUrl(sourceUrl)
    navigate('/create/identifying', {
      state: { lookup, sourceUrl, placeId, cityId, manualSearch: true },
    })
  }

  return (
    <section className="px-5 py-6 pb-20">
      <Link to="/create" state={{ sourceUrl }} className="inline-flex min-h-11 items-center text-sm font-semibold text-muted underline">
        Edit pasted link
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Search for a place</h1>
      <p className="mt-2 text-sm text-muted">Choose a city and find the place you had in mind. You’ll confirm it before saving.</p>

      {cities.loading ? <LoadingState message="Loading cities…" /> : cities.error ? (
        <ErrorState message={cities.error.message} onRetry={cities.retry} />
      ) : cities.data.length === 0 ? (
        <p role="status" className="mt-6 text-muted">No cities are available to search yet. You can edit your link and try again.</p>
      ) : (
        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">City</span>
            <select
              className="min-h-11 input-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              value={selectedCity ? cityId : ''}
              onChange={(event) => { setCityId(event.target.value); setSubmitted(null) }}
            >
              <option value="">Choose a city</option>
              {cities.data.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.country}</option>)}
            </select>
          </label>
          <TextField
            label="Place name, neighborhood or category"
            type="search"
            value={text}
            onChange={(event) => { setText(event.target.value); setSubmitted(null) }}
            autoComplete="off"
          />
          <Button type="submit" disabled={!selectedCity || !text.trim() || Boolean(submitted && search.loading)}>
            {submitted && search.loading ? 'Searching…' : 'Search places'}
          </Button>
        </form>
      )}

      {submitted && (
        <section aria-label="Search results" className="mt-7">
          {search.loading ? <LoadingState message="Searching places…" /> : search.error ? (
            <ErrorState message={search.error.message} onRetry={search.retry} />
          ) : search.data?.length === 0 ? (
            <p role="status" className="rounded-card bg-subtle p-4 text-sm">No places found for “{submitted.query}” in {selectedCity?.name}. Try another name or city, or edit your pasted link above.</p>
          ) : (
            <>
              <p role="status" className="mb-3 text-sm text-muted">{search.data?.length} {search.data?.length === 1 ? 'place' : 'places'} found in {selectedCity?.name}. Choose one to review.</p>
              <ul className="flex flex-col gap-3">
                {search.data?.map((place) => (
                  <li key={place.placeId}>
                    <Button variant="secondary" className="flex w-full items-center gap-3 text-left" onClick={() => choosePlace(place.placeId)}>
                      <ResultPhoto key={place.photoUrl} photoUrl={place.photoUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{place.name}</span>
                        <span className="mt-1 block text-sm font-normal text-muted">{place.subtitle}</span>
                      </span>
                      <span aria-hidden="true">→</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </section>
  )
}

function sourceFromUrl(url) {
  const source = { url }
  try {
    const hostname = new URL(url).hostname
    if (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) source.platform = 'TikTok'
    if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) source.platform = 'Instagram'
  } catch {
    // Keep the original text so it can be edited; do not invent a lookup ID.
  }
  return source
}

function ResultPhoto({ photoUrl }) {
  const [failed, setFailed] = useState(false)
  return (
    <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-input bg-subtle text-xs font-normal text-muted">
      {photoUrl && !failed
        ? <img src={photoUrl} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
        : 'No photo'}
    </span>
  )
}
