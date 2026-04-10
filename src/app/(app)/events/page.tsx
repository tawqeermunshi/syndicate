import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Calendar, Users, Globe } from 'lucide-react'
import RSVPButton from '@/components/events/RSVPButton'

const EVENT_TYPE_LABELS = {
  dinner: 'Dinner',
  meetup: 'Meetup',
  conference: 'Conference',
  workshop: 'Workshop',
  demo_day: 'Demo Day',
}

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      organiser:profiles!organiser_id(id, username, full_name, avatar_url, company)
    `)
    .eq('status', 'published')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  // Get attendee counts and user's RSVP status
  const eventIds = (events || []).map(e => e.id)
  const { data: attendees } = eventIds.length
    ? await supabase
        .from('event_attendees')
        .select('event_id, user_id, status')
        .in('event_id', eventIds)
    : { data: [] }

  const countMap = (attendees || []).reduce((acc, a) => {
    if (a.status === 'going') acc[a.event_id] = (acc[a.event_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const userRsvpMap = (attendees || [])
    .filter(a => a.user_id === user!.id)
    .reduce((acc, a) => { acc[a.event_id] = a.status; return acc }, {} as Record<string, string>)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link href="/events/new">
          <Button size="sm" className="bg-white text-black hover:bg-white/90 font-medium">
            Organise event
          </Button>
        </Link>
      </div>

      {!events?.length ? (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No upcoming events.</p>
          <p className="text-white/20 text-xs mt-1">Organise one for the community.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const goingCount = countMap[event.id] || 0
            const isFull = event.capacity && goingCount >= event.capacity
            const userStatus = userRsvpMap[event.id]

            return (
              <div key={event.id} className="border border-white/10 rounded-xl p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs border-white/20 text-white/40">
                        {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS]}
                      </Badge>
                      {isFull && (
                        <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">Full</Badge>
                      )}
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <h2 className="font-semibold text-white hover:underline">{event.title}</h2>
                    </Link>
                  </div>
                  <RSVPButton
                    eventId={event.id}
                    currentStatus={userStatus as 'going' | 'waitlist' | undefined}
                    isFull={!!isFull}
                  />
                </div>

                {event.description && (
                  <p className="text-white/50 text-sm leading-relaxed line-clamp-2">{event.description}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(event.starts_at).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                    {' · '}
                    {new Date(event.starts_at).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </span>
                  {event.is_online ? (
                    <span className="flex items-center gap-1.5">
                      <Globe size={12} /> Online
                    </span>
                  ) : (
                    event.location_name && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} /> {event.location_name}{event.city && `, ${event.city}`}
                      </span>
                    )
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users size={12} />
                    {goingCount} going
                    {event.capacity && <span className="text-white/20"> / {event.capacity}</span>}
                  </span>
                </div>

                {/* Organiser */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={event.organiser?.avatar_url} />
                    <AvatarFallback className="bg-white/10 text-white text-xs">
                      {event.organiser?.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white/30 text-xs">
                    organised by{' '}
                    <Link href={`/profile/${event.organiser?.username}`} className="text-white/50 hover:text-white transition-colors">
                      {event.organiser?.full_name}
                    </Link>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
