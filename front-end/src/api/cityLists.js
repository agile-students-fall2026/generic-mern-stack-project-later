import { api } from './client'
export const getMyCityLists = (options) => api.get('/api/lists', options)
export const getCityList = (id, options) => api.get(`/api/cities/${encodeURIComponent(id)}`, options)
export const getCityPlaces = (id, options) => api.get(`/api/cities/${encodeURIComponent(id)}/places`, options)
