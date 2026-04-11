'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Post } from '@/types'
import { MessageSquare, Zap, MoreHorizontal, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { isDemoProfileId } from '@/lib/demoProfiles'

const CATEGORY_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  building:        { label: 'Building',        color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.2)' },
  raising:         { label: 'Raising',          color: '#34d399', bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.2)' },
  hiring:          { label: 'Hiring',            color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  feedback_wanted: { label: 'Feedback wanted', color: '#fb923c', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.2)' },
}

export default function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const [reacted, setReacted] = useState(!!post.user_reaction)
  const [reactionCount, setReactionCount] = useState(post.reaction_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Array<{
    id: string
    author_id?: string
    content: string
    created_at: string
    author?: {
      username?: string
      full_name?: string
      avatar_url?: string
    }
  }>>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [commentActionError, setCommentActionError] = useState('')
  const router = useRouter()

  const cat = CATEGORY_STYLES[post.category] || { label: post.category, color: '#9ca3af', bg: 'transparent', border: 'rgba(255,255,255,0.1)' }
  const isOwn = post.author_id === currentUserId
  const author = post.author
  const authorIsDemo = post.author_id ? isDemoProfileId(post.author_id) : false

  async function toggleReaction() {
    const supabase = createClient()
    if (reacted) {
      await supabase.from('reactions').delete().match({ post_id: post.id, user_id: currentUserId })
      setReacted(false); setReactionCount(c => c - 1)
    } else {
      await supabase.from('reactions').insert({ post_id: post.id, user_id: currentUserId, type: 'signal' })
      setReacted(true); setReactionCount(c => c + 1)
    }
  }

  async function deletePost() {
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', post.id)
    router.refresh()
  }

  async function submitComment() {
    if (!comment.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('comments').insert({ post_id: post.id, author_id: currentUserId, content: comment.trim() })
    setComment('')
    await loadComments()
    setSubmitting(false)
    router.refresh()
  }

  async function loadComments() {
    setLoadingComments(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('id, author_id, content, created_at, author:profiles!author_id(username, full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments((data || []) as typeof comments)
    setCommentsLoaded(true)
    setLoadingComments(false)
  }

  async function handleToggleComments() {
    const next = !showComments
    setCommentActionError('')
    setShowComments(next)
    if (next && !commentsLoaded) {
      await loadComments()
    }
  }

  async function deleteComment(commentId: string) {
    setCommentActionError('')
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) {
      setCommentActionError(error.message || 'Could not delete comment')
      return
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    router.refresh()
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={e => (e.currentTarget.style.border = '1px solid rgba(139,92,246,0.18)')}
      onMouseLeave={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${author?.username}`}>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={author?.avatar_url} />
              <AvatarFallback className="text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white' }}>
                {author?.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${author?.username}`}
                className="text-sm font-semibold transition-colors"
                style={{ color: 'rgba(255,255,255,0.85)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}>
                {author?.full_name}
              </Link>
              {authorIsDemo && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-500/35 text-amber-400/90 px-1.5 py-0">
                  Demo
                </Badge>
              )}
              {author?.company && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{author.company}</span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {formatDistanceToNow(post.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ color: cat.color, background: cat.bg, border: `1px solid ${cat.border}` }}>
            {cat.label}
          </span>
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
                  <MoreHorizontal size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent style={{ background: '#0f0d1f', border: '1px solid rgba(255,255,255,0.08)' }}>
                <DropdownMenuItem onClick={deletePost}
                  className="text-red-400 focus:text-red-400 focus:bg-white/5 cursor-pointer text-xs">
                  <Trash2 size={13} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-5 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <motion.button onClick={toggleReaction} whileTap={{ scale: 0.85 }}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: reacted ? '#fbbf24' : 'rgba(255,255,255,0.25)' }}
          onMouseEnter={e => { if (!reacted) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          onMouseLeave={e => { if (!reacted) e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}>
          <Zap size={13} fill={reacted ? 'currentColor' : 'none'} strokeWidth={reacted ? 0 : 1.5} />
          {reactionCount > 0 ? reactionCount : ''} Signal
        </motion.button>

        <button onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: showComments ? '#a78bfa' : 'rgba(255,255,255,0.25)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = showComments ? '#a78bfa' : 'rgba(255,255,255,0.25)')}>
          <MessageSquare size={13} strokeWidth={1.5} />
          {post.comment_count ? `${post.comment_count} ` : ''}Comments
        </button>
      </div>

      {/* Comment input */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {commentActionError && (
            <p className="text-xs text-red-300/90 mb-2">{commentActionError}</p>
          )}
          {loadingComments ? (
            <p className="text-xs text-white/40 mb-3">Loading comments...</p>
          ) : comments.length > 0 ? (
            <div className="space-y-2 mb-3">
              {comments.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={item.author?.avatar_url} />
                      <AvatarFallback className="bg-white/10 text-[10px] text-white">
                        {item.author?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${item.author?.username}`} className="text-xs text-white/70 hover:underline">
                      {item.author?.full_name || 'Member'}
                    </Link>
                    <span className="text-[10px] text-white/30">{formatDistanceToNow(item.created_at)}</span>
                    </div>
                    {item.author_id === currentUserId && (
                      <button
                        onClick={() => deleteComment(item.id)}
                        className="inline-flex items-center gap-1 text-[10px] text-red-300/80 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={11} />
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-white/65 whitespace-pre-wrap">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/35 mb-3">No comments yet. Start the thread.</p>
          )}

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add your perspective..."
            rows={2}
            className="w-full rounded-xl text-sm resize-none outline-none transition-all p-3"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.8)',
            }}
            onFocus={e => (e.target.style.border = '1px solid rgba(139,92,246,0.35)')}
            onBlur={e => (e.target.style.border = '1px solid rgba(255,255,255,0.06)')}
          />
          <div className="flex justify-end mt-2">
            <button disabled={!comment.trim() || submitting} onClick={submitComment}
              className="px-5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-30 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
              {submitting ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </motion.div>
      )}
    </motion.article>
  )
}
