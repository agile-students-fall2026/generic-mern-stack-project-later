const { expect } = require("chai");
const { request } = require("chai-http");
const app = require("../app");
const { users } = require("../data/demoData");

function post(path, body) {
  return request.execute(app).post(path).send(body);
}

describe("auth routes", function () {
  const me = users.find((user) => user.id === "u_1");
  const originalPassword = me.password;
  const originalUserCount = users.length;

  // Undo anything the tests changed in memory so other test files aren't affected
  afterEach(function () {
    me.password = originalPassword;
    users.length = originalUserCount;
  });

  describe("POST /api/auth/signup", function () {
    it("creates a user and does not return the password", async function () {
      const response = await post("/api/auth/signup", {
        username: "Test_Person",
        email: "test.person@example.com",
        password: "testpass123",
      });

      expect(response.status).to.equal(201);
      expect(response.body.username).to.equal("test_person");
      expect(response.body.name).to.equal("test_person");
      expect(response.body.email).to.equal("test.person@example.com");
      expect(response.body).to.not.have.property("password");
      expect(users).to.have.length(originalUserCount + 1);
    });

    it("returns 400 when a field is missing", async function () {
      const noUsername = await post("/api/auth/signup", { email: "a@example.com", password: "testpass123" });
      const noEmail = await post("/api/auth/signup", { username: "newbie", password: "testpass123" });
      const noPassword = await post("/api/auth/signup", { username: "newbie", email: "a@example.com" });

      expect(noUsername.status).to.equal(400);
      expect(noEmail.status).to.equal(400);
      expect(noPassword.status).to.equal(400);
      expect(users).to.have.length(originalUserCount);
    });

    it("returns 400 when the username breaks the rules", async function () {
      const tooShort = await post("/api/auth/signup", {
        username: "ab",
        email: "a@example.com",
        password: "testpass123",
      });
      const badChars = await post("/api/auth/signup", {
        username: "no spaces!",
        email: "a@example.com",
        password: "testpass123",
      });

      expect(tooShort.status).to.equal(400);
      expect(tooShort.body.error).to.equal("Use at least 3 characters.");
      expect(badChars.status).to.equal(400);
      expect(badChars.body.error).to.equal("Use only letters, numbers, and underscores.");
    });

    it("returns 400 when the email is already used", async function () {
      const response = await post("/api/auth/signup", {
        username: "copycat",
        email: "SIYONA@example.com",
        password: "testpass123",
      });

      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equal({ error: "That email is already in use." });
      expect(users).to.have.length(originalUserCount);
    });

    it("returns 400 when the password breaks the rules", async function () {
      const response = await post("/api/auth/signup", {
        username: "weakling",
        email: "weak@example.com",
        password: "abc",
      });

      expect(response.status).to.equal(400);
      expect(response.body.error).to.equal("Use at least 8 characters.");
    });

    it("returns 409 when the username is taken", async function () {
      const response = await post("/api/auth/signup", {
        username: "Siyona",
        email: "other@example.com",
        password: "testpass123",
      });

      expect(response.status).to.equal(409);
      expect(response.body).to.deep.equal({ error: "That username is taken." });
      expect(users).to.have.length(originalUserCount);
    });
  });

  describe("POST /api/auth/login", function () {
    it("returns the user when email and password match", async function () {
      const response = await post("/api/auth/login", {
        email: "siyona@example.com",
        password: "password123",
      });

      expect(response.status).to.equal(200);
      expect(response.body.id).to.equal("u_1");
      expect(response.body).to.not.have.property("password");
    });

    it("also accepts a username in the same box", async function () {
      const response = await post("/api/auth/login", {
        email: "Siyona",
        password: "password123",
      });

      expect(response.status).to.equal(200);
      expect(response.body.id).to.equal("u_1");
    });

    it("returns 401 when the password is wrong", async function () {
      const response = await post("/api/auth/login", {
        email: "siyona@example.com",
        password: "wrong-password",
      });

      expect(response.status).to.equal(401);
      expect(response.body).to.deep.equal({ error: "Wrong email or password." });
    });

    it("returns 401 when the account doesn't exist", async function () {
      const response = await post("/api/auth/login", {
        email: "nobody@example.com",
        password: "password123",
      });

      expect(response.status).to.equal(401);
    });

    it("returns 400 when a field is missing", async function () {
      const response = await post("/api/auth/login", { email: "siyona@example.com" });

      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equal({ error: "Enter your password." });
    });
  });

  describe("POST /api/auth/logout", function () {
    it("returns { ok: true }", async function () {
      const response = await post("/api/auth/logout", {});

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ ok: true });
    });
  });

  describe("POST /api/auth/forgot-password", function () {
    it("returns { ok: true } for any valid email", async function () {
      const known = await post("/api/auth/forgot-password", { email: "siyona@example.com" });
      const unknown = await post("/api/auth/forgot-password", { email: "nobody@example.com" });

      expect(known.status).to.equal(200);
      expect(known.body).to.deep.equal({ ok: true });
      expect(unknown.body).to.deep.equal({ ok: true });
    });

    it("returns 400 when the email is missing or invalid", async function () {
      const missing = await post("/api/auth/forgot-password", {});
      const invalid = await post("/api/auth/forgot-password", { email: "abc" });

      expect(missing.status).to.equal(400);
      expect(invalid.status).to.equal(400);
      expect(invalid.body).to.deep.equal({ error: "Enter a valid email address." });
    });
  });

  describe("POST /api/auth/reset-password", function () {
    it("sets the new password without needing the current one", async function () {
      const response = await post("/api/auth/reset-password", { newPassword: "newpass456" });

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ ok: true });
      expect(me.password).to.equal("newpass456");
    });

    it("returns 400 when the new password is too short", async function () {
      const response = await post("/api/auth/reset-password", { newPassword: "abc1" });

      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equal({ error: "Use at least 8 characters." });
      expect(me.password).to.equal(originalPassword);
    });

    it("returns 400 when the new password has no number", async function () {
      const response = await post("/api/auth/reset-password", { newPassword: "abcdefghij" });

      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equal({ error: "Include at least one number." });
    });

    it("returns 400 when the new password is missing", async function () {
      const response = await post("/api/auth/reset-password", {});

      expect(response.status).to.equal(400);
      expect(response.body).to.deep.equal({ error: "Enter a new password." });
    });

    it("returns 400 when it's the same as the old password", async function () {
      const response = await post("/api/auth/reset-password", { newPassword: "password123" });

      expect(response.status).to.equal(400);
      expect(me.password).to.equal(originalPassword);
    });
  });

  describe("GET /api/users/username-available", function () {
    function check(username) {
      return request.execute(app).get("/api/users/username-available").query({ username });
    }

    it("says a free username is available", async function () {
      const response = await check("brand_new_name");

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ available: true });
    });

    it("says a taken username is not available (ignoring case)", async function () {
      const response = await check("SIYONA");

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ available: false });
    });

    it("returns 400 when the username is missing or invalid", async function () {
      const missing = await request.execute(app).get("/api/users/username-available");
      const invalid = await check("no spaces!");

      expect(missing.status).to.equal(400);
      expect(invalid.status).to.equal(400);
      expect(invalid.body).to.deep.equal({ error: "Use only letters, numbers, and underscores." });
    });
  });
});