import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const ROLE_LABELS: Record<string, string> = {
  founder: 'Founder',
  vc: 'VC / Angel',
  operator: 'Operator',
  angel: 'Angel',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, role, created_at')
    .eq('id', user!.id)
    .single()

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-white/40 mb-8">Account and profile</p>

      <div className="space-y-4">
        <section className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-4">Account</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-white/40 text-xs mb-1">Email</dt>
              <dd className="text-white/85">{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-white/40 text-xs mb-1">Sign-in</dt>
              <dd className="text-white/60 text-xs leading-relaxed">
                Google sign-in is managed in your Google account. Email and password accounts use the reset flow from
                the login screen when your workspace enables it.
              </dd>
            </div>
          </dl>
        </section>

        <section className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-4">Profile</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-white/40 text-xs mb-1">Name</dt>
              <dd className="text-white/85">{profile?.full_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-white/40 text-xs mb-1">Role</dt>
              <dd className="text-white/85">
                {profile?.role ? ROLE_LABELS[profile.role] ?? profile.role : '—'}
              </dd>
            </div>
            {memberSince && (
              <div>
                <dt className="text-white/40 text-xs mb-1">Member since</dt>
                <dd className="text-white/85">{memberSince}</dd>
              </div>
            )}
          </dl>
          {profile?.username && (
            <Link
              href={`/profile/${profile.username}`}
              className="inline-flex mt-4 text-sm text-violet-300/90 hover:text-violet-200 underline underline-offset-2"
            >
              View public profile
            </Link>
          )}
        </section>

        <p className="text-xs text-white/30 pt-2">
          More preferences (notifications, email digests) can ship here later.
        </p>
      </div>
    </div>
  )
}
