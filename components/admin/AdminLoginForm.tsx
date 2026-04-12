'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginForm() {
  const router = useRouter()
  const [pin, setPin]       = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pin }),
    })

    setLoading(false)

    if (!res.ok) {
      setError('Invalid PIN')
      return
    }

    router.push('/admin/hunt')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
      <h1 className="text-xl font-bold">Admin</h1>

      <div>
        <label className="block text-sm font-medium mb-1">PIN</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </form>
  )
}
