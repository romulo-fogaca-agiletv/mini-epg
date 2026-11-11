---
name: story-to-test-plan
description: Turn a user story with acceptance criteria into a test plan table that assigns each check to the right level — unit (jest), API (jest + supertest) or e2e (Playwright). Use when the user pastes or links a user story, Jira ticket or list of acceptance criteria and asks for a test plan, test cases, test scenarios, "what should we test", or coverage for a feature in mini-epg.
---

# Story → test plan

Produce a test plan table from a user story and its acceptance criteria (AC). The plan is a design document: **do not write test code** unless the user asks for it afterwards.

## 1. Get the story

- Story text pasted in chat → use it as is.
- Jira key or link (e.g. `EPG-123`) → read it with the Atlassian tools (`getJiraIssue`), taking the summary, description and acceptance-criteria field.
- No AC present → stop and ask for them. Do not invent acceptance criteria.

Number the ACs `AC1`, `AC2`, … in the order given, so every row can trace back to one.

## 2. Ground it in the code

Before choosing levels, look at what the story touches so the plan names real units and routes:

- Routes live in `src/app.js`; guide logic in `src/epg/*`; favorites in `src/users/favorites.js`; the web guide in `public/`.
- Read `PRODUCT.md` for existing rules the story may change or depend on (favorites limit, ClassInd, search behaviour, São Paulo day).
- Check `tests/` and `e2e/` for coverage that already exists; mark such rows **Existing** instead of proposing duplicates.
- If the story contradicts a documented rule or is ambiguous, list it under **Open questions** rather than guessing the expected result.

## 3. Pick the level for each check

Choose the **lowest level that can prove the behaviour**:

| Level | Use for | Tooling in this repo |
|---|---|---|
| **Unit** | Pure logic in one module: calculations, filters, limits, date-range math, rating checks. Call the function directly. | jest, `tests/<module>.test.js` |
| **API** | HTTP contract: status codes, response shape, query params, validation across modules (e.g. unknown channel → 400/404). | jest + supertest on `require('../src/app')` |
| **E2E** | What the user sees or does in the browser: clicks, rendering, debounce, error feedback in `public/`. Only for flows the UI actually exposes. | Playwright, `e2e/` |

Rules of thumb:
- One acceptance criterion usually yields **several rows**: the happy path, each boundary, and each negative case.
- Push down: if a unit test proves the rule, the API row only checks the wiring (status + one representative case), and the e2e row only checks the user-visible effect.
- An API-only feature (no UI in `public/`) gets **no e2e row**; say so in Notes.

## 4. Always probe these project-specific risks

Add rows whenever the story touches the area:

- **Time:** São Paulo day is `03:00Z → 03:00Z`; programmes that cross midnight; the 21:00–00:00 SP window (where UTC is already the next day); default date when `?date=` is missing. All times are `-03:00` ISO strings.
- **Ratings:** only ClassInd `L`, `10`, `12`, `14`, `16`, `18`; a `18` programme must never reach a kids profile — include a negative row for every surface (schedule, now-playing, search) the story exposes to kids.
- **Favorites:** exactly 50 allowed, the 51st rejected with 409; duplicates; unknown channel → 400; order preserved.
- **Search:** case and accent sensitivity; 20-programme cap.
- **Data:** never plan to hand-edit `data/schedule.json` or change `src/legacy/importer.js`; tests needing special data should use fixtures or mocks of `src/epg/store.js`.

## 5. Output format

Write in the language of the story (Portuguese story → Portuguese plan). Output exactly these sections:

**Summary** — one or two sentences: what the story changes and which modules it touches.

**Test plan**

| ID | AC | Level | Scenario | Preconditions / data | Steps | Expected result | Priority | Status |
|---|---|---|---|---|---|---|---|---|
| T1 | AC1 | Unit | `favorites.add` rejects the 51st channel | user has 50 favorites | call `add(user, 'spesp')` | throws/returns limit error; list stays at 50 | High | New |

Column rules:
- **ID** `T1`, `T2`, … ; group rows by AC, then by level (Unit → API → E2E).
- **AC** the AC number(s) the row proves; use `—` for project-risk rows not tied to an AC.
- **Scenario** in the repo's test-name style: "unit does what when condition" (it should be usable directly as the `it(...)` name).
- **Expected result** is concrete: status code, exact message, count, field value. Never "works correctly".
- **Priority** High (AC happy path, legal/rating rules, data loss), Medium (boundaries, validation), Low (cosmetic).
- **Status** `New` or `Existing (tests/file.test.js)`.

**Coverage by AC** — a short table `AC | Unit | API | E2E` with counts, so gaps are obvious. Every AC must have at least one row; flag any that cannot be tested and why.

**Open questions** — ambiguities and conflicts with `PRODUCT.md`, each with the assumption you used (if any).

**Out of scope** — things deliberately not covered (e.g. performance, VOD).

## 6. After the table

Offer, in one line, to generate the test files for the `New` rows. If the user accepts, follow `.claude/rules/testing.md` (one behaviour per test, jest + supertest, never weaken assertions).
