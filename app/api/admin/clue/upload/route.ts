import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/middleware/withAdmin'

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession()
  if (error) return error

  const formData = await req.formData()
  const file     = formData.get('image') as File | null
  const clue_id  = formData.get('clue_id') as string | null

  if (!file || !clue_id) {
    return NextResponse.json({ error: 'image and clue_id required' }, { status: 400 })
  }

  const ext  = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${clue_id}.${ext}`

  const { error: uploadError } = await adminClient.storage
    .from('clue-images')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, path })
}
