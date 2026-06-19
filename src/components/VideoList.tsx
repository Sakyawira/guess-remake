import { useState } from 'react'
import { Star, X } from 'lucide-react'
import type { Video } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VideoListProps {
  videos: Video[]
  onPlay: (url: string) => void
  onImport: (url: string) => Promise<void>
  onToggleFavourite: (video: Video) => void
  onDelete: (id: string) => void
}

export function VideoList({
  videos,
  onPlay,
  onImport,
  onToggleFavourite,
  onDelete,
}: VideoListProps) {
  const [url, setUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const addVideo = async () => {
    if (!url.trim()) return
    setIsAdding(true)
    try {
      await onImport(url.trim())
      setUrl('')
    } finally {
      setIsAdding(false)
    }
  }

  // Favourited videos float to the top.
  const ordered = [...videos].sort(
    (a, b) => Number(b.isFavourite) - Number(a.isFavourite),
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <span className="text-red-500">video</span>List
        </CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Add Video URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addVideo()}
          />
          <Button onClick={addVideo} disabled={isAdding}>
            {isAdding ? '…' : '+'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[420px] space-y-2 overflow-y-auto">
        {ordered.map((video) => (
          <div
            key={video.id}
            className="flex items-center gap-2 rounded-md border p-2"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavourite(video)}
              aria-label="Toggle favourite"
            >
              <Star
                className={
                  video.isFavourite
                    ? 'size-4 fill-yellow-400 text-yellow-400'
                    : 'size-4'
                }
              />
            </Button>
            <button
              className="flex flex-1 items-center gap-2 text-left"
              onClick={() => onPlay(video.webUrl)}
            >
              <img
                src={video.thumbnailUrl}
                alt=""
                className="h-10 w-16 rounded object-cover"
              />
              <span className="text-sm font-medium">{video.videoTitle}</span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(video.id)}
              aria-label="Delete video"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
