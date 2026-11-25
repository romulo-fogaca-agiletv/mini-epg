/* Minimal guide UI. No framework on purpose. */
const USER_ID = 'demo-user';
const TODAY = '2026-10-20'; // demo data covers 2026-10-20 and 2026-10-21

async function api(path, options) {
  const res = await fetch(path, options);
  return res.json();
}

function fmt(iso) {
  return iso.slice(11, 16);
}

async function loadChannels() {
  const [channels, fav] = await Promise.all([api('/channels'), api(`/users/${USER_ID}/favorites`)]);
  const list = document.getElementById('channels');
  list.innerHTML = '';
  for (const ch of channels) {
    const li = document.createElement('li');
    li.dataset.channelId = ch.id;
    const isFav = fav.favorites.includes(ch.id);
    li.innerHTML = `<span>${ch.number} · ${ch.name}</span>
      <button class="star ${isFav ? 'on' : ''}" aria-label="Favoritar ${ch.name}">★</button>`;
    li.querySelector('span').addEventListener('click', () => loadSchedule(ch.id, li));
    li.querySelector('.star').addEventListener('click', (e) => toggleFavorite(ch.id, e.target));
    list.appendChild(li);
  }
}

async function loadSchedule(channelId, li) {
  document.querySelectorAll('#channels li').forEach((el) => el.classList.remove('active'));
  li.classList.add('active');
  const data = await api(`/channels/${channelId}/schedule?date=${TODAY}`);
  const grid = document.getElementById('grid');
  grid.innerHTML = `<h2>${data.channel.name}</h2>` + data.programmes
    .map((p) => `<div class="prog"><span class="time">${fmt(p.start)}–${fmt(p.end)}</span>${p.title}<span class="rating">${p.rating}</span></div>`)
    .join('');
}

async function toggleFavorite(channelId, button) {
  if (button.classList.contains('on')) {
    await api(`/users/${USER_ID}/favorites/${channelId}`, { method: 'DELETE' });
    button.classList.remove('on');
  } else {
    await api(`/users/${USER_ID}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
    button.classList.add('on');
  }
  pollReminders(); // reminders follow the favourites right away
}

let timer;
document.getElementById('search').addEventListener('input', (e) => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const q = e.target.value;
    const out = document.getElementById('results');
    if (!q) { out.textContent = ''; return; }
    const r = await api(`/search?q=${encodeURIComponent(q)}`);
    out.textContent = `${r.channels.length} canais, ${r.programmes.length} programas: ` +
      [...r.channels.map((c) => c.name), ...r.programmes.map((p) => p.title)].slice(0, 8).join(', ');
  }, 250);
});

// --- Programme reminders -------------------------------------------------
const REMINDER_POLL_MS = 15000;

// Guide clock: the real time, or the instant in ?now= advancing with real elapsed time.
const clockOffsetMs = (() => {
  const override = new URLSearchParams(location.search).get('now');
  const ms = override ? Date.parse(override) : NaN;
  return Number.isNaN(ms) ? 0 : ms - Date.now();
})();
const guideNow = () => new Date(Date.now() + clockOffsetMs);

const SEEN_KEY = `mini-epg:reminders-seen:${USER_ID}`;
const SEEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Reminders already shown or dismissed in this browser: programmeId -> start ISO.
// Survives reloads, so a reminder is never shown twice (FR-004). Old entries are pruned.
function loadSeen() {
  try {
    const stored = JSON.parse(localStorage.getItem(SEEN_KEY)) || {};
    const cutoff = guideNow().getTime() - SEEN_MAX_AGE_MS;
    return Object.fromEntries(Object.entries(stored).filter(([, start]) => Date.parse(start) >= cutoff));
  } catch (err) {
    return {};
  }
}
const seen = loadSeen();
function markSeen(r) {
  seen[r.programmeId] = r.start;
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (err) { /* storage unavailable: shown once per page load */ }
}

const minutesLeft = (startIso) => Math.ceil((Date.parse(startIso) - guideNow().getTime()) / 60000);

function setReminderText(el) {
  // textContent elsewhere keeps titles from being interpreted as HTML.
  el.querySelector('.reminder-when').textContent = `começa em ${minutesLeft(el.dataset.start)} min · ${fmt(el.dataset.start)}`;
}

function createReminder(r) {
  const el = document.createElement('div');
  el.className = 'reminder';
  el.dataset.programmeId = r.programmeId;
  el.dataset.channelId = r.channelId;
  el.dataset.start = r.start;
  for (const cls of ['reminder-when', 'reminder-title', 'reminder-channel']) {
    const line = document.createElement('div');
    line.className = cls;
    el.appendChild(line);
  }
  el.querySelector('.reminder-title').textContent = r.title;
  el.querySelector('.reminder-channel').textContent = r.channelName;
  const close = document.createElement('button');
  close.className = 'reminder-dismiss';
  close.setAttribute('aria-label', `Dispensar lembrete: ${r.title}`);
  close.textContent = '×';
  close.addEventListener('click', () => el.remove());
  el.appendChild(close);
  setReminderText(el);
  return el;
}

// Reconcile the screen with the server answer: keep what is still due, add what is new and not
// seen before, drop what is no longer due (programme started, channel no longer a favourite).
function syncReminders(reminders) {
  const box = document.getElementById('reminders');
  const due = new Set(reminders.map((r) => r.programmeId));
  for (const el of [...box.children]) {
    if (!due.has(el.dataset.programmeId)) el.remove();
  }
  for (const r of reminders) {
    const visible = box.querySelector(`[data-programme-id="${r.programmeId}"]`);
    if (visible) continue;
    if (seen[r.programmeId]) continue;
    markSeen(r);
    box.appendChild(createReminder(r));
  }
}

// Every second: refresh the minutes left and drop reminders whose programme has started.
function tickReminders() {
  for (const el of document.querySelectorAll('#reminders .reminder')) {
    if (Date.parse(el.dataset.start) <= guideNow().getTime()) el.remove();
    else setReminderText(el);
  }
}

async function pollReminders() {
  try {
    const data = await api(`/users/${USER_ID}/reminders?at=${encodeURIComponent(guideNow().toISOString())}`);
    syncReminders(data.reminders || []);
  } catch (err) {
    console.error('reminders poll failed', err);
  }
}

loadChannels();
pollReminders();
setInterval(pollReminders, REMINDER_POLL_MS);
setInterval(tickReminders, 1000);
