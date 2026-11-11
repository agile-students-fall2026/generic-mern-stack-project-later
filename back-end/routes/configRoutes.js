/**
 * GET /api/config — categories, vote options, source platforms.
 */

const express = require("express");
const { getConfigPayload } = require("../logic/configPayload");

const router = express.Router();

router.get("/config", (req, res) => {
  const payload = getConfigPayload();
  res.json(payload);
});

module.exports = router;
