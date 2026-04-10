'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

const ROLE_LABELS = { founder: 'Founder', vc: 'VC', operator: 'Operator', angel: 'Angel' }

interface Application {
  id: string
  full_name: string
  email: string
  role: string
  what_built: string
  what_want: string
  why_join: string
  links?: string
  created_at: string
}

export default function ApplicationCard({ application }: { application: Application }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [loginLink, setLoginLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  async function decide(decision: 'approved' | 'rejected' | 'waitlisted') {
    setLoading(decision)
    const res = await fetch('/api/admin/applications/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: application.id, decision }),
    })
    const data = await res.json()
    setLoading(null)
    if (decision === 'approved' && data.loginLink) {
      setLoginLink(data.loginLink)
    } else {
      router.refresh()
    }
  }

  async function copyLink() {
    if (!loginLink) return
    await navigator.clipboard.writeText(loginLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-white/10 rounded-xl p-5 space-y-4 border-l-2 border-l-blue-500/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{application.full_name}</h3>
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">Application</Badge>
            <Badge variant="outline" className="text-xs border-white/20 text-white/40">
              {ROLE_LABELS[application.role as keyof typeof ROLE_LABELS]}
            </Badge>
          </div>
          <p className="text-white/30 text-xs mt-0.5">{application.email}</p>
        </div>
        <span className="text-white/20 text-xs shrink-0">
          {new Date(application.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="space-y-3">
        {([
          { label: "What they've built", value: application.what_built },
          { label: 'What they want', value: application.what_want },
          { label: 'Why join', value: application.why_join },
        ]).map(({ label, value }) => value ? (
          <div key={label}>
            <p className="text-xs text-white/30 mb-1 uppercase tracking-wider">{label}</p>
            <p className="text-white/80 text-sm leading-relaxed">{value}</p>
          </div>
        ) : null)}
        {application.links && (
          <div>
            <p className="text-xs text-white/30 mb-1 uppercase tracking-wider">Links</p>
            <p className="text-white/50 text-sm">{application.links}</p>
          </div>
        )}
      </div>

      {/* Login link shown after approval */}
      {loginLink ? (
        <div className="border border-green-500/20 rounded-lg p-4 bg-green-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            <p className="text-green-400 text-sm font-semibold">Approved — send this link to {application.full_name}</p>
          </div>
          <p className="text-white/30 text-xs">One-time login link. Send via WhatsApp, email, or DM. Valid for 24 hours.</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={loginLink}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 font-mono truncate"
            />
            <Button size="sm" onClick={copyLink}
              className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 text-xs h-auto px-3 shrink-0">
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 pt-1 border-t border-white/10">
          <Button size="sm" disabled={!!loading} onClick={() => decide('approved')}
            className="bg-white text-black hover:bg-white/90 text-xs h-8">
            {loading === 'approved' ? 'Creating account...' : 'Approve & generate link'}
          </Button>
          <Button size="sm" variant="outline" disabled={!!loading} onClick={() => decide('waitlisted')}
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-xs h-8 bg-transparent">
            {loading === 'waitlisted' ? '...' : 'Waitlist'}
          </Button>
          <Button size="sm" variant="outline" disabled={!!loading} onClick={() => decide('rejected')}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 bg-transparent">
            {loading === 'rejected' ? '...' : 'Reject'}
          </Button>
        </div>
      )}
    </div>
  )
}
