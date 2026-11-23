import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import EditPlace from './EditPlace'
import { getConfig } from '../api/config'
import { getPlace, updatePlace } from '../api/places'

// mock the api file so nothing actually hits the network
// for your own page, mock your area's api file the same way
vi.mock('../api/config', () => ({ getConfig: vi.fn() }))
vi.mock('../api/places', () => ({ getPlace: vi.fn(), updatePlace: vi.fn() }))

const serverPlace = {
  id: 'p_1',
  name: 'Top of the Rock',
  categoryId: 'viewpoint',
  neighborhood: 'Midtown',
}

const serverConfig = {
  categories: [
    { id: 'viewpoint', label: 'Viewpoint' },
    { id: 'food', label: 'Food' },
    { id: 'from_server', label: 'Server-only category' },
  ],
}

function renderEditPlace(path = '/place/p_1/edit') {
  const router = createMemoryRouter(
    [
      { path: '/place/:placeId/edit', element: <EditPlace /> },
      { path: '/place/:placeId', element: <h1>Place detail</h1> },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  getPlace.mockResolvedValue(serverPlace)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('EditPlace loading categories from the server', () => {
  it('shows a loading state, then the categories from /api/config', async () => {
    getConfig.mockResolvedValue(serverConfig)
    renderEditPlace()

    expect(screen.getByText('Loading place…')).toBeTruthy()
    // this category only exists in the fake server data, so seeing it means it came from the api
    expect(await screen.findByRole('option', { name: 'Server-only category' })).toBeTruthy()
  })

  it('shows an error with Try again, and retrying loads the form', async () => {
    // fail the first time, work the second time
    getConfig
      .mockRejectedValueOnce(new Error("Can't reach the server. Is the back-end running?"))
      .mockResolvedValueOnce(serverConfig)
    renderEditPlace()

    expect(await screen.findByText("Can't reach the server. Is the back-end running?")).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('option', { name: 'Server-only category' })).toBeTruthy()
    expect(getConfig).toHaveBeenCalledTimes(2)
  })
})

describe('EditPlace saving to the server', () => {
  it('fills the form from GET /api/places/:id', async () => {
    getConfig.mockResolvedValue(serverConfig)
    renderEditPlace()

    expect(await screen.findByDisplayValue('Top of the Rock')).toBeTruthy()
    expect(screen.getByDisplayValue('Midtown')).toBeTruthy()
    expect(getPlace).toHaveBeenCalledWith('p_1', expect.anything())
  })

  it('sends a PATCH and goes back to the place on save', async () => {
    getConfig.mockResolvedValue(serverConfig)
    updatePlace.mockResolvedValue({ ...serverPlace, name: 'Rock' })
    renderEditPlace()

    fireEvent.change(await screen.findByDisplayValue('Top of the Rock'), { target: { value: 'Rock' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('heading', { name: 'Place detail' })).toBeTruthy()
    expect(updatePlace).toHaveBeenCalledWith('p_1', {
      name: 'Rock',
      categoryId: 'viewpoint',
      neighborhood: 'Midtown',
    })
  })

  it("shows the server's error and stays on the form when the save fails", async () => {
    getConfig.mockResolvedValue(serverConfig)
    updatePlace.mockRejectedValue(new Error('Pick a category from the list.'))
    renderEditPlace()

    await screen.findByDisplayValue('Top of the Rock')
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Pick a category from the list.')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy()
  })

  it('shows Place not found when the server says 404', async () => {
    getConfig.mockResolvedValue(serverConfig)
    getPlace.mockRejectedValue(Object.assign(new Error('Place not found'), { status: 404 }))
    renderEditPlace('/place/p_missing/edit')

    expect(await screen.findByRole('heading', { name: 'Place not found' })).toBeTruthy()
  })
})