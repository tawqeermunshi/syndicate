import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Globe, MapPin, Users } from 'lucide-react'
import RSVPButton from '@/components/events/RSVPButton'

const EVENT_TYPE_LABELS = {
  dinner: 'Dinner',
  meetup: 'Meetup',
  conference: 'Conference',
  workshop: 'Workshop',
  demo_day: 'Demo Day',
}

type EventPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventDetailsPage({ params }: EventPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      organiser:profiles!organiser_id(id, username, full_name, avatar_url, company)
    `)
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: attendees } = await supabase
    .from('event_attendees')
    .select('user_id, status')
    .eq('event_id', id)

  const goingCount = (attendees || []).filter(a => a.status === 'going').length
  const userStatus = (attendees || []).find(a => a.user_id === user?.id)?.status
  const isFull = !!event.capacity && goingCount >= event.capacity

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8 text-sm">
        <Link href="/events" className="text-white/40 hover:text-white transition-colors">
          Events
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60">Details</span>
      </div>

      <div className="border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-white/20 text-white/50">
                {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS]}
              </Badge>
              {isFull ? (
                <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                  Full
                </Badge>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          </div>
          <RSVPButton
            eventId={event.id}
            currentStatus={userStatus as 'going' | 'waitlist' | undefined}
            isFull={isFull}
          />
        </div>

        {event.description ? (
          <p className="text-white/70 leading-relaxed">{event.description}</p>
        ) : null}

        <div className="grid gap-3 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>
              {new Date(event.starts_at).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {' · '}
              {new Date(event.starts_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>

          {event.is_online ? (
            <div className="flex items-center gap-2">
              <Globe size={14} />
              <span>Online event</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>
                {event.location_name || 'TBA'}
                {event.city ? `, ${event.city}` : ''}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>
              {goingCount} going
              {event.capacity ? ` / ${event.capacity}` : ''}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={event.organiser?.avatar_url} />
            <AvatarFallback className="bg-white/10 text-white text-xs">
              {event.organiser?.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="text-white/60">
              Organised by{' '}
              <Link href={`/profile/${event.organiser?.username}`} className="text-white hover:underline">
                {event.organiser?.full_name}
              </Link>
            </p>
            {event.organiser?.company ? (
              <p className="text-white/35 text-xs">{event.organiser.company}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
