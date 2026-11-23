import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import CityPage from './CityPage'
import MapTab from './MapTab'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const city = { id: 'server-city', name: 'Server City', coordinates: { lat: 48, lng: 2 }, placeCount: 1, members: [] }
const place = { id: 'server-place', savedPlaceId: 'server-save', cityId: city.id, name: 'Server-only place', categoryId: 'new-category', categoryLabel: 'Server category', coordinates: city.coordinates, tally: { 'must-go': 4, down: 1, pass: 0 } }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })
function renderPage(path) {
  const router = createMemoryRouter([
    { path: '/city/:cityId', element: <CityPage /> },
    { path: '/map', element: <MapTab /> },
  ], { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}
function serve(overrides = {}) {
  const fetchMock = vi.fn(async (url, options) => {
    const path = new URL(url).pathname
    if (overrides[path]) return overrides[path](options)
    if (path === '/api/lists') return json([city])
    if (path === '/api/config') return json({ categories: [{ id: 'new-category', label: 'Server category' }] })
    if (path === '/api/cities/server-city') return json(city)
    if (path === '/api/cities/server-city/places') return json([place])
    return json({ error: 'City list not found' }, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

it('shows server-only saved places, vote counts and categories without frontend fixtures', async () => {
  serve()
  renderPage('/city/server-city')
  const card = await screen.findByRole('link', { name: 'View Server-only place' })
  expect(within(card).getByText('Must-go').nextElementSibling.textContent).toBe('4')
  fireEvent.click(screen.getByRole('button', { name: 'Server category', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Map', exact: true }))
  expect(await screen.findByRole('button', { name: 'Server-only place — Server category' })).toBeTruthy()
})

it('does not request a pending city even when it appears in the map URL', async () => {
  const fetchMock = serve()
  renderPage('/map?city=not-joined')
  const select = await screen.findByRole('combobox', { name: 'City' })
  expect(within(select).getAllByRole('option').map((option) => option.value)).toEqual(['all', 'server-city'])
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes('not-joined'))).toBe(false)
})

it('does not display the old city while a different city is loading or after a late response', async () => {
  let finishOld
  let finishNew
  serve({
    '/api/cities/old': () => new Promise((resolve) => { finishOld = () => resolve(json({ ...city, id: 'old', name: 'Old city' })) }),
    '/api/cities/old/places': () => json([]),
    '/api/cities/new': () => new Promise((resolve) => { finishNew = () => resolve(json({ ...city, id: 'new', name: 'New city' })) }),
    '/api/cities/new/places': () => json([]),
  })
  const router = renderPage('/city/old')
  await waitFor(() => expect(finishOld).toBeTypeOf('function'))
  await act(() => router.navigate('/city/new'))
  await waitFor(() => expect(finishNew).toBeTypeOf('function'))
  await act(async () => finishOld())
  expect(screen.queryByRole('heading', { name: 'Old city' })).toBeNull()
  expect(screen.getByRole('status').textContent).toBe('Loading city…')
  await act(async () => finishNew())
  expect(await screen.findByRole('heading', { name: 'New city' })).toBeTruthy()
})

it('retries when config fails instead of silently substituting old local categories', async () => {
  let failed = true
  serve({ '/api/config': () => failed ? json({ error: 'Config unavailable' }, 503) : json({ categories: [] }) })
  renderPage('/city/server-city')
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Config unavailable')
  failed = false
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('heading', { name: 'Server City' })).toBeTruthy()
})

it('reloads places after returning from another route', async () => {
  let places = [place]
  serve({ '/api/cities/server-city/places': () => json(places) })
  const router = renderPage('/city/server-city')
  await screen.findByRole('link', { name: 'View Server-only place' })
  await act(() => router.navigate('/map'))
  await screen.findByRole('combobox', { name: 'City' })
  places = [{ ...place, name: 'Newly saved place', tally: { 'must-go': 7, down: 0, pass: 0 } }]
  await act(() => router.navigate('/city/server-city'))
  const card = await screen.findByRole('link', { name: 'View Newly saved place' })
  expect(within(card).getByText('Must-go').nextElementSibling.textContent).toBe('7')
})
