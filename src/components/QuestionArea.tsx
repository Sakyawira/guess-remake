import { useState } from 'react'
import type { Video } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuestionAreaProps {
  videos: Video[]
  disabled: boolean
  onReveal: (video: Video | null) => void
  onCorrect: () => void
  onWrong: () => void
}

interface Question {
  targetViews: number
  answerId: string
  choices: Video[]
}

type Feedback = 'correct' | 'wrong' | null

const formatViews = (n: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
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

  const enoughVideos = videos.length >= 3

  const generate = () => {
    if (!enoughVideos) return
    const picks = shuffle(videos).slice(0, 3)
    const answer = picks[Math.floor(Math.random() * picks.length)]
    setQuestion({
      targetViews: answer.viewCount,
      answerId: answer.id,
      choices: picks,
    })
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
    const answer = question.choices.find((c) => c.id === question.answerId)
    if (answer) {
      onReveal(answer)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-red-500">
          {question
            ? `Which video has ${formatViews(question.targetViews)} views?`
            : 'Which video has the most views?'}
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
