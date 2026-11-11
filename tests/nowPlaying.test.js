const { nowPlaying } = require('../src/epg/nowPlaying');

const onChannel = (at, channelId) =>
  nowPlaying(new Date(at)).find((r) => r.channel.id === channelId).programme;

describe('nowPlaying', () => {
  it('finds the programme during the day', () => {
    expect(onChannel('2026-10-20T14:00:00-03:00', 'spesp').title).toBe('Vôlei Superliga');
  });

  it('works between 21h and midnight São Paulo (next UTC day)', () => {
    // 22:30 local on 2026-10-20 is 01:30Z on 2026-10-21
    expect(onChannel('2026-10-21T01:30:00Z', 'spesp').title).toBe('Resenha Esportiva');
  });

  it('returns null when nothing is on air', () => {
    expect(onChannel('2030-01-01T12:00:00Z', 'spesp')).toBeNull();
  });
});
