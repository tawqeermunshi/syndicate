'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isOnline, setIsOnline] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const f = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('events').insert({
      organiser_id: user.id,
      title: f('title'),
      description: f('description') || null,
      event_type: f('event_type'),
      status: 'published',
      is_online: isOnline,
      location_name: !isOnline ? f('location_name') || null : null,
      location_address: !isOnline ? f('location_address') || null : null,
      city: !isOnline ? f('city') || null : null,
      online_link: isOnline ? f('online_link') || null : null,
      starts_at: f('starts_at'),
      ends_at: f('ends_at') || null,
      capacity: f('capacity') ? parseInt(f('capacity')) : null,
    }).select().single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/events/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/events" className="text-white/40 hover:text-white text-sm transition-colors">
          Events
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-sm">New event</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-8">Organise an event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-white/70">Event title</Label>
          <Input
            name="title"
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            placeholder="Founder dinner — Bandra, Mumbai"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/70">Description</Label>
          <Textarea
            name="description"
            rows={3}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            placeholder="Intimate dinner for 12 founders and operators. Good food, real conversations."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white/70">Event type</Label>
            <Select name="event_type" required>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                {[
                  { value: 'dinner', label: 'Dinner' },
                  { value: 'meetup', label: 'Meetup' },
                  { value: 'conference', label: 'Conference' },
                  { value: 'workshop', label: 'Workshop' },
                  { value: 'demo_day', label: 'Demo Day' },
                ].map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Capacity <span className="text-white/30">(optional)</span></Label>
            <Input
              name="capacity"
              type="number"
              min="1"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              placeholder="12"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white/70">Start date & time</Label>
            <Input
              name="starts_at"
              type="datetime-local"
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">End time <span className="text-white/30">(optional)</span></Label>
            <Input
              name="ends_at"
              type="datetime-local"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Location toggle */}
        <div className="space-y-4">
          <div className="flex rounded-lg border border-white/10 p-1 w-fit">
            <button type="button" onClick={() => setIsOnline(false)}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${!isOnline ? 'bg-white text-black font-medium' : 'text-white/50'}`}>
              In-person
            </button>
            <button type="button" onClick={() => setIsOnline(true)}
              className={`px-4 py-1.5 rounded-md text-sm transition-colors ${isOnline ? 'bg-white text-black font-medium' : 'text-white/50'}`}>
              Online
            </button>
          </div>

          {isOnline ? (
            <div className="space-y-2">
              <Label className="text-white/70">Meeting link <span className="text-white/30">(optional, shared after RSVP)</span></Label>
              <Input
                name="online_link"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder="https://meet.google.com/..."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Venue name</Label>
                <Input
                  name="location_name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder="The Bungalow, Bandra"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Address</Label>
                  <Input
                    name="location_address"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    placeholder="14 Pali Hill Road"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">City</Label>
                  <Input
                    name="city"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    placeholder="Mumbai"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-white text-black hover:bg-white/90 font-semibold px-8"
          >
            {loading ? 'Publishing...' : 'Publish event'}
          </Button>
          <Link href="/events">
            <Button variant="ghost" type="button" className="text-white/50 hover:text-white">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
