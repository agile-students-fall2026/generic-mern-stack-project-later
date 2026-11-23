const { categories, cities, friendships, lists, listInvites, places, savedPlaces, users, visits, votes } = require("../data/demoData");

const toPublicUser = ({ id, name, username, photoUrl }) => ({ id, name, username, photoUrl });
const getCity = (cityId) => cities.find((city) => city.id === cityId) ?? null;
const firstName = (fullName) => fullName.trim().split(/\s+/)[0];

function formatNameList(names) {
    if (names.length <= 1) return names[0] ?? "";
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function findFriendship(userId, otherId) {
    return friendships.find((item) => item.userIds.includes(userId) && item.userIds.includes(otherId));
}

function getSharedLists(userId, otherId) {
    return lists.filter((list) => list.memberIds.includes(userId) && list.memberIds.includes(otherId));
}

/** All friends of `userId`, sorted by display name. */
function getFriendsForUser(userId) {
    return friendships
        .filter((item) => item.userIds.includes(userId))
        .map((item) => users.find((user) => user.id === item.userIds.find((id) => id !== userId)))
        .filter(Boolean)
        .map(toPublicUser)
        .sort((a, b) => a.name.localeCompare(b.name));
}

/** Friends tab (#107). Shape: { id, name, username, photoUrl, sharedCities: string[] } */
function getFriendsWithSharedCities(userId) {
    return getFriendsForUser(userId).map((friend) => ({
        ...friend,
        sharedCities: getSharedLists(userId, friend.id).map((list) => getCity(list.cityId)?.name).filter(Boolean),
    }));
}

/** Case-insensitive, ignores a leading "@", empty query returns everyone. */
function filterFriendsByUsername(friends, query = "") {
    const wanted = query.trim().replace(/^@/, "").toLowerCase();
    if (!wanted) return friends;
    return friends.filter((friend) => friend.username.toLowerCase().includes(wanted));
}

/** Can the viewer find `user` in search? Respects settings.discoverability. */
function canDiscover(user, viewerFriendIds) {
    const setting = user.settings?.discoverability ?? "everyone";
    if (setting === "everyone") return true;
    if (setting === "friends_of_friends") {
        return getFriendsForUser(user.id).some((friend) => viewerFriendIds.has(friend.id));
    }
    return false;
}

/** Search page (#185). Non-friends whose username matches. Empty query returns []. */
function searchNonFriends(userId, query = "") {
    const wanted = query.trim().replace(/^@/, "").toLowerCase();
    if (!wanted) return []; // don't list every user when the box is empty
    const friendIds = new Set(getFriendsForUser(userId).map((friend) => friend.id));
    return users
        .filter((user) => user.id !== userId && !friendIds.has(user.id))
        .filter((user) => canDiscover(user, friendIds))
        .filter((user) => user.username.toLowerCase().includes(wanted))
        .map(toPublicUser)
        .sort((a, b) => a.name.localeCompare(b.name));
}

/** Home "Most saved by friends" (#80). */
function getMostSavedByFriends(userId, limit = 6) {
    const friends = getFriendsForUser(userId);
    const friendIds = new Set(friends.map((friend) => friend.id));
    const myListIds = new Set(lists.filter((list) => list.memberIds.includes(userId)).map((list) => list.id));
    const byPlace = new Map(); // placeId -> { savers: Set, lastSavedAt }
    for (const saved of savedPlaces.filter((item) => friendIds.has(item.savedBy) && myListIds.has(item.listId))) {
        const entry = byPlace.get(saved.placeId) ?? { savers: new Set(), lastSavedAt: "" };
        entry.savers.add(saved.savedBy);
        if (saved.savedAt > entry.lastSavedAt) entry.lastSavedAt = saved.savedAt;
        byPlace.set(saved.placeId, entry);
    }

    return [...byPlace.entries()]
        .flatMap(([placeId, { savers, lastSavedAt }]) => {
            const place = places.find((item) => item.id === placeId);
            if (!place) return [];
            const names = friends.filter((friend) => savers.has(friend.id)).map((friend) => firstName(friend.name));
            return [{
                id: place.id,
                name: place.name,
                categoryId: place.categoryId,
                categoryLabel: categories.find((category) => category.id === place.categoryId)?.label ?? "Other",
                cityName: getCity(place.cityId)?.name ?? "",
                photoUrl: place.photoUrl,
                saveCount: savers.size,
                savedByLabel: savers.size <= 2 ? `Saved by ${formatNameList(names)}` : `Saved by ${savers.size} friends`,
                lastSavedAt,
            }];
        })
        .sort((a, b) => b.saveCount - a.saveCount || b.lastSavedAt.localeCompare(a.lastSavedAt) || a.name.localeCompare(b.name))
        .slice(0, limit);
}

/** Friend's Profile. Returns null for yourself, unknown users, and non-friends (route sends 404). */
function getFriendProfile(viewerId, friendId, recentLimit = 5) {
    if (viewerId === friendId) return null; // findFriendship would wrongly match here
    const friend = users.find((user) => user.id === friendId);
    const friendship = findFriendship(viewerId, friendId);
    if (!friend || !friendship) return null;

    const sharedLists = getSharedLists(viewerId, friendId);
    const sharedListIds = new Set(sharedLists.map((list) => list.id));

    const recentlySaved = savedPlaces
        .filter((saved) => saved.savedBy === friendId && sharedListIds.has(saved.listId))
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        .slice(0, recentLimit)
        .flatMap((saved) => {
            const place = places.find((item) => item.id === saved.placeId);
            if (!place) return [];
            return [{
                savedPlaceId: saved.id,
                placeId: place.id,
                name: place.name,
                cityName: getCity(place.cityId)?.name ?? "",
                sourcePlatform: saved.sourcePlatform,
                thumbnailUrl: saved.thumbnailUrl ?? place.photoUrl,
                myVote: votes.find((vote) => vote.savedPlaceId === saved.id && vote.userId === viewerId)?.value ?? null,
            }];
        });

    const pendingListIds = new Set(
        listInvites
            .filter((invite) => invite.toUserId === friendId && invite.status === "pending")
            .map((invite) => invite.listId),
    );
    const invitableLists = lists
        .filter((list) => list.memberIds.includes(viewerId) && !list.memberIds.includes(friendId))
        .flatMap((list) => {
            const city = getCity(list.cityId);
            return city ? [{ listId: list.id, cityId: city.id, cityName: city.name, alreadyInvited: pendingListIds.has(list.id) }] : [];
        });

    return {
        friend: toPublicUser(friend),
        friendsSince: friendship.since,
        stats: {
            placesSaved: savedPlaces.filter((saved) => saved.savedBy === friendId).length,
            listsShared: sharedLists.length,
            placesVisited: visits.filter((visit) => visit.userId === friendId).length,
        },
        sharedCities: sharedLists.map((list) => getCity(list.cityId)).filter(Boolean).map(({ id, name }) => ({ id, name })),
        recentlySaved,
        invitableLists,
    };
}

module.exports = { getFriendsWithSharedCities, filterFriendsByUsername, getMostSavedByFriends, getFriendProfile, searchNonFriends };