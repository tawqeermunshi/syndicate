import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import MemberStatusToggle from './MemberStatusToggle'

const ROLE_LABELS = { founder: 'Founder', vc: 'VC', operator: 'Operator', angel: 'Angel' }
const ROLE_COLORS = {
  founder: 'border-blue-500/30 text-blue-400',
  vc: 'border-green-500/30 text-green-400',
  operator: 'border-purple-500/30 text-purple-400',
  angel: 'border-yellow-500/30 text-yellow-400',
}

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, role, status, company, location, invite_slots, created_at')
    .order('created_at', { ascending: false })

  const approved = (members || []).filter(m => m.status === 'approved')
  const others = (members || []).filter(m => m.status !== 'approved')

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline gap-3 mb-8">
        <h1 className="text-2xl font-bold">Members</h1>
        <span className="text-white/30 text-sm">{approved.length} approved</span>
      </div>

      <div className="space-y-2">
        {(members || []).map(member => (
          <div key={member.id} className="border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={member.avatar_url} />
              <AvatarFallback className="bg-white/10 text-white text-sm">{member.full_name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${member.username}`} className="font-medium text-sm hover:underline">
                  {member.full_name}
                </Link>
                <span className="text-white/30 text-xs">@{member.username}</span>
                <Badge variant="outline" className={`text-xs border ${ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]}`}>
                  {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-white/30">
                {member.company && <span>{member.company}</span>}
                <span>{member.invite_slots} invite slots</span>
                <span>{new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <MemberStatusToggle memberId={member.id} status={member.status} name={member.full_name} />
            </div>
          </div>
        ))}
      </div>

      {!members?.length && (
        <p className="text-white/30 text-sm text-center py-16">No members yet.</p>
      )}
    </div>
  )
}
