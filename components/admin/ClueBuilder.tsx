'use client'

import { useState, useRef } from 'react'
import type { Clue } from '@/types/db'

interface Props {
  huntId: string
  clues:  Clue[]
}

interface ClueForm {
  body:                string
  image_url:           string | null  // storage path after upload
  hint:                string
  location_name:       string
  points_value:        number
  unlocked_by_clue_id: string | null
}

const EMPTY_FORM: ClueForm = {
  body:                '',
  image_url:           null,
  hint:                '',
  location_name:       '',
  points_value:        10,
  unlocked_by_clue_id: null,
}

function clueImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/clue-images/${path}`
}

function clueLabel(clue: Clue) {
  if (clue.body) return clue.body.length > 50 ? clue.body.slice(0, 50) + '…' : clue.body
  return '[image clue]'
}

export default function ClueBuilder({ huntId, clues: initial }: Props) {
  const [clues, setClues]       = useState<Clue[]>(initial)
  const [form, setForm]         = useState<ClueForm>(EMPTY_FORM)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const fileInputRef            = useRef<HTMLInputElement>(null)

  function setField<K extends keyof ClueForm>(key: K, value: ClueForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    setError(null)

    const { compressClueImage } = await import('@/lib/compress')
    const compressed = await compressClueImage(file)

    // Upload to get a storage path — we need a temporary clue_id to name the file.
    // We'll use a timestamp placeholder; the real clue row will reference this path.
    const tempId = `tmp-${Date.now()}`

    const form = new FormData()
    form.append('image',   compressed, 'clue.jpg')
    form.append('clue_id', tempId)

    const res  = await fetch('/api/admin/clue/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)

    if (!res.ok) {
      setError(data.error ?? 'Image upload failed')
      return
    }

    setField('image_url', data.path as string)
  }

  function clearImage() {
    setField('image_url', null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.body.trim() && !form.image_url) {
      setError('Add clue text or an image')
      return
    }
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
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/clue/${id}`, { method: 'DELETE' })
    setClues((prev) => prev.filter((c) => c.id !== id))
  }

  function prerequisiteLabel(clue: Clue) {
    if (!clue.unlocked_by_clue_id) return null
    return clues.find((c) => c.id === clue.unlocked_by_clue_id)
  }

  return (
    <div className="space-y-6">
      {/* Clue list */}
      <div className="space-y-2">
        {clues.length === 0 && <p className="text-sm text-gray-400">No clues yet.</p>}
        {clues.map((clue) => {
          const prereq = prerequisiteLabel(clue)
          return (
            <div key={clue.id} className="border rounded-lg p-3 flex gap-3 items-start">
              {clue.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={clueImageUrl(clue.image_url)}
                  alt="Clue"
                  className="w-16 h-16 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                {clue.body && <p className="text-sm font-medium">{clue.body}</p>}
                {!clue.body && clue.image_url && (
                  <p className="text-sm text-gray-400 italic">Image clue</p>
                )}
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

      {/* Add clue form */}
      <form onSubmit={handleAdd} className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm">Add clue</h3>

        <textarea
          value={form.body}
          onChange={(e) => setField('body', e.target.value)}
          placeholder={form.image_url ? 'Caption (optional)' : 'Clue text shown to players'}
          rows={2}
          className="w-full border rounded px-3 py-2 text-sm resize-none"
        />

        {/* Image upload */}
        <div className="space-y-2">
          {imagePreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="w-32 h-32 rounded object-cover" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-white/70 rounded flex items-center justify-center text-xs text-gray-500">
                  Uploading…
                </div>
              )}
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 text-sm text-gray-500 border rounded px-3 py-2 cursor-pointer hover:bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              + Add image
            </label>
          )}
        </div>

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
          disabled={saving || uploading}
          className="bg-black text-white text-sm rounded px-4 py-2 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add clue'}
        </button>
      </form>
    </div>
  )
}
