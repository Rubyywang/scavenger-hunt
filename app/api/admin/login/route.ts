import { NextRequest, NextResponse } from 'next/server'
import { setAdminSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()

  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  await setAdminSession()
  return NextResponse.json({ ok: true })
}
