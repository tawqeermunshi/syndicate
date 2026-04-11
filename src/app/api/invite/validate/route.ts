import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/** Anonymous callers cannot read `invites` under normal RLS; use service role server-side only. */
export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'No invite code provided' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Invite validation is not configured on this server.' },
        { status: 503 },
      )
    }

    const admin = createAdminClient()
    const normalized = code.trim().toUpperCase()
    const { data: invite, error } = await admin
      .from('invites')
      .select('id, used_by, expires_at')
      .eq('code', normalized)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
