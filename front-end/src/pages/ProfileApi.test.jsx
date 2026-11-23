import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import Profile from './Profile'
import EditProfile from './EditProfile'

const profile = {
  id: 'server-user', name: 'Server User', username: 'server_user', photoUrl: '',
  interests: ['Food'], stats: { placesSaved: 7, cityLists: 1, placesVisited: 2 },
  cities: [{ id: 'server-city', name: 'Server City', placeCount: 7 }],
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })

function openPage(path = '/profile/edit') {
  render(<RouterProvider router={createMemoryRouter([
    { path: '/profile', element: <Profile /> },
    { path: '/profile/edit', element: <EditProfile /> },
  ], { initialEntries: [path] })} />)
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('renders server profile fields and city IDs after retrying a load failure', async () => {
  fetch.mockResolvedValueOnce(json({ error: 'Unavailable' }, 503))
    .mockResolvedValueOnce(json(profile))
  openPage('/profile')
  expect((await screen.findByRole('alert')).textContent).toContain('Unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('heading', { name: 'Server User' })).toBeTruthy()
  expect(screen.getByText('@server_user')).toBeTruthy()
  expect(screen.getByRole('link', { name: /Server City/ }).getAttribute('href')).toBe('/city/server-city')
  expect(fetch.mock.calls.every(([url]) => new URL(url).pathname === '/api/users/me')).toBe(true)
})

it('keeps edits on a username conflict, then reloads the saved profile on success', async () => {
  fetch.mockResolvedValueOnce(json(profile))
    .mockResolvedValueOnce(json({ error: 'That username is taken.' }, 409))
  openPage()
  fireEvent.change(await screen.findByLabelText('Name'), { target: { value: '  Updated User  ' } })
  fireEvent.change(screen.getByRole('textbox', { name: /^Username/ }), { target: { value: '@Updated_User' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  expect((await screen.findByRole('alert')).textContent).toContain('That username is taken.')
  expect(screen.getByLabelText('Name').value).toBe('  Updated User  ')
  const [url, options] = fetch.mock.calls[1]
  expect(new URL(url).pathname).toBe('/api/users/me')
  expect(options.method).toBe('PATCH')
  expect(JSON.parse(options.body)).toEqual({ name: 'Updated User', username: 'updated_user' })
  const updated = { ...profile, name: 'Updated User', username: 'updated_user' }
  fetch.mockResolvedValueOnce(json(updated)).mockResolvedValueOnce(json(updated))
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(await screen.findByRole('heading', { name: 'Updated User' })).toBeTruthy()
  expect(screen.getByText('@updated_user')).toBeTruthy()
})

it('uploads a persistent image data URL instead of the local preview URL', async () => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  fetch.mockResolvedValueOnce(json(profile)).mockResolvedValueOnce(json(profile)).mockResolvedValueOnce(json(profile))
  openPage()
  fireEvent.change(await screen.findByLabelText('Photo'), {
    target: { files: [new File(['image-content'], 'photo.png', { type: 'image/png' })] },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  await screen.findByRole('heading', { name: 'Server User' })
  expect(JSON.parse(fetch.mock.calls[1][1].body).photoUrl).toMatch(/^data:image\/png;base64,/)
  expect(revoke).toHaveBeenCalledWith('blob:preview')
})
