import { Link, useParams, useSearchParams } from 'react-router'
import CityHeader from '../components/CityHeader'
import RankedCityList from '../components/RankedCityList'
import PlaceMap from '../components/PlaceMap'
import CategoryFilter from '../components/CategoryFilter'
import Button from '../components/Button'
import { LoadingState } from '../components/LoadState'
import { filterPlacesByCategory } from '../components/mapPresentation'
import { getCityList, getCityPlaces } from '../api/cityLists'
import { getConfig } from '../api/config'
import { useApi } from '../hooks/useApi'

export default function CityPage() {
  const { cityId } = useParams()
  const [params, setParams] = useSearchParams()
  const { data, loading, error, retry } = useApi(async (options) => {
    const [city, places, config] = await Promise.all([
      getCityList(cityId, options), getCityPlaces(cityId, options), getConfig(options),
    ])
    return { city, places, categories: config.categories }
  }, [cityId])
  const view = params.get('view') === 'map' ? 'map' : 'list'
  function change(name, value) {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value === 'all') next.delete(name)
      else next.set(name, value)
      return next
    })
  }
  if (loading) return <LoadingState message="Loading city…" />
  if (error) {
    const missing = error.status === 404
    return <section className="px-5 py-8 leading-relaxed text-muted">
      <h1 className="mb-3 text-2xl font-semibold text-ink">{missing ? 'City not found' : 'We couldn’t load this city'}</h1>
      <p role={missing ? undefined : 'alert'}>{missing ? 'This city list is unavailable.' : error.message}</p>
      {!missing && <Button className="mt-5" onClick={retry}>Try again</Button>}
      <Link className="mt-5 block underline" to="/">Back to your lists</Link>
    </section>
  }
  const { city, places, categories } = data
  const category = categories.some(({ id }) => id === params.get('category')) ? params.get('category') : 'all'
  const visible = filterPlacesByCategory(places, category)
  return <section className="text-ink" aria-label={city.name + ' city list'}>
    <CityHeader city={city} view={view} onViewChange={(value) => change('view', value)} />
    <CategoryFilter categories={categories} value={category} onChange={(value) => change('category', value)} />
    <section id="city-view" className="mx-5 my-6 min-w-0" aria-label={view === 'map' ? 'Map view' : 'List view'}>
      {visible.length === 0 && category !== 'all' && <div className="mt-3 rounded-xl bg-subtle p-4 text-sm" role="status">
        <p>No saved places in this category.</p>
        <Button variant="secondary" className="mt-2" onClick={() => change('category', 'all')}>Show all categories</Button>
      </div>}
      {view === 'list'
        ? (visible.length > 0 || category === 'all') && <RankedCityList places={visible} />
        : <PlaceMap places={visible} center={city.coordinates} label={city.name} />}
    </section>
  </section>
}
