'use client'

import { useState } from 'react'

interface Props {
  currentName: string
}

export default function TeamNameForm({ currentName }: Props) {
  const [name, setName]     = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const res  = await fetch('/api/player/team-name', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to update')
      return
    }

    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Team name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          required
          className="w-full border rounded px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="border rounded px-3 py-1.5 text-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {saved && <span className="text-xs text-green-600 self-center">Saved</span>}
      {error && <span className="text-xs text-red-600 self-center">{error}</span>}
    </form>
  )
}
