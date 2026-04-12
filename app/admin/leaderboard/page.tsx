import { adminClient } from '@/lib/supabase/admin'
import type { Team } from '@/types/db'
import Leaderboard from '@/components/admin/Leaderboard'
import BroadcastForm from '@/components/admin/BroadcastForm'

export default async function LeaderboardPage() {
  const { data: hunt } = await adminClient
    .from('hunt')
    .select('id, status')
    .eq('status', 'active')
    .maybeSingle()

  if (!hunt) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-gray-500">No active hunt.</p>
      </div>
    )
  }

  const { data: teams } = await adminClient
    .from('team')
    .select('*')
    .eq('hunt_id', hunt.id)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Leaderboard</h1>
      <Leaderboard teams={(teams ?? []) as Team[]} />
      <hr />
      <BroadcastForm huntId={hunt.id} />
    </div>
  )
}
