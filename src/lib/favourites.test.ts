import { describe, expect, it } from 'vitest';
import { videoFixture } from '@/test/fixtures';
import { FAVOURITES_STORAGE_KEY, readFavourites, writeFavourites } from './favourites';

describe('personal browser favourites', () => {
  it('persists and restores id selections', () => {
    const ids = new Set([videoFixture().id]);
    expect(writeFavourites(ids)).toBe(true);
    expect(readFavourites()).toEqual(ids);
    expect(localStorage.getItem(FAVOURITES_STORAGE_KEY)).toBe(JSON.stringify([...ids]));
  });
  it('ignores invalid storage records', () => {
    localStorage.setItem(FAVOURITES_STORAGE_KEY, 'not-json');
    expect(readFavourites().size).toBe(0);
    localStorage.setItem(
      FAVOURITES_STORAGE_KEY,
      JSON.stringify([videoFixture().id, 12, '<script>', null])
    );
    expect(readFavourites()).toEqual(new Set([videoFixture().id]));
  });
  it('does not crash when browser storage is blocked', () => {
    const storage = {
      getItem() {
        throw new DOMException('Blocked', 'SecurityError');
      },
      setItem() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    };
    expect(readFavourites(storage).size).toBe(0);
    expect(writeFavourites(new Set([videoFixture().id]), storage)).toBe(false);
  });
});
