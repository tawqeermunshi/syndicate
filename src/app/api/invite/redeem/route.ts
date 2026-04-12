import { normalizeInviteCode } from '@/lib/inviteCode'
import { lookupInviteRow } from '@/lib/inviteLookupAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Apply a verified invite to the signed-in user: approve profile + mark invite used.
 * Must run server-side with service role — clients cannot read others' invites under RLS.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode : ''
    const normalized = normalizeInviteCode(inviteCode)
    if (!normalized) {
      return NextResponse.json({ error: 'No invite code provided' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server is not configured for invite redemption.' },
        { status: 503 },
      )
    }

    const admin = createAdminClient()
    const { invite, queryError } = await lookupInviteRow(admin, normalized)
    if (queryError) return NextResponse.json({ error: queryError }, { status: 500 })
    if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    const { data: invFull, error: invErr } = await admin
      .from('invites')
      .select('id, created_by, used_by')
      .eq('id', invite.id)
      .single()

    if (invErr || !invFull?.created_by) {
      return NextResponse.json({ error: 'Invite metadata missing' }, { status: 500 })
    }

    if (invFull.used_by === user.id) {
      const { error: pErr } = await admin
        .from('profiles')
        .update({ status: 'approved', invited_by: invFull.created_by })
        .eq('id', user.id)
      if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (invFull.used_by) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 })
    }

    const { data: claimed, error: claimErr } = await admin
      .from('invites')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('id', invite.id)
      .is('used_by', null)
      .select('id')

    if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 })
    if (!claimed?.length) {
      const { data: again } = await admin.from('invites').select('used_by').eq('id', invite.id).maybeSingle()
      if (again?.used_by === user.id) {
        await admin
          .from('profiles')
          .update({ status: 'approved', invited_by: invFull.created_by })
          .eq('id', user.id)
        return NextResponse.json({ ok: true })
      }
      return NextResponse.json(
        { error: 'This invite was just claimed. Refresh and sign in, or use another code.' },
        { status: 409 },
      )
    }

    const { error: pErr } = await admin
      .from('profiles')
      .update({ status: 'approved', invited_by: invFull.created_by })
      .eq('id', user.id)

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
