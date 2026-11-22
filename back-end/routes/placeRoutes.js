/**
 * GET   /api/places/:id   -> getPlaceDetail()
 * PATCH /api/places/:id   -> updatePlaceDetails()
 *       body { name, categoryId, neighborhood }
 */

const express = require("express");
const { getPlaceDetail, updatePlaceDetails } = require("../logic/places");

const router = express.Router();

router.get("/places/:id", (req, res) => {
    const place = getPlaceDetail(req.params.id);
    if (!place) return res.status(404).json({ error: "Place not found" });
    res.json(place);
});

router.patch("/places/:id", (req, res) => {
    const result = updatePlaceDetails(req.params.id, req.body || {});

    if (!result.ok && result.reason === "missing_place") {
        return res.status(404).json({ error: "Place not found" });
    }
    if (!result.ok) {
        return res.status(400).json({ error: result.error });
    }

    // Send the updated place back so the page doesn't need a second GET
    res.json(getPlaceDetail(req.params.id));
});

module.exports = router;