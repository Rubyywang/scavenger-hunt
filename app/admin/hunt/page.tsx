import { adminClient } from '@/lib/supabase/admin'
import type { Hunt, Clue } from '@/types/db'
import HuntControls from '@/components/admin/HuntControls'
import ClueBuilder from '@/components/admin/ClueBuilder'

export default async function HuntPage() {
  const { data: hunts } = await adminClient
    .from('hunt')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  const hunt = (hunts?.[0] ?? null) as Hunt | null

  const { data: clues } = hunt
    ? await adminClient
        .from('clue')
        .select('*')
        .eq('hunt_id', hunt.id)
        .order('created_at')
    : { data: [] }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Hunt</h1>
      <HuntControls hunt={hunt} />
      {hunt && <ClueBuilder huntId={hunt.id} clues={(clues ?? []) as Clue[]} />}
    </div>
  )
}
