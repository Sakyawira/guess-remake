import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Coins, Globe, Heart } from 'lucide-react';
import { api, youtubeEmbedUrl } from '@/lib/api';
import type { LeaderBoardEntry, Video } from '@/lib/api';
import { readFavourites, writeFavourites } from '@/lib/favourites';
import { useGameSocket } from '@/lib/socket';
import { useTheme } from '@/lib/useTheme';
import { useVideoLibrary } from '@/lib/use-video-library';
import { Header } from '@/components/Header';
import { QuestionArea } from '@/components/QuestionArea';
import { VideoList } from '@/components/VideoList';
import { VideoStats } from '@/components/VideoStats';
import { LeaderBoard } from '@/components/LeaderBoard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const STARTING_LIVES = 3;

export default function App() {
  const { isDark, toggle } = useTheme();
  const library = useVideoLibrary();
  const [favourites, setFavourites] = useState(readFavourites);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [others, setOthers] = useState<Video[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [name, setName] = useState('');
  const [board, setBoard] = useState<LeaderBoardEntry[] | null>(null);
  const [gameId, setGameId] = useState(0);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const {
    usersOnline,
    status,
    error: connectionError,
  } = useGameSocket({
    onVideoAdded: library.refresh,
    onVideoDeleted: library.refresh,
  });
  const videos = library.videos.map((video) => ({
    ...video,
    isFavourite: favourites.has(video.id),
  }));
  const isGameOver = lives === 0;

  const reveal = (video: Video | null, comparison: Video[] = []) => {
    setPlaying(video);
    setOthers(comparison);
  };
  const toggleFavourite = (video: Video) => {
    const next = new Set(favourites);
    if (next.has(video.id)) next.delete(video.id);
    else next.add(video.id);
    setFavourites(next);
    setStorageError(
      writeFavourites(next)
        ? null
        : 'Browser storage is unavailable. Favourites will last only for this session.'
    );
  };
  const loadLeaderboard = async () => {
    setScoreError(null);
    try {
      setBoard(await api.listLeaderBoard());
    } catch (error: unknown) {
      setScoreError(error instanceof Error ? error.message : 'Could not load the leaderboard.');
    }
  };
  const submitScore = async () => {
    if (!name.trim() || scoreSaved || submissionInFlight.current) return;
    submissionInFlight.current = true;
    setIsSubmitting(true);
    setScoreError(null);
    try {
      await api.addLeaderBoardEntry(name.trim(), score);
      setScoreSaved(true);
      await loadLeaderboard();
    } catch (error: unknown) {
      setScoreError(error instanceof Error ? error.message : 'Could not submit the score.');
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  };
  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitScore();
  };
  const replay = () => {
    if (submissionInFlight.current) return;
    setScore(0);
    setLives(STARTING_LIVES);
    setName('');
    setBoard(null);
    setScoreError(null);
    setScoreSaved(false);
    setGameId((id) => id + 1);
  };

  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header isDark={isDark} onToggleTheme={toggle} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <div className="flex justify-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Globe data-icon="inline-start" />
            {status === 'connected' ? `${usersOnline} online` : 'Live updates offline'}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Coins data-icon="inline-start" />
            {score} points
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Heart data-icon="inline-start" />
            {lives} lives
          </Badge>
        </div>
        {connectionError && (
          <Alert>
            <AlertTitle>Connection notice</AlertTitle>
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
        {storageError && (
          <Alert>
            <AlertTitle>Favourites not saved</AlertTitle>
            <AlertDescription>{storageError}</AlertDescription>
          </Alert>
        )}
        {library.error && (
          <Alert variant="destructive">
            <AlertTitle>Could not load videos</AlertTitle>
            <AlertDescription>
              {library.error}
              <Button variant="outline" onClick={library.refresh} disabled={library.isLoading}>
                Retry video loading
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {isGameOver ? (
          <section className="flex flex-col gap-4" aria-label="Game result">
            <form onSubmit={submitForm}>
              <FieldGroup>
                <Field data-disabled={isSubmitting || scoreSaved}>
                  <FieldLabel htmlFor="player-name">Player name</FieldLabel>
                  <Input
                    id="player-name"
                    placeholder="Enter your name"
                    value={name}
                    required
                    maxLength={255}
                    disabled={isSubmitting || scoreSaved}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field orientation="horizontal">
                  <Button type="submit" disabled={isSubmitting || scoreSaved || !name.trim()}>
                    {isSubmitting && <Spinner data-icon="inline-start" />}
                    {scoreSaved ? 'Score submitted' : isSubmitting ? 'Submitting…' : 'Submit score'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={replay}
                    disabled={isSubmitting}
                  >
                    Replay
                  </Button>
                </Field>
              </FieldGroup>
            </form>
            {scoreSaved && <p role="status">Your score was saved.</p>}
            {scoreError && (
              <Alert variant="destructive">
                <AlertTitle>
                  {scoreSaved ? 'Leaderboard unavailable' : 'Score not submitted'}
                </AlertTitle>
                <AlertDescription>{scoreError}</AlertDescription>
                {scoreSaved && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      void loadLeaderboard();
                    }}
                  >
                    Retry leaderboard
                  </Button>
                )}
              </Alert>
            )}
            {board && <LeaderBoard entries={board} />}
          </section>
        ) : (
          <QuestionArea
            key={gameId}
            videos={videos}
            disabled={isGameOver}
            onReveal={reveal}
            onCorrect={() => setScore((value) => Math.min(1_000_000, value + 100))}
            onWrong={() => setLives((value) => Math.max(0, value - 1))}
          />
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="aspect-video overflow-hidden rounded-md bg-muted">
              {playing && (
                <iframe
                  key={playing.id}
                  src={youtubeEmbedUrl(playing.webUrl, playing.videoLength * 0.25)}
                  title={playing.videoTitle}
                  className="size-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            {playing && (
              <VideoStats video={{ ...playing, isFavourite: favourites.has(playing.id) }} />
            )}
            {others.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">Other options</p>
                {others.map((video) => (
                  <VideoStats
                    key={video.id}
                    video={{ ...video, isFavourite: favourites.has(video.id) }}
                  />
                ))}
              </div>
            )}
          </div>
          <VideoList
            videos={videos}
            onPlay={(video) => reveal(video)}
            onToggleFavourite={toggleFavourite}
            onLoadMore={library.loadMore}
            hasMore={library.hasMore}
            isLoading={library.isLoading}
          />
        </div>
      </main>
    </div>
  );
}
