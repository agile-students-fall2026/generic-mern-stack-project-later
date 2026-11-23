const express = require("express");
const { currentUserId } = require("../data/demoData");
const { getUserLists } = require("../logic/cityLists");
const { getListMembers, getInviteOptions, sendListInvites } = require("../logic/listMembers");

const router = express.Router();

router.param("listId", (req, res, next, listId) => {
  const list = getUserLists(currentUserId).find((item) => item.id === listId);
  if (!list) return res.status(404).json({ error: "List not found" });
  res.locals.list = list;
  next();
});

router.get("/lists/:listId/members", (req, res) => {
  res.json(getListMembers(res.locals.list));
});

router.get("/cities/:cityId/invite-options", (req, res) => {
  const list = getUserLists(currentUserId).find((item) => item.cityId === req.params.cityId);
  const data = list && getInviteOptions(list, currentUserId);
  if (!data) return res.status(404).json({ error: "City list not found" });
  res.json(data);
});

router.post("/lists/:listId/invites", (req, res) => {
  const toUserIds = req.body?.toUserIds;
  if (!Array.isArray(toUserIds) || toUserIds.length === 0 ||
      toUserIds.some((id) => typeof id !== "string" || !id.trim())) {
    return res.status(400).json({ error: "Choose at least one friend to invite." });
  }

  const result = sendListInvites(res.locals.list, currentUserId, toUserIds);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json(result);
});

module.exports = router;
