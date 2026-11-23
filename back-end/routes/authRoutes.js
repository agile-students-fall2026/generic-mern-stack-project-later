/**
 * Mock auth routes (no real sessions or security yet).
 *
 * POST /api/auth/signup          { username, email, password } 
 * POST /api/auth/login           { email, password }  (email can also be a username)
 * POST /api/auth/logout
 * POST /api/auth/forgot-password { email }
 * POST /api/auth/reset-password  { newPassword }  (forgot-password flow, no current password)
 */

const express = require("express");
const { signup, login, resetPassword } = require("../logic/auth");

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isFilled(value) {
  return typeof value === "string" && value.trim() !== "";
}

router.post("/auth/signup", (req, res) => {
  const { username, name, email, password } = req.body || {};

  if (!isFilled(username)) {
    return res.status(400).json({ error: "Pick a username." });
  }
  if (!isFilled(email)) {
    return res.status(400).json({ error: "Enter your email." });
  }
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Enter a password." });
  }

  const result = signup({ username, name, email, password });

  if (!result.ok && result.reason === "username_taken") {
    return res.status(409).json({ error: result.error });
  }
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  // The middleware in app.js strips the password from this response.
  res.status(201).json(result.user);
});

router.post("/auth/login", (req, res) => {
  const body = req.body || {};
  const identifier = body.email || body.usernameOrEmail;
  const { password } = body;

  if (!isFilled(identifier)) {
    return res.status(400).json({ error: "Enter your username or email." });
  }
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Enter your password." });
  }

  const result = login({ identifier, password });
  if (!result.ok) {
    return res.status(401).json({ error: "Wrong email or password." });
  }

  res.json(result.user);
});

router.post("/auth/logout", (req, res) => {
  // Nothing to clear until real sessions exist.
  res.json({ ok: true });
});

router.post("/auth/forgot-password", (req, res) => {
  const { email } = req.body || {};

  if (!isFilled(email) || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  // We don't send email, and we don't reveal whether the account exists.
  res.json({ ok: true });
});

router.post("/auth/reset-password", (req, res) => {
  const { newPassword } = req.body || {};

  if (typeof newPassword !== "string" || !newPassword) {
    return res.status(400).json({ error: "Enter a new password." });
  }

  const result = resetPassword({ newPassword });

  if (!result.ok && result.reason === "missing_user") {
    return res.status(404).json({ error: "We could not find your account." });
  }
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ ok: true });
});

module.exports = router;