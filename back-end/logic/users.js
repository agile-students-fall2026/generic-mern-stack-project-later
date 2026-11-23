/**
 * Account logic for the signed-in user.
 *
 * Changing a password only edits the users array in memory, so a server
 * restart puts the demo password ("password123") back.
 */

const { users, currentUserId } = require("../data/demoData");

/** Same rules as the front-end password fields. Returns "" when it's fine. */
function validateNewPassword(password) {
  if (!password) return "Enter a new password.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return "";
}

/**
 * Change the current user's password.
 *
 * { ok: true }
 * { ok: false, reason: "missing_user" }
 * { ok: false, reason: "wrong_password" }
 * { ok: false, reason: "invalid", error }
 *
 * The route turns each reason into an HTTP status code.
 */
function changePassword({ currentPassword, newPassword, userId = currentUserId }) {
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return { ok: false, reason: "missing_user" };
  }

  if (user.password !== currentPassword) {
    return { ok: false, reason: "wrong_password" };
  }

  const problem = validateNewPassword(newPassword);
  if (problem) {
    return { ok: false, reason: "invalid", error: problem };
  }

  if (newPassword === currentPassword) {
    return { ok: false, reason: "invalid", error: "Pick a password you haven't used here before." };
  }

  user.password = newPassword;
  return { ok: true };
}

/** Same rules as Signup.jsx. making sure username is valid */
function validateUsername(username) {
  const value = String(username || "").trim().toLowerCase();
  if (!value) return "Pick a username.";
  if (value.length < 3) return "Use at least 3 characters.";
  if (!/^[a-z0-9_]+$/.test(value)) return "Use only letters, numbers, and underscores.";
  return "";
}

/** Case-insensitive check against the mock users. To ensure username is not already taken. */
function isUsernameAvailable(username) {
  const wanted = String(username).trim().toLowerCase();
  return !users.some((user) => user.username.toLowerCase() === wanted);
}

module.exports = { changePassword, validateNewPassword, validateUsername, isUsernameAvailable };

