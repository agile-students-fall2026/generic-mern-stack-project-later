const { expect } = require("chai");
const { request } = require("chai-http");
const app = require("../app");
const { lists, listInvites } = require("../data/demoData");

const get = (path) => request.execute(app).get(`/api${path}`);
const send = (body, listId = "l_2") =>
  request.execute(app).post(`/api/lists/${listId}/invites`).send(body);

describe("List member and outgoing invitation routes", () => {
  let originalInvites;
  let originalLists;

  beforeEach(() => {
    originalInvites = structuredClone(listInvites);
    originalLists = structuredClone(lists);
  });

  afterEach(() => {
    listInvites.splice(0, listInvites.length, ...originalInvites);
    lists.splice(0, lists.length, ...originalLists);
  });

  it("returns members in list order with only their public display fields", async () => {
    const response = await get("/lists/l_2/members");
    expect(response.status).to.equal(200);
    expect(response.body.map((member) => member.id)).to.deep.equal(["u_1", "u_2", "u_4"]);
    for (const member of response.body) {
      expect(member).to.have.all.keys("id", "name", "username", "photoUrl");
    }
  });

  it("returns the screen's list metadata and friends who are not members", async () => {
    const response = await get("/cities/c_paris/invite-options");
    expect(response.status).to.equal(200);
    expect(response.body).to.include({
      status: "ready", cityId: "c_paris", cityName: "Paris", listId: "l_2",
      ownerId: "u_1", currentUserId: "u_1", invitePath: "/join/PAR-7Q2K",
    });
    expect(response.body.members).to.deep.equal((await get("/lists/l_2/members")).body);
    expect(response.body.friendsToInvite).to.have.length(1);
    expect(response.body.friendsToInvite[0]).to.include({ id: "u_5", alreadyInvited: false });
    expect(response.body.friendsToInvite[0]).not.to.have.property("email");
  });

  it("returns 404 for unknown lists and lists the demo user has not joined", async () => {
    for (const listId of ["l_1", "missing"]) {
      expect((await get(`/lists/${listId}/members`)).status).to.equal(404);
      expect((await send({ toUserIds: ["u_5"] }, listId)).status).to.equal(404);
    }
    for (const cityId of ["c_nyc", "missing"]) {
      expect((await get(`/cities/${cityId}/invite-options`)).status).to.equal(404);
    }
    expect(listInvites).to.deep.equal(originalInvites);
  });

  it("records pending invites from the server's user and marks them in the next read", async () => {
    const response = await send({ toUserIds: ["u_5"], fromUserId: "u_3" });
    expect(response.status).to.equal(200);
    expect(response.body.ok).to.equal(true);
    expect(response.body.created).to.have.length(1);
    const [invite] = response.body.created;
    expect(invite).to.include({ listId: "l_2", fromUserId: "u_1", toUserId: "u_5", status: "pending" });
    expect(invite.id).to.be.a("string");
    expect(Number.isNaN(Date.parse(invite.createdAt))).to.equal(false);
    expect(listInvites.at(-1)).to.deep.equal(invite);
    expect(lists.find((list) => list.id === "l_2").memberIds).not.to.include("u_5");
    const options = await get("/cities/c_paris/invite-options");
    expect(options.body.friendsToInvite[0].alreadyInvited).to.equal(true);
  });

  it("rejects empty, malformed and mixed invalid batches without partial writes", async () => {
    for (const body of [{}, { toUserIds: [] }, { toUserIds: "u_5" },
      { toUserIds: [null] }, { toUserIds: [" "] }, { toUserIds: ["u_5", "missing"] },
      { toUserIds: ["u_5", "u_3"] }]) {
      expect((await send(body)).status).to.equal(400);
      expect(listInvites).to.deep.equal(originalInvites);
    }
  });

  it("skips members and deduplicates repeated recipients, retries and concurrent submissions", async () => {
    const responses = await Promise.all([
      send({ toUserIds: ["u_5", "u_5", "u_2"] }),
      send({ toUserIds: ["u_5"] }),
    ]);
    expect(responses.map((response) => response.status)).to.deep.equal([200, 200]);
    expect(responses.flatMap((response) => response.body.created)).to.have.length(1);
    expect((await send({ toUserIds: ["u_5"] })).body).to.deep.equal({ ok: true, created: [] });
    expect(listInvites.filter((invite) => invite.listId === "l_2")).to.have.length(1);
  });

  it("allows another invite after a decline, with a distinct id", async () => {
    const first = await send({ toUserIds: ["u_5"] });
    listInvites.find((invite) => invite.id === first.body.created[0].id).status = "declined";
    const second = await send({ toUserIds: ["u_5"] });
    expect(second.body.created).to.have.length(1);
    expect(second.body.created[0].id).not.to.equal(first.body.created[0].id);
  });

  it("finds the user's own list when another list for the same city already exists", async () => {
    lists.push({ ...lists[0], id: "l_new_nyc", ownerId: "u_1", memberIds: ["u_1"] });
    const response = await get("/cities/c_nyc/invite-options");
    expect(response.status).to.equal(200);
    expect(response.body.listId).to.equal("l_new_nyc");
    expect(response.body.members.map((member) => member.id)).to.deep.equal(["u_1"]);
  });
});
