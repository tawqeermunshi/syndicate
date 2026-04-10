'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function GenerateInviteButton({ slotsRemaining }: { slotsRemaining: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    const res = await fetch('/api/invites/generate', { method: 'POST' })
    if (res.ok) router.refresh()
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      disabled={loading || slotsRemaining === 0}
      onClick={generate}
      className="bg-white text-black hover:bg-white/90 font-medium shrink-0"
    >
      {loading ? 'Generating...' : 'Generate invite'}
    </Button>
  )
}
