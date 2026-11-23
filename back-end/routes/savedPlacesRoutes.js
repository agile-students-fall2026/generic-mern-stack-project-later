/**
 * Body:
 *   { placeId: "p_10" }
 *   { placeId: "p_9", lookup: { platform, url, thumbnailUrl } }
 *
 * placeId is required. lookup is optional.
 */

const express = require("express");
const { getPlaceVotes, castVote } = require("../logic/votes");
const { prepareLookup, savePlaceToList } = require("../logic/savedPlaces");

const router = express.Router();

router.post("/saved-places", (req, res) => {
  const rawPlaceId = req.body && req.body.placeId;
  const placeId = typeof rawPlaceId === "string" ? rawPlaceId.trim() : "";

  if (!placeId) {
    return res.status(400).json({ error: "Send a placeId." });
  }

  const prepared = prepareLookup(req.body.lookup);
  if (!prepared.ok) {
    return res.status(400).json({ error: prepared.error });
  }

  const result = savePlaceToList({
    placeId,
    lookup: prepared.lookup,
  });

  if (!result.ok && result.reason === "missing_place") {
    return res.status(404).json({ error: "Place not found" });
  }

  // The function says reason "duplicate". HTTP 409 means "already taken".
  // duplicate: true is the flag the page can check. The saved list is unchanged.
  if (!result.ok && result.reason === "duplicate") {
    return res.status(409).json({
      ...result,
      duplicate: true,
      error: "This place is already on your list.",
    });
  }

  // 200 and the same object savePlaceToList() returns.
  // listId is an existing list, or the list this request just created.
  res.json(result);
});

/** Tally + my vote: { savedPlaceId, canVote, myVote, counts } */
router.get("/saved-places/:id/votes", (req, res) => {
  const result = getPlaceVotes(req.params.id);
  if (!result) return res.status(404).json({ error: "Saved place not found" });
  res.json(result);
});

/** Body: { value: "must-go" | "down" | "pass" } */
router.put("/saved-places/:id/vote", (req, res) => {
  const value = req.body && req.body.value;
  const result = castVote(req.params.id, value);

  if (!result.ok && result.reason === "invalid_vote") {
    return res.status(400).json({ error: "Vote must be must-go, down, or pass." });
  }
  if (!result.ok && result.reason === "missing_saved_place") {
    return res.status(404).json({ error: "Saved place not found" });
  }
  if (!result.ok && result.reason === "not_member") {
    return res.status(403).json({ error: result.error });
  }

  res.json(result);
});

module.exports = router;
