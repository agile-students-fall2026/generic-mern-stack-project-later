# Manual place search (#174)

When a pasted link has no match, Create offers **Search manually**. Suggested
Matches also offers **None of these? Search manually**. The pasted URL and any
known lookup are carried into the search screen; **Edit pasted link** restores
that URL on Create.

The user chooses a city, enters a place name/neighborhood/category, and submits
the search. Results come from `GET /api/cities/:id/search?q=...`, using the shared
API client. Tapping a result opens the existing Identifying confirmation page;
it does not save automatically. The existing duplicate check and save endpoint
remain responsible for checking and saving the selected place. **Not it? See
other matches** returns to manual search when the place was chosen there.

`GET /api/cities` returns `{ id, name, country }[]` from the backend demo catalog.
It includes cities without a joined list because the save endpoint can create
that user's first list in a city. A lookup failure supplies no city, so the UI
asks the user to choose one instead of inferring a location from the link.

Search and confirmation use the shared API fields `categoryId`, `categoryLabel`,
and `neighborhood` introduced with the category badge integration. Search rows
retain `placeId` as their selection/save identifier; `savedPlaceId` is the
separate identifier used by the voting API. Search results and confirmation use
the same `CategoryTag` component and preserve the create flow's Tailwind styles.

The latest master includes the profile, incoming invitation, member and place
APIs. The member screen continues using `data.ownerId` and `data.currentUserId`
from the server. CityPage/MapTab still read local mock data pending #162, and
PlaceDetail/EditPlace still need their separate API wiring; a successful save
does not establish that those screens already reflect server-side changes.

This searches the Sprint 2 server's mock places, not live TikTok/Instagram posts
or a third-party places service. An unknown URL is preserved without inventing a
lookup ID. Known TikTok/Instagram domains supply the source platform for saving.
The existing in-memory backend resets saved places when restarted.

## Manual check

1. Start both servers and open `/create`.
2. Enter `https://www.tiktok.com/@travel/video/unmatched` and click **Find the place**.
3. Click **Search manually**, choose Paris, and search for `Septime`.
4. Click the result. Verify **Is this the place?** appears before **Save to Paris**.
5. Save and verify **Saved!** only after the server responds successfully.
6. Repeat the search: confirmation should show the duplicate warning and disable saving.
7. Search for nonsense text and use **Edit pasted link**; the original URL should remain.
8. Open `/create/search` without navigation state; it should offer **Go to Create**.

Automated coverage: `npm test` in `front-end`, `npm run coverage` in `back-end`.

Integrated verification on November 22: 94 backend tests, 54 frontend tests,
97.85% backend line coverage, and the frontend production build pass. The
browser flow above was verified against the merged team PRs. Full lint still
reports the two existing `react-hooks/set-state-in-effect` errors in `useApi.js`
and `SuggestedMatches.jsx`, also reproduced on master without this PR.
