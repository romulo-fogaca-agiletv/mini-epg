# Tasks: Programme Reminders

**Input**: Design documents from `specs/001-programme-reminders/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/reminders-api.md](contracts/reminders-api.md), [quickstart.md](quickstart.md)

**Tests**: Included, because the plan lists unit, API and e2e tests for this feature and the project already tests every module. Write each test first and confirm it fails before implementing.

**Project rules that apply to every task**: times are America/Sao_Paulo with a fixed `-03:00` offset and are compared as `Date` instants; no new runtime dependencies; do not edit `src/legacy/importer.js` or `data/schedule.json`; never weaken existing tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: user story from spec.md (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm the baseline before changing anything.

- [X] T001 Run `npm test` from the repository root and record that the existing suite passes before any change (baseline for later regressions)

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: The server-side rule and endpoint that every story relies on.

- [X] T002 [P] Write failing unit tests for `upcomingReminders` in `tests/reminders.test.js` covering: programme exactly 10 min away is included with `minutesRemaining` 10; 9 min away gives 9; 11 min away is excluded; start equal to `now` or already started is excluded; non-favourite channel excluded; empty favourites gives `[]`; result sorted by start then channel number; back-to-back programmes on one channel (the first ends when the second starts) each produce their own reminder at their own 10-minute mark; a programme at `2026-10-21T00:00:00-03:00` is included for `now` `2026-10-20T23:50:00-03:00` (spec FR-001, FR-003, FR-007, FR-009)
- [X] T003 Implement `upcomingReminders(channelIds, now, leadMinutes = 10)` in `src/epg/reminders.js`: read programmes only through `src/epg/store.js`, include a programme when its channel is in `channelIds` and `now < start <= now + leadMinutes` (compare `Date` instants), return the fields of the derived Reminder in [data-model.md](data-model.md) (`Reminder.programmeId`, `Reminder.channelId`, `Reminder.channelName`, `Reminder.title`, `Reminder.start`, `Reminder.rating`, `Reminder.minutesRemaining` per data-model.md), with `minutesRemaining = ceil((start - now) / 60000)` as the integer range 1 to 10 in `Reminder.minutesRemaining` of data-model.md; make T002 pass
- [X] T004 [P] Write failing API tests for `GET /users/:userId/reminders` in `tests/reminders.api.test.js` using supertest and `favorites._reset()` in `beforeEach`: response shape from [contracts/reminders-api.md](contracts/reminders-api.md) (`at`, `leadMinutes`, `reminders`); favourite channel yields its reminder, same programme on a non-favourite channel does not; no favourites or unknown `userId` gives 200 and `[]`; invalid `at` gives 400 with the `error` message from the contract; missing `at` uses the current time and returns 200
- [X] T005 Add the route `GET /users/:userId/reminders` in `src/app.js`: parse optional `at` (reject invalid dates with 400), read favourites via `favorites.list`, call `upcomingReminders`, respond as in the contract; do not read data files directly in `app.js`; make T004 pass

**Checkpoint**: `npm test` is green; the endpoint answers the quickstart sections 1 and 2 manually.

---

## Phase 3: User Story 1 - Get warned 10 minutes before a programme on a favourite channel (Priority: P1) 🎯 MVP

**Goal**: A viewer with favourite channels sees one on-screen reminder (title, channel, start time) 10 minutes before a programme on those channels.

**Independent Test**: Favourite one channel, open `/?now=<10 min before a programme on it>`, and confirm exactly one reminder appears with the right title, channel and São Paulo start time (quickstart section 3, steps 1–2).

### Tests for User Story 1

- [X] T006 [P] [US1] Write a failing Playwright scenario in `e2e/reminders.spec.js`: favourite a channel through the UI star, load the guide with `?now=` set to 10 minutes before one of its programmes, expect a visible reminder containing the title, channel name and `HH:MM` start; also expect no reminder for the same start time on a non-favourite channel and two reminders when two favourite channels start together (spec scenarios 1, 2 and 4). Follow the structure of `e2e/favorites.spec.js`

### Implementation for User Story 1

- [X] T007 [P] [US1] Add a reminders container (`<div id="reminders" role="status" aria-live="polite" data-testid="reminders">`) and its toast styles in `public/index.html`, matching the existing dark theme (research D9)
- [X] T008 [US1] In `public/app.js`, add the guide clock: read optional `?now=` from the page URL; if valid, start the clock at that instant and advance it with elapsed real time, otherwise use the real clock; fall back to the real clock when `?now=` is invalid (research D3, FR-013)
- [X] T009 [US1] In `public/app.js`, add `pollReminders()` that calls `GET /users/${USER_ID}/reminders?at=<clock ISO>` and renders one toast per reminder with title, channel name, start via the existing `fmt()` and the text "começa em N min" from `Reminder.minutesRemaining` (data-model.md); call it on load and then every 15 seconds (research D5). Build the DOM text with `textContent` so titles are never injected as HTML
- [X] T010 [US1] Make T006 pass and run the quickstart section 3 steps 1–2 against `npm start` — **e2e (T006) NOT run: Chromium not installed and e2e skipped by the user; quickstart section 3 steps 1–2 verified manually in the browser pane (2 reminders at 19:50)**

**Checkpoint**: User Story 1 works on its own and is demonstrable (MVP).

---

## Phase 4: User Story 2 - Reminders follow changes to favourites (Priority: P2)

**Goal**: Adding or removing a favourite changes which reminders appear, without reloading the page.

**Independent Test**: Quickstart section 4: star a channel before its 10-minute mark and a reminder appears; unstar it before the mark and none appears.

### Tests for User Story 2

- [ ] T011 [US2] Add failing scenarios to `e2e/reminders.spec.js`: (a) star the channel when the guide clock is before the window, advance into it, expect a reminder; (b) star then unstar before the window, expect none; (c) with a reminder visible, unstar its channel and expect the reminder to be removed (spec US2 scenarios 1, 2 and 3, FR-005)

### Implementation for User Story 2

- [ ] T012 [US2] In `public/app.js`, call `pollReminders()` right after a successful favourite add or remove in `toggleFavorite`, and remove from the screen any visible reminder whose channel is no longer in the response (research D5; FR-005, SC-003)
- [ ] T013 [US2] Make T011 pass and run quickstart section 4

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: User Story 3 - Dismiss reminders and avoid confusing ones (Priority: P3)

**Goal**: Reminders can be dismissed, are shown once even after reload, disappear when the programme starts, and show real remaining minutes when the guide opens late.

**Independent Test**: Quickstart section 3 steps 3–6.

### Tests for User Story 3

- [ ] T014 [US3] Add failing scenarios to `e2e/reminders.spec.js`: dismiss a reminder and expect it gone and not back after reload; shown reminder does not reappear after reload; open at 3 minutes before the start and expect the text "3 min"; open after a programme has started and expect no reminder for it; reminder removed on its own once the guide clock reaches the start (spec US3 scenarios 1–3, FR-004, FR-006, FR-007, FR-008)

### Implementation for User Story 3

- [ ] T015 [US3] In `public/app.js`, add the seen set in `localStorage` under `mini-epg:reminders-seen:<USER_ID>` as a map of `Reminder.programmeId` to `Reminder.start` (data-model.md): add an id the first time its reminder is shown, never render a reminder whose id is in the set, and prune entries whose start is more than 24 hours before the guide clock on load (research D6; FR-004)
- [ ] T016 [US3] In `public/app.js`, add a dismiss button with `aria-label` to each toast that removes it; add a 1-second display tick that refreshes the remaining minutes and removes any toast whose `Reminder.start` is at or before the guide clock (research D7; FR-008)
- [ ] T017 [US3] Make T014 pass and run quickstart section 3 steps 3–6

**Checkpoint**: All three stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T018 [P] Update `ARCHITECTURE.md` (module table: `src/epg/reminders.js`; public guide behaviour; persistence note about the browser-side seen set) and `PRODUCT.md` (new user flow and the `GET /users/:userId/reminders` API entry; note that reminders do not filter by rating yet, FR-010)
- [ ] T019 Run `npm test` and `npm run test:e2e` and confirm everything is green with no existing test changed
- [ ] T020 Run `git status` and confirm `src/legacy/importer.js` and `data/schedule.json` are unmodified, then walk through every section of [quickstart.md](quickstart.md)

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: T001 first. Phase 2 blocks all stories.
- **Within Phase 2**: T002 before T003; T004 can be written in parallel with T002; T005 needs T003 and T004.
- **US1 (Phase 3)** depends on Phase 2. **US2** and **US3** depend on US1's polling and toast code (T008, T009) because they extend `public/app.js`.
- **US2 and US3** are independent of each other, but both edit `public/app.js`, so implement them one after the other. Their test tasks (T011, T014) edit the same e2e file; write them one after the other too.
- **Polish (Phase 6)** after all chosen stories.

```text
T001 → (T002 → T003) + T004 → T005 → T006/T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018/T019/T020
```

### Parallel opportunities

- T002 and T004 (different test files).
- T006 and T007 (e2e file vs `public/index.html`).
- T018 with T019/T020 once code is done.

## Implementation Strategy

- **MVP**: Phases 1–3 (T001–T010). That alone delivers the reminder for favourite channels, with the overridable "now" needed to demonstrate it.
- **Increment 2**: US2 (T011–T013), small, mostly a re-poll after toggling.
- **Increment 3**: US3 (T014–T017), dismissal, once-only memory and auto-removal.
- Commit after each phase checkpoint.

## Notes

- Constrained fields from `data-model.md` (`Reminder.minutesRemaining`, `Reminder.start`, `Reminder.programmeId`) are cited where they are implemented (T003, T009, T015, T016).
- FR-010 only requires carrying the rating: `Reminder.rating` is returned (T003) so the `18` filter can be added when a kids profile exists. No filter task is planned now.
