import type { Clue, Submission } from '@/types/db'
import PhotoCapture from './PhotoCapture'

interface Props {
  clue:       Clue
  submission: Submission | null
}

const STATUS_LABEL: Record<Submission['status'], string> = {
  pending:  'Submitted — awaiting review',
  approved: 'Approved',
  rejected: 'Not approved',
  failed:   'Not approved',
}

const STATUS_COLOR: Record<Submission['status'], string> = {
  pending:  'text-yellow-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  failed:   'text-red-600',
}

export default function ClueCard({ clue, submission }: Props) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{clue.body}</p>
        <span className="text-xs text-gray-400 shrink-0">{clue.points_value}pt</span>
      </div>

      {clue.hint && (
        <p className="text-sm text-gray-500 italic">Hint: {clue.hint}</p>
      )}

      {submission ? (
        <p className={`text-sm font-medium ${STATUS_COLOR[submission.status]}`}>
          {STATUS_LABEL[submission.status]}
        </p>
      ) : (
        <PhotoCapture clueId={clue.id} />
      )}
    </div>
  )
}
