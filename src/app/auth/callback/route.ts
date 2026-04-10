import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const inviteCode = url.searchParams.get('invite')

  if (code) {
    // Create the response up front so cookies can be set directly on it
    const response = NextResponse.redirect(new URL('/login', request.url))

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

      let destination: string
      if (!profile) {
        destination = inviteCode ? `/onboarding?invite=${inviteCode}` : '/onboarding'
      } else if (profile.status === 'approved') {
        destination = '/feed'
      } else {
        destination = '/pending'
      }

      response.headers.set('location', new URL(destination, request.url).toString())
      return response
    }
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
