import { beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, videoFixture } from '@/test/fixtures';
import { api, ApiError, normaliseVideo, youtubeEmbedUrl } from './api';

const FETCH = vi.fn<typeof fetch>();
beforeEach(() => {
  FETCH.mockReset();
  vi.stubGlobal('fetch', FETCH);
});

describe('gameplay-only API', () => {
  it('uses bounded pages and only the public gameplay header', async () => {
    FETCH.mockResolvedValue(jsonResponse([videoFixture()]));
    await api.listVideos(100);
    const [url, options] = FETCH.mock.calls[0];
    expect(url).toBe('https://api.example/videos?limit=100&offset=100');
    const headers = new Headers(options?.headers);
    expect(headers.get('X-API-Key')).toBe('public-test-client-key');
    expect(headers.get('X-Admin-Key')).toBeNull();
    expect(api).not.toHaveProperty('importVideo');
    expect(api).not.toHaveProperty('deleteVideo');
    expect(api).not.toHaveProperty('setFavourite');
  });

  it('rejects offsets outside the backend contract', async () => {
    for (const offset of [-1, 10001, 1.5]) {
      await expect(api.listVideos(offset)).rejects.toThrow('supported range');
    }
    expect(FETCH).not.toHaveBeenCalled();
  });

  it('ignores shared server favourites and normalizes MongoDB ids', () => {
    const raw = { ...videoFixture(), id: undefined, _id: videoFixture().id, isFavourite: true };
    expect(normaliseVideo(raw)).toMatchObject({ id: videoFixture().id, isFavourite: false });
    expect(() => normaliseVideo({ ...raw, videoLength: 'unsafe' })).toThrow();
  });

  it.each([401, 403])(
    'explains rejected gameplay access without echoing server details (%s)',
    async (status) => {
      FETCH.mockResolvedValue(jsonResponse({ message: 'do-not-show-server-details' }, status));
      await expect(api.listVideos()).rejects.toThrow('API key is missing or invalid');
    }
  );

  it('uses the exposed Retry-After value for rate-limit feedback', async () => {
    FETCH.mockResolvedValue(jsonResponse({}, 429, { 'Retry-After': '12' }));
    await expect(api.listVideos()).rejects.toMatchObject({ status: 429, retryAfterSeconds: 12 });
    await expect(api.listVideos()).rejects.toThrow('12 seconds');
  });

  it('falls back safely when Retry-After is absent or invalid', async () => {
    FETCH.mockResolvedValue(jsonResponse({}, 429, { 'Retry-After': 'not-a-duration' }));
    await expect(api.listVideos()).rejects.toMatchObject({ retryAfterSeconds: 60 });
  });

  it('turns transport errors into a useful message', async () => {
    FETCH.mockRejectedValue(new TypeError('private transport failure'));
    await expect(api.listVideos()).rejects.toThrow('Could not reach the game server');
  });

  it('rejects malformed response shapes', async () => {
    FETCH.mockResolvedValue(jsonResponse({ items: [] }));
    await expect(api.listVideos()).rejects.toThrow('invalid video list');
  });

  it('fails clearly before fetching when the gameplay key is not configured', async () => {
    vi.stubEnv('VITE_API_KEY', '');
    vi.resetModules();
    const { api: unconfigured } = await import('./api');
    await expect(unconfigured.listVideos()).rejects.toThrow('not configured');
    expect(FETCH).not.toHaveBeenCalled();
  });

  it('limits leaderboard reads and submits gameplay scores', async () => {
    FETCH.mockResolvedValueOnce(
      jsonResponse([{ id: videoFixture().id, playerName: 'Player', score: 100 }])
    );
    expect(await api.listLeaderBoard()).toHaveLength(1);
    expect(FETCH.mock.calls[0][0]).toBe('https://api.example/leaderboards?limit=100&offset=0');
    FETCH.mockResolvedValueOnce(jsonResponse({}));
    await api.addLeaderBoardEntry('Player', 100);
    expect(FETCH.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ playerName: 'Player', score: 100 }),
    });
  });
});

describe('YouTube embeds', () => {
  it('uses only the YouTube embed host and a validated id', () => {
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ', 15.9)).toContain(
      'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&start=15'
    );
    expect(youtubeEmbedUrl('https://attacker.example/watch?v=dQw4w9WgXcQ')).toBe('about:blank');
    expect(youtubeEmbedUrl('javascript:alert(1)')).toBe('about:blank');
    expect(youtubeEmbedUrl('https://youtube.com/watch?v=not-valid')).toBe('about:blank');
  });
  it('provides typed errors', () => {
    expect(new ApiError('message', 401).status).toBe(401);
  });
});
