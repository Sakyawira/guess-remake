/** Gameplay configuration is public. Never add an administrator key here. */
export const API_BASE = (import.meta.env.VITE_API_BASE?.trim() || 'http://localhost:3000').replace(
  /\/+$/,
  ''
);
export const API_KEY: string | undefined = import.meta.env.VITE_API_KEY?.trim();
export const VIDEO_PAGE_SIZE = 100;
export const MAX_VIDEO_OFFSET = 10_000;

export interface Video {
  id: string;
  videoTitle: string;
  videoLength: number;
  webUrl: string;
  thumbnailUrl: string;
  /** This value is replaced by personal browser favourites, not the server's flag. */
  isFavourite: boolean;
  viewCount: number;
  releaseDate: string;
}

export interface LeaderBoardEntry {
  id: string;
  playerName: string;
  score: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(message: string, status = 0, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function responseId(raw: Record<string, unknown>): string {
  const id = raw.id ?? raw._id;
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
    throw new ApiError('The game server returned an invalid record. Please try again.');
  }
  return id;
}

export function normaliseVideo(raw: unknown): Video {
  if (
    !isRecord(raw) ||
    typeof raw.videoTitle !== 'string' ||
    typeof raw.videoLength !== 'number' ||
    !Number.isFinite(raw.videoLength) ||
    typeof raw.webUrl !== 'string' ||
    typeof raw.thumbnailUrl !== 'string'
  ) {
    throw new ApiError('The game server returned an invalid video. Please try again.');
  }
  return {
    id: responseId(raw),
    videoTitle: raw.videoTitle,
    videoLength: raw.videoLength,
    webUrl: raw.webUrl,
    thumbnailUrl: raw.thumbnailUrl,
    isFavourite: false,
    viewCount:
      typeof raw.viewCount === 'number' && Number.isFinite(raw.viewCount) ? raw.viewCount : 0,
    releaseDate: typeof raw.releaseDate === 'string' ? raw.releaseDate : '',
  };
}

function normaliseEntry(raw: unknown): LeaderBoardEntry {
  if (
    !isRecord(raw) ||
    typeof raw.playerName !== 'string' ||
    typeof raw.score !== 'number' ||
    !Number.isFinite(raw.score)
  ) {
    throw new ApiError('The game server returned an invalid leaderboard. Please try again.');
  }
  return { id: responseId(raw), playerName: raw.playerName, score: raw.score };
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  if (!API_KEY) {
    throw new ApiError('The game API key is not configured. Please contact the site owner.', 401);
  }
  const headers = new Headers(init?.headers);
  headers.set('X-API-Key', API_KEY);
  if (init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: init?.signal ?? AbortSignal.timeout(10_000),
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError' && init?.signal?.aborted) {
      throw error;
    }
    throw new ApiError('Could not reach the game server. Please try again.');
  }
  if (response.status === 401 || response.status === 403) {
    throw new ApiError(
      'The game API key is missing or invalid. Please contact the site owner.',
      response.status
    );
  }
  if (response.status === 429) {
    const header = response.headers.get('Retry-After');
    const seconds =
      header && /^\d+$/.test(header) ? Math.min(3600, Math.max(1, Number(header))) : 60;
    throw new ApiError(`Too many requests. Please try again in ${seconds} seconds.`, 429, seconds);
  }
  if (!response.ok) {
    throw new ApiError(
      response.status === 400
        ? 'The request was not accepted. Check your player name and score.'
        : 'The game server could not complete the request. Please try again.',
      response.status
    );
  }
  if (response.status === 204) return undefined;
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    throw new ApiError('The game server returned an unreadable response. Please try again.');
  }
}

export const api = {
  async listVideos(offset = 0, signal?: AbortSignal): Promise<Video[]> {
    if (!Number.isInteger(offset) || offset < 0 || offset > MAX_VIDEO_OFFSET) {
      throw new ApiError('The video page is outside the supported range.');
    }
    const raw = await request(`/videos?limit=${VIDEO_PAGE_SIZE}&offset=${offset}`, { signal });
    if (!Array.isArray(raw)) throw new ApiError('The game server returned an invalid video list.');
    return raw.map(normaliseVideo);
  },

  async listLeaderBoard(): Promise<LeaderBoardEntry[]> {
    const raw = await request('/leaderboards?limit=100&offset=0');
    if (!Array.isArray(raw)) throw new ApiError('The game server returned an invalid leaderboard.');
    return raw.map(normaliseEntry);
  },

  async addLeaderBoardEntry(playerName: string, score: number): Promise<void> {
    await request('/leaderboards', {
      method: 'POST',
      body: JSON.stringify({ playerName, score }),
    });
  },
};

/** Only construct embeds for validated YouTube identifiers. */
export function youtubeEmbedUrl(webUrl: string, startSeconds = 0): string {
  let id: string | null = null;
  try {
    const url = new URL(webUrl);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) {
      id = url.searchParams.get('v') ?? url.pathname.split('/').filter(Boolean).pop() ?? null;
    }
  } catch {
    // An invalid server value must never become an arbitrary iframe URL.
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return 'about:blank';
  const start = Number.isFinite(startSeconds) ? Math.max(0, Math.floor(startSeconds)) : 0;
  return `https://www.youtube.com/embed/${id}?autoplay=1&start=${start}`;
}
