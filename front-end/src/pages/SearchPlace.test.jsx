import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import Create from './Create'
import SearchPlace from './SearchPlace'
import Identifying from './Identifying'
import SuggestedMatches from './SuggestedMatches'
import SaveSuccess from './SaveSuccess'

const sourceUrl = 'https://www.tiktok.com/@travel/video/unmatched'
const cities = [{ id: 'city_server', name: 'Server City', country: 'Test Country' }, { id: 'city_other', name: 'Other City', country: 'Test Country' }]
const result = { placeId: 'place_server', name: 'Server Cafe', subtitle: 'Food - Riverside', categoryId: 'food', categoryLabel: 'Food', neighborhood: 'Riverside', photoUrl: '' }
const card = { ...result, cityId: 'city_server', cityName: 'Server City', duplicate: null, sharingMessage: 'Goes into your Server City list.' }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })

function renderFlow(path = '/create/search', state = { sourceUrl }) {
  const router = createMemoryRouter([
    { path: '/create', element: <Create /> },
    { path: '/create/search', element: <SearchPlace /> },
    { path: '/create/identifying', element: <Identifying /> },
    { path: '/create/matches', element: <SuggestedMatches /> },
    { path: '/create/success', element: <SaveSuccess /> },
  ], { initialEntries: [{ pathname: path, state }] })
  render(<RouterProvider router={router} />)
  return router
}

function searchFor(text = 'Cafe', cityId = 'city_server') {
  fireEvent.change(screen.getByRole('combobox', { name: 'City' }), { target: { value: cityId } })
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Search places' }))
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const path = new URL(url).pathname
    if (path === '/api/cities') return json(cities)
    if (path.endsWith('/search')) return json([result])
    if (path.endsWith('/card')) return json(card)
    if (path === '/api/links/lookup') return json({ status: 'not_found' })
    if (path === '/api/saved-places') return json({ ok: true, placeId: result.placeId, placeName: result.name, cityId: card.cityId, cityName: card.cityName })
    throw new Error(`Unexpected request: ${path}`)
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Manual place search', () => {
  it('offers a safe return to Create for a direct visit with no link context', () => {
    renderFlow('/create/search', null)
    expect(screen.getByText('Start by pasting a link on the Create screen.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Go to Create' }).getAttribute('href')).toBe('/create')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('takes an unknown link through search, explicit confirmation, and saving with its source', async () => {
    renderFlow('/create', null)
    fireEvent.change(screen.getByPlaceholderText('link…'), { target: { value: sourceUrl } })
    fireEvent.click(screen.getByRole('button', { name: 'Find the place' }))
    fireEvent.click(await screen.findByRole('link', { name: 'Search manually' }))
    await screen.findByRole('option', { name: 'Server City, Test Country' })
    expect(screen.getByRole('combobox').value).toBe('')
    searchFor('Cafe & tea')
    const resultButton = await screen.findByRole('button', { name: /Server Cafe/ })
    expect(screen.getByText('Food').className).toContain('bg-peach')
    expect(screen.getByText('Riverside')).toBeTruthy()
    fireEvent.click(resultButton)
    await screen.findByRole('heading', { name: 'Is this the place?' })
    expect(screen.getByText('Food').className).toContain('bg-peach')
    expect(screen.getByText('Riverside')).toBeTruthy()
    expect(fetch.mock.calls.some(([url]) => url.endsWith('/api/saved-places'))).toBe(false)
    const searchCall = fetch.mock.calls.find(([url]) => url.includes('/search?'))
    expect(new URL(searchCall[0]).pathname).toBe('/api/cities/city_server/search')
    expect(new URL(searchCall[0]).searchParams.get('q')).toBe('Cafe & tea')
    fireEvent.click(screen.getByRole('button', { name: 'Save to Server City' }))
    expect(await screen.findByRole('heading', { name: 'Saved!' })).toBeTruthy()
    const saveCall = fetch.mock.calls.find(([url]) => url.endsWith('/api/saved-places'))
    expect(JSON.parse(saveCall[1].body)).toEqual({ placeId: result.placeId, lookup: { url: sourceUrl, platform: 'TikTok' } })
    expect(fetch.mock.calls.find(([url]) => url.includes('/card'))[0]).not.toContain('lookupId=')
  })

  it('preserves a known failed lookup and keeps the pasted link when editing after no results', async () => {
    const lookup = { id: 'known_link', url: sourceUrl, platform: 'TikTok', status: 'not_found' }
    fetch.mockResolvedValueOnce(json({ status: 'ok', lookup, candidates: [], cityId: null }))
    renderFlow('/create', { sourceUrl })
    fireEvent.click(screen.getByRole('button', { name: 'Find the place' }))
    fireEvent.click(await screen.findByRole('link', { name: 'Search manually' }))
    await screen.findByRole('combobox')
    fetch.mockResolvedValueOnce(json([]))
    searchFor('Nothing here')
    expect(await screen.findByText(/No places found for/)).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: 'Edit pasted link' }))
    expect(screen.getByPlaceholderText('link…').value).toBe(sourceUrl)
    expect(screen.queryByRole('link', { name: 'Search manually' })).toBeNull()
  })

  it('retries city-list and search failures without losing entered criteria', async () => {
    fetch.mockRejectedValueOnce(new TypeError('offline'))
    renderFlow()
    expect((await screen.findByRole('alert')).textContent).toContain("Can't reach the server")
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByRole('combobox')
    fetch.mockResolvedValueOnce(json({ error: 'Search unavailable' }, 503))
    searchFor()
    expect((await screen.findByRole('alert')).textContent).toContain('Search unavailable')
    expect(screen.getByRole('searchbox').value).toBe('Cafe')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: /Server Cafe/ })).toBeTruthy()
  })

  it('does not show stale results when the user changes cities during a request', async () => {
    renderFlow()
    await screen.findByRole('combobox')
    let finishOld
    fetch.mockImplementationOnce(() => new Promise((resolve) => { finishOld = resolve }))
    searchFor('Old')
    const oldRequest = fetch.mock.calls.at(-1)[1]
    expect(screen.getByText('Searching places…')).toBeTruthy()
    fetch.mockResolvedValueOnce(json([{ ...result, placeId: 'other', name: 'Other Cafe' }]))
    searchFor('Other', 'city_other')
    expect(await screen.findByRole('button', { name: /Other Cafe/ })).toBeTruthy()
    expect(oldRequest.signal.aborted).toBe(true)
    await act(() => finishOld(json([{ ...result, name: 'Old Cafe' }])))
    expect(screen.queryByRole('button', { name: /Old Cafe/ })).toBeNull()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    expect(screen.queryByRole('button', { name: /Other Cafe/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Search places' }).disabled).toBe(true)
  })

  it('allows manual search from suggested matches and leaves duplicate checking to confirmation', async () => {
    const lookup = { id: 'known_link', url: sourceUrl, platform: 'TikTok', status: 'ambiguous' }
    renderFlow('/create/matches', { lookup, cityId: 'city_server', candidates: [] })
    fireEvent.click(screen.getByRole('link', { name: 'None of these? Search manually' }))
    await screen.findByRole('combobox')
    expect(screen.getByRole('combobox').value).toBe('city_server')
    searchFor()
    await screen.findByRole('button', { name: /Server Cafe/ })
    fetch.mockResolvedValueOnce(json({ ...card, duplicate: { id: 'already_saved' } }))
    fireEvent.click(screen.getByRole('button', { name: /Server Cafe/ }))
    await screen.findByText(/Server Cafe is already on this list/)
    expect(screen.getByRole('button', { name: 'Save to Server City' }).disabled).toBe(true)
    expect(fetch.mock.calls.at(-1)[0]).toContain('lookupId=known_link')
    fireEvent.click(screen.getByRole('button', { name: 'Not it? See other matches' }))
    expect(await screen.findByRole('heading', { name: 'Search for a place' })).toBeTruthy()
  })

  it('shows fallbacks for missing photos and does not search blank text', async () => {
    renderFlow()
    await screen.findByRole('combobox')
    searchFor('   ')
    expect(fetch).toHaveBeenCalledTimes(1)
    searchFor()
    await screen.findByRole('button', { name: /Server Cafe/ })
    expect(screen.getByText('No photo')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Broken photo' } })
    fetch.mockResolvedValueOnce(json([{ ...result, photoUrl: '/missing-image.jpg' }]))
    fireEvent.click(screen.getByRole('button', { name: 'Search places' }))
    const row = await screen.findByRole('button', { name: /Server Cafe/ })
    fireEvent.error(row.querySelector('img'))
    expect(screen.getByText('No photo')).toBeTruthy()
  })

  it('does not show success after a failed save and keeps confirmation available', async () => {
    renderFlow()
    await screen.findByRole('combobox')
    searchFor()
    fireEvent.click(await screen.findByRole('button', { name: /Server Cafe/ }))
    await screen.findByRole('button', { name: 'Save to Server City' })
    fetch.mockResolvedValueOnce(json({ error: 'Could not save this place' }, 503))
    fireEvent.click(screen.getByRole('button', { name: 'Save to Server City' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Could not save this place')
    expect(screen.queryByRole('heading', { name: 'Saved!' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Save to Server City' }).disabled).toBe(false)
  })

  it('can return to search if a selected place is no longer available', async () => {
    renderFlow()
    await screen.findByRole('combobox')
    searchFor()
    await screen.findByRole('button', { name: /Server Cafe/ })
    fetch.mockResolvedValueOnce(json({ error: 'Place not found' }, 404))
    fireEvent.click(screen.getByRole('button', { name: /Server Cafe/ }))
    expect((await screen.findByRole('alert')).textContent).toContain('Place not found')
    expect(screen.queryByRole('button', { name: 'Save to Server City' })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: 'Search for another place' }))
    expect(await screen.findByRole('heading', { name: 'Search for a place' })).toBeTruthy()
  })
})
