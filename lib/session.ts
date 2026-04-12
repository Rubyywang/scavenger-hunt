import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET      = new TextEncoder().encode(process.env.SESSION_SECRET!)
const PLAYER_COOKIE = 'sh_session'
const ADMIN_COOKIE  = 'sh_admin'

export type PlayerSession = {
  player_id: string
  team_id:   string
  name:      string
}

export type AdminSession = {
  role: 'admin'
}

export async function setPlayerSession(session: PlayerSession): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)

  const store = await cookies()
  store.set(PLAYER_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
  })
}

export async function setAdminSession(): Promise<void> {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(SECRET)

  const store = await cookies()
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 12,
  })
}

export async function getPlayerSession(): Promise<PlayerSession | null> {
  try {
    const store  = await cookies()
    const cookie = store.get(PLAYER_COOKIE)
    if (!cookie) return null
    const { payload } = await jwtVerify(cookie.value, SECRET)
    return payload as unknown as PlayerSession
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const store  = await cookies()
    const cookie = store.get(ADMIN_COOKIE)
    if (!cookie) return null
    const { payload } = await jwtVerify(cookie.value, SECRET)
    return payload as unknown as AdminSession
  } catch {
    return null
  }
}

export async function clearPlayerSession(): Promise<void> {
  const store = await cookies()
  store.delete(PLAYER_COOKIE)
}
