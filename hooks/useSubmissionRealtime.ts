'use client'

import { useEffect, useState } from 'react'
import { browserClient } from '@/lib/supabase/browser'
import type { Submission } from '@/types/db'

export function useSubmissionRealtime(
  teamId:  string,
  initial: Submission[]
): Submission[] {
  const [submissions, setSubmissions] = useState<Submission[]>(initial)

  useEffect(() => {
    const channel = browserClient
      .channel(`submissions:${teamId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'submission',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSubmissions((prev) => [...prev, payload.new as Submission])
          } else if (payload.eventType === 'UPDATE') {
            setSubmissions((prev) =>
              prev.map((s) =>
                s.id === (payload.new as Submission).id
                  ? (payload.new as Submission)
                  : s
              )
            )
          }
        }
      )
      .subscribe()

    return () => { browserClient.removeChannel(channel) }
  }, [teamId])

  return submissions
}
