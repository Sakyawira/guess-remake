import { useCallback, useEffect, useState } from 'react'
import { api, youtubeEmbedUrl, type LeaderBoardEntry, type Video } from '@/lib/api'
import { useGameSocket } from '@/lib/socket'
import { useTheme } from '@/lib/useTheme'
import { Header } from '@/components/Header'
import { QuestionArea } from '@/components/QuestionArea'
import { VideoList } from '@/components/VideoList'
import { VideoStats } from '@/components/VideoStats'
import { LeaderBoard } from '@/components/LeaderBoard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STARTING_LIVES = 3

export default function App() {
  const { isDark, toggle } = useTheme()
  const [videos, setVideos] = useState<Video[]>([])
  const [playing, setPlaying] = useState<Video | null>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [name, setName] = useState('')
  const [board, setBoard] = useState<LeaderBoardEntry[] | null>(null)

  const refreshVideos = useCallback(() => {
    api.listVideos().then(setVideos)
  }, [])

  const { usersOnline } = useGameSocket({
    onVideoAdded: refreshVideos,
    onVideoDeleted: refreshVideos,
  })

  useEffect(() => {
    refreshVideos()
  }, [refreshVideos])

  const importVideo = async (url: string) => {
    await api.importVideo(url)
    refreshVideos()
  }

  const toggleFavourite = async (video: Video) => {
    await api.setFavourite(video.id, !video.isFavourite)
    refreshVideos()
  }

  const deleteVideo = async (id: string) => {
    await api.deleteVideo(id)
    refreshVideos()
  }

  const submitScore = async () => {
    if (!name.trim()) return
    await api.addLeaderBoardEntry(name.trim(), score)
    setBoard(await api.listLeaderBoard())
  }

  const replay = () => {
    setScore(0)
    setLives(STARTING_LIVES)
    setName('')
    setBoard(null)
  }

  const isGameOver = lives === 0

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header isDark={isDark} onToggleTheme={toggle} />

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex justify-center gap-3">
          <Badge variant="secondary">{usersOnline} online</Badge>
          <Badge variant="secondary">{score} points</Badge>
          <Badge variant="secondary">{lives} lives</Badge>
        </div>

        {isGameOver ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Input
                className="max-w-xs"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitScore()}
              />
              <Button onClick={submitScore}>Submit</Button>
              <Button variant="secondary" onClick={replay}>
                Replay
              </Button>
            </div>
            {board && <LeaderBoard entries={board} />}
          </div>
        ) : (
          <QuestionArea
            videos={videos}
            disabled={isGameOver}
            onReveal={setPlaying}
            onCorrect={() => setScore((s) => s + 100)}
            onWrong={() => setLives((l) => Math.max(0, l - 1))}
          />
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="aspect-video overflow-hidden rounded-md bg-black">
              {playing && (
                <iframe
                  key={playing.id}
                  src={youtubeEmbedUrl(playing.webUrl, playing.videoLength * 0.25)}
                  title={playing.videoTitle}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            {playing && <VideoStats video={playing} />}
          </div>
          <VideoList
            videos={videos}
            onPlay={setPlaying}
            onImport={importVideo}
            onToggleFavourite={toggleFavourite}
            onDelete={deleteVideo}
          />
        </div>
      </main>
    </div>
  )
}
