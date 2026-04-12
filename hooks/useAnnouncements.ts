'use client'

import { useEffect, useState } from 'react'
import { browserClient } from '@/lib/supabase/browser'
import type { Announcement } from '@/types/db'

export function useAnnouncements(huntId: string): Announcement | null {
  const [latest, setLatest] = useState<Announcement | null>(null)

  useEffect(() => {
    const channel = browserClient
      .channel(`announcements:${huntId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'announcement',
          filter: `hunt_id=eq.${huntId}`,
        },
        (payload) => setLatest(payload.new as Announcement)
      )
      .subscribe()

    return () => { browserClient.removeChannel(channel) }
  }, [huntId])

  return latest
}
