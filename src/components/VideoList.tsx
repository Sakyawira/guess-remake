import { Star } from 'lucide-react';
import type { Video } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

interface VideoListProps {
  videos: Video[];
  onPlay: (video: Video) => void;
  onToggleFavourite: (video: Video) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function VideoList({
  videos,
  onPlay,
  onToggleFavourite,
  onLoadMore,
  hasMore,
  isLoading,
}: VideoListProps) {
  const ordered = [...videos].sort((a, b) => Number(b.isFavourite) - Number(a.isFavourite));
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Video library</CardTitle>
        <CardDescription>
          Favourites are personal to this browser. Load more videos to expand the question pool.
        </CardDescription>
      </CardHeader>
      <CardContent
        className="flex max-h-[420px] flex-col gap-2 overflow-y-auto"
        aria-busy={isLoading}
      >
        {videos.length === 0 && !isLoading && (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No videos available</EmptyTitle>
              <EmptyDescription>
                A site administrator must add videos before you can play.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {ordered.map((video) => (
          <div key={video.id} className="flex items-center gap-2 rounded-md border p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavourite(video)}
              aria-label={`Favourite ${video.videoTitle}`}
              aria-pressed={video.isFavourite}
            >
              <Star data-icon="inline-start" className={cn(video.isFavourite && 'fill-current')} />
            </Button>
            <button
              className="flex flex-1 items-center gap-2 text-left"
              onClick={() => onPlay(video)}
            >
              <img
                src={video.thumbnailUrl}
                alt=""
                className="h-10 w-16 rounded object-cover"
                loading="lazy"
              />
              <span className="text-sm font-medium">{video.videoTitle}</span>
            </button>
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {videos.length} videos loaded
        </span>
        {isLoading && <Spinner aria-label="Loading videos" />}
        {hasMore && (
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Load more videos'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
