const { randomUUID } = require("node:crypto");
const { cities, users, friendships, listInvites } = require("../data/demoData");

function publicUser({ id, name, username, photoUrl }) {
  return { id, name, username, photoUrl };
}

function getListMembers(list) {
  return list.memberIds
    .map((id) => users.find((user) => user.id === id))
    .filter(Boolean)
    .map(publicUser);
}

function getFriends(userId) {
  const friendIds = friendships
    .filter((friendship) => friendship.userIds.includes(userId))
    .flatMap((friendship) => friendship.userIds.filter((id) => id !== userId));
  return users.filter((user) => friendIds.includes(user.id))
    .map(publicUser)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getInviteOptions(list, userId) {
  const city = cities.find((item) => item.id === list.cityId);
  if (!city) return null;

  const pendingIds = new Set(listInvites
    .filter((invite) => invite.listId === list.id && invite.status === "pending")
    .map((invite) => invite.toUserId));

  return {
    status: "ready",
    cityId: city.id,
    cityName: city.name,
    listId: list.id,
    ownerId: list.ownerId,
    currentUserId: userId,
    description: list.description,
    inviteCode: list.inviteCode,
    invitePath: `/join/${list.inviteCode}`,
    members: getListMembers(list),
    friendsToInvite: getFriends(userId)
      .filter((friend) => !list.memberIds.includes(friend.id))
      .map((friend) => ({ ...friend, alreadyInvited: pendingIds.has(friend.id) })),
  };
}

function sendListInvites(list, userId, toUserIds) {
  const recipientIds = [...new Set(toUserIds)];
  const friendIds = new Set(getFriends(userId).map((friend) => friend.id));
  // Validate the whole batch before changing shared in-memory data.
  if (recipientIds.some((id) => !list.memberIds.includes(id) && !friendIds.has(id))) {
    return { ok: false, error: "You can only invite your friends to this list." };
  }

  const pendingIds = new Set(listInvites
    .filter((invite) => invite.listId === list.id && invite.status === "pending")
    .map((invite) => invite.toUserId));
  const created = recipientIds
    .filter((id) => !list.memberIds.includes(id) && !pendingIds.has(id))
    .map((toUserId) => ({
      id: `li_${randomUUID()}`,
      listId: list.id,
      fromUserId: userId,
      toUserId,
      status: "pending",
      createdAt: new Date().toISOString(),
    }));

  listInvites.push(...created);
  return { ok: true, created };
}

module.exports = { getListMembers, getInviteOptions, sendListInvites };
