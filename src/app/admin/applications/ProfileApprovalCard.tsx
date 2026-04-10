'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import { MapPin, Building2 } from 'lucide-react'

const ROLE_LABELS = { founder: 'Founder', vc: 'VC', operator: 'Operator', angel: 'Angel' }

export default function ProfileApprovalCard({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function decide(decision: 'approved' | 'rejected') {
    setLoading(decision)
    await fetch('/api/admin/profiles/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profile.id, decision }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{profile.full_name}</h3>
            <span className="text-white/30 text-xs">@{profile.username}</span>
            <Badge variant="outline" className="text-xs border-white/20 text-white/40">
              {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS]}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
            {profile.company && <span className="flex items-center gap-1"><Building2 size={11} />{profile.company}</span>}
            {profile.location && <span className="flex items-center gap-1"><MapPin size={11} />{profile.location}</span>}
          </div>
        </div>
        <span className="text-white/20 text-xs shrink-0">
          {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {profile.headline && (
        <p className="text-white/70 text-sm">{profile.headline}</p>
      )}

      {profile.metrics && (
        <div>
          <p className="text-xs text-white/30 mb-1 uppercase tracking-wider">Traction</p>
          <p className="text-white/80 text-sm">{profile.metrics}</p>
        </div>
      )}

      {profile.past_work && (
        <div>
          <p className="text-xs text-white/30 mb-1 uppercase tracking-wider">Past work</p>
          <p className="text-white/80 text-sm">{profile.past_work}</p>
        </div>
      )}

      {profile.open_to && profile.open_to.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.open_to.map((item: string) => (
            <span key={item} className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-white/40">{item}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-white/10">
        <Button size="sm" disabled={!!loading} onClick={() => decide('approved')}
          className="bg-white text-black hover:bg-white/90 text-xs h-8">
          {loading === 'approved' ? 'Approving...' : 'Approve'}
        </Button>
        <Button size="sm" variant="outline" disabled={!!loading} onClick={() => decide('rejected')}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 bg-transparent">
          {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
    </div>
  )
}
