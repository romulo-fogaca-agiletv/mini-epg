# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reference docs

@ARCHITECTURE.md
@PRODUCT.md

## Commands

```bash
npm test                                # all jest tests
npx jest tests/channels.test.js         # one file
npx jest -t "returns the channel list"  # one test by name
npm run test:e2e                        # Playwright; needs `npx playwright install chromium` once
npm start                               # http://localhost:3000
```

## Conventions

- **Times are always America/Sao_Paulo.** Stored and returned as ISO strings with a fixed `-03:00` offset (no DST since 2019). Do not add timezone libraries. Compare instants via `Date`, never by slicing UTC strings; a São Paulo day is 03:00Z to 03:00Z.
- **Ratings are ClassInd only:** `L`, `10`, `12`, `14`, `16`, `18`. Never US/other scales. `18` must never reach a kids profile.
- `docs/architecture-old.md` is obsolete (Redis, Elasticsearch, moment-timezone, US ratings); trust the code.

## Do not touch

- `src/legacy/importer.js`: undocumented business rules, owner gone. Do not edit, refactor or reformat it, not even to export constants.
- `data/schedule.json`: regenerated nightly by the importer; hand edits are lost. Derive new programme fields at read time.

## Tests

When a test fails, fix the code. Do not weaken, skip or delete the test, loosen assertions, or change expected values to match buggy output, unless the user confirms the expected behaviour itself changed.
