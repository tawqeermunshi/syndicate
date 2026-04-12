import { assertDeliverableEmail } from '@/lib/joinEmailValidation'
import { generateJoinOtpCode, hashJoinOtp, JOIN_OTP_TTL_MS } from '@/lib/joinEmailOtp'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_OTP_PER_EMAIL_PER_HOUR = 5

/** Send a 6-digit email code for invite sign-up (Resend). */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const bad = await assertDeliverableEmail(email)
    if (bad) return NextResponse.json({ error: bad }, { status: 400 })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server is not configured.' }, { status: 503 })
    }

    const admin = createAdminClient()
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: cErr } = await admin
      .from('join_email_otp')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', hourAgo)

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    if ((count ?? 0) >= MAX_OTP_PER_EMAIL_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many codes sent to this address. Try again in an hour.' },
        { status: 429 },
      )
    }

    await admin.from('join_email_otp').delete().eq('email', email).is('consumed_at', null)

    const code = generateJoinOtpCode()
    const codeHash = hashJoinOtp(email, code)
    const expiresAt = new Date(Date.now() + JOIN_OTP_TTL_MS).toISOString()

    const { error: insErr } = await admin.from('join_email_otp').insert({
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
    })
    if (insErr) {
      if (insErr.message.includes('join_email_otp') || insErr.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'Email verification table is missing. Run the latest Supabase migration (join_email_otp) on your project.',
          },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM || 'Nexus <onboarding@resend.dev>'

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: 'Your Nexus verification code',
          text: `Your verification code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        console.error('Resend error:', res.status, txt)
        return NextResponse.json({ error: 'Could not send email. Try again later.' }, { status: 502 })
      }
    } else if (process.env.ALLOW_DEV_OTP_PLAINTEXT === '1') {
      return NextResponse.json({ ok: true, devOtp: code })
    } else {
      return NextResponse.json(
        {
          error:
            'Email delivery is not configured. Add RESEND_API_KEY and RESEND_FROM in Vercel, or for local dev only set ALLOW_DEV_OTP_PLAINTEXT=1.',
        },
        { status: 503 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
