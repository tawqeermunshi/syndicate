'use client'

import { useState } from 'react'
import { useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile, PostCategory } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ModalCloseButton } from '@/components/nav/NavChrome'

const CATEGORIES: { value: PostCategory; label: string; color: string }[] = [
  { value: 'building',        label: 'Building',        color: '#60a5fa' },
  { value: 'raising',         label: 'Raising',          color: '#34d399' },
  { value: 'hiring',          label: 'Hiring',            color: '#a78bfa' },
  { value: 'feedback_wanted', label: 'Feedback wanted', color: '#fb923c' },
]

export default function PostComposer({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [postError, setPostError] = useState('')
  const [category, setCategory] = useState<PostCategory>('building')
  const [loading, setLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '-')
  }

  async function handlePost() {
    if (!content.trim()) return
    setPostError('')
    if (imageFile && videoFile) {
      setPostError('Attach either one image or one video per post.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    let imageUrl: string | null = null
    let videoUrl: string | null = null

    try {
      if (imageFile) {
        const imagePath = `${profile.id}/${Date.now()}-${sanitizeFileName(imageFile.name)}`
        const { error: uploadErr } = await supabase.storage
          .from('post-media')
          .upload(imagePath, imageFile, { upsert: false })
        if (uploadErr) {
          setPostError(uploadErr.message.includes('post-media')
            ? 'Media bucket is not configured yet. Run the latest Supabase migration and try again.'
            : `Could not upload image: ${uploadErr.message}`)
          setLoading(false)
          return
        }
        imageUrl = supabase.storage.from('post-media').getPublicUrl(imagePath).data.publicUrl
      }

      if (videoFile) {
        const videoPath = `${profile.id}/${Date.now()}-${sanitizeFileName(videoFile.name)}`
        const { error: uploadErr } = await supabase.storage
          .from('post-media')
          .upload(videoPath, videoFile, { upsert: false })
        if (uploadErr) {
          setPostError(uploadErr.message.includes('post-media')
            ? 'Media bucket is not configured yet. Run the latest Supabase migration and try again.'
            : `Could not upload video: ${uploadErr.message}`)
          setLoading(false)
          return
        }
        videoUrl = supabase.storage.from('post-media').getPublicUrl(videoPath).data.publicUrl
      }

      const chosenCategory = category
      const { error: postErr } = await supabase.from('posts').insert({
        author_id: profile.id,
        content: content.trim(),
        category: chosenCategory,
        image_url: imageUrl,
        video_url: videoUrl,
      })
      if (postErr) {
        setPostError(`Could not create post: ${postErr.message}`)
        setLoading(false)
        return
      }
      setContent('')
      setImageFile(null)
      setVideoFile(null)
      setPostError('')
      setOpen(false)
      setLoading(false)
      router.refresh()
    } catch {
      setPostError('Could not create post. Please try again.')
      setLoading(false)
    }
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
              className="flex-1 space-y-4 relative">
              <div className="flex justify-end">
                <ModalCloseButton
                  ariaLabel="Close composer"
                  onClick={() => {
                    setOpen(false)
                    setContent('')
                    setImageFile(null)
                    setVideoFile(null)
                    setPostError('')
                  }}
                />
              </div>
              <textarea
                autoFocus
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setOpen(false)
                    setContent('')
                    setImageFile(null)
                    setVideoFile(null)
                    setPostError('')
                  }
                }}
                placeholder="Share what you're building, raising, or ask for feedback..."
                rows={4}
                className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none"
                style={{ color: 'rgba(255,255,255,0.85)', caretColor: '#a78bfa' }}
              />
              <div className="space-y-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0] || null
                    setImageFile(f)
                    if (f) setVideoFile(null)
                  }}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0] || null
                    setVideoFile(f)
                    if (f) setImageFile(null)
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="rounded-lg border px-3 py-1.5 text-xs"
                    style={{
                      borderColor: 'rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.65)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    Add image
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="rounded-lg border px-3 py-1.5 text-xs"
                    style={{
                      borderColor: 'rgba(255,255,255,0.14)',
                      color: 'rgba(255,255,255,0.65)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    Add video
                  </button>
                  {(imageFile || videoFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setVideoFile(null)
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs"
                      style={{
                        borderColor: 'rgba(248,113,113,0.25)',
                        color: 'rgba(248,113,113,0.9)',
                        background: 'rgba(248,113,113,0.05)',
                      }}
                    >
                      Remove media
                    </button>
                  )}
                </div>
                {imageFile && (
                  <p className="text-xs text-white/45">Image selected: {imageFile.name}</p>
                )}
                {videoFile && (
                  <p className="text-xs text-white/45">Video selected: {videoFile.name}</p>
                )}
              </div>
              {postError && <p className="text-xs text-red-300/90">{postError}</p>}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const active = category === c.value
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all"
                        style={{
                          color: active ? c.color : 'rgba(255,255,255,0.45)',
                          borderColor: active ? `${c.color}55` : 'rgba(255,255,255,0.10)',
                          background: active ? `${c.color}1f` : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => {
                    setOpen(false)
                    setContent('')
                    setImageFile(null)
                    setVideoFile(null)
                    setPostError('')
                  }}
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
