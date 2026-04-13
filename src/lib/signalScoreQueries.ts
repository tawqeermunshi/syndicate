import type { SupabaseClient } from '@supabase/supabase-js'
import { SIGNAL_POST_WINDOW_DAYS } from '@/lib/signalScore'
import type { SignalScoreInputs } from '@/lib/signalScore'

export async function fetchSignalScoreInputs(
  client: SupabaseClient,
  profileId: string,
): Promise<SignalScoreInputs> {
  const since = new Date(Date.now() - SIGNAL_POST_WINDOW_DAYS * 86400000).toISOString()

  const { data: postRows, error: postErr } = await client
    .from('posts')
    .select('id')
    .eq('author_id', profileId)
    .eq('is_published', true)
    .gte('created_at', since)

  if (postErr) throw postErr

  const postIds = (postRows ?? []).map((r) => r.id)
  const postsLast28 = postIds.length

  if (postIds.length === 0) {
    return { postsLast28: 0, signalsOnRecentPosts: 0, commentsFromOthersOnRecentPosts: 0 }
  }

  const [{ count: signalCount, error: sigErr }, { count: commentCount, error: comErr }] = await Promise.all([
    client
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'signal')
      .in('post_id', postIds),
    client
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .in('post_id', postIds)
      .neq('author_id', profileId),
  ])

  if (sigErr) throw sigErr
  if (comErr) throw comErr

  return {
    postsLast28,
    signalsOnRecentPosts: signalCount ?? 0,
    commentsFromOthersOnRecentPosts: commentCount ?? 0,
  }
}
