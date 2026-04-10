'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RSVPButton({
  eventId,
  currentStatus,
  isFull,
}: {
  eventId: string
  currentStatus?: 'going' | 'waitlist'
  isFull: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const router = useRouter()

  async function handleRSVP() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (status) {
      // Cancel RSVP
      await supabase.from('event_attendees').delete().match({ event_id: eventId, user_id: user.id })
      setStatus(undefined)
    } else {
      const newStatus = isFull ? 'waitlist' : 'going'
      await supabase.from('event_attendees').upsert({
        event_id: eventId,
        user_id: user.id,
        status: newStatus,
      })
      setStatus(newStatus as 'going' | 'waitlist')
    }

    setLoading(false)
    router.refresh()
  }

  if (status === 'going') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleRSVP}
        disabled={loading}
        className="border-green-500/40 text-green-400 hover:border-red-500/40 hover:text-red-400 bg-transparent text-xs h-8 shrink-0"
      >
        {loading ? '...' : 'Going ✓'}
      </Button>
    )
  }

  if (status === 'waitlist') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleRSVP}
        disabled={loading}
        className="border-yellow-500/40 text-yellow-400 bg-transparent text-xs h-8 shrink-0"
      >
        {loading ? '...' : 'Waitlisted'}
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      onClick={handleRSVP}
      disabled={loading}
      className="bg-white text-black hover:bg-white/90 text-xs h-8 shrink-0"
    >
      {loading ? '...' : isFull ? 'Join waitlist' : 'RSVP'}
    </Button>
  )
}
