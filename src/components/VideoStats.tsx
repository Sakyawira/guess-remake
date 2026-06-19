import type { Video } from '@/lib/api'

const formatViews = (n: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

export function VideoStats({ video }: { video: Video }) {
  return (
    <div className="rounded-md border p-3">
      <p className="font-medium">{video.videoTitle}</p>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{formatViews(video.viewCount)} views</span>
        <span>{formatDuration(video.videoLength)}</span>
        {video.isFavourite && <span>★ favourite</span>}
      </div>
    </div>
  )
}
