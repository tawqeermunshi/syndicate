import { createClient } from '@/lib/supabase/server'
import IntrosClient from '@/components/intros/IntrosClient'

export default async function IntrosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    supabase
      .from('intro_requests')
      .select('*, from_user:profiles!from_user_id(id, username, full_name, avatar_url, role, company, headline)')
      .eq('to_user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('intro_requests')
      .select('*, to_user:profiles!to_user_id(id, username, full_name, avatar_url, role, company, headline)')
      .eq('from_user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <IntrosClient
        initialIncoming={(incoming || []) as any}
        initialOutgoing={(outgoing || []) as any}
        currentUserId={user!.id}
      />
    </div>
  )
}
