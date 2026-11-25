# Implementation Plan: Programme Reminders

**Branch**: `lab4-exercicio` (feature id `001-programme-reminders`) | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-programme-reminders/spec.md`

## Summary

Show an on-screen reminder in the web guide 10 minutes before any programme starts on one of the viewer's favourite channels. A new read-only API endpoint answers "which programmes on my favourite channels start within the next 10 minutes, as of this moment?". The guide polls it every 15 seconds, shows each reminder once, lets the viewer dismiss it, and removes it when the programme starts. "Now" defaults to the real time and can be overridden (query parameter) for tests and demos. No schedule, importer or favourites-storage changes.

## Technical Context

**Language/Version**: Node.js (CommonJS, `'use strict'`), plain browser JavaScript in `public/` (no build)

**Primary Dependencies**: `express` only at runtime (unchanged). Dev: `jest`, `supertest`, Playwright (already in the repo)

**Storage**: None added. Programmes and channels come from `data/*.json` through `src/epg/store.js`; favourites stay in memory (`src/users/favorites.js`). "Already shown / dismissed" lives in the browser (`localStorage`)

**Testing**: jest unit tests for the pure reminder logic; jest + supertest for the endpoint; Playwright e2e for the toast, dismissal, reload and favourite changes

**Target Platform**: Node server plus a modern desktop browser

**Project Type**: Web service with a small static front end

**Performance Goals**: A reminder is visible within 30 s of the 10-minute mark (poll every 15 s); favourite changes reflected within 30 s (an immediate re-poll makes it near instant)

**Constraints**: All times America/Sao_Paulo with a fixed `-03:00` offset; compare instants as `Date`, never by slicing UTC strings; no timezone libraries; no new runtime dependencies; do not edit `src/legacy/importer.js` or `data/schedule.json`

**Scale/Scope**: At most 50 favourites per user, a few dozen programmes per channel; the filter scans the in-memory programme list on each poll (trivial cost)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled Spec Kit template, so it sets no gates. The binding rules are the project conventions in `CLAUDE.md`, `ARCHITECTURE.md` and `PRODUCT.md`, used as gates:

| Gate | Status |
|---|---|
| Times in São Paulo, ISO with `-03:00`, compare as `Date`, no tz library | PASS: the new module only compares `Date` instants |
| ClassInd ratings only; `18` never reaches a kids profile | PASS: the response carries `rating` so a future kids filter can apply (FR-010); no kids profile exists yet |
| Do not touch `src/legacy/importer.js` or `data/schedule.json` | PASS: neither is read or edited by the new code beyond the existing store |
| Data access only through `src/epg/store.js` | PASS |
| Channel validation stays in `app.js`, limits and dedup in `favorites.js` | PASS: untouched |
| Runtime dependencies stay `express` only | PASS |
| Tests: fix the code, never weaken tests | PASS: only new tests are added |

Post-design re-check (after Phase 1): all gates still PASS. No Complexity Tracking entries are needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-programme-reminders/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entities
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   └── reminders-api.md # Phase 1 HTTP contract
├── checklists/
│   └── requirements.md
└── tasks.md             # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app.js                    # + GET /users/:userId/reminders (validates `at`, delegates)
├── epg/
│   └── reminders.js          # NEW: pure upcomingReminders(channelIds, now, leadMinutes)
└── users/favorites.js        # unchanged (read via list())

public/
├── index.html                # + #reminders container and toast styles
└── app.js                    # + polling, toast rendering, dismiss, seen-set in localStorage, `?now=` override

tests/
├── reminders.test.js         # NEW: unit tests for the pure logic
└── reminders.api.test.js     # NEW: endpoint tests (supertest)

e2e/
└── reminders.spec.js         # NEW: Playwright scenarios
```

**Structure Decision**: Keep the existing single-project layout. The reminder rule goes in a new pure module under `src/epg/`, next to `nowPlaying.js`, so it depends only on `store` and is easy to unit test. The Express route stays thin and follows the `now-playing` pattern (`?at=`), and the front end remains plain JS in `public/`.

## Complexity Tracking

No constitution violations to justify.
