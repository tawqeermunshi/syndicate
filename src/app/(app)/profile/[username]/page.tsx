import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import IntroRequestModal from '@/components/profile/IntroRequestModal'
import { Globe, Link2, X, MapPin, Building2 } from 'lucide-react'
import { DEMO_POSTS_BY_USERNAME, DEMO_PROFILES } from '@/lib/demoProfiles'

const ROLE_LABELS = {
  founder: 'Founder',
  vc: 'VC',
  operator: 'Operator',
  angel: 'Angel',
}

const OPEN_TO_LABELS: Record<string, string> = {
  funding: 'Open to funding',
  cofounders: 'Looking for co-founders',
  hiring: 'Hiring',
  advising: 'Open to advising',
  investing: 'Investing',
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const demoProfile = DEMO_PROFILES.find(p => p.username === username)
  const isDemoProfile = Boolean(demoProfile)

  const { data: dbProfile } = isDemoProfile
    ? { data: null }
    : await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('status', 'approved')
        .single()

  const profile = (demoProfile || dbProfile) as typeof dbProfile

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  // Get their recent posts
  const { data: posts } = isDemoProfile
    ? { data: DEMO_POSTS_BY_USERNAME[username] || [] }
    : await supabase
        .from('posts')
        .select('*')
        .eq('author_id', profile.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header card */}
      <div className="border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-white/10 text-white text-2xl">
                {profile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">{profile.full_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs border-white/20 text-white/50">
                  {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS]}
                </Badge>
                {profile.company && (
                  <span className="flex items-center gap-1 text-white/50 text-xs">
                    <Building2 size={12} />
                    {profile.company}
                    {profile.company_stage && <span className="text-white/30">· {profile.company_stage}</span>}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1 text-white/30 text-xs">
                    <MapPin size={12} />
                    {profile.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          {!isOwnProfile && (
            <IntroRequestModal toProfile={profile} />
          )}
          {isOwnProfile && (
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 bg-transparent shrink-0">
              Edit profile
            </Button>
          )}
        </div>

        {profile.headline && (
          <p className="text-white/80 text-sm mt-4 leading-relaxed">{profile.headline}</p>
        )}
        {profile.bio && (
          <p className="text-white/50 text-sm mt-2 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {/* Proof of work */}
      {(profile.metrics || profile.past_work) && (
        <div className="border border-white/10 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-white/30">Proof of work</h2>
          {profile.metrics && (
            <div>
              <p className="text-xs text-white/40 mb-1">Traction</p>
              <p className="text-white/80 text-sm">{profile.metrics}</p>
            </div>
          )}
          {profile.past_work && (
            <div>
              <p className="text-xs text-white/40 mb-1">Past work</p>
              <p className="text-white/80 text-sm">{profile.past_work}</p>
            </div>
          )}
        </div>
      )}

      {/* VC-specific */}
      {profile.role === 'vc' && (profile.fund_name || profile.check_size) && (
        <div className="border border-white/10 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="text-xs tracking-widest uppercase text-white/30">Investment focus</h2>
          {profile.fund_name && (
            <div>
              <p className="text-xs text-white/40 mb-1">Fund</p>
              <p className="text-white/80 text-sm">{profile.fund_name}</p>
            </div>
          )}
          {profile.check_size && (
            <div>
              <p className="text-xs text-white/40 mb-1">Check size</p>
              <p className="text-white/80 text-sm">{profile.check_size}</p>
            </div>
          )}
          {profile.sectors && profile.sectors.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Sectors</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.sectors.map((s: string) => (
                  <Badge key={s} variant="outline" className="text-xs border-white/15 text-white/50">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Open to */}
      {profile.open_to && profile.open_to.length > 0 && (
        <div className="border border-white/10 rounded-xl p-5 mb-6">
          <h2 className="text-xs tracking-widest uppercase text-white/30 mb-3">Open to</h2>
          <div className="flex flex-wrap gap-2">
            {profile.open_to.map((item: string) => (
              <span key={item} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/60">
                {OPEN_TO_LABELS[item] || item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {(profile.linkedin_url || profile.twitter_url || profile.github_url || profile.website_url) && (
        <div className="border border-white/10 rounded-xl p-5 mb-6">
          <h2 className="text-xs tracking-widest uppercase text-white/30 mb-3">Links</h2>
          <div className="flex flex-wrap gap-3">
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <Globe size={14} /> Website
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <Link2 size={14} /> LinkedIn
              </a>
            )}
            {profile.twitter_url && (
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <X size={14} /> Twitter / X
              </a>
            )}
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <Link2 size={14} /> GitHub
              </a>
            )}
          </div>
        </div>
      )}

      {/* Recent posts */}
      {posts && posts.length > 0 && (
        <div>
          <h2 className="text-xs tracking-widest uppercase text-white/30 mb-4">Recent posts</h2>
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="border border-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">{post.content}</p>
                <p className="text-white/30 text-xs mt-2">
                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
