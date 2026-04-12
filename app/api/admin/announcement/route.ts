import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/middleware/withAdmin'

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { body, hunt_id } = await req.json()
  if (!body?.trim() || !hunt_id) {
    return NextResponse.json({ error: 'body and hunt_id required' }, { status: 400 })
  }

  const { data: announcement, error: dbError } = await adminClient
    .from('announcement')
    .insert({ body: body.trim(), hunt_id })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true, announcement }, { status: 201 })
}
