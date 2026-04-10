import { createClient } from '@/lib/supabase/server'
import GenerateInviteButton from '@/components/GenerateInviteButton'

export default async function InvitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('invite_slots')
    .eq('id', user!.id)
    .single()

  const { data: invites } = await supabase
    .from('invites')
    .select('*, used_by_profile:profiles!used_by(full_name, username)')
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  const used = (invites || []).filter(i => i.used_by)
  const unused = (invites || []).filter(i => !i.used_by)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold mb-1">Invites</h1>
          <p className="text-white/40 text-sm">
            You have <span className="text-white font-medium">{profile?.invite_slots ?? 0}</span> invite{profile?.invite_slots !== 1 ? 's' : ''} remaining.
            Only invite people you'd personally vouch for.
          </p>
        </div>
        <GenerateInviteButton slotsRemaining={profile?.invite_slots ?? 0} />
      </div>

      {/* Unused invites */}
      {unused.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs tracking-widest uppercase text-white/30 mb-3">Unused codes</h2>
          <div className="space-y-2">
            {unused.map(invite => (
              <div key={invite.id} className="border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                <code className="font-mono text-sm text-white/80 tracking-wider">{invite.code}</code>
                <span className="text-white/30 text-xs">
                  {new Date(invite.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used invites */}
      {used.length > 0 && (
        <div>
          <h2 className="text-xs tracking-widest uppercase text-white/30 mb-3">Used</h2>
          <div className="space-y-2">
            {used.map(invite => (
              <div key={invite.id} className="border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between opacity-50">
                <code className="font-mono text-sm text-white/60 tracking-wider line-through">{invite.code}</code>
                <span className="text-white/40 text-xs">
                  used by {invite.used_by_profile?.full_name || 'someone'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!invites?.length && (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No invites generated yet.</p>
          <p className="text-white/20 text-xs mt-1">Generate your first invite code above.</p>
        </div>
      )}
    </div>
  )
}
