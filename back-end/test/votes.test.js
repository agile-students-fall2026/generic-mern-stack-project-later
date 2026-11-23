const { expect } = require("chai");
const { request } = require("chai-http");
const app = require("../app");
const { votes } = require("../data/demoData");

describe("Vote routes", function () {
    // castVote edits the votes array, so restore it after every test.
    let snapshot;
    beforeEach(function () {
        snapshot = votes.map((vote) => ({ ...vote }));
    });
    afterEach(function () {
        votes.splice(0, votes.length, ...snapshot);
    });

    function getVotes(id) {
        return request.execute(app).get(`/api/saved-places/${id}/votes`);
    }
    function vote(id, body) {
        return request.execute(app).put(`/api/saved-places/${id}/vote`).send(body);
    }

    describe("GET /api/saved-places/:id/votes", function () {
        it("returns the tally and my vote", async function () {
            // sp_6: u_1 must-go, u_2 must-go, u_4 down. Current user is u_1.
            const response = await getVotes("sp_6");

            expect(response.status).to.equal(200);
            expect(response.body).to.deep.equal({
                savedPlaceId: "sp_6",
                canVote: true,
                myVote: "must-go",
                counts: { "must-go": 2, down: 1, pass: 0 },
            });
        });

        it("says canVote false on a list the user isn't on", async function () {
            // sp_1 is on the New York list. u_1 isn't a member.
            const response = await getVotes("sp_1");

            expect(response.status).to.equal(200);
            expect(response.body).to.include({ canVote: false, myVote: null });
            expect(response.body.counts["must-go"]).to.equal(4);
        });

        it("returns 404 for an unknown saved place", async function () {
            const response = await getVotes("sp_missing");
            expect(response.status).to.equal(404);
        });
    });

    describe("PUT /api/saved-places/:id/vote", function () {
        it("adds a first vote", async function () {
            // sp_7: only u_4 voted (down).
            const before = votes.length;
            const response = await vote("sp_7", { value: "must-go" });

            expect(response.status).to.equal(200);
            expect(response.body).to.deep.equal({
                ok: true,
                savedPlaceId: "sp_7",
                canVote: true,
                myVote: "must-go",
                counts: { "must-go": 1, down: 1, pass: 0 },
            });
            expect(votes.length).to.equal(before + 1);
        });

        it("replaces an existing vote instead of adding a second one", async function () {
            const before = votes.length;
            const response = await vote("sp_6", { value: "pass" });

            expect(response.status).to.equal(200);
            expect(response.body.myVote).to.equal("pass");
            expect(response.body.counts).to.deep.equal({ "must-go": 1, down: 1, pass: 1 });
            expect(votes.length).to.equal(before);
        });

        it("returns 400 when the value isn't a vote option", async function () {
            const bad = await vote("sp_6", { value: "maybe" });
            const missing = await vote("sp_6", {});

            expect(bad.status).to.equal(400);
            expect(missing.status).to.equal(400);
            expect(bad.body.error).to.be.a("string");
        });

        it("returns 404 for an unknown saved place", async function () {
            const response = await vote("sp_missing", { value: "down" });
            expect(response.status).to.equal(404);
        });

        it("returns 403 when the user isn't on the list", async function () {
            const response = await vote("sp_1", { value: "down" });
            expect(response.status).to.equal(403);
        });
    });
});