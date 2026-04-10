import { createClient } from '@/lib/supabase/server'
import IntrosClient from '@/components/intros/IntrosClient'

type ProfileRow = {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  role: string
  company: string | null
  fund_name: string | null
  headline: string | null
}

function embedUser(p: ProfileRow) {
  return {
    username: p.username,
    full_name: p.full_name,
    avatar_url: p.avatar_url ?? undefined,
    company: p.company || p.fund_name || undefined,
  }
}

export default async function IntrosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user!.id

  const [incomingRes, outgoingRes] = await Promise.all([
    supabase.from('intro_requests').select('*').eq('to_user_id', uid).order('created_at', { ascending: false }),
    supabase.from('intro_requests').select('*').eq('from_user_id', uid).order('created_at', { ascending: false }),
  ])

  const incomingRows = incomingRes.data ?? []
  const outgoingRows = outgoingRes.data ?? []

  const profileIds = [
    ...new Set([
      ...incomingRows.map((r) => r.from_user_id as string),
      ...outgoingRows.map((r) => r.to_user_id as string),
    ]),
  ]

  const profilesById: Record<string, ProfileRow> = {}
  if (profileIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, role, company, fund_name, headline')
      .in('id', profileIds)

    for (const p of profs ?? []) {
      profilesById[p.id] = p as ProfileRow
    }
  }

  const initialIncoming = incomingRows.map((row) => ({
    ...row,
    from_user: profilesById[row.from_user_id as string]
      ? embedUser(profilesById[row.from_user_id as string])
      : undefined,
  }))

  const initialOutgoing = outgoingRows.map((row) => ({
    ...row,
    to_user: profilesById[row.to_user_id as string]
      ? embedUser(profilesById[row.to_user_id as string])
      : undefined,
  }))

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <IntrosClient
        initialIncoming={initialIncoming}
        initialOutgoing={initialOutgoing}
        currentUserId={uid}
      />
    </div>
  )
}
