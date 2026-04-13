import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/middleware/withAdmin'

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { hunt_id } = await req.json()
  if (!hunt_id) {
    return NextResponse.json({ error: 'hunt_id required' }, { status: 400 })
  }

  const { data: pin, error: pinError } = await adminClient.rpc('generate_pin', {
    p_hunt_id: hunt_id,
  })

  if (pinError || !pin) {
    return NextResponse.json({ error: 'PIN generation failed' }, { status: 500 })
  }

  const { data: team, error: dbError } = await adminClient
    .from('team')
    .insert({ hunt_id: hunt_id as string, pin: pin as string, name: null, total_score: 0 })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true, team }, { status: 201 })
}
