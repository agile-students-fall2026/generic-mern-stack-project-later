import { api } from './client.js'

// POST /api/auth/login   ("Username or email" is sent as `email`)
export function login(usernameOrEmail, password) {
  return api.post('/api/auth/login', { email: usernameOrEmail, password })
}

// POST /api/auth/signup
export function signup({ username, email, password }) {
  return api.post('/api/auth/signup', { username, email, password })
}

// POST /api/auth/logout
export function logout() {
  return api.post('/api/auth/logout', {})
}

// POST /api/auth/forgot-password
export function forgotPassword(email) {
  return api.post('/api/auth/forgot-password', { email })
}

// POST /api/auth/reset-password   (forgot-password flow, no current password)
export function resetPassword(newPassword) {
  return api.post('/api/auth/reset-password', { newPassword })
}

// GET /api/users/username-available?username=xyz
export function checkUsernameAvailable(username, options) {
  return api.get(`/api/users/username-available?username=${encodeURIComponent(username)}`, options)
}