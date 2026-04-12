import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requirePlayerSession } from '@/lib/middleware/withPlayer'

export async function PATCH(req: NextRequest) {
  const { session, error } = await requirePlayerSession()
  if (error) return error

  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const { data: team, error: dbError } = await adminClient.rpc('update_team_name', {
    p_team_id: session.team_id,
    p_name:    name.trim(),
  })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true, team })
}
