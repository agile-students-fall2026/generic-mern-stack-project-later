import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Home from './Home'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('accepts the server invitation and reloads the joined city list', async () => {
  let joined = false
  const json = (data) => new Response(JSON.stringify(data))
  const serverFetch = vi.fn(async (url, options) => {
    const path = new URL(url).pathname
    if (path === '/api/lists') return json(joined
      ? [{ id: 'server-city', name: 'New City', placeCount: 3, members: [] }] : [])
    if (path === '/api/invites') return json([{
      id: 'server-invite', cityId: 'server-city', cityName: 'New City', sender: null,
    }])
    if (path === '/api/friends/most-saved') return json([])
    if (path === '/api/invites/server-invite/respond') {
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({ response: 'accept' })
      joined = true
      return json({ ok: true, cityId: 'server-city' })
    }
    throw new Error(`Unexpected path: ${path}`)
  })
  vi.stubGlobal('fetch', serverFetch)
  render(<MemoryRouter><Home /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Join the New City list' }))
  expect(await screen.findByRole('heading', { name: 'New City' })).toBeTruthy()
  expect(screen.getByRole('link', { name: /New City/ }).getAttribute('href')).toBe('/city/server-city')
  expect(screen.queryByRole('button', { name: 'Join the New City list' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Invitations' })).toBeTruthy()
  expect(serverFetch.mock.calls.filter(([url]) => new URL(url).pathname === '/api/lists')).toHaveLength(2)
})
