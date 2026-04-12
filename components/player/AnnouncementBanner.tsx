'use client'

import { useAnnouncements } from '@/hooks/useAnnouncements'

interface Props {
  huntId: string
}

export default function AnnouncementBanner({ huntId }: Props) {
  const latest = useAnnouncements(huntId)

  if (!latest) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
      <p className="text-sm font-medium text-yellow-800">{latest.body}</p>
    </div>
  )
}
