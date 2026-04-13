import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import AdminGenerateInvite from './AdminGenerateInvite'
import AdminAdjustSlots from './AdminAdjustSlots'

export default async function AdminInvitesPage() {
  const supabase = await createClient()

  const [{ data: invites }, { data: members }] = await Promise.all([
    supabase
      .from('invites')
      .select(`
        *,
        creator:profiles!created_by(full_name, username)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, username, invite_slots')
      .eq('status', 'approved')
      .order('full_name'),
  ])

  const unused = (invites || []).filter(i => !i.used_by)
  const used = (invites || []).filter(i => i.used_by)

  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Invites</h1>
          <p className="text-white/30 text-sm">{unused.length} unused · {used.length} used</p>
        </div>
        <AdminGenerateInvite />
      </div>

      {/* Unused codes */}
      {unused.length > 0 && (
        <div>
          <h2 className="text-xs tracking-widest uppercase text-white/30 mb-3">Unused codes</h2>
          <div className="space-y-2">
            {unused.map(invite => (
              <div key={invite.id} className="border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <code className="font-mono text-sm text-white/80 tracking-wider">{invite.code}</code>
                  <span className="text-white/30 text-xs">
                    by {invite.creator?.full_name ?? 'system'}
                  </span>
                </div>
                <span className="text-white/20 text-xs">
                  {new Date(invite.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used codes */}
      {used.length > 0 && (
        <div>
          <h2 className="text-xs tracking-widest uppercase text-white/30 mb-3">Used codes</h2>
          <div className="space-y-2">
            {used.map(invite => (
              <div key={invite.id} className="border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <code className="font-mono text-sm text-white/40 tracking-wider line-through">{invite.code}</code>
                  <span className="text-white/30 text-xs">used</span>
                </div>
                <span className="text-white/20 text-xs">
                  {invite.used_at ? new Date(invite.used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member invite slots */}
      <div>
        <h2 className="text-xs tracking-widest uppercase text-white/30 mb-3">Member invite slots</h2>
        <div className="space-y-2">
          {(members || []).map(member => (
            <div key={member.id} className="border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{member.full_name}</span>
                <span className="text-white/30 text-xs ml-2">@{member.username}</span>
              </div>
              <AdminAdjustSlots memberId={member.id} currentSlots={member.invite_slots} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
