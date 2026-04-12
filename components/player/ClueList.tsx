'use client'

import type { Team, Clue, Submission } from '@/types/db'
import type { PlayerSession } from '@/lib/session'
import { useTeamRealtime } from '@/hooks/useTeamRealtime'
import { useSubmissionRealtime } from '@/hooks/useSubmissionRealtime'
import ClueCard from './ClueCard'

interface Props {
  team:        Team
  clues:       Clue[]       // all clues for this hunt
  submissions: Submission[]
  session:     PlayerSession
}

// A clue is visible if it has no prerequisite (free hanging),
// or the team has already submitted the clue it depends on.
function getVisibleClues(clues: Clue[], submissions: Submission[]): Clue[] {
  const submittedIds = new Set(submissions.map((s) => s.clue_id))
  return clues.filter(
    (c) => !c.unlocked_by_clue_id || submittedIds.has(c.unlocked_by_clue_id)
  )
}

export default function ClueList({ team: initial, clues, submissions: initialSubs }: Props) {
  const team        = useTeamRealtime(initial.id, initial)
  const submissions = useSubmissionRealtime(initial.id, initialSubs)

  const submissionByClue = Object.fromEntries(submissions.map((s) => [s.clue_id, s]))
  const visibleClues     = getVisibleClues(clues, submissions)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{team.name ?? 'Your team'}</h2>
        <span className="text-sm text-gray-500">{team.total_score} pts</span>
      </div>

      {visibleClues.length === 0 ? (
        <p className="text-gray-500 text-sm">Waiting for the hunt to start…</p>
      ) : (
        visibleClues.map((clue) => (
          <ClueCard
            key={clue.id}
            clue={clue}
            submission={submissionByClue[clue.id] ?? null}
          />
        ))
      )}
    </div>
  )
}
