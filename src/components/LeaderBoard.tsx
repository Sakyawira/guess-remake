import type { LeaderBoardEntry } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LeaderBoardProps {
  entries: LeaderBoardEntry[]
}

export function LeaderBoard({ entries }: LeaderBoardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-500">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2">Player</th>
              <th className="py-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b last:border-0">
                <td className="py-2">{entry.playerName}</td>
                <td className="py-2 text-right">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
