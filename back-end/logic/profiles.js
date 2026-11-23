const { categories, currentUserId, savedPlaces, users, visits } = require("../data/demoData");
const { getCityHeader, getUserLists } = require("./cityLists");

function getUserProfile(userId) {
  const user = users.find((item) => item.id === userId);
  if (!user) return null;

  const userLists = getUserLists(userId);

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    photoUrl: user.photoUrl,
    interests: user.interests
      .map((id) => categories.find((category) => category.id === id)?.label)
      .filter(Boolean),
    stats: {
      placesSaved: savedPlaces.filter((saved) => saved.savedBy === userId).length,
      cityLists: userLists.length,
      placesVisited: visits.filter((visit) => visit.userId === userId).length,
    },
    cities: userLists
      .map(getCityHeader)
      .filter(Boolean)
      .map(({ id, name, placeCount }) => ({ id, name, placeCount })),
  };
}

function updateCurrentProfile(changes) {
  const user = users.find((item) => item.id === currentUserId);
  if (!user) return { status: 404, error: "User not found." };

  if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
    return { status: 400, error: "Send a profile object." };
  }

  const { name, username, photoUrl } = changes;

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return { status: 400, error: "Enter a name." };
  }

  if (photoUrl !== undefined && typeof photoUrl !== "string") {
    return { status: 400, error: "Photo URL must be a string." };
  }

  if (username !== undefined) {
    if (typeof username !== "string" || !username.trim()) {
      return { status: 400, error: "Enter a username." };
    }

    const wanted = username.trim().toLowerCase();
    const taken = users.some(
      (other) => other.id !== user.id && other.username.toLowerCase() === wanted
    );
    if (taken) return { status: 409, error: "That username is taken." };
  }

  // Apply changes together after every submitted field has passed validation.
  if (name !== undefined) user.name = name.trim();
  if (username !== undefined) user.username = username.trim();
  if (photoUrl) user.photoUrl = photoUrl;

  return { profile: getUserProfile(user.id) };
}

module.exports = { getUserProfile, updateCurrentProfile };
