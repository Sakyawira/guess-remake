export const FAVOURITES_STORAGE_KEY = 'guess-remake:favourites:v1';
const MAX_FAVOURITES = 10_100;

export function readFavourites(storage?: Pick<Storage, 'getItem'>): Set<string> {
  try {
    const value = (storage ?? window.localStorage).getItem(FAVOURITES_STORAGE_KEY);
    if (!value) return new Set();
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length > MAX_FAVOURITES) return new Set();
    return new Set(
      parsed.filter((id): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
    );
  } catch {
    return new Set();
  }
}

export function writeFavourites(ids: Set<string>, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    (storage ?? window.localStorage).setItem(FAVOURITES_STORAGE_KEY, JSON.stringify([...ids]));
    return true;
  } catch {
    return false;
  }
}
