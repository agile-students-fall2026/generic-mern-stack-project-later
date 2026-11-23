const express = require("express");
const { currentUserId } = require("../data/demoData");
const {
    getFriendsWithSharedCities,
    filterFriendsByUsername,
    getMostSavedByFriends,
    getFriendProfile,
} = require("../logic/friends");

const router = express.Router();

router.get("/friends", (req, res) => {
    // Express 5 turns ?q=a&q=b into an array, so only accept a plain string
    const q = typeof req.query.q === "string" ? req.query.q : "";
    res.json(filterFriendsByUsername(getFriendsWithSharedCities(currentUserId), q));
});

// Must come before /friends/:id
router.get("/friends/most-saved", (req, res) => {
    res.json(getMostSavedByFriends(currentUserId));
});

router.get("/friends/:id", (req, res) => {
    const profile = getFriendProfile(currentUserId, req.params.id);
    if (!profile) return res.status(404).json({ error: "Friend not found" });
    res.json(profile);
});

module.exports = router;