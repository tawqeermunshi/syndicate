'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Profile, PostCategory } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES: { value: PostCategory; label: string; color: string }[] = [
  { value: 'building',        label: 'Building',        color: '#60a5fa' },
  { value: 'raising',         label: 'Raising',          color: '#34d399' },
  { value: 'hiring',          label: 'Hiring',            color: '#a78bfa' },
  { value: 'feedback_wanted', label: 'Feedback wanted', color: '#fb923c' },
]

export default function PostComposer({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory>('building')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handlePost() {
    if (!content.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('posts').insert({ author_id: profile.id, content: content.trim(), category })
    setContent(''); setOpen(false); setLoading(false)
    router.refresh()
  }

  return (
    <div className="rounded-2xl p-4 transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: open ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="text-xs font-semibold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white' }}>
            {profile.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        {!open ? (
          <button onClick={() => setOpen(true)}
            className="flex-1 text-left text-sm py-1 transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
            What are you building?
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 space-y-4">
              <textarea
                autoFocus
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setContent('') } }}
                placeholder="Share what you're building, raising, or ask for feedback..."
                rows={4}
                className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none"
                style={{ color: 'rgba(255,255,255,0.85)', caretColor: '#a78bfa' }}
              />
              <div className="flex items-center justify-between">
                <Select value={category} onValueChange={v => setCategory(v as PostCategory)}>
                  <SelectTrigger className="w-40 h-7 text-xs focus:ring-0 focus:ring-offset-0"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#0f0d1f', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}
                        className="text-xs focus:bg-white/5"
                        style={{ color: c.color }}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <button onClick={() => { setOpen(false); setContent('') }}
                    className="px-3 py-1.5 text-xs transition-colors rounded-lg"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                    Cancel
                  </button>
                  <button disabled={!content.trim() || loading} onClick={handlePost}
                    className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-30 hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
