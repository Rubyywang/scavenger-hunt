# Scavenger Hunt Web App — Project Plan

## Overview

A mobile-first browser-based scavenger hunt platform. Players join via a PIN shared by the admin, follow sequential clues, and upload photo proof at each location. One active hunt at a time. The admin manages everything from a dashboard.

---

## Core Concept

- **One shared URL** — everyone navigates to the same link. No app install.
- **PIN-based join** — admin creates teams, each team gets a unique PIN. Admin shares PINs manually (WhatsApp, printed sheet, etc.). No email, no magic links.
- **Team name set by first player** — first teammate to join sets the team name. Everyone else sees it on join. Any player can change it anytime after that.
- **Individual player names** — each player enters their own display name. No uniqueness enforced — two Sarahs on a team is fine.
- **Rejoin = new player row** — if a player loses their session (phone dies, clears cookies), they re-enter their PIN + name and get a new player row. Team progress is unaffected.
- **One active hunt at a time** — enforced by a partial unique index in Postgres.
- **Sequential clues, async review** — next clue unlocks as soon as a submission is made, not on approval. Multiple clues can be in-flight. Progression and scoring are fully decoupled.
- **First submission locks the clue** — one photo per clue per team. Unique constraint at DB level. Duplicate attempt returns "your teammate already submitted this one."
- **Confirmation before submit** — player sees a compressed preview, taps Submit or Retake before anything uploads.
- **Client-side image compression** — max 1200px / 80% JPEG quality before upload. Typical output 150–400KB vs 8–15MB iPhone original.
- **Fixed points per clue** — same points for every team, awarded on approval only.
- **Manual photo approval** — admin reviews async, never blocks team progression.
- **Admin broadcast** — admin sends a message to all teams mid-hunt via realtime.
- **No time limits** — hunt ends when admin ends it.
- **Live leaderboard for admin only** — players see final scores at end of hunt.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend + API routes | Next.js (App Router) | One repo for frontend + backend, great learning ground |
| Database + Storage + Realtime | Supabase | Postgres, file storage, realtime subscriptions |
| Session auth | `jose` (signed JWT cookies) | No Supabase Auth needed for players |
| Styling | Tailwind CSS | Mobile-first, fast to learn |
| Deployment | Vercel | Free tier, one-click deploy with Next.js |

**Auth model:**
- Players: PIN + name → server issues a signed JWT cookie (`jose`). No Supabase Auth.
- Admin: hardcoded `ADMIN_PIN` env var → separate signed cookie. No user accounts.
- Service role key used server-side for all DB operations. Never exposed to client.

---

## Data Model

### `hunt`
```
id          uuid PK
title       text
status      enum        -- draft | active | ended
created_at  timestamptz
started_at  timestamptz
ended_at    timestamptz
```
Partial unique index: `UNIQUE (status) WHERE status = 'active'` — one active hunt at a time.

### `clue`
```
id             uuid PK
hunt_id        uuid FK → hunt
order_index    int         -- determines unlock sequence
body           text        -- shown to players
hint           text        -- optional
location_name  text        -- admin reference only
points_value   int
UNIQUE (hunt_id, order_index)
```

### `team`
```
id                  uuid PK
hunt_id             uuid FK → hunt
name                text        -- null until first player sets it
pin                 text        -- admin-generated, shared manually
total_score         int         -- updated on approval
latest_clue_index   int         -- updated on submission
UNIQUE (hunt_id, pin)
```

### `player`
```
id          uuid PK
team_id     uuid FK → team
name        text
joined_at   timestamptz
```
No uniqueness constraints. Rejoin creates a new row.

### `submission`
```
id              uuid PK
team_id         uuid FK → team
clue_id         uuid FK → clue
player_id       uuid FK → player
photo_url       text
submitted_at    timestamptz
reviewed_at     timestamptz
status          enum        -- pending | approved | rejected | failed
points_awarded  int
UNIQUE (team_id, clue_id)   -- enforced at DB level
```

### `announcement`
```
id          uuid PK
hunt_id     uuid FK → hunt
body        text
created_at  timestamptz
```

### `ai_review` *(Phase 5 placeholder)*
```
id                uuid PK
submission_id     uuid FK → submission
model             text
confidence        float
suggested_status  enum  -- approved | rejected
reviewed_at       timestamptz
UNIQUE (submission_id)
```

---

## Key Mechanic: Progression vs Scoring

| Event | Progression | Score |
|---|---|---|
| Team submits photo | `latest_clue_index` +1, next clue unlocks | No change |
| Admin approves | No change | `total_score` += `points_value` |
| Admin rejects | No change | Submission → `failed`, 0 points |

Teams never wait on the admin. Review is purely async.

---

## Postgres Functions

| Function | Purpose |
|---|---|
| `join_team(pin, player_name, team_name?)` | Validate PIN, set team name atomically if first, insert player, return both |
| `update_team_name(team_id, name)` | Update team name, any player, anytime, last write wins |
| `submit_clue(team_id, player_id, clue_id, photo_url)` | Atomic insert + index increment |
| `approve_submission(submission_id)` | Set approved, award points, update team score |
| `reject_submission(submission_id)` | Set failed, 0 points |
| `start_hunt(hunt_id)` | Flip to active, record start time |
| `end_hunt(hunt_id)` | Flip to ended, record end time |
| `generate_pin(hunt_id)` | Generate unique 6-char PIN for a team |

All functions are `SECURITY DEFINER` — run with service role privileges, called via `supabase.rpc()` from API routes only.

---

## Photo Submission Flow

1. Player taps **Upload proof** → `<input type="file" accept="image/*" capture="environment">`
2. Client-side compression runs (max 1200px, 80% JPEG)
3. **Confirmation screen** — compressed preview, **Submit** / **Retake**
4. Player taps Submit → `POST /api/game/submit` with FormData
5. Server uploads to Supabase Storage (`{team_id}/{clue_id}.jpg`)
6. `submit_clue()` RPC fires atomically
7. On success → next clue unlocks via realtime on all teammates' screens
8. On `23505` (unique violation) → "Your teammate already submitted this one"

---

## Join Flow

1. Player navigates to the app URL
2. Enters PIN + their display name → `POST /api/player/join`
3. If team has no name yet → server returns `team_name_required` → player is prompted for team name → resubmit
4. Server issues signed JWT cookie → redirect to `/play`
5. Rejoin: same flow, new player row, session restored

---

## Game Flow

### Admin setup
1. Create hunt + clues (order, body, points)
2. Create teams → PINs generated → share manually
3. Press **Start hunt**

### In-game
- Teams join, first player sets team name
- Sequential clues unlock on submission
- Admin reviews photos async — approval updates score only
- Admin broadcasts mid-hunt announcements
- Leaderboard visible to admin only

### End
- Admin presses **End hunt**
- Final leaderboard revealed to all players

---

## Build Phases

### Phase 1 — Hunt + clue engine
- Supabase schema + functions
- Next.js + Tailwind setup
- Admin: create hunt, clues, teams
- Player: join flow, PIN validation, cookie session, clue display

### Phase 2 — Photo upload + review
- Supabase Storage bucket
- Client compression utility
- Player: camera, confirmation screen, upload, pending state
- Admin: submission queue, approve/reject

### Phase 3 — Realtime + leaderboard
- Realtime on `team` and `announcement`
- Admin live leaderboard
- Player announcement banner
- End-of-hunt final scores

### Phase 4 — Polish + resilience
- Reconnect handling
- Broadcast UI
- Hunt start/end with confirmation dialogs
- Mobile polish
- Edge cases: join mid-hunt, no submissions, network drop during upload

### Phase 5 — AI photo review *(future)*
- Supabase edge function on submission insert
- Vision model call (Claude or GPT-4o) with photo + clue context
- Write to `ai_review` table
- Admin sees confidence badge in queue
- Optional auto-approve above threshold

---

## All Decisions Locked

| Decision | Choice |
|---|---|
| Auth (players) | PIN + name → signed JWT cookie (`jose`) |
| Auth (admin) | Hardcoded `ADMIN_PIN` env var → signed cookie |
| Team credential | PIN generated by Postgres, shared by admin manually |
| Team name | Set by first player (atomic), editable anytime by any player |
| Player identity | Display name only, no uniqueness, rejoin = new row |
| Team size | ~6 players, not enforced at DB level |
| Clue structure | Sequential, unlock on submission (not approval) |
| Multiple in-flight clues | Yes — progression and scoring decoupled |
| Duplicate submissions | Blocked by `UNIQUE (team_id, clue_id)` |
| Atomicity | `submit_clue()` Postgres function |
| Photo confirmation | Preview screen before upload — Submit / Retake |
| Image compression | Client-side canvas, max 1200px, 80% JPEG |
| Rejected photo | Marked `failed`, 0 points, no resubmit |
| Scoring | Fixed points per clue, on approval only |
| Leaderboard | Admin only during hunt, all players at end |
| Time limits | None — admin ends manually |
| Announcements | Admin broadcast via realtime |
| Server logic | Next.js API routes + Postgres functions |
| Realtime | Supabase realtime (Postgres LISTEN/NOTIFY) |
| Photo approval | Manual now, AI-assisted Phase 5 |
| Hunt concurrency | One active hunt, enforced by partial unique index |
