import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicOrigin } from '@/lib/siteUrl'

const PUBLIC_PATHS = ['/', '/apply', '/login', '/join', '/auth/callback']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Must run before auth: fetch() follows redirects and would re-POST to /login (405, empty body).
  if (pathname.startsWith('/api')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic =
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/auth'))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', getPublicOrigin(request)))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
