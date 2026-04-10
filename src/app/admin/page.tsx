import { createClient } from '@/lib/supabase/server'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [
    { count: pendingProfiles },
    { count: pendingApplications },
    { count: totalMembers },
    { count: unusedInvites },
    { count: totalPosts },
    { count: totalEvents },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('invites').select('*', { count: 'exact', head: true }).is('used_by', null),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
  ])

  const stats = [
    { label: 'Pending approvals', value: (pendingProfiles ?? 0) + (pendingApplications ?? 0), alert: true, href: '/admin/applications' },
    { label: 'Approved members', value: totalMembers ?? 0, href: '/admin/members' },
    { label: 'Unused invites', value: unusedInvites ?? 0, href: '/admin/invites' },
    { label: 'Posts', value: totalPosts ?? 0, href: '/feed' },
    { label: 'Live events', value: totalEvents ?? 0, href: '/events' },
  ]

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <a key={s.label} href={s.href}
            className={`border rounded-xl p-5 hover:bg-white/5 transition-colors ${
              s.alert && (s.value > 0) ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10'
            }`}>
            <p className={`text-3xl font-bold mb-1 ${s.alert && s.value > 0 ? 'text-yellow-400' : 'text-white'}`}>
              {s.value}
            </p>
            <p className="text-white/40 text-sm">{s.label}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
