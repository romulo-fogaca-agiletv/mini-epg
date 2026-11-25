const request = require('supertest');
const app = require('../src/app');
const favorites = require('../src/users/favorites');

const USER = 'reminder-user';
const AT = '2026-10-20T19:50:00-03:00'; // 10 min before spesp p0012 and notbr p0028 (both 20:00)

const getReminders = (userId, at) => request(app).get(`/users/${userId}/reminders`).query(at ? { at } : {});

beforeEach(() => favorites._reset());

describe('GET /users/:userId/reminders', () => {
  it('returns 200 when the user has a favourite channel with a programme in the window', async () => {
    favorites.add(USER, 'spesp');
    const res = await getReminders(USER, AT);
    expect(res.status).toBe(200);
  });

  it('returns the programme starting in 10 minutes when its channel is a favourite', async () => {
    favorites.add(USER, 'spesp');
    const res = await getReminders(USER, AT);
    expect(res.body.reminders).toEqual([
      expect.objectContaining({
        programmeId: 'p0012',
        channelId: 'spesp',
        title: 'Luta Livre Extrema',
        start: '2026-10-20T20:00:00-03:00',
        minutesRemaining: 10,
      }),
    ]);
  });

  it('echoes the evaluated instant as at when at is given', async () => {
    const res = await getReminders(USER, AT);
    expect(new Date(res.body.at).getTime()).toBe(new Date(AT).getTime());
  });

  it('returns leadMinutes 10 when the request succeeds', async () => {
    const res = await getReminders(USER, AT);
    expect(res.body.leadMinutes).toBe(10);
  });

  it('omits programmes on channels that are not favourites', async () => {
    favorites.add(USER, 'spesp');
    const res = await getReminders(USER, AT);
    expect(res.body.reminders.map((r) => r.channelId)).toEqual(['spesp']);
  });

  it('returns an empty list when the user has no favourites', async () => {
    const res = await getReminders(USER, AT);
    expect(res.body.reminders).toEqual([]);
  });

  it('returns 200 when the userId is unknown', async () => {
    const res = await getReminders('nobody', AT);
    expect(res.status).toBe(200);
  });

  it('returns an empty list when nothing starts in the window', async () => {
    favorites.add(USER, 'spesp');
    const res = await getReminders(USER, '2026-10-20T19:00:00-03:00');
    expect(res.body.reminders).toEqual([]);
  });

  it('returns 400 when at is not a valid date', async () => {
    const res = await getReminders(USER, 'not-a-date');
    expect(res.status).toBe(400);
  });

  it('returns the error message from the contract when at is not a valid date', async () => {
    const res = await getReminders(USER, 'not-a-date');
    expect(res.body.error).toMatch(/Invalid 'at'/);
  });

  it('returns 200 when at is missing', async () => {
    const res = await getReminders(USER);
    expect(res.status).toBe(200);
  });

  it('evaluates at the current time when at is missing', async () => {
    const res = await getReminders(USER);
    expect(Math.abs(new Date(res.body.at).getTime() - Date.now())).toBeLessThan(5000);
  });
});
