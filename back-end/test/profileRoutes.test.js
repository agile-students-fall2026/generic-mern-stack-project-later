const { expect } = require("chai");
const { request } = require("chai-http");
const app = require("../app");
const {
  categories, cities, currentUserId, lists, savedPlaces, users, visits,
} = require("../data/demoData");

const get = (path) => request.execute(app).get(path);
const patchMe = (body) => request.execute(app).patch("/api/users/me").send(body);

describe("Profile routes", function () {
  const me = users.find((user) => user.id === currentUserId);
  const other = users.find((user) => user.id !== currentUserId);
  let original;

  beforeEach(function () {
    original = { ...me };
  });

  afterEach(function () {
    Object.assign(me, original);
  });

  it("GET /me returns the demo user's profile, interest labels, stats, and cities", async function () {
    const response = await get("/api/users/me");
    const myLists = lists.filter((list) => list.memberIds.includes(me.id));

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
      id: "u_1",
      name: me.name,
      username: me.username,
      photoUrl: me.photoUrl,
      interests: me.interests
        .map((id) => categories.find((category) => category.id === id)?.label)
        .filter(Boolean),
      stats: {
        placesSaved: savedPlaces.filter((saved) => saved.savedBy === me.id).length,
        cityLists: myLists.length,
        placesVisited: visits.filter((visit) => visit.userId === me.id).length,
      },
      cities: myLists.map((list) => ({
        id: list.cityId,
        name: cities.find((city) => city.id === list.cityId).name,
        placeCount: savedPlaces.filter((saved) => saved.listId === list.id).length,
      })),
    });
  });

  it("GET /:id returns the requested user's public profile", async function () {
    const response = await get(`/api/users/${other.id}`);
    expect(response.status).to.equal(200);
    expect(response.body).to.have.all.keys(
      "id", "name", "username", "photoUrl", "interests", "stats", "cities"
    );
    expect(response.body).to.include({ id: other.id, username: other.username });
  });

  it("GET /:id returns 404 for an unknown user", async function () {
    expect((await get("/api/users/no-such-user")).status).to.equal(404);
  });

  it("PATCH /me updates all three fields and returns the saved profile", async function () {
    const photoUrl = "https://example.com/photo.jpg";
    const response = await patchMe({
      name: "  New Name  ",
      username: "  updated_157  ",
      photoUrl,
    });

    expect(response.status).to.equal(200);
    expect(response.body).to.include({
      id: me.id, name: "New Name", username: "updated_157", photoUrl,
    });
    expect((await get("/api/users/me")).body).to.deep.equal(response.body);
  });

  it("PATCH /me allows a single field and keeps omitted fields", async function () {
    const response = await patchMe({ name: "Updated Name" });
    expect(response.status).to.equal(200);
    expect(response.body).to.include({
      name: "Updated Name", username: original.username, photoUrl: original.photoUrl,
    });
  });

  it("PATCH /me allows the user's own handle and preserves an empty photo", async function () {
    const response = await patchMe({ username: original.username.toUpperCase(), photoUrl: "" });
    expect(response.status).to.equal(200);
    expect(response.body.username).to.equal(original.username.toUpperCase());
    expect(response.body.photoUrl).to.equal(original.photoUrl);
  });

  it("PATCH /me returns 409 for a taken username and applies no partial edit", async function () {
    const response = await patchMe({
      name: "Should stay unchanged",
      username: `  ${other.username.toUpperCase()}  `,
    });
    expect(response.status).to.equal(409);
    expect(response.body.error).to.equal("That username is taken.");
    expect(me).to.deep.equal(original);
  });

  it("PATCH /me rejects invalid fields before applying changes", async function () {
    for (const body of [{ name: " " }, { username: 42 }, { name: "New", photoUrl: false }]) {
      const response = await patchMe(body);
      expect(response.status).to.equal(400);
      expect(me).to.deep.equal(original);
    }
  });

  it("PATCH /me only updates allowed fields on the current user", async function () {
    const response = await patchMe({ id: other.id, password: "ignored", name: "Edited Name" });
    expect(response.status).to.equal(200);
    expect(response.body).to.include({ id: original.id, name: "Edited Name" });
    expect(me.password).to.equal(original.password);
    expect(response.body).not.to.have.property("password");
  });
});
