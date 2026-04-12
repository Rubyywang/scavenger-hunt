'use client'

import { useEffect, useState } from 'react'
import { browserClient } from '@/lib/supabase/browser'
import type { Team } from '@/types/db'

export function useTeamRealtime(teamId: string, initial: Team): Team {
  const [team, setTeam] = useState<Team>(initial)

  useEffect(() => {
    const channel = browserClient
      .channel(`team:${teamId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'team',
          filter: `id=eq.${teamId}`,
        },
        (payload) => setTeam(payload.new as Team)
      )
      .subscribe()

    return () => { browserClient.removeChannel(channel) }
  }, [teamId])

  return team
}
