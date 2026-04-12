import { assertDeliverableEmail } from '@/lib/joinEmailValidation'
import { hashJoinOtp } from '@/lib/joinEmailOtp'
import { normalizeInviteCode } from '@/lib/inviteCode'
import { lookupInviteRow } from '@/lib/inviteLookupAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Email/password signup for invite flow: OTP + invite gate; invite claimed on auth user create. */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode : ''
    const otpRaw = typeof body.otp === 'string' ? body.otp.trim().replace(/\D/g, '') : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (otpRaw.length !== 6) {
      return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 })
    }
    if (!normalizeInviteCode(inviteCode)) {
      return NextResponse.json({ error: 'No invite code provided.' }, { status: 400 })
    }

    const deliverErr = await assertDeliverableEmail(email)
    if (deliverErr) return NextResponse.json({ error: deliverErr }, { status: 400 })

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

    const otpHash = hashJoinOtp(email, otpRaw)
    const nowIso = new Date().toISOString()
    const { data: otpRows, error: otpErr } = await admin
      .from('join_email_otp')
      .select('id')
      .eq('email', email)
      .eq('code_hash', otpHash)
      .is('consumed_at', null)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)

    if (otpErr) {
      if (otpErr.message.includes('join_email_otp') || otpErr.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'Email verification is not set up. Run the latest Supabase migration (join_email_otp) on your project.',
          },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: otpErr.message }, { status: 500 })
    }
    const otpRow = otpRows?.[0]
    if (!otpRow) {
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 })
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
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

    const uid = created.user?.id
    if (!uid) {
      return NextResponse.json({ error: 'Account creation failed.' }, { status: 500 })
    }

    const { data: claimed, error: claimErr } = await admin
      .from('invites')
      .update({ used_by: uid, used_at: new Date().toISOString() })
      .eq('id', invite.id)
      .is('used_by', null)
      .select('id')

    if (claimErr || !claimed?.length) {
      await admin.auth.admin.deleteUser(uid)
      return NextResponse.json(
        { error: 'This invite was just claimed by someone else. Try again or use a different code.' },
        { status: 409 },
      )
    }

    await admin.from('join_email_otp').update({ consumed_at: new Date().toISOString() }).eq('id', otpRow.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
