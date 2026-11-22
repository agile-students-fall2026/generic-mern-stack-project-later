/**
 * Place detail + edit. Back-end copies of getPlaceDetail() and
 * updatePlaceDetails() in front-end/src/data/mockDataLayer.js.
 * Edits change data/demoData.js in memory only.
 */

const { categories, cities, places, savedPlaces, users } = require("../data/demoData");

function toPublicUser(user) {
    if (!user) return null;
    return { id: user.id, name: user.name, username: user.username, photoUrl: user.photoUrl };
}

/** Same shape as getPlaceDetail(), or null if the place doesn't exist. */
function getPlaceDetail(placeId) {
    const place = places.find((item) => item.id === placeId);
    if (!place) return null;

    const city = cities.find((item) => item.id === place.cityId);
    const category = categories.find((item) => item.id === place.categoryId);
    const saved = savedPlaces.find((item) => item.placeId === placeId);

    return {
        id: place.id,
        cityId: place.cityId,
        cityName: city ? city.name : "",
        name: place.name,
        categoryId: place.categoryId,
        categoryLabel: category ? category.label : "Other",
        neighborhood: place.neighborhood,
        coordinates: place.coordinates,
        photoUrl: saved ? saved.thumbnailUrl : place.photoUrl,
        sourcePlatform: saved ? saved.sourcePlatform : null,
        sourceUrl: saved ? saved.sourceUrl : null,
        savedBy: toPublicUser(saved && users.find((user) => user.id === saved.savedBy)),
        savedPlaceId: saved ? saved.id : null,
    };
}

/**
 * { ok: true }
 * { ok: false, reason: "missing_place" | "invalid", error }
 * The route turns missing_place into 404 and invalid into 400.
 */
function updatePlaceDetails(placeId, { name, categoryId, neighborhood } = {}) {
    const place = places.find((item) => item.id === placeId);
    if (!place) {
        return { ok: false, reason: "missing_place", error: "This place no longer exists." };
    }
    if (typeof name !== "string" || name.trim() === "") {
        return { ok: false, reason: "invalid", error: "Give the place a name." };
    }
    if (typeof neighborhood !== "string") {
        return { ok: false, reason: "invalid", error: "The neighborhood has to be text." };
    }
    if (!categories.some((item) => item.id === categoryId)) {
        return { ok: false, reason: "invalid", error: "Pick a category from the list." };
    }

    place.name = name.trim();
    place.categoryId = categoryId;
    place.neighborhood = neighborhood.trim();
    return { ok: true };
}

module.exports = { getPlaceDetail, updatePlaceDetails };