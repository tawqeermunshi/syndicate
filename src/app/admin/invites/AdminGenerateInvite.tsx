'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AdminGenerateInvite() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    await fetch('/api/admin/invites/generate', { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button onClick={generate} disabled={loading}
      className="bg-white text-black hover:bg-white/90 font-medium">
      {loading ? 'Generating...' : 'Generate invite'}
    </Button>
  )
}
