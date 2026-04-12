import type { Team } from '@/types/db'

interface Props {
  team: Team
}

export default function TeamCard({ team }: Props) {
  return (
    <div className="border rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium truncate">
          {team.name ?? <span className="text-gray-400 italic">No name yet</span>}
        </p>
        <p className="text-sm text-gray-500">
          {team.total_score} pts
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-lg font-bold tracking-widest">{team.pin}</p>
        <p className="text-xs text-gray-400">PIN</p>
      </div>
    </div>
  )
}
