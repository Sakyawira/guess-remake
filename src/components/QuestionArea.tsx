import { useState } from 'react'
import { api, type Video } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuestionAreaProps {
  disabled: boolean
  onPlay: (url: string) => void
  onCorrect: () => void
  onWrong: () => void
}

interface Question {
  phrase: string
  answerId: string
  startTime: number
  choices: Video[]
}

type Feedback = 'correct' | 'wrong' | null

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function QuestionArea({
  disabled,
  onPlay,
  onCorrect,
  onWrong,
}: QuestionAreaProps) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [answered, setAnswered] = useState(false)

  const generate = async () => {
    setIsLoading(true)
    setFeedback(null)
    setAnswered(false)
    try {
      const lyric = await api.randomTranscription()
      const [answer, decoyA, decoyB] = await Promise.all([
        api.getVideo(lyric.video),
        api.randomVideo(),
        api.randomVideo(),
      ])
      setQuestion({
        phrase: lyric.phrase,
        answerId: answer.id,
        startTime: lyric.startTime,
        choices: shuffle([answer, decoyA, decoyB]),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const choose = (choice: Video) => {
    if (!question || answered || disabled) return
    setAnswered(true)
    if (choice.id === question.answerId) {
      setFeedback('correct')
      onCorrect()
      onPlay(`${choice.webUrl}&t=${question.startTime}s`)
    } else {
      setFeedback('wrong')
      onWrong()
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-red-500">
          Which song contains these lyrics?
        </CardTitle>
        <div className="flex items-center gap-3">
          {feedback === 'correct' && (
            <span className="text-sm font-medium text-green-500">Correct!</span>
          )}
          {feedback === 'wrong' && (
            <span className="text-sm font-medium text-red-500">Wrong!</span>
          )}
          <Button onClick={generate} disabled={isLoading || disabled}>
            {isLoading ? 'Loading…' : 'Get new question'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {question && (
          <p className="text-xl font-semibold">"{question.phrase}"</p>
        )}
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
      </CardContent>
    </Card>
  )
}
