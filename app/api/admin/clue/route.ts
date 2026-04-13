import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/middleware/withAdmin'

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { hunt_id, body, image_url, hint, location_name, points_value, unlocked_by_clue_id } =
    await req.json()

  if (!hunt_id || (!body?.trim() && !image_url)) {
    return NextResponse.json({ error: 'hunt_id and either body or image_url required' }, { status: 400 })
  }

  const { data: clue, error: dbError } = await adminClient
    .from('clue')
    .insert({
      hunt_id:             hunt_id                      as string,
      body:                (body?.trim()          || null) as string | null,
      image_url:           (image_url             || null) as string | null,
      hint:                (hint?.trim()           || null) as string | null,
      location_name:       (location_name?.trim()  || null) as string | null,
      points_value:        (points_value ?? 10)            as number,
      unlocked_by_clue_id: (unlocked_by_clue_id   || null) as string | null,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true, clue }, { status: 201 })
}
