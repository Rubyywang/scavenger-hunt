import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/middleware/withAdmin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { id } = await params

  const { data: hunt, error: rpcError } = await adminClient.rpc('start_hunt', {
    p_hunt_id: id,
  })

  if (rpcError) {
    const status = rpcError.message.includes('HUNT_NOT_FOUND_OR_NOT_DRAFT') ? 409 : 500
    return NextResponse.json({ error: rpcError.message }, { status })
  }

  return NextResponse.json({ ok: true, hunt })
}
