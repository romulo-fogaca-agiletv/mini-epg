# Quickstart: validating Programme Reminders

Run these checks after the feature is implemented. Details: [data-model.md](data-model.md), [contracts/reminders-api.md](contracts/reminders-api.md).

## Prerequisites

```powershell
npm install
npm start   # http://localhost:3000
```

Favourites are in memory, so they reset on every server restart. Pick a channel id from `GET /channels` and a programme start from its schedule for `2026-10-20` (for example `spesp` and a programme starting at 20:00; adjust to real data).

## 1. API: window and filtering (spec FR-001, FR-003, FR-007)

1. Favourite a channel:
   `POST /users/demo-user/favorites` with `{ "channelId": "<id>" }`.
2. `GET /users/demo-user/reminders?at=<start − 10 min>`
   - Expected: one reminder for that programme, `minutesRemaining: 10`.
3. `GET ...?at=<start − 9 min>` → still listed, `minutesRemaining: 9`.
4. `GET ...?at=<start>` → not listed (already started).
5. `GET ...?at=<start − 11 min>` → not listed.
6. Remove the favourite (`DELETE /users/demo-user/favorites/<id>`), repeat step 2 → empty list.
7. `GET ...?at=not-a-date` → `400`.

## 2. API: midnight (FR-009, SC-005)

With a favourite on a channel that has a programme starting at `2026-10-21T00:00:00-03:00`:
`GET ...?at=2026-10-20T23:50:00-03:00` → one reminder, `start` shows `-03:00`.

## 3. Guide: visible reminder (US1, US3)

1. Open `http://localhost:3000/?now=2026-10-20T19:49:30-03:00` (use a start of your chosen programme).
2. Star the channel. Within about 30 s the clock reaches 19:50 and a reminder appears showing title, channel and `20:00`.
3. Reload the same URL: the reminder does **not** come back (FR-004).
4. Open a fresh browser profile with `?now=2026-10-20T19:57:00-03:00`: the reminder says it starts in 3 minutes.
5. Wait for the guide clock to pass 20:00 with a reminder still shown: it disappears on its own.
6. Click the dismiss button on a reminder: it disappears and stays gone after reload.

## 4. Guide: favourites change (US2, FR-005)

1. With the guide clock at 19:45 and no favourite, nothing is shown at 19:50.
2. Star the channel at 19:45: a reminder appears at 19:50.
3. Unstar before 19:50: no reminder.

## 5. Automated checks

```powershell
npm test            # new: tests/reminders.test.js, tests/reminders.api.test.js
npm run test:e2e    # new: e2e/reminders.spec.js
```

## Expected outcome

Every step above behaves as described, `npm test` is green, and no changes appear in `src/legacy/importer.js` or `data/schedule.json` (`git status`).
