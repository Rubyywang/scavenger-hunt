'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Hunt } from '@/types/db'

interface Props {
  hunts: Hunt[]
}

export default function HuntControls({ hunts }: Props) {
  const router = useRouter()
  const [title, setTitle]       = useState('')
  const [showForm, setShowForm] = useState(hunts.length === 0)
  const [loading, setLoading]   = useState<string | null>(null) // hunt id or 'create'
  const [error, setError]       = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading('create')
    setError(null)

    const res  = await fetch('/api/admin/hunt', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title }),
    })
    const data = await res.json()
    setLoading(null)

    if (!res.ok) { setError(data.error ?? 'Failed to create'); return }

    setTitle('')
    setShowForm(false)
    router.refresh()
  }

  async function handleStart(hunt: Hunt) {
    setLoading(hunt.id)
    await fetch(`/api/admin/hunt/${hunt.id}/start`, { method: 'POST' })
    setLoading(null)
    router.refresh()
  }

  async function handleEnd(hunt: Hunt) {
    if (!confirm('End the hunt? Final scores will be revealed to all players.')) return
    setLoading(hunt.id)
    await fetch(`/api/admin/hunt/${hunt.id}/end`, { method: 'POST' })
    setLoading(null)
    router.refresh()
  }

  async function handleDelete(hunt: Hunt) {
    if (!confirm(`Delete "${hunt.title}"? This cannot be undone.`)) return
    setLoading(hunt.id)
    const res  = await fetch(`/api/admin/hunt/${hunt.id}`, { method: 'DELETE' })
    const data = await res.json()
    setLoading(null)

    if (!res.ok) { setError(data.error ?? 'Delete failed'); return }

    router.refresh()
  }

  return (
    <div className="space-y-3">
      {/* Hunt list */}
      {hunts.map(hunt => (
        <div key={hunt.id} className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
          <div className="flex-1">
            <p className="font-medium">{hunt.title}</p>
            <p className="text-xs text-gray-500 capitalize">{hunt.status}</p>
          </div>

          {hunt.status === 'draft' && (
            <button
              onClick={() => handleStart(hunt)}
              disabled={loading === hunt.id}
              className="bg-green-600 text-white text-sm rounded px-4 py-2 disabled:opacity-50"
            >
              Start
            </button>
          )}

          {hunt.status === 'active' && (
            <button
              onClick={() => handleEnd(hunt)}
              disabled={loading === hunt.id}
              className="bg-red-600 text-white text-sm rounded px-4 py-2 disabled:opacity-50"
            >
              End hunt
            </button>
          )}

          {hunt.status !== 'active' && (
            <button
              onClick={() => handleDelete(hunt)}
              disabled={loading === hunt.id}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      ))}

      {/* Create form */}
      {showForm ? (
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
            disabled={loading === 'create'}
            className="bg-black text-white text-sm rounded px-4 py-2 disabled:opacity-50"
          >
            Create
          </button>
          {hunts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-2"
            >
              Cancel
            </button>
          )}
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          + New hunt
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
