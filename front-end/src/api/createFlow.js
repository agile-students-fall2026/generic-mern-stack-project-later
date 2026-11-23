import { api } from './client.js'

// POST /api/links/lookup
// Body is { url }. 
// The JSON is { status: "empty" | "not_found" | "ok", lookup?, candidates?, cityId? }.
export function lookupLink(url, options) {
  return api.post('/api/links/lookup', { url }, options)
}

// GET /api/places/:id/card
// lookupId is optional. It fills in the link photo and the "From TikTok" tag.
// The card also includes duplicate and sharingMessage, so Identifying needs one call.
export function getPlaceCard(placeId, lookupId, options) {
  const query = lookupId ? `?lookupId=${encodeURIComponent(lookupId)}` : ''
  return api.get(`/api/places/${encodeURIComponent(placeId)}/card${query}`, options)
}

// GET /api/cities/:id/search?q=
// Returns an array of { placeId, name, subtitle, photoUrl, bestMatch }.
export function searchPlaces(cityId, query, options) {
  const params = new URLSearchParams({ q: query })
  return api.get(`/api/cities/${encodeURIComponent(cityId)}/search?${params}`, options)
}

// POST /api/saved-places
// body is { placeId, lookup }
// Success is { ok: true, placeId, placeName, cityId, cityName, listId, savedPlaceId }.
export function savePlace(body, options) {
  return api.post('/api/saved-places', body, options)
}
