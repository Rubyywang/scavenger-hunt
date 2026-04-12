import { NextResponse } from 'next/server'
import { getAdminSession, AdminSession } from '@/lib/session'

type AuthOk  = { session: AdminSession; error: null }
type AuthErr = { session: null; error: NextResponse }

export async function requireAdminSession(): Promise<AuthOk | AuthErr> {
  const session = await getAdminSession()
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }),
    }
  }
  return { session, error: null }
}
