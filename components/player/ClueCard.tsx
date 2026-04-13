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

function clueImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/clue-images/${path}`
}

export default function ClueCard({ clue, submission }: Props) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-2">
          {clue.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clueImageUrl(clue.image_url)}
              alt="Clue"
              className="w-full rounded object-cover max-h-64"
            />
          )}
          {clue.body && <p className="font-medium">{clue.body}</p>}
        </div>
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
