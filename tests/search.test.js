const { search } = require('../src/epg/search');

describe('search', () => {
  it('finds channels ignoring case and accents', () => {
    expect(search('sao paulo').channels.map((c) => c.id)).toContain('spesp');
  });

  it('finds programmes ignoring case and accents', () => {
    expect(search('VOLEI').programmes.map((p) => p.title)).toContain('Vôlei Superliga');
  });
});
