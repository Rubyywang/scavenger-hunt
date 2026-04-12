import { NextResponse } from 'next/server'
import { getPlayerSession, PlayerSession } from '@/lib/session'

type AuthOk  = { session: PlayerSession; error: null }
type AuthErr = { session: null; error: NextResponse }

export async function requirePlayerSession(): Promise<AuthOk | AuthErr> {
  const session = await getPlayerSession()
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }),
    }
  }
  return { session, error: null }
}
