import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Identifying from './Identifying'
import SuggestedMatches from './SuggestedMatches'

const card = {
  placeId: 'p_10', name: 'Septime', categoryId: 'food', categoryLabel: 'Food',
  neighborhood: 'Bastille', subtitle: 'Food - Bastille', cityId: 'c_paris', cityName: 'Paris',
  thumbnailUrl: '', duplicate: null, sharingMessage: 'Goes into your Paris list.',
}
const lookup = { id: 'lk_2', placeId: 'p_10', platform: 'Instagram' }

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('uses API card category fields on the confirmation screen without a local place object', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(card))))
  render(<MemoryRouter initialEntries={[{ pathname: '/create/identifying', state: { lookup } }]}>
    <Identifying />
  </MemoryRouter>)
  expect(await screen.findByRole('heading', { name: 'Septime' })).toBeTruthy()
  expect(screen.getByText('Food').className).toContain('bg-peach')
  expect(screen.getByText('Bastille')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Save to Paris' }).disabled).toBe(false)
})

it('shows the category badge and neighborhood supplied with API candidates', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(card))))
  const state = { lookup, cityId: 'c_paris', candidates: [{ ...card, photoUrl: '', bestMatch: true }] }
  render(<MemoryRouter initialEntries={[{ pathname: '/create/matches', state }]}>
    <SuggestedMatches />
  </MemoryRouter>)
  expect(await screen.findByRole('button', { name: /Septime.*Food.*Bastille/ })).toBeTruthy()
  expect(screen.getByText('Food').className).toContain('bg-peach')
})
