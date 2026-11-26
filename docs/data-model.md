# Data model

MongoDB collections for Later, and the rules for turning them into JSON. This replaces the in-memory arrays in `back-end/data/demoData.js`. String ids such as `u_1` and `p_1` become MongoDB ObjectIds. The JSON the API sends still has a string `id` on every document.

Categories, vote options, and source platforms stay in code and are served by `GET /api/config`. They are not collections. `categoryId` is one of `food`, `shopping`, `viewpoint`, `artsculture`, `nightlife`, `activities`, `other`.

## Decisions

**Drop `notes`.** No module reads that array. `logic/profiles.js` and `logic/friends.js` read `visits` only, to count `placesVisited`.

**Keep `visits`.** `GET` profile and `GET` friend profile both return `stats.placesVisited`, and both counts are `visits` filtered by `userId`. Profile and Friend Profile render that number. There is no route that creates a visit yet. The collection still has to exist so those two responses stay correct.

**Every model emits `id` as a string.** The front end reads `id` on users, cities, places, invites, friends, and members, and it puts those strings into routes (`/place/:placeId`, `/city/:id`, `/friends/:id`). Mongoose stores `_id` and, by default, `res.json(doc)` sends `_id` and omits the `id` virtual. A shared plugin fixes that for every schema:

```js
function idPlugin(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
      ret.id = doc._id.toString();
      delete ret._id;
      delete ret.passwordHash;
    },
  });
}
```

Apply it to every model. ObjectId references already serialize as hex strings, so `cityId`, `placeId`, `listId`, `savedPlaceId`, and `userId` stay strings in JSON. Keep returning shaped response objects where a route already renames fields (`placeId` on a card, `savedPlaceId` on a ranked row). The plugin covers the case where a route sends the document itself.

**Store the Google place id permanently. Treat everything else from Places as a short-lived cache.** Checked against the Places ID guide and the Maps Platform Service Specific Terms (Places API section, last modified 24 November 2026) and the Places policies page (updated 9 November 2026):

- The place id is exempt from the caching restriction. Store `googlePlaceId` indefinitely. Google recommends refreshing an id older than 12 months with a Place Details call that asks for the id only. `googlePlaceIdCheckedAt` records that check.
- Latitude and longitude from the Places API may be cached for 30 consecutive calendar days, then deleted. Store them with `coordinatesFetchedAt`. A read path refreshes or clears coordinates older than 30 days.
- The same Places section forbids using Places content with a non-Google map. Later's map is Leaflet on OpenStreetMap tiles (`docs/spikes/map-library.md`). Coordinates that came from Places stay off that map. `coordinatesSource: "authored"` is a pin the team or a user supplied and may be drawn on Leaflet. `coordinatesSource: "places"` is the 30-day cache and is not drawn. A place with no usable pin still appears in the list, which the map spike already allows.
- Name, neighborhood, and category are stored as our fields because Edit Place writes them and the user confirms them before a save. Photos on a card come from the social post (`savedPlaces.thumbnailUrl`). Google photos, reviews, and formatted addresses are not stored.

City center coordinates in the seed are written by us for the empty-map state. They are not Places content, so the 30-day rule does not apply to them.

## Shared rules

- Refs are ObjectIds. The "References" line on each collection says which collection they point at.
- Dates are BSON dates. JSON sends ISO strings, which is what the current sort-by-`savedAt` code already compares.
- Embedded objects use `{ _id: false }`.
- "Owner" is the teammate whose logic is the source of truth today. It is not an access-control field.

## users

Account and profile. Signup, login, password change, and `GET/PATCH /api/users/me` all use this collection.

**Owner:** Aleena (account and password). Zainab reads it for the profile response.

| Field | Type | Notes |
| --- | --- | --- |
| name | string | Required. Editable. |
| username | string | Required. Stored lowercase. 3+ characters, `[a-z0-9_]`. |
| email | string | Required. Stored lowercase. Login accepts email or username. |
| passwordHash | string | Required. Replaces the plaintext `password` in the demo data. `select: false`. The JSON transform removes it. `stripPasswords` stays as a second check. |
| photoUrl | string | |
| interests | string[] | Category ids from config, not references. |
| settings.notifications.listInvites | boolean | Default true. |
| settings.notifications.votes | boolean | Default true. |
| settings.notifications.newPlaces | boolean | Default true. |
| settings.notifications.friendRequests | boolean | Default true. |
| settings.discoverability | string | `everyone`, `friends_of_friends`, or `nobody`. Default `everyone`. |
| createdAt | date | |

**References:** none.

**Indexes:** unique `username`, unique `email`.

Public profile JSON keeps today's shape: `id`, `name`, `username`, `photoUrl`, interest labels, stats, and cities. Email and `passwordHash` stay off that payload.

## friendships

An undirected pair. Friend lists, discovery, and "most saved by friends" all start here.

**Owner:** Aashma.

| Field | Type | Notes |
| --- | --- | --- |
| userIds | ObjectId[2] | Always stored sorted, so each pair exists once. |
| since | date | Shown as "friends since" on a friend profile. |

**References:** `userIds` → `users`.

**Indexes:** unique `userIds`. The multikey index also serves "friends of this user".

## friendRequests

Incoming requests on the Friends screen. The demo array has one pending row (`u_3` → `u_1`). No route reads it yet. `docs/city-pages-api.md` records that Friends filters current friends and has no add-friend flow. The collection stays so that flow has a place to write.

**Owner:** Aashma.

| Field | Type | Notes |
| --- | --- | --- |
| fromUserId | ObjectId | Required. |
| toUserId | ObjectId | Required. |
| status | string | `pending`, `accepted`, or `declined`. |
| createdAt | date | |

**References:** `fromUserId` and `toUserId` → `users`.

**Indexes:** `{ toUserId: 1, status: 1 }` for the inbox. Unique partial index on `{ fromUserId: 1, toUserId: 1 }` where `status` is `pending`, so a pair has one open request.

Accepting a request inserts a `friendships` row and sets `status` to `accepted`.

## cities

Shared city catalog. A city is not owned by a user. Lists point at a city.

**Owner:** Inoo.

| Field | Type | Notes |
| --- | --- | --- |
| name | string | Required. |
| country | string | Required. |
| coordinates | `{ lat, lng }` | City center for an empty map. Authored data. |
| summary | string | Short description in the demo data. No current route returns it. |

**References:** none.

**Indexes:** unique `{ name: 1, country: 1 }`.

`GET /api/lists` and `GET /api/cities/:id` return the city `id`, `name`, and `coordinates`, plus the list's `placeCount` and `members`. Those extra fields are joined at read time.

## places

A place the app can show, whether or not a list has saved it. Place detail, edit, link confirmation, and manual search all read this collection.

**Owner:** Aashma. Siyona reads it from the create flow.

| Field | Type | Notes |
| --- | --- | --- |
| cityId | ObjectId | Required. |
| googlePlaceId | string | Permanent. Unique. Empty on demo rows until a Places lookup fills it. |
| googlePlaceIdCheckedAt | date | Set whenever we confirm the id. Refresh the id after 12 months. |
| name | string | Required. User-confirmed. Edit Place can change it. |
| categoryId | string | Required. Category enum, not a reference. |
| neighborhood | string | User-confirmed. Edit Place can change it. |
| coordinates | `{ lat, lng }` | Optional. |
| coordinatesFetchedAt | date | Required when `coordinatesSource` is `places`. |
| coordinatesSource | string | `authored` or `places`. |
| photoUrl | string | Our image or a placeholder. Google photo URIs are not stored here. |

**References:** `cityId` → `cities`.

**Indexes:** unique sparse `googlePlaceId`. Index `cityId` for search-in-city.

A Places response contributes `googlePlaceId` immediately. It contributes coordinates only with `coordinatesSource: "places"` and `coordinatesFetchedAt`. Those coordinates are deleted or replaced once they are 30 days old, and they are not sent to the Leaflet map. `name` and `neighborhood` are the values the user confirmed or edited.

## lists

One shared list per group per city. Saving the first place in a city creates the list. A user belongs to at most one list per city. `getListForUserAndCity` and `GET /api/cities/:cityId` both depend on that rule. Enforce it in the save and invite-accept paths.

**Owner:** Inoo.

| Field | Type | Notes |
| --- | --- | --- |
| cityId | ObjectId | Required. |
| ownerId | ObjectId | Required. The user who created the list. |
| memberIds | ObjectId[] | Includes the owner. |
| description | string | |
| inviteCode | string | Required. Used by `/join/:inviteCode`. |
| createdAt | date | |

**References:** `cityId` → `cities`. `ownerId` and `memberIds` → `users`.

**Indexes:** unique `inviteCode`. Index `cityId`. Index `memberIds` for "lists I belong to". Index `{ ownerId: 1 }`.

## listInvites

An invitation onto a list. Home and Invites read pending rows for the current user. Members sends new rows.

**Owner:** Inoo.

| Field | Type | Notes |
| --- | --- | --- |
| listId | ObjectId | Required. |
| fromUserId | ObjectId | Required. |
| toUserId | ObjectId | Required. |
| status | string | `pending`, `accepted`, or `declined`. |
| createdAt | date | |

**References:** `listId` → `lists`. `fromUserId` and `toUserId` → `users`.

**Indexes:** `{ toUserId: 1, status: 1 }` for the inbox. Unique partial index on `{ listId: 1, toUserId: 1 }` where `status` is `pending`.

Accepting pushes `toUserId` onto `lists.memberIds` when that user is not already a member.

## savedPlaces

A place saved onto one list. The duplicate check is one row per `(listId, placeId)`.

**Owner:** Siyona.

| Field | Type | Notes |
| --- | --- | --- |
| listId | ObjectId | Required. |
| placeId | ObjectId | Required. |
| savedBy | ObjectId | Required. |
| sourcePlatform | string | `TikTok` or `Instagram`. Default `Instagram` when the client omits a lookup. |
| sourceUrl | string | The pasted post. Empty when the save has no lookup. |
| thumbnailUrl | string | Post image, or the place photo when there is no lookup. |
| savedAt | date | |

**References:** `listId` → `lists`. `placeId` → `places`. `savedBy` → `users`.

**Indexes:** unique `{ listId: 1, placeId: 1 }`. Index `savedBy`. Index `{ listId: 1, savedAt: -1 }` for "recently saved".

## votes

One current vote per member per saved place. Casting again updates `value`.

**Owner:** Aashma Varma.

| Field | Type | Notes |
| --- | --- | --- |
| savedPlaceId | ObjectId | Required. |
| userId | ObjectId | Required. |
| value | string | `must-go`, `down`, or `pass`. |

**References:** `savedPlaceId` → `savedPlaces`. `userId` → `users`.

**Indexes:** unique `{ savedPlaceId: 1, userId: 1 }`.

Only votes whose `userId` is in the list's `memberIds` affect the tally. Ranked city lists sort by `must-go` count, then name. The vote response itself is `{ savedPlaceId, canVote, myVote, counts }` and does not need the vote document's `id`.

Leave `text` off this schema until Place Details notes are built.

## visits

A user has been to a place. Kept because profile stats read it.

**Owner:** Zainab. Aashma reads the same count on the friend profile.

| Field | Type | Notes |
| --- | --- | --- |
| userId | ObjectId | Required. |
| placeId | ObjectId | Required. |
| visitedAt | date | |

**References:** `userId` → `users`. `placeId` → `places`.

**Indexes:** unique `{ userId: 1, placeId: 1 }`.

`placesVisited` is the count of rows for that user. No route inserts a visit yet.

## linkLookups

Cache of "paste this URL" results. `POST` link lookup, the confirmation card, and ambiguous candidates all read it. It is server cache, not a user-owned record.

**Owner:** Siyona.

| Field | Type | Notes |
| --- | --- | --- |
| url | string | Required. The pasted URL, trimmed. |
| platform | string | `TikTok` or `Instagram`. |
| status | string | `found`, `ambiguous`, or `not_found`. |
| placeId | ObjectId | Set when `status` is `found`. |
| thumbnailUrl | string | |
| keywords | string[] | Set on ambiguous lookups. |
| candidates | `{ placeId, bestMatch }[]` | Embedded. `placeId` points at `places`. `_id: false`. |
| fetchedAt | date | When this resolution was stored. |

**References:** `placeId` → `places`. `candidates.placeId` → `places`.

**Indexes:** unique `url`.

A URL that is absent from this collection is the API's outer `not_found`. That outcome is not a stored row. When real caption parsing replaces the fixture, this collection remains a cache keyed by URL. Place identity still lives on `places`, including `googlePlaceId`.
