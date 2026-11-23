import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import PlaceDetail from './PlaceDetail'
import { castVote, getPlace, getPlaceVotes } from '../api/places'

// mock the api file so nothing actually hits the network
vi.mock('../api/places', () => ({
    getPlace: vi.fn(),
    getPlaceVotes: vi.fn(),
    castVote: vi.fn(),
}))

const serverPlace = {
    id: 'p_6',
    cityId: 'c_paris',
    cityName: 'Paris',
    name: 'Sacré-Cœur',
    categoryLabel: 'Viewpoint',
    neighborhood: 'Montmartre',
    coordinates: { lat: 48.8867, lng: 2.3431 },
    photoUrl: null,
    sourcePlatform: 'TikTok',
    sourceUrl: 'https://www.tiktok.com/@parisviews/1',
    savedBy: { id: 'u_2', name: 'Samantha Chen' },
    savedPlaceId: 'sp_6',
}

const serverVotes = {
    savedPlaceId: 'sp_6',
    canVote: true,
    myVote: null,
    counts: { 'must-go': 1, down: 1, pass: 0 },
}

function renderPlaceDetail(path = '/place/p_6') {
    const router = createMemoryRouter(
        [{ path: '/place/:placeId', element: <PlaceDetail /> }],
        { initialEntries: [path] },
    )
    render(<RouterProvider router={router} />)
}

beforeEach(() => {
    getPlace.mockResolvedValue(serverPlace)
    getPlaceVotes.mockResolvedValue(serverVotes)
})

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('PlaceDetail', () => {
    it('loads the place and its votes from the server', async () => {
        renderPlaceDetail()

        expect(screen.getByText('Loading place…')).toBeTruthy()
        expect(await screen.findByRole('heading', { name: 'Sacré-Cœur' })).toBeTruthy()
        expect(screen.getByText('Viewpoint · Montmartre · saved by Samantha from TikTok')).toBeTruthy()
        expect(await screen.findByText('Tap a vote to let the group know.')).toBeTruthy()
        expect(getPlace).toHaveBeenCalledWith('p_6', expect.anything())
        expect(getPlaceVotes).toHaveBeenCalledWith('sp_6', expect.anything())
    })

    it('sends a PUT when a chip is tapped and shows the new tally', async () => {
        castVote.mockResolvedValue({ ok: true, ...serverVotes, myVote: 'must-go', counts: { 'must-go': 2, down: 1, pass: 0 } })
        renderPlaceDetail()

        fireEvent.click(await screen.findByRole('button', { name: /Must-go/ }))

        expect(await screen.findByText('Tap another option to change your vote.')).toBeTruthy()
        expect(castVote).toHaveBeenCalledWith('sp_6', 'must-go')
        expect(screen.getByRole('button', { name: /Must-go/ }).getAttribute('aria-pressed')).toBe('true')
        expect(screen.getByRole('button', { name: /Must-go/ }).textContent).toContain('2')
    })

    it("shows the server's error when a vote fails", async () => {
        castVote.mockRejectedValue(new Error('Only list members can vote.'))
        renderPlaceDetail()

        fireEvent.click(await screen.findByRole('button', { name: /Hard pass/ }))

        expect(await screen.findByText('Only list members can vote.')).toBeTruthy()
    })

    it('skips the votes request for a place nobody has saved', async () => {
        getPlace.mockResolvedValue({ ...serverPlace, savedPlaceId: null, savedBy: null, sourceUrl: null })
        renderPlaceDetail()

        expect(await screen.findByRole('heading', { name: 'Sacré-Cœur' })).toBeTruthy()
        expect(getPlaceVotes).not.toHaveBeenCalled()
        expect(screen.queryByRole('group', { name: 'Are you in?' })).toBeNull()
    })

    it('shows Place not found on a 404', async () => {
        getPlace.mockRejectedValue(Object.assign(new Error('Place not found'), { status: 404 }))
        renderPlaceDetail('/place/p_missing')

        expect(await screen.findByRole('heading', { name: 'Place not found' })).toBeTruthy()
    })

    it('shows Try again when the server is down, and retrying loads the place', async () => {
        getPlace
            .mockRejectedValueOnce(Object.assign(new Error("Can't reach the server. Is the back-end running?"), { status: 0 }))
            .mockResolvedValueOnce(serverPlace)
        renderPlaceDetail()

        fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

        expect(await screen.findByRole('heading', { name: 'Sacré-Cœur' })).toBeTruthy()
        expect(getPlace).toHaveBeenCalledTimes(2)
    })
})