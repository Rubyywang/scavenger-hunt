'use client'

import type { Team } from '@/types/db'
import { useTeamRealtime } from '@/hooks/useTeamRealtime'

interface RowProps {
  team: Team
  rank: number
}

function TeamRow({ team: initial, rank }: RowProps) {
  const team = useTeamRealtime(initial.id, initial)
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
      <span className="text-gray-400 w-5 shrink-0 text-right">{rank}</span>
      <span className="flex-1 font-medium truncate">{team.name ?? team.pin}</span>
      <span className="font-bold">{team.total_score}</span>
    </div>
  )
}

interface Props {
  teams: Team[]
}

export default function Leaderboard({ teams }: Props) {
  const sorted = [...teams].sort((a, b) => b.total_score - a.total_score)

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-500">No teams yet.</p>
  }

  return (
    <div className="border rounded-lg">
      {sorted.map((team, i) => (
        <TeamRow key={team.id} team={team} rank={i + 1} />
      ))}
    </div>
  )
}
