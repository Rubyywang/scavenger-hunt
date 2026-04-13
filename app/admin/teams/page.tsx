import { adminClient } from '@/lib/supabase/admin'
import type { Hunt, Team } from '@/types/db'
import TeamCard from '@/components/admin/TeamCard'
import CreateTeamButton from '@/components/admin/CreateTeamButton'

export default async function TeamsPage() {
  const { data: hunts } = await adminClient
    .from('hunt')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  const hunt = (hunts?.[0] ?? null) as Hunt | null

  const { data: teams } = hunt
    ? await adminClient
        .from('team')
        .select('*')
        .eq('hunt_id', hunt.id)
        .order('total_score', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Teams</h1>
        {hunt && hunt.status !== 'ended' && (
          <CreateTeamButton huntId={hunt.id} />
        )}
      </div>

      {(teams ?? []).length === 0 ? (
        <p className="text-sm text-gray-500">No teams yet.</p>
      ) : (
        <div className="space-y-3">
          {(teams as Team[]).map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  )
}
