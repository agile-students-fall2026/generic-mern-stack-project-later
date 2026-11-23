# List members and outgoing invitations

These routes use the shared in-memory demo data and fixed `currentUserId`, like
the other Sprint 2 APIs. They are not session authentication or persistent storage;
pending invitations survive page reloads, but reset when the server restarts.

| Method and path | Response / request |
| --- | --- |
| `GET /api/lists/:listId/members` | Array of public users (`id`, `name`, `username`, `photoUrl`) in membership order. |
| `GET /api/cities/:cityId/invite-options` | The current user's joined list: `status`, `cityId`, `cityName`, `listId`, `ownerId`, `currentUserId`, `description`, `inviteCode`, `invitePath`, `members`, `friendsToInvite`. Friends exclude current members and include an `alreadyInvited` flag for pending invites. |
| `POST /api/lists/:listId/invites` | Body `{ "toUserIds": ["u_5"] }`; returns `{ "ok": true, "created": [...] }`. Each created invite has `id`, `listId`, `fromUserId`, `toUserId`, `status: "pending"`, and `createdAt`. |

Both reads and writes require membership of the selected list. Missing or inaccessible
lists return 404. The server selects the sender; clients do not supply `fromUserId`.
An empty/malformed recipient array or a non-friend recipient returns 400 without
writing any part of the batch. Existing members and pending invitations are skipped,
so repeated submissions are safe; `created` can be empty. Declined invitations can
be sent again. Responses never include email addresses or passwords.

`FriendProfile` can reuse the POST endpoint after resolving its target list ID.
The invite link path is preserved from the existing UI contract; these routes do
not add a `/join/:code` handler or implement accepting/declining invitations.

Run `npm run coverage` from `back-end` for HTTP contract and regression tests.
