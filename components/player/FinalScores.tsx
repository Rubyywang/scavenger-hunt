import type { Team } from '@/types/db'

interface Props {
  teams:    Team[]
  myTeamId: string
}

export default function FinalScores({ teams, myTeamId }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="font-semibold">Final Scores</h2>
      <div className="border rounded-lg divide-y">
        {teams.map((team, i) => (
          <div
            key={team.id}
            className={`flex items-center gap-4 px-4 py-3 ${
              team.id === myTeamId ? 'bg-yellow-50' : ''
            }`}
          >
            <span className="text-gray-400 w-5 shrink-0">{i + 1}</span>
            <span className={`flex-1 ${team.id === myTeamId ? 'font-bold' : ''}`}>
              {team.name ?? team.pin}
              {team.id === myTeamId && ' (you)'}
            </span>
            <span className="font-semibold">{team.total_score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
