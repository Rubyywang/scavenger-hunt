'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Hunt } from '@/types/db'

interface Props {
  hunt: Hunt | null
}

export default function HuntControls({ hunt }: Props) {
  const router = useRouter()
  const [title, setTitle]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res  = await fetch('/api/admin/hunt', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to create')
      return
    }

    router.refresh()
  }

  async function handleStart() {
    if (!hunt) return
    setLoading(true)
    await fetch(`/api/admin/hunt/${hunt.id}/start`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  async function handleEnd() {
    if (!hunt) return
    if (!confirm('End the hunt? Final scores will be revealed to all players.')) return
    setLoading(true)
    await fetch(`/api/admin/hunt/${hunt.id}/end`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  if (!hunt) {
    return (
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Hunt title"
          required
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white text-sm rounded px-4 py-2 disabled:opacity-50"
        >
          Create hunt
        </button>
        {error && <p className="text-xs text-red-600 self-center">{error}</p>}
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex-1">
        <p className="font-medium">{hunt.title}</p>
        <p className="text-xs text-gray-500 capitalize">{hunt.status}</p>
      </div>

      {hunt.status === 'draft' && (
        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-green-600 text-white text-sm rounded px-4 py-2 disabled:opacity-50"
        >
          Start hunt
        </button>
      )}

      {hunt.status === 'active' && (
        <button
          onClick={handleEnd}
          disabled={loading}
          className="bg-red-600 text-white text-sm rounded px-4 py-2 disabled:opacity-50"
        >
          End hunt
        </button>
      )}

      {hunt.status === 'ended' && (
        <span className="text-sm text-gray-400">Hunt ended</span>
      )}
    </div>
  )
}
