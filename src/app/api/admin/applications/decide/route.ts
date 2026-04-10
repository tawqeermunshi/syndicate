import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { resolveAppBaseUrl } from '@/lib/siteUrl'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.id)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId, decision } = await request.json()

  // Mark application as reviewed
  const { data: app, error: appError } = await supabase
    .from('applications')
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single()

  if (appError) return NextResponse.json({ error: appError.message }, { status: 500 })

  // On approval: create the user account + profile + generate login link
  if (decision === 'approved') {
    const admin = createAdminClient()
    const appUrl = resolveAppBaseUrl()

    // 1. Create auth user (email confirmed, no verification email sent)
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: app.email,
      email_confirm: true,
    })

    if (createError) {
      // User might already exist — look them up
      const { data: { users } } = await admin.auth.admin.listUsers()
      const existing = users.find(u => u.email === app.email)
      if (!existing) return NextResponse.json({ error: createError.message }, { status: 500 })

      // Generate link for existing user
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: app.email,
        options: { redirectTo: `${appUrl}/auth/callback` },
      })
      return NextResponse.json({ success: true, loginLink: linkData?.properties?.action_link ?? null })
    }

    // 2. Create profile from application data
    await admin.from('profiles').upsert({
      id: created.user.id,
      full_name: app.full_name,
      role: app.role || 'founder',
      status: 'approved',
      username: app.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') + '_' + created.user.id.slice(0, 4),
    })

    // 3. Generate one-time login link (admin-generated, no rate limit)
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: app.email,
      options: { redirectTo: `${appUrl}/auth/callback` },
    })

    return NextResponse.json({ success: true, loginLink: linkData?.properties?.action_link ?? null })
  }

  return NextResponse.json({ success: true })
}
