'use strict';
const store = require('./store');

const LEAD_MINUTES = 10;
const MS_PER_MINUTE = 60 * 1000;

// Programmes on the given channels that start within the next `leadMinutes` of `now`.
// A programme qualifies when now < start <= now + leadMinutes (compared as instants,
// so São Paulo midnight and the UTC day boundary need no special handling).
function upcomingReminders(channelIds, now = new Date(), leadMinutes = LEAD_MINUTES) {
  const wanted = new Set(channelIds);
  const limit = now.getTime() + leadMinutes * MS_PER_MINUTE;
  const channelNumber = new Map(store.getChannels().map((c) => [c.id, c.number]));

  return store
    .getProgrammes()
    .filter((p) => wanted.has(p.channelId))
    .map((p) => ({ programme: p, startMs: new Date(p.start).getTime() }))
    .filter(({ startMs }) => startMs > now.getTime() && startMs <= limit)
    .sort((a, b) => a.startMs - b.startMs || channelNumber.get(a.programme.channelId) - channelNumber.get(b.programme.channelId))
    .map(({ programme: p, startMs }) => ({
      programmeId: p.id,
      channelId: p.channelId,
      channelName: store.getChannel(p.channelId).name,
      title: p.title,
      start: p.start,
      rating: p.rating,
      minutesRemaining: Math.ceil((startMs - now.getTime()) / MS_PER_MINUTE),
    }));
}

module.exports = { upcomingReminders, LEAD_MINUTES };
