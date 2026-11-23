const { expect } = require("chai");
const { request } = require("chai-http");
const app = require("../app");

const get = (path) => request.execute(app).get(path);

describe("Friend routes", () => {
    it("lists friends sorted by name with shared cities", async () => {
        const res = await get("/api/friends");
        expect(res.status).to.equal(200);
        expect(res.body.map(({ id }) => id)).to.deep.equal(["u_5", "u_2", "u_4"]);
        expect(res.body.map(({ sharedCities }) => sharedCities)).to.deep.equal([[], ["Paris"], ["Paris"]]);
        expect(res.body[0]).to.not.have.property("password");
    });

    it("filters by username, ignoring case and a leading @", async () => {
        const res = await get("/api/friends?q=@TIF");
        expect(res.body.map(({ username }) => username)).to.deep.equal(["tiffy"]);
        const none = await get("/api/friends?q=zzz");
        expect(none.status).to.equal(200);
        expect(none.body).to.deep.equal([]);
    });

    it("does not treat most-saved as a friend id", async () => {
        const res = await get("/api/friends/most-saved");
        expect(res.status).to.equal(200);
        expect(res.body.map(({ id }) => id)).to.deep.equal(["p_2", "p_6", "p_7", "p_4", "p_3"]);
        expect(res.body[0]).to.include({ saveCount: 1, savedByLabel: "Saved by Samantha" });
    });

    it("returns a friend's profile with only shared-list saves", async () => {
        const res = await get("/api/friends/u_2");
        expect(res.status).to.equal(200);
        expect(res.body).to.include({ friendsSince: "2025-03-01" });
        expect(res.body.stats.listsShared).to.equal(1);
        expect(res.body.recentlySaved.map(({ savedPlaceId }) => savedPlaceId)).to.deep.equal(["sp_6", "sp_7"]);
    });

    it("only includes places from lists the current user belongs to", async () => {
        const res = await get("/api/friends/most-saved");
        const myCityNames = lists
            .filter((list) => list.memberIds.includes(currentUserId))
            .map((list) => cities.find((city) => city.id === list.cityId).name);
        expect(res.status).to.equal(200);
        for (const place of res.body) expect(myCityNames).to.include(place.cityName);
    });

    for (const id of ["u_3", "u_1", "nope"]) {
        it(`returns 404 for a non-friend, yourself, or a missing user (${id})`, async () => {
            const res = await get(`/api/friends/${id}`);
            expect(res.status).to.equal(404);
            expect(res.body).to.deep.equal({ error: "Friend not found" });
        });
    }
});