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
  const { title } = await req.json()
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  }

  const { data: hunt, error: dbError } = await adminClient
    .from('hunt')
    .update({ title: title.trim() })
    .eq('id', id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true, hunt })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params

  // Refuse to delete an active hunt
  const { data: hunt } = await adminClient
    .from('hunt')
    .select('status')
    .eq('id', id)
    .single()

  if (hunt?.status === 'active') {
    return NextResponse.json({ error: 'Cannot delete an active hunt — end it first' }, { status: 409 })
  }

  const { error: dbError } = await adminClient
    .from('hunt')
    .delete()
    .eq('id', id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
