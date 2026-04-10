'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

export default function MemberStatusToggle({
  memberId, status, name
}: {
  memberId: string
  status: string
  name: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle(newStatus: string) {
    setLoading(true)
    await fetch('/api/admin/profiles/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: memberId, decision: newStatus }),
    })
    setLoading(false)
    router.refresh()
  }

  if (status === 'approved') {
    return (
      <Button size="sm" variant="outline" disabled={loading} onClick={() => toggle('rejected')}
        className="border-white/10 text-white/30 hover:border-red-500/40 hover:text-red-400 text-xs h-7 bg-transparent">
        {loading ? '...' : 'Revoke'}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`text-xs border ${
        status === 'pending' ? 'border-yellow-500/30 text-yellow-400' : 'border-red-500/30 text-red-400'
      }`}>
        {status}
      </Badge>
      <Button size="sm" disabled={loading} onClick={() => toggle('approved')}
        className="bg-white text-black hover:bg-white/90 text-xs h-7">
        {loading ? '...' : 'Approve'}
      </Button>
    </div>
  )
}
