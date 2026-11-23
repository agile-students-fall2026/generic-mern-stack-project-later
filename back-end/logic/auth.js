/**
 * Mock auth logic. No real security: passwords are plain text in memory.
 * Routes turn each `reason` into an HTTP status code.
 */

const { users, currentUserId } = require("../data/demoData");
const { validateNewPassword, validateUsername } = require("./users");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function nextUserId() {
  const numbers = users.map((user) => Number(user.id.replace("u_", "")) || 0);
  return `u_${Math.max(0, ...numbers) + 1}`;
}

/**
 * { ok: true, user }
 * { ok: false, reason: "invalid" | "email_taken" | "username_taken", error }
 */
function signup({ username, name, email, password }) {
  const cleanUsername = normalize(username);
  const cleanEmail = String(email).trim();

  const usernameProblem = validateUsername(cleanUsername);
  if (usernameProblem) {
    return { ok: false, reason: "invalid", error: usernameProblem };
  }
  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return { ok: false, reason: "invalid", error: "Enter a valid email address." };
  }
  const passwordProblem = validateNewPassword(password);
  if (passwordProblem) {
    return { ok: false, reason: "invalid", error: passwordProblem };
  }

  if (users.some((user) => normalize(user.email) === normalize(cleanEmail))) {
    return { ok: false, reason: "email_taken", error: "That email is already in use." };
  }
  if (users.some((user) => normalize(user.username) === cleanUsername)) {
    return { ok: false, reason: "username_taken", error: "That username is taken." };
  }

  const user = {
    id: nextUserId(),
    name: String(name || "").trim() || cleanUsername,
    username: cleanUsername,
    email: cleanEmail,
    password,
    photoUrl: `https://picsum.photos/seed/${cleanUsername}/200`,
    interests: [],
    settings: {
      notifications: { listInvites: true, votes: true, newPlaces: true, friendRequests: true },
      discoverability: "everyone",
    },
    createdAt: new Date().toISOString().slice(0, 10),
  };

  users.push(user);
  return { ok: true, user };
}

/**
 * Accepts an email OR a username (the Login form has one box for both).
 * { ok: true, user } or { ok: false }
 */
function login({ identifier, password }) {
  const wanted = normalize(identifier);
  const user = users.find(
    (item) => normalize(item.email) === wanted || normalize(item.username) === wanted
  );

  if (!user || user.password !== password) {
    return { ok: false };
  }
  return { ok: true, user };
}

/**
 * Forgot-password flow: the user doesn't know their current password.
 * There's no email token yet, so this resets the demo user.
 *
 * { ok: true }
 * { ok: false, reason: "missing_user" }
 * { ok: false, reason: "invalid", error }
 */
function resetPassword({ newPassword, userId = currentUserId }) {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return { ok: false, reason: "missing_user" };
  }

  const problem = validateNewPassword(newPassword);
  if (problem) {
    return { ok: false, reason: "invalid", error: problem };
  }
  if (newPassword === user.password) {
    return { ok: false, reason: "invalid", error: "Pick a password you haven't used here before." };
  }

  user.password = newPassword;
  return { ok: true };
}

module.exports = { signup, login, resetPassword };