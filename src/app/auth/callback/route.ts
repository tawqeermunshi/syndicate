import { normalizeInviteCode } from '@/lib/inviteCode'
import { lookupInviteRow } from '@/lib/inviteLookupAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicOrigin } from '@/lib/siteUrl'

export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request)
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const inviteCode = url.searchParams.get('invite')

  if (code) {
    // Create the response up front so cookies can be set directly on it
    const response = NextResponse.redirect(new URL('/login', origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Set cookies on the response, not on the Next.js cookie store
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, status')
        .eq('id', data.user.id)
        .single()

      // Email/password sign-up claims the invite in /api/invite/sign-up; Google OAuth does not.
      // Claim here so the same code cannot be re-verified after a successful Google join.
      if (!profile && inviteCode && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const norm = normalizeInviteCode(inviteCode)
        if (norm) {
          const admin = createAdminClient()
          const { invite, queryError } = await lookupInviteRow(admin, norm)
          if (!queryError && invite) {
            if (invite.used_by && invite.used_by !== data.user.id) {
              response.headers.set('location', new URL('/join?invite_used=1', origin).toString())
              return response
            }
            if (!invite.used_by) {
              await admin
                .from('invites')
                .update({ used_by: data.user.id, used_at: new Date().toISOString() })
                .eq('id', invite.id)
                .is('used_by', null)
            }
          }
        }
      }

      let destination: string
      if (!profile) {
        destination = inviteCode ? `/onboarding?invite=${encodeURIComponent(normalizeInviteCode(inviteCode) || inviteCode)}` : '/onboarding'
      } else if (profile.status === 'approved') {
        destination = '/feed'
      } else {
        destination = '/pending'
      }

      response.headers.set('location', new URL(destination, origin).toString())
      return response
    }
  }

  return NextResponse.redirect(new URL('/login', origin))
}
