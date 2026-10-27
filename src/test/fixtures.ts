import type { Video } from '@/lib/api';

export function videoFixture(index = 1): Video {
  return {
    id: index.toString(16).padStart(24, '0'),
    videoTitle: `Video ${index}`,
    videoLength: 60,
    webUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    isFavourite: false,
    viewCount: index * 100,
    releaseDate: '2026-01-01T00:00:00Z',
  };
}

export function jsonResponse(value: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(value), { status, headers });
}
