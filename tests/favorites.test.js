const favorites = require('../src/users/favorites');

describe('favorites', () => {
  beforeEach(() => favorites._reset());

  it(`allows exactly MAX_FAVORITES (${favorites.MAX_FAVORITES}) and rejects one more`, () => {
    for (let i = 0; i < favorites.MAX_FAVORITES; i++) {
      expect(favorites.add('u1', 'ch' + i).ok).toBe(true);
    }
    expect(favorites.list('u1')).toHaveLength(favorites.MAX_FAVORITES);

    const extra = favorites.add('u1', 'one-too-many');
    expect(extra.ok).toBe(false);
    expect(favorites.list('u1')).toHaveLength(favorites.MAX_FAVORITES);
  });

  it('re-adding an existing favorite at the limit is still ok', () => {
    for (let i = 0; i < favorites.MAX_FAVORITES; i++) favorites.add('u1', 'ch' + i);
    expect(favorites.add('u1', 'ch0').ok).toBe(true);
  });
});
