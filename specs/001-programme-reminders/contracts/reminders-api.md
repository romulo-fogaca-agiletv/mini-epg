# Contract: Reminders API

## `GET /users/:userId/reminders`

Programmes on the user's favourite channels that start within the next 10 minutes of the given moment.

### Query parameters

| Name | Required | Format | Default |
|---|---|---|---|
| `at` | no | ISO 8601 instant, e.g. `2026-10-20T19:50:00-03:00` | the current time |

### Responses

**200 OK**

```json
{
  "at": "2026-10-20T19:50:00-03:00",
  "leadMinutes": 10,
  "reminders": [
    {
      "programmeId": "p0123",
      "channelId": "spesp",
      "channelName": "SP Esportes",
      "title": "Jogo da Rodada",
      "start": "2026-10-20T20:00:00-03:00",
      "rating": "L",
      "minutesRemaining": 10
    }
  ]
}
```

- `reminders` is `[]` when the user has no favourites or nothing starts in the window.
- Each reminder satisfies `at < start <= at + 10 min`.
- Ordered by `start` ascending, then channel number.
- `at` in the body is echoed back as received (normalised to ISO), and is the instant the evaluation used.

**400 Bad Request** when `at` is present but is not a valid date:

```json
{ "error": "Invalid 'at' (expected ISO 8601 date-time)" }
```

### Behaviour notes

- A user without favourites (or unknown `userId`) gets `200` with an empty list, consistent with `GET /users/:userId/favorites`.
- Read-only: no state changes on the server.
- No authentication, like the other `/users/:userId/...` routes (known product gap).
- A channel that was favourited but no longer exists in the channel list simply yields no reminders.

## Guide URL parameter

`/?now=<ISO 8601 instant>` makes the guide start its internal clock at that instant, then advance with real elapsed time. It affects only the `at` sent to the endpoint above and the minutes shown. Without it, the guide uses the real clock. If the value is not a valid ISO 8601 instant, it is ignored and the guide uses the real clock.
