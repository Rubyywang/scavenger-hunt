'use client'

import { useState } from 'react'
import type { Clue } from '@/types/db'

interface Props {
  huntId: string
  clues:  Clue[]
}

interface ClueForm {
  body:                string
  hint:                string
  location_name:       string
  points_value:        number
  unlocked_by_clue_id: string | null
}

const EMPTY_FORM: ClueForm = {
  body:                '',
  hint:                '',
  location_name:       '',
  points_value:        10,
  unlocked_by_clue_id: null,
}

export default function ClueBuilder({ huntId, clues: initial }: Props) {
  const [clues, setClues]   = useState<Clue[]>(initial)
  const [form, setForm]     = useState<ClueForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res  = await fetch('/api/admin/clue', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ hunt_id: huntId, ...form }),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to save')
      return
    }

    setClues((prev) => [...prev, data.clue as Clue])
    setForm(EMPTY_FORM)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/clue/${id}`, { method: 'DELETE' })
    setClues((prev) => prev.filter((c) => c.id !== id))
  }

  function setField<K extends keyof ClueForm>(key: K, value: ClueForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function clueLabel(clue: Clue) {
    return clue.body.length > 50 ? clue.body.slice(0, 50) + '…' : clue.body
  }

  function prerequisiteLabel(clue: Clue) {
    if (!clue.unlocked_by_clue_id) return null
    return clues.find((c) => c.id === clue.unlocked_by_clue_id)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {clues.length === 0 && (
          <p className="text-sm text-gray-400">No clues yet.</p>
        )}
        {clues.map((clue) => {
          const prereq = prerequisiteLabel(clue)
          return (
            <div key={clue.id} className="border rounded-lg p-3 flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{clue.body}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {prereq
                    ? `Unlocks after: ${clueLabel(prereq)}`
                    : 'Free hanging (always visible)'}
                </p>
                {clue.hint && (
                  <p className="text-xs text-gray-500 truncate">Hint: {clue.hint}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">{clue.points_value}pt</span>
              <button
                onClick={() => handleDelete(clue.id)}
                className="text-xs text-red-500 hover:text-red-700 shrink-0"
              >
                Remove
              </button>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleAdd} className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm">Add clue</h3>

        <textarea
          value={form.body}
          onChange={(e) => setField('body', e.target.value)}
          placeholder="Clue text shown to players"
          rows={2}
          required
          className="w-full border rounded px-3 py-2 text-sm resize-none"
        />

        <div>
          <label className="block text-xs text-gray-500 mb-1">Unlocked by</label>
          <select
            value={form.unlocked_by_clue_id ?? ''}
            onChange={(e) => setField('unlocked_by_clue_id', e.target.value || null)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Free hanging (always visible)</option>
            {clues.map((c) => (
              <option key={c.id} value={c.id}>
                {clueLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={form.hint}
          onChange={(e) => setField('hint', e.target.value)}
          placeholder="Hint (optional)"
          className="w-full border rounded px-3 py-2 text-sm"
        />

        <div className="flex gap-3">
          <input
            type="text"
            value={form.location_name}
            onChange={(e) => setField('location_name', e.target.value)}
            placeholder="Location name (admin only)"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.points_value}
            onChange={(e) => setField('points_value', Number(e.target.value))}
            min={1}
            className="w-20 border rounded px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white text-sm rounded px-4 py-2 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add clue'}
        </button>
      </form>
    </div>
  )
}
