/** Base URL of the NestJS API. Override with VITE_API_BASE at build time. */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

/** Builds an autoplaying YouTube embed URL, optionally starting at `startSeconds`. */
export function youtubeEmbedUrl(webUrl: string, startSeconds = 0): string {
  let id = ''
  try {
    const url = new URL(webUrl)
    id =
      url.searchParams.get('v') ??
      url.pathname.split('/').filter(Boolean).pop() ??
      ''
  } catch {
    id = webUrl
  }
  const start = Math.max(0, Math.floor(startSeconds))
  return `https://www.youtube.com/embed/${id}?autoplay=1&start=${start}`
}

export interface Transcription {
  startTime: number
  phrase: string
}

export interface Video {
  id: string
  videoTitle: string
  videoLength: number
  webUrl: string
  thumbnailUrl: string
  isFavourite: boolean
  viewCount: number
  releaseDate: string
  transcriptions: Transcription[]
}

export interface LeaderBoardEntry {
  id: string
  playerName: string
  score: number
}

/** Normalises a raw API video (Mongo `_id`) into our `Video` shape. */
function normaliseVideo(raw: any): Video {
  return {
    id: raw.id ?? raw._id,
    videoTitle: raw.videoTitle,
    videoLength: raw.videoLength,
    webUrl: raw.webUrl,
    thumbnailUrl: raw.thumbnailUrl,
    isFavourite: raw.isFavourite,
    viewCount: raw.viewCount ?? 0,
    releaseDate: raw.releaseDate ?? '',
    transcriptions: raw.transcriptions ?? [],
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export const api = {
  listVideos: async (): Promise<Video[]> =>
    (await request<any[]>('/videos')).map(normaliseVideo),

  importVideo: (url: string): Promise<Video> =>
    request('/videos/import', { method: 'POST', body: JSON.stringify({ url }) }),

  setFavourite: (id: string, isFavourite: boolean): Promise<Video> =>
    request(`/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isFavourite }),
    }),

  deleteVideo: (id: string): Promise<void> =>
    request(`/videos/${id}`, { method: 'DELETE' }),

  listLeaderBoard: (): Promise<LeaderBoardEntry[]> =>
    request('/leaderboards'),

  addLeaderBoardEntry: (playerName: string, score: number): Promise<LeaderBoardEntry> =>
    request('/leaderboards', {
      method: 'POST',
      body: JSON.stringify({ playerName, score }),
    }),
}
