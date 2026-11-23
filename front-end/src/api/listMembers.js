import { api } from './client'

export function getInviteToListData(cityId, options) {
  return api.get(`/api/cities/${encodeURIComponent(cityId)}/invite-options`, options)
}

export async function getListMembersData(cityId, options) {
  // Resolve the user's joined list because the city route does not contain its ID.
  const data = await getInviteToListData(cityId, options)
  const members = await api.get(`/api/lists/${encodeURIComponent(data.listId)}/members`, options)
  return { ...data, members }
}

export function sendListInvites({ listId, toUserIds }, options) {
  return api.post(`/api/lists/${encodeURIComponent(listId)}/invites`, { toUserIds }, options)
}
