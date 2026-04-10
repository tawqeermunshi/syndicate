'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import IntroActions from '@/components/IntroActions'
import { formatDistanceToNow } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import { DEMO_PROFILES } from '@/lib/demoProfiles'
import { getDemoIntroRequests } from '@/lib/demoIntros'

const STATUS_STYLES = {
  pending: 'border-yellow-500/30 text-yellow-400',
  accepted: 'border-green-500/30 text-green-400',
  declined: 'border-red-500/30 text-red-400',
}

type IntroRecord = {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  purpose: string
  context: string
  proposed_duration: number
  from_user_id: string
  to_user_id: string
  from_user?: {
    username?: string
    full_name?: string
    avatar_url?: string
    company?: string
  }
  to_user?: {
    username?: string
    full_name?: string
    avatar_url?: string
    company?: string
  }
}

function mapById() {
  return new Map(DEMO_PROFILES.map((p) => [p.id, p]))
}

export default function IntrosClient({
  initialIncoming,
  initialOutgoing,
  currentUserId,
}: {
  initialIncoming: IntroRecord[]
  initialOutgoing: IntroRecord[]
  currentUserId: string
}) {
  const pathname = usePathname()
  const [demoIncoming, setDemoIncoming] = useState<IntroRecord[]>([])
  const [demoOutgoing, setDemoOutgoing] = useState<IntroRecord[]>([])

  // localStorage is empty on the server; reading it during render causes hydration mismatch
  // and outgoing demo intros never show. Load after mount and when returning to this page.
  useEffect(() => {
    const demo = getDemoIntroRequests()
    const profileMap = mapById()

    startTransition(() => {
      setDemoIncoming(
        demo
          .filter((r) => r.to_user_id === currentUserId)
          .map((r) => {
            const from = profileMap.get(r.from_user_id)
            return {
              ...r,
              from_user: from
                ? {
                    username: from.username,
                    full_name: from.full_name,
                    avatar_url: from.avatar_url,
                    company: from.company || from.fund_name,
                  }
                : undefined,
            }
          }) as IntroRecord[],
      )

      setDemoOutgoing(
        demo
          .filter((r) => r.from_user_id === currentUserId)
          .map((r) => {
            const to = profileMap.get(r.to_user_id)
            return {
              ...r,
              to_user: to
                ? {
                    username: to.username,
                    full_name: to.full_name,
                    avatar_url: to.avatar_url,
                    company: to.company || to.fund_name,
                  }
                : undefined,
            }
          }) as IntroRecord[],
      )
    })
  }, [currentUserId, pathname])

  const { incoming, outgoing } = useMemo(() => {
    return {
      incoming: [...demoIncoming, ...initialIncoming].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      outgoing: [...demoOutgoing, ...initialOutgoing].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }
  }, [demoIncoming, demoOutgoing, initialIncoming, initialOutgoing])

  const pendingCount = incoming.filter((r) => r.status === 'pending').length

  return (
    <>
      <div className="mb-6 border border-white/10 rounded-2xl p-5 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Intro requests
              {pendingCount > 0 && (
                <span className="ml-2 bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full align-middle">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="text-white/45 text-sm mt-1">
              Send intros from a member&apos;s profile using the <span className="text-white/70">Request intro</span> button.
            </p>
          </div>
          <Link
            href="/members"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:text-white hover:border-white/30 transition-colors"
          >
            Browse members
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="incoming" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/50">
            Incoming {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/50">
            Outgoing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          {!incoming.length ? (
            <div className="border border-white/10 rounded-xl p-8 text-center">
              <p className="text-white/40 text-sm">No incoming intro requests yet.</p>
              <p className="text-white/30 text-xs mt-1">
                When members request time with you, they will appear here with full context.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incoming.map((req) => (
                <div key={req.id} className="border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Link href={`/profile/${req.from_user?.username}`}>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={req.from_user?.avatar_url} />
                          <AvatarFallback className="bg-white/10 text-white text-sm">
                            {req.from_user?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link href={`/profile/${req.from_user?.username}`} className="font-medium text-sm hover:underline">
                          {req.from_user?.full_name}
                        </Link>
                        {req.from_user?.company && (
                          <p className="text-white/40 text-xs">{req.from_user.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs border ${STATUS_STYLES[req.status]}`}>
                        {req.status}
                      </Badge>
                      <span className="text-white/30 text-xs">{formatDistanceToNow(req.created_at)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-white/80 text-sm font-medium">{req.purpose}</p>
                    <p className="text-white/50 text-sm leading-relaxed">{req.context}</p>
                    <p className="text-white/30 text-xs">{req.proposed_duration} min call</p>
                  </div>

                  {req.status === 'pending' && req.id.startsWith('demo-intro-') ? null : req.status === 'pending' ? (
                    <IntroActions requestId={req.id} />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing">
          {!outgoing.length ? (
            <div className="border border-white/10 rounded-xl p-8 text-center">
              <p className="text-white/40 text-sm">You haven&apos;t sent any intro requests yet.</p>
              <p className="text-white/30 text-xs mt-1 mb-4">
                Go to a member profile and tap <span className="text-white/60">Request intro</span> to send one.
              </p>
              <Link
                href="/members"
                className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Find members
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {outgoing.map((req) => (
                <div key={req.id} className="border border-white/10 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Link href={`/profile/${req.to_user?.username}`}>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={req.to_user?.avatar_url} />
                          <AvatarFallback className="bg-white/10 text-white text-sm">
                            {req.to_user?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link href={`/profile/${req.to_user?.username}`} className="font-medium text-sm hover:underline">
                          {req.to_user?.full_name}
                        </Link>
                        {req.to_user?.company && (
                          <p className="text-white/40 text-xs">{req.to_user.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs border ${STATUS_STYLES[req.status]}`}>
                        {req.status}
                      </Badge>
                      <span className="text-white/30 text-xs">{formatDistanceToNow(req.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">{req.purpose}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
