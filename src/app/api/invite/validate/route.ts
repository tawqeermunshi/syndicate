import { normalizeInviteCode } from '@/lib/inviteCode'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

type InviteRow = { id: string; used_by: string | null; expires_at: string | null }

/** Anonymous callers cannot read `invites` under normal RLS; use service role server-side only. */
export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'No invite code provided' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            'Invite codes cannot be verified until SUPABASE_SERVICE_ROLE_KEY is set on this server (e.g. in Vercel → Project → Settings → Environment Variables). Copy it from Supabase → Project Settings → API → service_role, then redeploy.',
        },
        { status: 503 },
      )
    }

    const admin = createAdminClient()
    const normalized = normalizeInviteCode(code)
    if (!normalized) {
      return NextResponse.json({ error: 'No invite code provided' }, { status: 400 })
    }

    let invite: InviteRow | null = null

    const rpc = await admin.rpc('match_invite_code', { p_raw: normalized })
    if (!rpc.error && rpc.data !== null && rpc.data !== undefined) {
      const rows = rpc.data as InviteRow | InviteRow[]
      invite = Array.isArray(rows) ? rows[0] ?? null : rows
    }

    if (!invite) {
      const { data: row, error } = await admin
        .from('invites')
        .select('id, used_by, expires_at')
        .ilike('code', normalized)
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      invite = row
    }

    if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    if (invite.used_by) return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 })
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
