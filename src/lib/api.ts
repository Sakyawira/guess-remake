/** Base URL of the NestJS API. Override with VITE_API_BASE at build time. */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

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
  transcriptions: Transcription[]
}

export interface LeaderBoardEntry {
  id: string
  playerName: string
  score: number
}

interface RandomTranscription extends Transcription {
  video: string
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

  randomVideo: async (): Promise<Video> =>
    normaliseVideo(await request<any>('/videos/random')),

  getVideo: async (id: string): Promise<Video> =>
    normaliseVideo(await request<any>(`/videos/${id}`)),

  importVideo: (url: string): Promise<Video> =>
    request('/videos/import', { method: 'POST', body: JSON.stringify({ url }) }),

  setFavourite: (id: string, isFavourite: boolean): Promise<Video> =>
    request(`/videos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isFavourite }),
    }),

  deleteVideo: (id: string): Promise<void> =>
    request(`/videos/${id}`, { method: 'DELETE' }),

  randomTranscription: (): Promise<RandomTranscription> =>
    request('/transcriptions/random'),

  listLeaderBoard: (): Promise<LeaderBoardEntry[]> =>
    request('/leaderboards'),

  addLeaderBoardEntry: (playerName: string, score: number): Promise<LeaderBoardEntry> =>
    request('/leaderboards', {
      method: 'POST',
      body: JSON.stringify({ playerName, score }),
    }),
}
