import { api } from './client.js'

// GET /api/friends → [{ id, name, username, photoUrl, sharedCities }]
export function getFriends(options) {
    return api.get('/api/friends', options)
}

// GET /api/friends/most-saved → place cards for the Home section
export function getMostSavedByFriends(options) {
    return api.get('/api/friends/most-saved', options)
}

// GET /api/friends/:id → friend profile, 404 if they aren't your friend
export function getFriend(friendId, options) {
    return api.get(`/api/friends/${encodeURIComponent(friendId)}`, options)
}