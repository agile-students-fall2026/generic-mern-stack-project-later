import { api } from './client.js'

// GET /api/places/:id
// returns the place detail (same shape getPlaceDetail() had)
export function getPlace(placeId, options) {
    return api.get(`/api/places/${encodeURIComponent(placeId)}`, options)
}

// PATCH /api/places/:id
// fields is { name, categoryId, neighborhood }. Returns the updated place.
export function updatePlace(placeId, fields, options) {
    return api.patch(`/api/places/${encodeURIComponent(placeId)}`, fields, options)
}

// GET /api/saved-places/:id/votes
// returns { savedPlaceId, canVote, myVote, counts }
export function getPlaceVotes(savedPlaceId, options) {
    return api.get(`/api/saved-places/${encodeURIComponent(savedPlaceId)}/votes`, options)
}

// PUT /api/saved-places/:id/vote
// value is 'must-go' | 'down' | 'pass'. Returns { ok, savedPlaceId, canVote, myVote, counts }.
export function castVote(savedPlaceId, value, options) {
    return api.put(`/api/saved-places/${encodeURIComponent(savedPlaceId)}/vote`, { value }, options)
}