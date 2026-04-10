'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ApplicationActions({
  applicationId,
  email,
  reviewerId,
}: {
  applicationId: string
  email: string
  reviewerId: string
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function decide(decision: 'approved' | 'rejected' | 'waitlisted') {
    setLoading(decision)
    await fetch('/api/admin/applications/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, decision, reviewerId }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 pt-2 border-t border-white/10">
      <Button
        size="sm"
        disabled={!!loading}
        onClick={() => decide('approved')}
        className="bg-white text-black hover:bg-white/90 text-xs h-8"
      >
        {loading === 'approved' ? '...' : 'Approve'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        onClick={() => decide('waitlisted')}
        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs h-8 bg-transparent"
      >
        {loading === 'waitlisted' ? '...' : 'Waitlist'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        onClick={() => decide('rejected')}
        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 bg-transparent"
      >
        {loading === 'rejected' ? '...' : 'Reject'}
      </Button>
    </div>
  )
}
