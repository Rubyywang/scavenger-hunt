import { redirect } from 'next/navigation'
import { getPlayerSession } from '@/lib/session'
import { adminClient } from '@/lib/supabase/admin'
import type { Hunt, Team, Clue, Submission } from '@/types/db'
import AnnouncementBanner from '@/components/player/AnnouncementBanner'
import TeamNameForm from '@/components/player/TeamNameForm'
import ClueList from '@/components/player/ClueList'
import FinalScores from '@/components/player/FinalScores'

type TeamWithHunt = Team & { hunt: Hunt }

export default async function PlayPage() {
  const session = await getPlayerSession()
  if (!session) redirect('/')

  const { data: teamData } = await adminClient
    .from('team')
    .select('*, hunt(*)')
    .eq('id', session.team_id)
    .single()

  if (!teamData) redirect('/')

  const { hunt, ...team } = teamData as TeamWithHunt & Record<string, unknown>
  const typedTeam = team as Team
  const typedHunt = hunt as Hunt

  const { data: clues } = await adminClient
    .from('clue')
    .select('*')
    .eq('hunt_id', typedHunt.id)

  const { data: submissions } = await adminClient
    .from('submission')
    .select('*')
    .eq('team_id', typedTeam.id)

  if (typedHunt.status === 'ended') {
    const { data: allTeams } = await adminClient
      .from('team')
      .select('*')
      .eq('hunt_id', typedHunt.id)
      .order('total_score', { ascending: false })

    return (
      <main className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-bold">Hunt over!</h1>
        <FinalScores teams={allTeams ?? []} myTeamId={typedTeam.id} />
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <AnnouncementBanner huntId={typedHunt.id} />
      <TeamNameForm currentName={typedTeam.name ?? ''} />
      <ClueList
        team={typedTeam}
        clues={(clues ?? []) as Clue[]}
        submissions={(submissions ?? []) as Submission[]}
        session={session}
      />
    </main>
  )
}
