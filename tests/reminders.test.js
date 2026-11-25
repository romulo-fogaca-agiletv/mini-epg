const { upcomingReminders } = require('../src/epg/reminders');

// spesp p0011 starts 17:00 and p0012 starts 20:00 on 2026-10-20 (p0011 ends when p0012 starts).
// notbr p0028 also starts at 20:00. spesp p0107 starts 2026-10-21T00:00-03:00.
const at = (hhmmss) => new Date(`2026-10-20T${hhmmss}-03:00`);
const ids = (list) => list.map((r) => r.programmeId);

describe('upcomingReminders', () => {
  it('includes the programme when it starts in exactly 10 minutes', () => {
    expect(ids(upcomingReminders(['spesp'], at('19:50:00')))).toEqual(['p0012']);
  });

  it('returns the programme details when a programme is in the window', () => {
    const [r] = upcomingReminders(['spesp'], at('19:50:00'));
    expect(r).toMatchObject({
      programmeId: 'p0012',
      channelId: 'spesp',
      channelName: 'São Paulo Esporte',
      title: 'Luta Livre Extrema',
      start: '2026-10-20T20:00:00-03:00',
      rating: expect.any(String),
    });
  });

  it('sets minutesRemaining to 10 when the programme starts in exactly 10 minutes', () => {
    expect(upcomingReminders(['spesp'], at('19:50:00'))[0].minutesRemaining).toBe(10);
  });

  it('sets minutesRemaining to the real minutes left when the window is already open', () => {
    expect(upcomingReminders(['spesp'], at('19:57:00'))[0].minutesRemaining).toBe(3);
  });

  it('rounds minutesRemaining up when part of a minute is left', () => {
    expect(upcomingReminders(['spesp'], at('19:59:30'))[0].minutesRemaining).toBe(1);
  });

  it('excludes the programme when it starts in more than 10 minutes', () => {
    expect(ids(upcomingReminders(['spesp'], at('19:49:59')))).not.toContain('p0012');
  });

  it('excludes the programme when it starts at exactly the current instant', () => {
    expect(ids(upcomingReminders(['spesp'], at('20:00:00')))).not.toContain('p0012');
  });

  it('excludes the programme when it has already started', () => {
    expect(ids(upcomingReminders(['spesp'], at('20:05:00')))).not.toContain('p0012');
  });

  it('excludes the channel when it is not in the favourites list', () => {
    expect(upcomingReminders(['notbr'], at('19:50:00')).map((r) => r.channelId)).toEqual(['notbr']);
  });

  it('returns an empty list when there are no favourites', () => {
    expect(upcomingReminders([], at('19:50:00'))).toEqual([]);
  });

  it('returns one reminder per favourite channel when programmes start at the same time', () => {
    const list = upcomingReminders(['notbr', 'spesp'], at('19:50:00'));
    expect(list).toHaveLength(2);
  });

  it('sorts reminders by channel number when programmes start at the same time', () => {
    const list = upcomingReminders(['notbr', 'spesp'], at('19:50:00'));
    expect(list.map((r) => r.channelId)).toEqual(['spesp', 'notbr']); // 101 before 102
  });

  it('gives the first of two back-to-back programmes its own reminder at its own 10-minute mark', () => {
    expect(ids(upcomingReminders(['spesp'], at('16:50:00')))).toEqual(['p0011']);
  });

  it('gives the second of two back-to-back programmes its own reminder at its own 10-minute mark', () => {
    expect(ids(upcomingReminders(['spesp'], at('19:50:00')))).toEqual(['p0012']);
  });

  it('includes a programme starting after midnight when the instant is before midnight', () => {
    expect(ids(upcomingReminders(['spesp'], at('23:50:00')))).toEqual(['p0107']);
  });

  it('keeps the São Paulo offset in start when the programme starts after midnight', () => {
    expect(upcomingReminders(['spesp'], at('23:50:00'))[0].start).toBe('2026-10-21T00:00:00-03:00');
  });

  it('includes the programme when the instant falls on the next UTC day', () => {
    // 23:50 in São Paulo on 2026-10-20 is 02:50Z on 2026-10-21
    const list = upcomingReminders(['spesp'], new Date('2026-10-21T02:50:00Z'));
    expect(ids(list)).toEqual(['p0107']);
  });
});
