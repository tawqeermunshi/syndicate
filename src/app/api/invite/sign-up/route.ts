import { normalizeInviteCode } from '@/lib/inviteCode'
import { lookupInviteRow } from '@/lib/inviteLookupAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/** Email/password signup for invite flow: invite proves access; user is created confirmed (no inbox step). */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (!normalizeInviteCode(inviteCode)) {
      return NextResponse.json({ error: 'No invite code provided.' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            'Sign-up is not configured until SUPABASE_SERVICE_ROLE_KEY is set on this server. Redeploy after adding it in Vercel → Environment Variables.',
        },
        { status: 503 },
      )
    }

    const admin = createAdminClient()
    const { invite, queryError } = await lookupInviteRow(admin, inviteCode)
    if (queryError) return NextResponse.json({ error: queryError }, { status: 500 })
    if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    if (invite.used_by) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 })
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      const msg = createError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Sign in with that email instead.' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
