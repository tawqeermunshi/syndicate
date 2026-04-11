'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { saveDemoIntroRequest } from '@/lib/demoIntros'
import { isDemoProfileId } from '@/lib/demoProfiles'
import { Badge } from '@/components/ui/badge'

export default function IntroRequestModal({ toProfile }: { toProfile: Profile }) {
  const [open, setOpen] = useState(false)
  const [purpose, setPurpose] = useState('')
  const [context, setContext] = useState('')
  const [duration, setDuration] = useState('30')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      from_user_id: user.id,
      to_user_id: toProfile.id,
      purpose: purpose.trim(),
      context: context.trim(),
      proposed_duration: parseInt(duration),
    }

    const { error } = await supabase.from('intro_requests').insert(payload)

    // Demo profiles are not persisted in DB; fallback keeps behavior consistent.
    if (error) {
      saveDemoIntroRequest(payload)
    }

    setSent(true)
    setLoading(false)
    setTimeout(() => { setOpen(false); setSent(false) }, 2000)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" className="bg-white text-black hover:bg-white/90 font-medium shrink-0">
          Request intro
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-white">Request an intro call</DialogTitle>
            {isDemoProfileId(toProfile.id) && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-500/35 text-amber-400/90">
                Demo
              </Badge>
            )}
          </div>
          <p className="text-white/40 text-sm">with {toProfile.full_name}</p>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <p className="text-white/70">Intro request sent. They&apos;ll be notified.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-white/70">What do you want to talk about?</Label>
              <Textarea
                required
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                placeholder="Discuss pricing strategy for our B2B product..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Why them, why now?</Label>
              <Textarea
                required
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                placeholder="I saw your post about enterprise SaaS conversion — we're facing the same problem..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Proposed duration</Label>
              <Select value={duration} onValueChange={(v) => setDuration(v ?? '30')}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="15" className="focus:bg-white/10">15 minutes</SelectItem>
                  <SelectItem value="30" className="focus:bg-white/10">30 minutes</SelectItem>
                  <SelectItem value="45" className="focus:bg-white/10">45 minutes</SelectItem>
                  <SelectItem value="60" className="focus:bg-white/10">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading || !purpose.trim() || !context.trim()}
              className="w-full bg-white text-black hover:bg-white/90 font-medium"
            >
              {loading ? 'Sending...' : 'Send request'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
