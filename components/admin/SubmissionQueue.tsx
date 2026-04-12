'use client'

import { useState } from 'react'
import SubmissionCard, { type FullSubmission } from './SubmissionCard'

interface Props {
  submissions: FullSubmission[]
}

export default function SubmissionQueue({ submissions: initial }: Props) {
  const [pending, setPending] = useState<FullSubmission[]>(initial)

  function handleReviewed(id: string) {
    setPending((prev) => prev.filter((s) => s.id !== id))
  }

  if (pending.length === 0) {
    return <p className="text-sm text-gray-500">No pending submissions.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {pending.map((s) => (
        <SubmissionCard key={s.id} submission={s} onReviewed={handleReviewed} />
      ))}
    </div>
  )
}
