import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import FriendProfile from './FriendProfile'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('waits for the invite API, shows a failure honestly, and retains success after a fresh load', async () => {
  let invited = false
  let fail = true
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status })
  const server = vi.fn(async (url, options) => {
    const path = new URL(url).pathname
    if (path === '/api/config') return json({ voteOptions: [] })
    if (path === '/api/friends/u_3') return json({
      friend: { id: 'u_3', name: 'John Logan', username: 'john', photoUrl: null },
      friendsSince: '2025-01-01', stats: { placesSaved: 0, listsShared: 0, placesVisited: 0 },
      sharedCities: [], recentlySaved: [], invitableLists: [{ listId: 'server-list', cityName: 'Paris', alreadyInvited: invited }],
    })
    if (path === '/api/lists/server-list/invites') {
      expect(options.method).toBe('POST')
      expect(JSON.parse(options.body)).toEqual({ toUserIds: ['u_3'] })
      if (fail) return json({ error: 'Could not send invitation' }, 503)
      invited = true
      return json({ ok: true })
    }
    throw new Error('Unexpected route: ' + path)
  })
  vi.stubGlobal('fetch', server)
  const mount = () => render(<RouterProvider router={createMemoryRouter([
    { path: '/friends/:userId', element: <FriendProfile /> },
  ], { initialEntries: ['/friends/u_3'] })} />)
  mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Invite to list' }))
  fireEvent.click(screen.getByRole('button', { name: 'Invite John to Paris' }))
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Could not send invitation')
  expect(screen.queryByRole('status')).toBeNull()
  fail = false
  fireEvent.click(screen.getByRole('button', { name: 'Invite John to Paris' }))
  expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Invited John to Paris.')
  cleanup()
  mount()
  expect((await screen.findByRole('button', { name: 'Invite to list' })).disabled).toBe(true)
})
