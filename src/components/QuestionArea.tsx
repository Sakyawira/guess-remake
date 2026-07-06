import { useRef, useState } from 'react'
import type { Video } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuestionAreaProps {
  videos: Video[]
  disabled: boolean
  onReveal: (video: Video | null, others?: Video[]) => void
  onCorrect: () => void
  onWrong: () => void
}

type Mode = 'views' | 'date' | 'mostViews' | 'leastViews' | 'oldest' | 'newest'

interface Question {
  prompt: string
  answerId: string
  choices: Video[]
  isSuperlative: boolean
  signature: string
}

type Feedback = 'correct' | 'wrong' | null

const formatViews = (n: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB')

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const MODES: Mode[] = [
  'views',
  'date',
  'mostViews',
  'leastViews',
  'oldest',
  'newest',
]

function buildQuestion(videos: Video[]): Question {
  const picks = shuffle(videos).slice(0, 3)
  const mode = MODES[Math.floor(Math.random() * MODES.length)]
  const releaseTime = (v: Video) => new Date(v.releaseDate).getTime()

  let answer: Video
  let prompt: string
  switch (mode) {
    case 'mostViews':
      answer = picks.reduce((a, b) => (b.viewCount > a.viewCount ? b : a))
      prompt = 'Which video has the most views?'
      break
    case 'leastViews':
      answer = picks.reduce((a, b) => (b.viewCount < a.viewCount ? b : a))
      prompt = 'Which video has the fewest views?'
      break
    case 'oldest':
      answer = picks.reduce((a, b) => (releaseTime(b) < releaseTime(a) ? b : a))
      prompt = 'Which video is the oldest?'
      break
    case 'newest':
      answer = picks.reduce((a, b) => (releaseTime(b) > releaseTime(a) ? b : a))
      prompt = 'Which video is the newest?'
      break
    case 'date':
      answer = picks[Math.floor(Math.random() * picks.length)]
      prompt = `Which video was released on ${formatDate(answer.releaseDate)}?`
      break
    default:
      answer = picks[Math.floor(Math.random() * picks.length)]
      prompt = `Which video has ${formatViews(answer.viewCount)} views?`
  }
  const isSuperlative =
    mode === 'mostViews' ||
    mode === 'leastViews' ||
    mode === 'oldest' ||
    mode === 'newest'
  const signature = `${prompt}|${picks.map((p) => p.id).sort().join(',')}`
  return { prompt, answerId: answer.id, choices: picks, isSuperlative, signature }
}

export function QuestionArea({
  videos,
  disabled,
  onReveal,
  onCorrect,
  onWrong,
}: QuestionAreaProps) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [answered, setAnswered] = useState(false)
  const askedRef = useRef<Set<string>>(new Set())

  const enoughVideos = videos.length >= 3

  const generate = () => {
    if (!enoughVideos) return
    // Avoid repeating a question until replay (which remounts this component).
    let next = buildQuestion(videos)
    for (let i = 0; i < 30 && askedRef.current.has(next.signature); i++) {
      next = buildQuestion(videos)
    }
    askedRef.current.add(next.signature)
    setQuestion(next)
    setFeedback(null)
    setAnswered(false)
    onReveal(null)
  }

  const choose = (choice: Video) => {
    if (!question || answered || disabled) return
    setAnswered(true)
    if (choice.id === question.answerId) {
      setFeedback('correct')
      onCorrect()
    } else {
      setFeedback('wrong')
      onWrong()
    }
    // Reveal the correct video (play it + show its stats), win or lose.
    // For superlative questions, also pass the other options for comparison.
    const answer = question.choices.find((c) => c.id === question.answerId)
    if (answer) {
      const others = question.isSuperlative
        ? question.choices.filter((c) => c.id !== answer.id)
        : []
      onReveal(answer, others)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-red-500">
          {question ? question.prompt : 'Guess the video'}
        </CardTitle>
        <div className="flex items-center gap-3">
          {feedback === 'correct' && (
            <span className="text-sm font-medium text-green-500">Correct!</span>
          )}
          {feedback === 'wrong' && (
            <span className="text-sm font-medium text-red-500">Wrong!</span>
          )}
          <Button onClick={generate} disabled={disabled || !enoughVideos}>
            Get new question
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!enoughVideos ? (
          <p className="text-sm text-muted-foreground">
            Add at least 3 videos to start playing.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {question?.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => choose(choice)}
                disabled={answered}
                className="flex items-center gap-2 rounded-md border p-2 text-left transition hover:bg-accent disabled:opacity-60"
              >
                <img
                  src={choice.thumbnailUrl}
                  alt=""
                  className="h-12 w-20 rounded object-cover"
                />
                <span className="text-sm font-medium">{choice.videoTitle}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
