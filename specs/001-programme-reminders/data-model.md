# Data Model: Programme Reminders

No new persisted data on the server. Existing entities are reused; the reminder is derived at read time (as the project requires for new programme fields).

## Existing entities (unchanged)

- **Channel** (`data/channels.json` via `store.getChannel(id)`): `id`, `name`, `number`.
- **Programme** (`data/schedule.json` via `store.getProgrammes()`): `id`, `channelId`, `title`, `rating` (ClassInd: `L`, `10`, `12`, `14`, `16`, `18`), `live`, `start`, `end` (ISO strings with `-03:00`).
- **Favourites** (`src/users/favorites.js`): per `userId`, an ordered list of channel ids, max 50.

## Reminder (derived, not stored on the server)

Computed for a user at a given instant `now`.

| Field | Type | Source / rule |
|---|---|---|
| `programmeId` | string | `Programme.id` |
| `channelId` | string | `Programme.channelId` |
| `channelName` | string | Channel lookup |
| `title` | string | `Programme.title` |
| `start` | ISO string (`-03:00`) | `Programme.start` |
| `rating` | ClassInd code | `Programme.rating` (kept so a future kids filter can apply) |
| `minutesRemaining` | integer 1–10 | `ceil((start − now) / 60000)` |

**Inclusion rule**: `channelId` ∈ the user's favourites AND `now < start <= now + 10 min` (compared as `Date` instants).

**Ordering**: ascending `start`, then channel number, so two simultaneous reminders have a stable order.

## Browser-side state

| Item | Where | Content |
|---|---|---|
| Seen set | `localStorage`, key `mini-epg:reminders-seen:<userId>` | Map of `programmeId → start ISO`. Entries whose `start` is more than 24 h before the current "now" are pruned on load |
| Visible reminders | DOM only | Items currently on screen |
| Clock offset | memory | `override − realNow` when `?now=` is given; `0` otherwise |

## State transitions of a reminder in the browser

```text
(not in window) ──enters window──▶ eligible ──not in seen set──▶ VISIBLE ──dismiss──▶ DISMISSED (in seen set)
                                                         │
                                                         └── programme starts ──▶ REMOVED (in seen set)
```

A programme id enters the seen set the moment its reminder is first shown, so reload never shows it again.
