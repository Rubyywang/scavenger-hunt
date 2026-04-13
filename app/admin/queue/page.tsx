import { adminClient } from '@/lib/supabase/admin'
import type { Submission, Clue, Team } from '@/types/db'
import SubmissionQueue from '@/components/admin/SubmissionQueue'

export type FullSubmission = Submission & { clue: Clue; team: Team; signed_url: string }

export default async function QueuePage() {
  const { data: raw } = await adminClient
    .from('submission')
    .select('*, clue(*), team(*)')
    .eq('status', 'pending')
    .order('submitted_at')

  // Generate signed URLs server-side — bucket is private
  const submissions: FullSubmission[] = await Promise.all(
    ((raw ?? []) as unknown as FullSubmission[]).map(async (sub) => {
      const { data } = await adminClient.storage
        .from('submission-photos')
        .createSignedUrl(sub.photo_url, 3600)
      return { ...sub, signed_url: data?.signedUrl ?? '' }
    })
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Review Queue</h1>
      <SubmissionQueue submissions={submissions} />
    </div>
  )
}
