import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/middleware/withAdmin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params
  const { body, hint, location_name, points_value, unlocked_by_clue_id } = await req.json()

  const updates: Partial<{ body: string; hint: string | null; location_name: string | null; points_value: number; unlocked_by_clue_id: string | null }> = {}
  if (body?.trim())                    updates.body                = body.trim()
  if (hint !== undefined)              updates.hint                = hint?.trim() || null
  if (location_name !== undefined)     updates.location_name       = location_name?.trim() || null
  if (points_value !== undefined)      updates.points_value        = points_value
  if (unlocked_by_clue_id !== undefined)
    updates.unlocked_by_clue_id = unlocked_by_clue_id || null

  const { data: clue, error: dbError } = await adminClient
    .from('clue')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true, clue })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params

  const { error: dbError } = await adminClient.from('clue').delete().eq('id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
