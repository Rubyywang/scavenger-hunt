import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requirePlayerSession } from '@/lib/middleware/withPlayer'

export async function POST(req: NextRequest) {
  const { session, error } = await requirePlayerSession()
  if (error) return error

  const formData = await req.formData()
  const file    = formData.get('photo') as File | null
  const clue_id = formData.get('clue_id') as string | null

  if (!file || !clue_id) {
    return NextResponse.json({ error: 'Missing photo or clue_id' }, { status: 400 })
  }

  // Deterministic storage path: one file per team+clue
  const path = `${session.team_id}/${clue_id}.jpg`

  const { error: uploadError } = await adminClient.storage
    .from('submission-photos')
    .upload(path, file, { contentType: 'image/jpeg', upsert: false })

  if (uploadError && !uploadError.message.includes('already exists')) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: submission, error: rpcError } = await adminClient.rpc('submit_clue', {
    p_team_id:   session.team_id,
    p_player_id: session.player_id,
    p_clue_id:   clue_id,
    p_photo_url: path,
  })

  if (rpcError) {
    if (rpcError.code === '23505') {
      return NextResponse.json(
        { error: 'Your teammate already submitted this one' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Submit failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, submission })
}
