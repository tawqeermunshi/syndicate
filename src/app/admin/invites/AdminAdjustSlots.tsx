'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAdjustSlots({ memberId, currentSlots }: { memberId: string; currentSlots: number }) {
  const [slots, setSlots] = useState(currentSlots)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function update(newSlots: number) {
    if (newSlots < 0) return
    setLoading(true)
    setSlots(newSlots)
    await fetch('/api/admin/invites/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, slots: newSlots }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => update(slots - 1)} disabled={loading || slots === 0}
        className="w-6 h-6 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-sm flex items-center justify-center transition-colors disabled:opacity-30">
        −
      </button>
      <span className="text-sm font-mono w-4 text-center">{slots}</span>
      <button onClick={() => update(slots + 1)} disabled={loading}
        className="w-6 h-6 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/30 text-sm flex items-center justify-center transition-colors">
        +
      </button>
    </div>
  )
}
