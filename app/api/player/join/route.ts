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
    p_team_name:   team_name?.trim() ?? null,
  })

  if (error) {
    if (error.message.includes('INVALID_PIN'))
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 404 })
    if (error.message.includes('TEAM_NAME_REQUIRED'))
      return NextResponse.json({ error: 'team_name_required' }, { status: 422 })
    return NextResponse.json({ error: 'Join failed' }, { status: 500 })
  }

  const { player, team } = data as { player: { id: string; name: string }; team: { id: string } }

  await setPlayerSession({
    player_id: player.id,
    team_id:   team.id,
    name:      player.name,
  })

  return NextResponse.json({ ok: true, team })
}
