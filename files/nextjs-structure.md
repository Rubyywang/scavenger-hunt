# Next.js Project Structure & API Routes

## Setup

```bash
npx create-next-app@latest scavenger-hunt \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd scavenger-hunt
npm install @supabase/supabase-js jose
```

`jose` is used for signing and verifying session cookies. No Supabase Auth
for players — sessions are JWTs stored in a cookie, signed with a secret key.

### Environment variables (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SESSION_SECRET=a-long-random-string-at-least-32-chars
ADMIN_PIN=your-admin-pin
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

`SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` are server-only.
Never prefix these with `NEXT_PUBLIC_`.

---

## Folder Structure

```
scavenger-hunt/
├── app/
│   ├── layout.tsx                    # Root layout — fonts, global styles
│   ├── page.tsx                      # Landing / join page
│   │
│   ├── play/
│   │   └── page.tsx                  # Player game view
│   │
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout — auth guard, nav
│   │   ├── page.tsx                  # Redirect to /admin/hunt
│   │   ├── login/
│   │   │   └── page.tsx              # Admin PIN login
│   │   ├── hunt/
│   │   │   └── page.tsx              # Hunt builder
│   │   ├── teams/
│   │   │   └── page.tsx              # Team manager — create teams, show PINs
│   │   ├── queue/
│   │   │   └── page.tsx              # Submission review queue
│   │   └── leaderboard/
│   │       └── page.tsx              # Live leaderboard (admin only)
│   │
│   └── api/
│       ├── player/
│       │   ├── join/
│       │   │   └── route.ts          # POST — validate PIN, create player, set cookie
│       │   └── team-name/
│       │       └── route.ts          # PATCH — update team name (any player, anytime)
│       │
│       ├── game/
│       │   └── submit/
│       │       └── route.ts          # POST — compress check, upload, submit_clue RPC
│       │
│       └── admin/
│           ├── login/
│           │   └── route.ts          # POST — validate admin PIN, set admin cookie
│           ├── hunt/
│           │   ├── route.ts          # POST — create hunt
│           │   └── [id]/
│           │       ├── route.ts      # PATCH — update hunt
│           │       ├── start/
│           │       │   └── route.ts  # POST — start_hunt RPC
│           │       └── end/
│           │           └── route.ts  # POST — end_hunt RPC
│           ├── clue/
│           │   ├── route.ts          # POST — create clue
│           │   └── [id]/
│           │       └── route.ts      # PATCH / DELETE
│           ├── team/
│           │   └── route.ts          # POST — create team, generate PIN
│           ├── submission/
│           │   └── [id]/
│           │       ├── approve/
│           │       │   └── route.ts  # POST — approve_submission RPC
│           │       └── reject/
│           │           └── route.ts  # POST — reject_submission RPC
│           └── announcement/
│               └── route.ts          # POST — insert announcement
│
├── lib/
│   ├── supabase/
│   │   └── admin.ts                  # Service role client (server only)
│   ├── session.ts                    # Cookie read/write helpers (jose)
│   ├── compress.ts                   # Client-side image compression
│   └── middleware/
│       ├── withPlayer.ts             # API middleware — validates player cookie
│       └── withAdmin.ts              # API middleware — validates admin cookie
│
├── components/
│   ├── player/
│   │   ├── JoinForm.tsx              # PIN + player name form
│   │   ├── TeamNameForm.tsx          # Set/edit team name
│   │   ├── ClueCard.tsx              # Single clue + upload button
│   │   ├── ClueList.tsx              # All unlocked clues
│   │   ├── PhotoCapture.tsx          # Camera + compression + confirmation
│   │   └── AnnouncementBanner.tsx    # Realtime broadcast banner
│   └── admin/
│       ├── ClueBuilder.tsx           # Add/edit/reorder clues
│       ├── TeamCard.tsx              # Team name + PIN display
│       ├── SubmissionCard.tsx        # Photo + approve/reject
│       ├── Leaderboard.tsx           # Live rankings
│       └── BroadcastForm.tsx         # Announcement input + send
│
├── hooks/
│   ├── useTeamRealtime.ts            # Subscribes to team row changes
│   ├── useSubmissionRealtime.ts      # Subscribes to own team's submissions
│   └── useAnnouncements.ts           # Subscribes to announcement inserts
│
├── middleware.ts                      # Edge middleware — guards /admin routes
└── types/
    └── db.ts                          # Supabase generated types + session types
```

---

## Session Design

Players have no Supabase Auth account. Identity is a signed JWT cookie
issued by the server on join and validated on every protected request.

### lib/session.ts

```typescript
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)
const COOKIE_NAME = 'sh_session'
const EXPIRY = '7d' // well beyond any hunt duration

export type PlayerSession = {
  player_id: string
  team_id:   string
  name:      string
}

export type AdminSession = {
  role: 'admin'
}

export type Session = PlayerSession | AdminSession

export async function setPlayerSession(session: PlayerSession) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRY)
    .sign(SECRET)

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })
}

export async function setAdminSession() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(SECRET)

  cookies().set('sh_admin', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12
  })
}

export async function getPlayerSession(): Promise<PlayerSession | null> {
  try {
    const cookie = cookies().get(COOKIE_NAME)
    if (!cookie) return null
    const { payload } = await jwtVerify(cookie.value, SECRET)
    return payload as unknown as PlayerSession
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookie = cookies().get('sh_admin')
    if (!cookie) return null
    const { payload } = await jwtVerify(cookie.value, SECRET)
    return payload as unknown as AdminSession
  } catch {
    return null
  }
}

export function clearSession() {
  cookies().delete(COOKIE_NAME)
}
```

---

## API Routes

### POST /api/player/join

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { setPlayerSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { pin, player_name, team_name } = await req.json()

  if (!pin || !player_name?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await adminClient.rpc('join_team', {
    p_pin:         pin.toUpperCase().trim(),
    p_player_name: player_name.trim(),
    p_team_name:   team_name?.trim() ?? null
  })

  if (error) {
    if (error.message.includes('INVALID_PIN'))
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 404 })
    if (error.message.includes('TEAM_NAME_REQUIRED'))
      return NextResponse.json({ error: 'team_name_required' }, { status: 422 })
    return NextResponse.json({ error: 'Join failed' }, { status: 500 })
  }

  const { player, team } = data

  await setPlayerSession({
    player_id: player.id,
    team_id:   team.id,
    name:      player.name
  })

  return NextResponse.json({ ok: true, team })
}
```

**Join flow from the client:**
1. Player enters PIN → POST with `{ pin, player_name }` (no team_name yet)
2. If response is `team_name_required` (422) → prompt for team name → POST again with `{ pin, player_name, team_name }`
3. On success → redirect to `/play`

This way players who join second don't see the team name prompt at all.

---

### PATCH /api/player/team-name

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getPlayerSession } from '@/lib/session'

export async function PATCH(req: NextRequest) {
  const session = await getPlayerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const { data, error } = await adminClient.rpc('update_team_name', {
    p_team_id: session.team_id,
    p_name:    name.trim()
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, team: data })
}
```

---

### POST /api/game/submit

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getPlayerSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getPlayerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await req.formData()
  const file     = formData.get('photo') as File
  const clue_id  = formData.get('clue_id') as string

  if (!file || !clue_id) {
    return NextResponse.json({ error: 'Missing photo or clue_id' }, { status: 400 })
  }

  // Upload to storage — path is deterministic per team+clue
  const path = `${session.team_id}/${clue_id}.jpg`
  const { error: uploadError } = await adminClient.storage
    .from('submission-photos')
    .upload(path, file, { contentType: 'image/jpeg', upsert: false })

  if (uploadError && !uploadError.message.includes('already exists')) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Atomic insert + index increment
  const { data, error } = await adminClient.rpc('submit_clue', {
    p_team_id:   session.team_id,
    p_player_id: session.player_id,
    p_clue_id:   clue_id,
    p_photo_url: path
  })

  if (error) {
    if (error.code === '23505')
      return NextResponse.json(
        { error: 'Your teammate already submitted this one' },
        { status: 409 }
      )
    return NextResponse.json({ error: 'Submit failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, submission: data })
}
```

---

### POST /api/admin/login

```typescript
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
```

---

### POST /api/admin/team

Generates a PIN and creates the team. PIN generation is handled in Postgres.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { hunt_id } = await req.json()
  if (!hunt_id) return NextResponse.json({ error: 'hunt_id required' }, { status: 400 })

  // Generate unique PIN via Postgres function
  const { data: pin, error: pinError } = await adminClient
    .rpc('generate_pin', { p_hunt_id: hunt_id })

  if (pinError || !pin) {
    return NextResponse.json({ error: 'PIN generation failed' }, { status: 500 })
  }

  const { data: team, error } = await adminClient
    .from('team')
    .insert({ hunt_id, pin, name: null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, team })
}
```

---

### POST /api/admin/submission/[id]/approve & reject

```typescript
// approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data, error } = await adminClient.rpc('approve_submission', {
    p_submission_id: params.id
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, submission: data })
}
```

```typescript
// reject/route.ts — identical shape, calls reject_submission RPC
```

---

### POST /api/admin/announcement

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { body, hunt_id } = await req.json()
  if (!body?.trim() || !hunt_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('announcement')
    .insert({ body: body.trim(), hunt_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, announcement: data })
}
```

---

## Admin Route Guard (Middleware)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const cookie = req.cookies.get('sh_admin')
    if (!cookie) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    try {
      await jwtVerify(cookie.value, SECRET)
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
```

---

## Realtime Hooks

Realtime subscriptions use the Supabase anon key from the browser.
Tables have no public RLS policies — subscriptions are filtered by team_id
on the client, and sensitive data is not exposed via realtime payloads.

### hooks/useTeamRealtime.ts

```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

type Team = Database['public']['Tables']['team']['Row']

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useTeamRealtime(teamId: string, initial: Team) {
  const [team, setTeam] = useState<Team>(initial)

  useEffect(() => {
    const channel = supabase
      .channel(`team:${teamId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'team',
          filter: `id=eq.${teamId}`
        },
        (payload) => setTeam(payload.new as Team)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [teamId])

  return team
}
```

### hooks/useAnnouncements.ts

```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

type Announcement = Database['public']['Tables']['announcement']['Row']

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useAnnouncements(huntId: string) {
  const [latest, setLatest] = useState<Announcement | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`announcements:${huntId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'announcement',
          filter: `hunt_id=eq.${huntId}`
        },
        (payload) => setLatest(payload.new as Announcement)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [huntId])

  return latest
}
```

---

## Utilities

### lib/supabase/admin.ts

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### lib/compress.ts

```typescript
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale  = Math.min(1200 / bitmap.width, 1200 / bitmap.height, 1)
  const canvas = document.createElement('canvas')
  canvas.width  = Math.round(bitmap.width  * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) =>
    canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.8)
  )
}
```

---

## Type Generation

```bash
npx supabase gen types typescript \
  --project-id your-project-id \
  --schema public \
  > types/db.ts
```

Re-run after any schema change.

---

## Key Decisions Reflected Here

| Decision | Implementation |
|---|---|
| No Supabase Auth for players | Signed JWT cookie via `jose` |
| PIN is team credential | `team.pin` column, validated in `join_team()` |
| Team name set by first player | Atomic conditional UPDATE in `join_team()` |
| Team name editable anytime | `update_team_name()` RPC, last write wins |
| Rejoin creates new player row | Plain INSERT in `join_team()`, no upsert |
| Admin auth | Separate `sh_admin` cookie, hardcoded `ADMIN_PIN` env var |
| All player API calls validated | `getPlayerSession()` called at top of every route |
| All admin API calls validated | `getAdminSession()` called at top of every route |
