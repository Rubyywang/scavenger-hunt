import { adminClient } from '@/lib/supabase/admin'
import type { Hunt, Clue } from '@/types/db'
import HuntControls from '@/components/admin/HuntControls'
import ClueBuilder from '@/components/admin/ClueBuilder'

export default async function HuntPage() {
  const { data: hunts } = await adminClient
    .from('hunt')
    .select('*')
    .order('created_at', { ascending: false })

  const allHunts = (hunts ?? []) as Hunt[]
  const activeOrDraft = allHunts.find(h => h.status === 'draft' || h.status === 'active') ?? null

  const { data: clues } = activeOrDraft
    ? await adminClient
        .from('clue')
        .select('*')
        .eq('hunt_id', activeOrDraft.id)
        .order('created_at')
    : { data: [] }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Hunts</h1>
      <HuntControls hunts={allHunts} />
      {activeOrDraft && <ClueBuilder huntId={activeOrDraft.id} clues={(clues ?? []) as Clue[]} />}
    </div>
  )
}
