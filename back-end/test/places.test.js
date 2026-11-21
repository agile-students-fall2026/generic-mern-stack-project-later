const { expect } = require("chai");
const { request } = require("chai-http");
const app = require("../app");
const { places } = require("../data/demoData");

describe("Place routes", function () {
    describe("GET /api/places/:id", function () {
        it("returns the detail for a saved place", async function () {
            // p_6 Sacré-Cœur is saved on the Paris list as sp_6 by u_2.
            const response = await request.execute(app).get("/api/places/p_6");

            expect(response.status).to.equal(200);
            expect(response.body).to.include({
                id: "p_6",
                cityId: "c_paris",
                cityName: "Paris",
                name: "Sacré-Cœur",
                categoryId: "viewpoint",
                categoryLabel: "Viewpoint",
                neighborhood: "Montmartre",
                sourcePlatform: "TikTok",
                savedPlaceId: "sp_6",
            });
            expect(response.body.savedBy).to.have.all.keys("id", "name", "username", "photoUrl");
            expect(response.body.savedBy.id).to.equal("u_2");
        });

        it("returns null saved fields for a place nobody has saved", async function () {
            // p_12 Mamiche exists but isn't on any list.
            const response = await request.execute(app).get("/api/places/p_12");

            expect(response.status).to.equal(200);
            expect(response.body).to.include({
                id: "p_12",
                savedPlaceId: null,
                sourcePlatform: null,
                savedBy: null,
            });
        });

        it("returns 404 for an unknown place", async function () {
            const response = await request.execute(app).get("/api/places/p_missing");

            expect(response.status).to.equal(404);
            expect(response.body).to.deep.equal({ error: "Place not found" });
        });
    });

    describe("PATCH /api/places/:id", function () {
        // PATCH edits demoData in memory, so put p_7 back after each test.
        let original;
        beforeEach(function () {
            original = { ...places.find((place) => place.id === "p_7") };
        });
        afterEach(function () {
            Object.assign(places.find((place) => place.id === "p_7"), original);
        });

        function patchPlace(id, body) {
            return request.execute(app).patch(`/api/places/${id}`).send(body);
        }

        it("updates the place and returns the new detail", async function () {
            const response = await patchPlace("p_7", {
                name: "  Du Pain  ",
                categoryId: "shopping",
                neighborhood: " 10th ",
            });

            expect(response.status).to.equal(200);
            expect(response.body).to.include({
                id: "p_7",
                name: "Du Pain",
                categoryId: "shopping",
                categoryLabel: "Shopping",
                neighborhood: "10th",
            });

            const again = await request.execute(app).get("/api/places/p_7");
            expect(again.body.name).to.equal("Du Pain");
        });

        it("returns 400 for a bad category, empty name, or missing fields", async function () {
            const badCategory = await patchPlace("p_7", { name: "X", categoryId: "pizza", neighborhood: "" });
            const emptyName = await patchPlace("p_7", { name: "   ", categoryId: "food", neighborhood: "" });
            const missing = await patchPlace("p_7", {});

            for (const response of [badCategory, emptyName, missing]) {
                expect(response.status).to.equal(400);
                expect(response.body.error).to.be.a("string");
            }
            expect(places.find((place) => place.id === "p_7").name).to.equal(original.name);
        });

        it("returns 404 for an unknown place", async function () {
            const response = await patchPlace("p_missing", { name: "X", categoryId: "food", neighborhood: "" });

            expect(response.status).to.equal(404);
            expect(response.body).to.deep.equal({ error: "Place not found" });
        });
    });
});