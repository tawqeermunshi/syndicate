import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Building2 } from 'lucide-react'
import { DEMO_PROFILES, isDemoUsername } from '@/lib/demoProfiles'

const ROLE_LABELS = { founder: 'Founder', vc: 'VC', operator: 'Operator', angel: 'Angel' }
const ROLE_COLORS = {
  founder: 'border-blue-500/30 text-blue-400',
  vc: 'border-green-500/30 text-green-400',
  operator: 'border-purple-500/30 text-purple-400',
  angel: 'border-yellow-500/30 text-yellow-400',
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const { role, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, role, headline, company, company_stage, metrics, location, open_to, fund_name, check_size')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (role) query = query.eq('role', role)
  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data: members } = await query.limit(100)

  const roles = ['', 'founder', 'vc', 'operator', 'angel']
  const roleLabels = { '': 'All', founder: 'Founders', vc: 'Investors', operator: 'Operators', angel: 'Angels' }

  const mergedMembers = [...DEMO_PROFILES, ...(members || []).filter(m => !isDemoUsername(m.username))]
    .filter(m => !role || m.role === role)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-4">Members</h1>

        {/* Role filter */}
        <div className="flex flex-wrap gap-2">
          {roles.map(r => (
            <Link
              key={r}
              href={r ? `/members?role=${r}` : '/members'}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                role === r || (!role && r === '')
                  ? 'bg-white text-black border-white'
                  : 'border-white/15 text-white/50 hover:text-white hover:border-white/30'
              }`}
            >
              {roleLabels[r as keyof typeof roleLabels]}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mergedMembers.map(member => (
          <Link
            key={member.id}
            href={`/profile/${member.username}`}
            className="border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={member.avatar_url} />
                <AvatarFallback className="bg-white/10 text-white">
                  {member.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm group-hover:underline truncate">{member.full_name}</span>
                  <Badge variant="outline" className={`text-xs border shrink-0 ${ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]}`}>
                    {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                  </Badge>
                  {isDemoUsername(member.username) && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-500/35 text-amber-400/90 shrink-0">
                      Demo
                    </Badge>
                  )}
                </div>

                {member.headline && (
                  <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-2">{member.headline}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-white/30">
                  {(member.company || member.fund_name) && (
                    <span className="flex items-center gap-1">
                      <Building2 size={10} />
                      {member.company || member.fund_name}
                    </span>
                  )}
                  {member.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {member.location}
                    </span>
                  )}
                </div>

                {member.metrics && (
                  <p className="text-white/40 text-xs mt-2 font-mono">{member.metrics}</p>
                )}

                {member.open_to && member.open_to.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.open_to.slice(0, 2).map((item: string) => (
                      <span key={item} className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/40">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!mergedMembers.length && (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No members found.</p>
        </div>
      )}
    </div>
  )
}
