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

// --- User Story 2: reminders follow changes to favourites ---------------------
const star = (page, channelId) => page.locator(`li[data-channel-id="${channelId}"] .star`);

test('guide shows a reminder right away when the viewer favourites a channel whose programme is in the window', async ({ page }) => {
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await star(page, 'spesp').click();
  await expect(reminders(page)).toContainText('Luta Livre Extrema');
});

test('guide shows the reminder when the clock reaches the window after the viewer favourited the channel', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto(guideAt('2026-10-20T19:49:50-03:00'));
  await star(page, 'spesp').click();
  await expect(reminders(page)).toHaveCount(0);
  await expect(reminders(page)).toContainText('Luta Livre Extrema', { timeout: 30000 });
});

test('guide removes a visible reminder when the viewer unfavourites its channel', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await expect(reminders(page)).toHaveCount(1);
  await star(page, 'spesp').click();
  await expect(reminders(page)).toHaveCount(0);
});

// --- User Story 3: dismiss, once-only and no confusing reminders --------------
const dismissButton = (page) => reminders(page).first().getByRole('button', { name: /dispensar/i });

test('guide removes the reminder when the viewer dismisses it', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await dismissButton(page).click();
  await expect(reminders(page)).toHaveCount(0);
});

test('guide does not show a dismissed reminder again after reload', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await dismissButton(page).click();
  await page.reload();
  await expect(star(page, 'spesp')).toHaveClass(/\bon\b/); // guide has loaded and polled
  await expect(reminders(page)).toHaveCount(0);
});

test('guide does not show a reminder again after reload when it was shown but not dismissed', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt(TEN_MIN_BEFORE));
  await expect(reminders(page)).toHaveCount(1);
  await page.reload();
  await expect(star(page, 'spesp')).toHaveClass(/\bon\b/);
  await expect(reminders(page)).toHaveCount(0);
});

test('guide shows the real minutes left when it opens 3 minutes before the programme', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt('2026-10-20T19:57:00-03:00'));
  await expect(reminders(page)).toContainText('3 min');
});

test('guide shows no reminder when the programme has already started', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt('2026-10-20T20:05:00-03:00'));
  await expect(star(page, 'spesp')).toHaveClass(/\bon\b/);
  await expect(reminders(page)).toHaveCount(0);
});

test('guide removes a reminder on its own when the programme starts', async ({ page, request }) => {
  await favorite(request, 'spesp');
  await page.goto(guideAt('2026-10-20T19:59:57-03:00'));
  await expect(reminders(page)).toHaveCount(1);
  await expect(reminders(page)).toHaveCount(0, { timeout: 10000 });
});
