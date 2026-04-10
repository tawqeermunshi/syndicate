import { createClient } from '@/lib/supabase/server'
import PostComposer from '@/components/feed/PostComposer'
import PostCard from '@/components/feed/PostCard'
import FeedFilter from '@/components/feed/FeedFilter'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, username, full_name, avatar_url, role, headline, company)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (category) {
    query = query.eq('category', category)
  }

  const { data: posts } = await query

  // Get reaction counts
  const postIds = (posts || []).map(p => p.id)
  const { data: reactions } = postIds.length
    ? await supabase
        .from('reactions')
        .select('post_id, user_id')
        .in('post_id', postIds)
    : { data: [] }

  const { data: comments } = postIds.length
    ? await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
    : { data: [] }

  const reactionMap = (reactions || []).reduce((acc, r) => {
    acc[r.post_id] = (acc[r.post_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const userReactionSet = new Set(
    (reactions || []).filter(r => r.user_id === user!.id).map(r => r.post_id)
  )

  const commentMap = (comments || []).reduce((acc, c) => {
    acc[c.post_id] = (acc[c.post_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const enrichedPosts = (posts || []).map(p => ({
    ...p,
    reaction_count: reactionMap[p.id] || 0,
    comment_count: commentMap[p.id] || 0,
    user_reaction: userReactionSet.has(p.id) ? 'signal' : undefined,
  }))

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-4">Feed</h1>
        <FeedFilter active={category} />
      </div>

      <PostComposer profile={profile} />

      <div className="space-y-4 mt-6">
        {enrichedPosts.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p>No posts yet. Be the first to share something.</p>
          </div>
        ) : (
          enrichedPosts.map(post => (
            <PostCard key={post.id} post={post} currentUserId={user!.id} />
          ))
        )}
      </div>
    </div>
  )
}
