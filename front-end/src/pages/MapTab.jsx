import { Link, useSearchParams } from 'react-router'
import Button from '../components/Button'
import PlaceMap from '../components/PlaceMap'
import CategoryFilter from '../components/CategoryFilter'
import { LoadingState } from '../components/LoadState'
import { filterPlacesByCategory } from '../components/mapPresentation'
import { getMyCityLists, getCityPlaces } from '../api/cityLists'
import { getConfig } from '../api/config'
import { useApi } from '../hooks/useApi'

export default function MapTab() {
  const [params, setParams] = useSearchParams()
  const { data, loading, error, retry } = useApi(async (options) => {
    const [cities, config] = await Promise.all([getMyCityLists(options), getConfig(options)])
    const places = (await Promise.all(cities.map((city) => getCityPlaces(city.id, options)))).flat()
    return { cities, places, categories: config.categories }
  })
  function change(name, value) {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value === 'all') next.delete(name)
      else next.set(name, value)
      return next
    })
  }
  if (loading) return <LoadingState message="Loading your map…" />
  if (error) return <section className="px-5 py-10 text-center">
    <h1 className="text-2xl">We couldn’t load your cities</h1>
    <p className="mt-2 text-sm text-muted" role="alert">{error.message}</p>
    <Button className="mt-4" onClick={retry}>Try again</Button>
  </section>
  const { cities, categories } = data
  if (cities.length === 0) return <section className="px-5 py-10 text-center">
    <h1 className="text-2xl">No city lists yet</h1>
    <p className="mt-2 text-muted">Save a place or accept an invitation to start your map.</p>
    <p className="mt-4"><Link to="/create" className="font-semibold text-brand">Add a place</Link>
      {' · '}<Link to="/invites" className="font-semibold text-brand">View invitations</Link></p>
  </section>
  // Only server-confirmed membership can make a city selectable.
  const selected = cities.find(({ id }) => id === params.get('city'))
  const category = categories.some(({ id }) => id === params.get('category')) ? params.get('category') : 'all'
  const cityPlaces = selected ? data.places.filter((place) => place.cityId === selected.id) : data.places
  const places = filterPlacesByCategory(cityPlaces, category)
  const query = '?view=list' + (category !== 'all' ? '&category=' + encodeURIComponent(category) : '')
  return <section>
    <header className="px-5 pt-6">
      <h1 className="text-3xl">Your map</h1>
      <p className="mt-2 mb-5 text-sm text-muted">Explore the places saved in your city lists.</p>
      <label className="mb-2 block text-sm font-semibold" htmlFor="map-city">City</label>
      <select className="input-field w-full" id="map-city" value={selected?.id ?? 'all'} onChange={(event) => change('city', event.target.value)}>
        <option value="all">All cities</option>
        {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
      </select>
    </header>
    <CategoryFilter categories={categories} value={category} onChange={(value) => change('category', value)} />
    <div className="m-5">
      <PlaceMap places={places} center={(selected ?? cities[0]).coordinates} label={selected?.name ?? 'All your cities'} />
      {selected && <Link className="inline-flex min-h-11 items-center font-semibold text-brand-dark" to={'/city/' + encodeURIComponent(selected.id) + query}>Open {selected.name} list →</Link>}
      {category !== 'all' && places.length === 0 && <Button variant="secondary" onClick={() => change('category', 'all')}>Show all categories</Button>}
    </div>
  </section>
}
