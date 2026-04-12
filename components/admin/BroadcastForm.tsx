'use client'

import { useState } from 'react'

interface Props {
  huntId: string
}

export default function BroadcastForm({ huntId }: Props) {
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setSent(false)
    setError(null)

    const res  = await fetch('/api/admin/announcement', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ body, hunt_id: huntId }),
    })
    const data = await res.json()
    setSending(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to send')
      return
    }

    setBody('')
    setSent(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm font-medium">Broadcast message</label>
      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); setSent(false) }}
        placeholder="Message to all teams…"
        rows={2}
        required
        className="w-full border rounded px-3 py-2 text-sm resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={sending}
          className="bg-black text-white text-sm rounded px-4 py-2 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send to all'}
        </button>
        {sent  && <span className="text-xs text-green-600">Sent</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </form>
  )
}
