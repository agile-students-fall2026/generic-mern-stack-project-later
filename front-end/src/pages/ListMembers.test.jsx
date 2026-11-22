import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import Members from './Members'
import InviteToList from './InviteToList'

const member = { id: 'server_owner', name: 'Server Owner', username: 'owner', photoUrl: '' }
const friend = { id: 'server_friend', name: 'Server Friend', username: 'friend', photoUrl: '', alreadyInvited: false }
const options = {
  status: 'ready', cityId: 'c_paris', cityName: 'Paris', listId: 'server_list',
  currentUserId: member.id, ownerId: member.id, invitePath: '/join/SERVER-CODE',
  members: [member], friendsToInvite: [friend],
}
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })

function renderPage(path = '/city/c_paris/invite') {
  const router = createMemoryRouter([
    { path: '/city/:cityId/members', element: <Members /> },
    { path: '/city/:cityId/invite', element: <InviteToList /> },
    { path: '/', element: <h1>Your lists</h1> },
  ], { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Members API integration', () => {
  it('resolves the list and shows server members, owner and current user', async () => {
    fetch.mockResolvedValueOnce(json({ ...options, members: [] })).mockResolvedValueOnce(json([member]))
    renderPage('/city/c_paris/members')
    expect(screen.getByText('Loading members…')).toBeTruthy()
    expect(await screen.findByText('Server Owner')).toBeTruthy()
    expect(screen.getByText('(you)')).toBeTruthy()
    expect(screen.getByText('Owner')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Invite' }).getAttribute('href')).toBe('/city/c_paris/invite')
    expect(fetch.mock.calls.map(([url]) => new URL(url).pathname)).toEqual([
      '/api/cities/c_paris/invite-options', '/api/lists/server_list/members',
    ])
  })

  it('retries a failed member request and safely handles navigation to a missing list', async () => {
    fetch.mockResolvedValueOnce(json(options)).mockResolvedValueOnce(json({ error: 'Temporarily unavailable' }, 503))
    const router = renderPage('/city/c_paris/members')
    expect((await screen.findByRole('alert')).textContent).toContain('Temporarily unavailable')
    fetch.mockResolvedValueOnce(json(options)).mockResolvedValueOnce(json([member]))
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText('Server Owner')
    fetch.mockResolvedValueOnce(json({ error: 'City list not found' }, 404))
    await act(() => router.navigate('/city/missing/members'))
    expect((await screen.findByRole('alert')).textContent).toContain('City list not found')
    expect(screen.queryByText('Server Owner')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: 'Back to your lists' }))
    expect(await screen.findByRole('heading', { name: 'Your lists' })).toBeTruthy()
  })
})

describe('InviteToList API integration', () => {
  it('sends selected IDs once, waits for the server, then disables the invited friend', async () => {
    let finish
    fetch.mockResolvedValueOnce(json(options)).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    renderPage()
    expect(screen.getByText('Loading invitation options…')).toBeTruthy()
    const checkbox = await screen.findByRole('checkbox', { name: 'Invite Server Friend' })
    const button = screen.getByRole('button', { name: 'Invite friends' })
    expect(button.disabled).toBe(true)
    fireEvent.click(checkbox)
    fireEvent.click(button)
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: 'Sending…' }).disabled).toBe(true)
    expect(checkbox.disabled).toBe(true)
    expect(screen.queryByText('Invited 1 friend.')).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(2)
    const [url, request] = fetch.mock.calls[1]
    expect(new URL(url).pathname).toBe('/api/lists/server_list/invites')
    expect(request.method).toBe('POST')
    expect(JSON.parse(request.body)).toEqual({ toUserIds: [friend.id] })
    await act(() => finish(json({ ok: true, created: [{ id: 'new_invite', toUserId: friend.id }] })))
    expect(await screen.findByText('Invited 1 friend.')).toBeTruthy()
    expect(screen.getByText('Invite already sent')).toBeTruthy()
    expect(checkbox.disabled).toBe(true)
    expect(checkbox.checked).toBe(false)
    expect(button.disabled).toBe(true)
  })

  it('keeps selection after a failed POST and lets the user retry without false success', async () => {
    fetch.mockResolvedValueOnce(json(options)).mockResolvedValueOnce(json({ error: 'Please try again later' }, 503))
    renderPage()
    const checkbox = await screen.findByRole('checkbox', { name: 'Invite Server Friend' })
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByRole('button', { name: 'Invite friends' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Please try again later')
    expect(checkbox.checked).toBe(true)
    expect(checkbox.disabled).toBe(false)
    expect(screen.queryByText('Invite already sent')).toBeNull()
    fetch.mockResolvedValueOnce(json({ ok: true, created: [] }))
    fireEvent.click(screen.getByRole('button', { name: 'Invite friends' }))
    expect(await screen.findByText('These friends are already invited or on the list.')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(checkbox.disabled).toBe(true)
  })

  it('reads pending status from the server and copying a link never sends an invitation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    fetch.mockResolvedValueOnce(json({ ...options, friendsToInvite: [{ ...friend, alreadyInvited: true }] }))
    renderPage()
    expect((await screen.findByRole('checkbox')).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }))
    expect(await screen.findByText('Copied!')).toBeTruthy()
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/join/SERVER-CODE`)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('shows load errors with retry, and supports an empty friend list', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Network error'))
    renderPage()
    expect((await screen.findByRole('alert')).textContent).toContain("Can't reach the server")
    fetch.mockResolvedValueOnce(json({ ...options, friendsToInvite: [] }))
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('All your friends are already on this list.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Invite friends' }).disabled).toBe(true)
  })

  it('handles inaccessible city lists without exposing an invite form', async () => {
    fetch.mockResolvedValueOnce(json({ error: 'City list not found' }, 404))
    renderPage('/city/c_nyc/invite')
    expect((await screen.findByRole('alert')).textContent).toContain('City list not found')
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.getByRole('link', { name: 'Back to your lists' }).getAttribute('href')).toBe('/')
  })

  it('aborts an in-flight submission and resets selections when changing cities', async () => {
    let finish
    fetch.mockResolvedValueOnce(json(options)).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const router = renderPage()
    fireEvent.click(await screen.findByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Invite friends' }))
    const request = fetch.mock.calls[1][1]
    fetch.mockResolvedValueOnce(json({ ...options, cityId: 'c_rome', cityName: 'Rome', listId: 'rome_list' }))
    await act(() => router.navigate('/city/c_rome/invite'))
    await screen.findByRole('heading', { name: "Who's coming to Rome?" })
    expect(request.signal.aborted).toBe(true)
    expect(screen.getByRole('checkbox').checked).toBe(false)
    await act(() => finish(json({ ok: true, created: [{ id: 'old_invite' }] })))
    await waitFor(() => expect(screen.getByRole('checkbox').disabled).toBe(false))
    expect(screen.queryByText('Invited 1 friend.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Invite friends' }).disabled).toBe(true)
  })
})
