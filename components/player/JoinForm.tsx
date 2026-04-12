'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinForm() {
  const router = useRouter()
  const [pin, setPin]             = useState('')
  const [playerName, setPlayerName] = useState('')
  const [teamName, setTeamName]   = useState('')
  const [needsTeamName, setNeedsTeamName] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const body: Record<string, string> = { pin, player_name: playerName }
    if (needsTeamName) body.team_name = teamName

    const res  = await fetch('/api/player/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)

    if (res.status === 422 && data.error === 'team_name_required') {
      setNeedsTeamName(true)
      return
    }

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    router.push('/play')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Join the Hunt</h1>

      <div>
        <label className="block text-sm font-medium mb-1">Team PIN</label>
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value.toUpperCase())}
          placeholder="XXXXXX"
          maxLength={6}
          required
          className="w-full border rounded px-3 py-2 text-center text-lg tracking-widest uppercase"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Your name</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Display name"
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {needsTeamName && (
        <div>
          <label className="block text-sm font-medium mb-1">Team name</label>
          <p className="text-xs text-gray-500 mb-1">
            You&apos;re the first one here — set your team name.
          </p>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {loading ? 'Joining…' : 'Join'}
      </button>
    </form>
  )
}
