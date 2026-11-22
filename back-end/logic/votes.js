/**
 * Voting. Back-end copies of getPlaceVotes() and castVote() in
 * front-end/src/data/mockDataLayer.js. One vote per person per place.
 */

const { lists, savedPlaces, votes, currentUserId, VOTE_OPTIONS } = require("../data/demoData");

const VOTE_VALUES = VOTE_OPTIONS.map((option) => option.value);

/** { savedPlaceId, canVote, myVote, counts } or null if the saved place / list is gone. */
function getPlaceVotes(savedPlaceId, userId = currentUserId) {
    const saved = savedPlaces.find((item) => item.id === savedPlaceId);
    const list = saved && lists.find((item) => item.id === saved.listId);
    if (!saved || !list) return null;

    // Only list members' votes count (same rule as the ranked city list)
    const counts = { "must-go": 0, down: 0, pass: 0 };
    votes
        .filter((vote) => vote.savedPlaceId === savedPlaceId && list.memberIds.includes(vote.userId))
        .forEach((vote) => {
            if (Object.hasOwn(counts, vote.value)) counts[vote.value] += 1;
        });

    const canVote = list.memberIds.includes(userId);
    const mine = canVote
        ? votes.find((vote) => vote.savedPlaceId === savedPlaceId && vote.userId === userId)
        : null;

    return { savedPlaceId, canVote, myVote: mine ? mine.value : null, counts };
}

/**
 * { ok: true, ...getPlaceVotes() }
 * { ok: false, reason: "invalid_vote" | "missing_saved_place" | "not_member", error }
 */
function castVote(savedPlaceId, value, userId = currentUserId) {
    if (!VOTE_VALUES.includes(value)) {
        return { ok: false, reason: "invalid_vote", error: "Unknown vote." };
    }

    const current = getPlaceVotes(savedPlaceId, userId);
    if (!current) {
        return { ok: false, reason: "missing_saved_place", error: "This place is no longer on the list." };
    }
    if (!current.canVote) {
        return { ok: false, reason: "not_member", error: "Only list members can vote." };
    }

    const existing = votes.find((vote) => vote.savedPlaceId === savedPlaceId && vote.userId === userId);
    if (existing) {
        existing.value = value;
    } else {
        votes.push({ id: `v_${Date.now()}`, savedPlaceId, userId, value });
    }

    return { ok: true, ...getPlaceVotes(savedPlaceId, userId) };
}

module.exports = { VOTE_VALUES, getPlaceVotes, castVote };