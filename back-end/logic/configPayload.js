/**
 * Builds the JSON body for GET /api/config.
 * Keeps mock data in data/demoData.js (not hard-coded in the route).
 */

const {
  categories,
  VOTE_OPTIONS,
  SOURCE_PLATFORMS,
} = require("../data/demoData");

function getConfigPayload() {
  return {
    categories,
    voteOptions: VOTE_OPTIONS,
    sourcePlatforms: SOURCE_PLATFORMS,
  };
}

module.exports = { getConfigPayload };
