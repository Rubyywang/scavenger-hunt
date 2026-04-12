import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/middleware/withAdmin'

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { title } = await req.json()
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  }

  const { data: hunt, error: dbError } = await adminClient
    .from('hunt')
    .insert({ title: title.trim(), status: 'draft' })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true, hunt }, { status: 201 })
}
