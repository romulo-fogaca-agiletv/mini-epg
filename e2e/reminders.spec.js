const { test, expect } = require('@playwright/test');

const USER = 'demo-user';
// spesp "Luta Livre Extrema" and notbr "Jornal da Manhã" both start 2026-10-20 20:00 (-03:00).
const TEN_MIN_BEFORE = '2026-10-20T19:50:00-03:00';
const guideAt = (iso) => `/?now=${encodeURIComponent(iso)}`;
const reminders = (page) => page.getByTestId('reminders').locator('.reminder');

// Favorites live in server memory and the server may be reused, so start each test clean.
test.beforeEach(async ({ request }) => {
  const res = await request.get(`/users/${USER}/favorites`);
  for (const id of (await res.json()).favorites) {
    await request.delete(`/users/${USER}/favorites/${id}`);
  }
});

const favorite = (request, channelId) => request.post(`/users/${USER}/favorites`, { data: { channelId } });

test('guide shows the programme title when a favourite channel starts a programme in 10 minutes', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await expect(reminders(page)).toContainText('Luta Livre Extrema');
});

test('guide shows the channel name when a favourite channel starts a programme in 10 minutes', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await expect(reminders(page)).toContainText('São Paulo Esporte');
});

test('guide shows the start time in São Paulo time when a reminder appears', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await expect(reminders(page)).toContainText('20:00');
});

test('guide shows exactly one reminder when one favourite channel has a programme in the window', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await expect(reminders(page)).toHaveCount(1);
});

test('guide shows no reminder when the channel with a programme in the window is not a favourite', async ({ page, request }) => {
  await favorite(request, 'infmu');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await expect(page.locator('li[data-channel-id="infmu"] .star')).toHaveClass(/\bon\b/); // guide has loaded
  await expect(reminders(page)).toHaveCount(0);
});

test('guide shows a reminder for each favourite channel when two programmes start at the same time', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await favorite(request, 'notbr');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await expect(reminders(page)).toHaveCount(2);
});
