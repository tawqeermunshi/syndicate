'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, FileText, Ticket, LayoutDashboard, ExternalLink } from 'lucide-react'
import MafiaLogo from '@/components/brand/MafiaLogo'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/invites', label: 'Invites', icon: Ticket },
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r border-white/10 flex flex-col bg-black">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="mb-2">
          <MafiaLogo size="sm" muted />
        </div>
        <p className="text-sm font-semibold">Admin</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href + '/') || pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-white/10 text-white font-medium' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}>
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <Link href="/feed"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors">
          <ExternalLink size={15} />
          Back to app
        </Link>
      </div>
    </aside>
  )
}
