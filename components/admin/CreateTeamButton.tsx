'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  huntId: string
}

export default function CreateTeamButton({ huntId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    await fetch('/api/admin/team', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ hunt_id: huntId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="bg-black text-white text-sm rounded px-4 py-2 disabled:opacity-50"
    >
      {loading ? 'Creating…' : 'Add team'}
    </button>
  )
}
