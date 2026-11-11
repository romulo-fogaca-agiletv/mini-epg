'use strict';
const store = require('./store');

const MAX_RESULTS = 20;

// Lowercase and strip accents so "sao paulo" matches "São Paulo".
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Searches channel names and programme titles (case- and accent-insensitive).
function search(query) {
  if (!query || !query.trim()) return { channels: [], programmes: [] };
  const q = normalize(query.trim());

  const channels = store
    .getChannels()
    .filter((c) => normalize(c.name).includes(q));

  const programmes = store
    .getProgrammes()
    .filter((p) => normalize(p.title).includes(q))
    .slice(0, MAX_RESULTS);

  return { channels, programmes };
}

module.exports = { search, MAX_RESULTS };
