'use client'

import { useState } from 'react'
import type { Submission, Clue, Team } from '@/types/db'

export type FullSubmission = Submission & { clue: Clue; team: Team; signed_url: string }

interface Props {
  submission: FullSubmission
  onReviewed: (id: string) => void
}

export default function SubmissionCard({ submission, onReviewed }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch(`/api/admin/submission/${submission.id}/${action}`, { method: 'POST' })
    setLoading(null)
    onReviewed(submission.id)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={submission.signed_url}
        alt="Submission photo"
        className="w-full object-cover max-h-64 bg-gray-100"
      />
      <div className="p-4 space-y-3">
        <p className="text-sm font-medium">{submission.clue.body}</p>
        <p className="text-xs text-gray-500">
          Team: {submission.team.name ?? submission.team.pin}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handle('reject')}
            disabled={!!loading}
            className="flex-1 border rounded py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {loading === 'reject' ? '…' : 'Reject'}
          </button>
          <button
            onClick={() => handle('approve')}
            disabled={!!loading}
            className="flex-1 bg-green-600 text-white rounded py-1.5 text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'approve' ? '…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}
