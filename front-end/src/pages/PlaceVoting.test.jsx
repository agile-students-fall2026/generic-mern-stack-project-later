import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import PlaceDetail from './PlaceDetail'
import CityPage from './CityPage'
import { votes } from '../data/demoData'

const originalVotes = structuredClone(votes)
beforeEach(() => votes.splice(0, votes.length, ...structuredClone(originalVotes)))
afterEach(() => {
  cleanup()
  votes.splice(0, votes.length, ...structuredClone(originalVotes))
})

function openPlace(id) {
  const router = createMemoryRouter([
    { path: '/place/:placeId', element: <PlaceDetail /> },
    { path: '/city/:cityId', element: <CityPage /> },
  ], { initialEntries: [`/place/${id}`] })
  render(<RouterProvider router={router} />)
}

it('changes an existing vote, updates the chips, and shows the new ranking on return', async () => {
  openPlace('p_6')
  expect(screen.getByRole('button', { name: /Must-go/ }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: /Hard pass/ }))
  expect(screen.getByRole('button', { name: /Hard pass/ }).getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByRole('button', { name: /Must-go/ }).textContent).toContain('1')
  expect(votes.filter(v => v.savedPlaceId === 'sp_6' && v.userId === 'u_1')).toHaveLength(1)
  fireEvent.click(screen.getByRole('link', { name: 'Back to Paris' }))
  const list = await screen.findByRole('list', { name: 'Places ranked by must-go votes' })
  expect(within(list).getAllByRole('listitem').map(row => within(row).getByRole('heading').textContent))
    .toEqual(['Merci', 'Sacré-Cœur', 'Du Pain et des Idées'])
  fireEvent.click(screen.getByRole('link', { name: 'View Sacré-Cœur' }))
  expect(await screen.findByRole('button', { name: /Hard pass/ })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Hard pass/ }).getAttribute('aria-pressed')).toBe('true')
})

it('disables voting for a nonmember and for an unsaved place', () => {
  openPlace('p_2')
  expect(screen.getByRole('button', { name: /Must-go/ }).disabled).toBe(true)
  expect(screen.getByText('Join this city list to vote.')).toBeTruthy()
  cleanup()
  openPlace('p_9')
  expect(screen.getByRole('button', { name: /Must-go/ }).disabled).toBe(true)
  expect(screen.getByText('Save this place to a list before voting.')).toBeTruthy()
  expect(votes).toEqual(originalVotes)
})
