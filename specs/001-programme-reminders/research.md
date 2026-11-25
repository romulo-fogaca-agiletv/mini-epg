# Research: Programme Reminders

No `NEEDS CLARIFICATION` items remained after `/speckit-clarify`. The decisions below close the open design questions.

## D1. Where the reminder window is computed

- **Decision**: On the server, in a pure function `upcomingReminders(channelIds, now, leadMinutes = 10)` in `src/epg/reminders.js`. A programme qualifies when `now < start <= now + leadMinutes` (as `Date` instants) and its `channelId` is in `channelIds`.
- **Rationale**: The server already owns programme data and the `Date`-based time rules. The browser then only polls and renders. A pure function is easy to test with fixed instants, including across São Paulo midnight (FR-009, SC-005).
- **Alternatives**: Downloading whole schedules to the browser and filtering there duplicates time logic and needs a schedule fetch per favourite channel. Server push (SSE/WebSocket) is unnecessary because polling meets the 30 s target.

## D2. Boundary semantics

- **Decision**: Lower bound is exclusive (`start > now`, so programmes that already started never qualify, FR-007); upper bound is inclusive (`start <= now + 10 min`, so the reminder exists at exactly 19:50 for a 20:00 start). `minutesRemaining = ceil((start - now) / 60000)`, so 19:57:00 gives 3 and 19:50:00 gives 10.
- **Rationale**: Matches FR-001, FR-006 and FR-007 and gives the late-open case the real number of minutes (Story 3).
- **Alternatives**: `floor` would show "0 minutes" in the last minute; rounding could show "10" slightly after the mark.

## D3. How the guide gets "now" (FR-013)

- **Decision**: The API takes an optional `at` ISO instant, the same convention as `/now-playing?at=`. The guide reads an optional `?now=<ISO>` from its own URL. If present, the guide treats it as the starting "now" and advances it with the elapsed real time; otherwise it uses the real clock. The client sends `at` on each poll.
- **Rationale**: Deterministic tests and demos without changing the fixed demo day, and consistent with the existing API.
- **Alternatives**: A server-side global clock override adds mutable state; a freezing (non-advancing) override cannot demonstrate a reminder appearing over time.

## D4. Invalid `at`

- **Decision**: `at` that does not parse to a valid date returns `400 { error }`. (`/now-playing` currently does not validate; this endpoint does, and that endpoint is left as is.)
- **Rationale**: An invalid date would silently produce an empty list, which is hard to debug.

## D5. Polling and favourites changes (FR-005, SC-001, SC-003)

- **Decision**: The guide polls every 15 seconds and also immediately after loading and after each favourite toggle. The server reads the user's current favourites on each request, so no client-side cache of favourites is needed for reminders.
- **Rationale**: 15 s keeps the worst case under the 30 s target with margin. An immediate re-poll after a toggle makes changes feel instant.
- **Alternatives**: A longer interval risks missing the 30 s target.

## D6. "Shown once" memory (FR-004)

- **Decision**: The browser stores the ids of programmes already shown or dismissed in `localStorage`, under a key scoped to the demo user. A reminder is rendered only if its programme id is not in that set; ids are added when a reminder is first shown. Stored ids older than a day are pruned on load to keep the set small.
- **Rationale**: Survives reloads without server state, as clarified. Programme ids (e.g. `p0001`) are stable within a schedule.
- **Alternatives**: Server-side "sent" records need identity and persistence that do not exist (favourites are in memory and there is no auth).
- **Known limit**: A regenerated schedule that reuses ids could hide a reminder; accepted, documented in the spec assumptions.

## D7. Disappearing and dismissing (FR-008)

- **Decision**: A visible reminder is removed when the viewer clicks its dismiss button, or automatically once the guide's "now" reaches the programme's `start`. The auto-removal is evaluated on each poll and on a 1 s display tick that also refreshes the minutes shown.
- **Rationale**: Matches clarification 4 without extra server work.

## D8. Ratings and kids profile (FR-010)

- **Decision**: The response includes each programme's `rating`. No filtering is added now because no kids profile exists. When it does, the same filter that guards other listings must be applied to this endpoint.
- **Rationale**: Avoids inventing the profile model (an open product question) while keeping the data needed to apply the rule later.

## D9. Accessibility of the toast

- **Decision**: The container uses `role="status"` with `aria-live="polite"`, and the dismiss button has an `aria-label`.
- **Rationale**: Screen readers announce the reminder without stealing focus. Low cost, and it covers the pending accessibility item from clarification.
