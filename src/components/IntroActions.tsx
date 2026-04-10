'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function IntroActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const router = useRouter()

  async function respond(action: 'accept' | 'decline') {
    setLoading(action)
    const supabase = createClient()
    await supabase.from('intro_requests').update({
      status: action === 'accept' ? 'accepted' : 'declined',
      ...(action === 'accept' ? { accepted_at: new Date().toISOString() } : { declined_at: new Date().toISOString() }),
    }).eq('id', requestId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 pt-1">
      <Button
        size="sm"
        disabled={!!loading}
        onClick={() => respond('accept')}
        className="bg-white text-black hover:bg-white/90 text-xs h-8"
      >
        {loading === 'accept' ? 'Accepting...' : 'Accept'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!loading}
        onClick={() => respond('decline')}
        className="border-white/20 text-white/60 hover:text-white hover:bg-white/5 text-xs h-8 bg-transparent"
      >
        {loading === 'decline' ? 'Declining...' : 'Decline'}
      </Button>
    </div>
  )
}
