'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/types'
import { Rss, Users, Calendar, Mail, Ticket, Settings, LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NexusLogo from '@/components/brand/NexusLogo'

const NAV = [
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/intros', label: 'Intros', icon: Mail },
  { href: '/invites', label: 'Invites', icon: Ticket },
]

const ROLE_LABELS: Record<string, string> = {
  founder: 'Founder', vc: 'VC', operator: 'Operator', angel: 'Angel',
}

const adminIds = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-20"
      style={{
        background: 'rgba(7,5,15,0.85)',
        borderRight: '1px solid rgba(139,92,246,0.10)',
      }}>

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <NexusLogo size="sm" muted />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
              style={active
                ? { background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }
                : { color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }
              }
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
              <Icon size={15} strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
        {adminIds.includes(profile.id) && (
          <Link href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
            style={{ color: 'rgba(251,191,36,0.6)', border: '1px solid transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <ShieldCheck size={15} strokeWidth={1.5} />
            Admin
          </Link>
        )}
        <Link href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
          style={pathname === '/settings'
            ? { background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }
            : { color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }
          }
          onMouseEnter={e => {
            if (pathname !== '/settings') e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
          }}
          onMouseLeave={e => {
            if (pathname !== '/settings') e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
          }}>
          <Settings size={15} strokeWidth={pathname === '/settings' ? 2.5 : 1.5} />
          Settings
        </Link>
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
          style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
          <LogOut size={15} strokeWidth={1.5} />
          Sign out
        </button>

        {/* Profile */}
        <Link href={`/profile/${profile.username}`}
          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mt-2"
          style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: 'white' }}>
              {profile.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 truncate">{profile.full_name}</p>
            <p className="text-xs" style={{ color: 'rgba(167,139,250,0.6)' }}>{ROLE_LABELS[profile.role]}</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
