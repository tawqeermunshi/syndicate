'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthScreenTopBar } from '@/components/nav/NavChrome'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

const OPEN_TO_OPTIONS = [
  { value: 'funding', label: 'Open to funding' },
  { value: 'cofounders', label: 'Looking for co-founders' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'advising', label: 'Open to advising' },
  { value: 'investing', label: 'Investing' },
]

const bg = {
  background: 'var(--ink)',
  minHeight: '100vh',
  position: 'relative' as const,
  overflow: 'hidden' as const,
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(240,236,230,0.5)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: '0.73rem', color: 'rgba(240,236,230,0.25)', marginTop: '-2px' }}>{hint}</p>}
      {children}
    </div>
  )
}

function SField({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{
      width: '100%', height: '42px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px', padding: '0 12px',
      fontSize: '0.87rem', color: 'var(--text)', outline: 'none',
      transition: 'border-color 0.2s ease', ...style,
    }}
      onFocus={e => (e.target.style.borderColor = 'rgba(124,58,237,0.45)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  )
}

function STextarea({ style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} style={{
      width: '100%',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px', padding: '10px 12px',
      fontSize: '0.87rem', color: 'var(--text)', outline: 'none', resize: 'none',
      transition: 'border-color 0.2s ease', lineHeight: 1.6, ...style,
    }}
      onFocus={e => (e.target.style.borderColor = 'rgba(124,58,237,0.45)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  )
}

function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')

  const [role, setRole] = useState<UserRole>('founder')
  const [openTo, setOpenTo] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleOpenTo(val: string) {
    setOpenTo(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const f = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement)?.value

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const username = f('username').toLowerCase().replace(/[^a-z0-9_]/g, '')

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing && existing.id !== user.id) {
      setError('Username taken. Try another.')
      setLoading(false)
      return
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, status, invited_by')
      .eq('id', user.id)
      .maybeSingle()

    let status = currentProfile?.status ?? 'pending'
    let invitedBy = currentProfile?.invited_by ?? null

    if (inviteCode) {
      const { data: invite } = await supabase
        .from('invites')
        .select('id, created_by, used_by')
        .eq('code', inviteCode.toUpperCase())
        .single()

      if (invite && !invite.used_by) {
        status = 'approved'
        invitedBy = invite.created_by
        await supabase.from('invites').update({ used_by: user.id, used_at: new Date().toISOString() }).eq('id', invite.id)
      }
    }

    const profileData = {
      id: user.id,
      username,
      full_name: f('full_name'),
      role,
      status,
      headline: f('headline') || null,
      bio: f('bio') || null,
      company: f('company') || null,
      company_stage: f('company_stage') || null,
      metrics: f('metrics') || null,
      past_work: f('past_work') || null,
      fund_name: role === 'vc' ? f('fund_name') || null : null,
      check_size: role === 'vc' ? f('check_size') || null : null,
      location: f('location') || null,
      linkedin_url: f('linkedin_url') || null,
      twitter_url: f('twitter_url') || null,
      open_to: openTo,
      invited_by: invitedBy,
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (status === 'approved') {
      router.push('/feed')
    } else {
      router.push('/pending')
    }
  }

  return (
    <main style={bg}>
      {/* Orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="orb-1" style={{ position: 'absolute', top: '-20%', left: '-15%', width: '65vw', height: '65vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.11) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="orb-2" style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
      </div>

      <AuthScreenTopBar />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '700px', margin: '0 auto', padding: '1.5rem 1.5rem 5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.5rem' }}>
              Set up your profile
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text2)', lineHeight: 1.6 }}>
              This is your proof-of-work card. Be specific — the community values signal over polish.
            </p>
          </div>

          <div style={{ borderRadius: '20px', padding: '2rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Identity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Full name">
                  <SField name="full_name" required placeholder="Rohan Sharma" />
                </Field>
                <Field label="Username">
                  <SField name="username" required placeholder="rohansharma" />
                </Field>
              </div>

              <Field label="I am a">
                <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                  <SelectTrigger style={{ height: '42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'var(--text)', fontSize: '0.87rem' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#120f1e', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }}>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="vc">VC / Angel Investor</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="angel">Angel Investor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Headline">
                <SField name="headline" placeholder="Building Acme — B2B SaaS for logistics" />
              </Field>

              <Field label="Bio" hint="Optional — a bit more about you">
                <STextarea name="bio" rows={3} placeholder="A bit more about you, your background, what drives you..." />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label={role === 'vc' ? 'Fund name' : 'Company'}>
                  <SField name={role === 'vc' ? 'fund_name' : 'company'} />
                </Field>
                {role !== 'vc' ? (
                  <Field label="Stage">
                    <Select name="company_stage">
                      <SelectTrigger style={{ height: '42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'var(--text)', fontSize: '0.87rem' }}>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent style={{ background: '#120f1e', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }}>
                        {['Idea', 'Pre-seed', 'Seed', 'Series A', 'Series B+', 'Profitable'].map(s => (
                          <SelectItem key={s} value={s.toLowerCase().replace(' ', '-')}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ) : (
                  <Field label="Check size">
                    <SField name="check_size" placeholder="$500K–$2M" />
                  </Field>
                )}
              </div>

              <Field label="Proof of work / traction">
                <SField name="metrics" placeholder="400 users, $8K MRR — or 12 investments, 2 exits" />
              </Field>

              <Field label="Past work">
                <SField name="past_work" placeholder="Ex-PM at Razorpay, founded Startup X (acquired)" />
              </Field>

              {/* Open To chips */}
              <Field label="Open to">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '2px' }}>
                  {OPEN_TO_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleOpenTo(opt.value)}
                      style={{
                        padding: '6px 14px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 500,
                        border: '1px solid',
                        transition: 'all 0.18s ease',
                        ...(openTo.includes(opt.value)
                          ? { background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', borderColor: 'rgba(124,58,237,0.4)' }
                          : { background: 'transparent', color: 'rgba(240,236,230,0.4)', borderColor: 'rgba(255,255,255,0.1)' })
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Location">
                  <SField name="location" placeholder="Mumbai, India" />
                </Field>
                <Field label="LinkedIn URL" hint="Optional">
                  <SField name="linkedin_url" placeholder="https://linkedin.com/in/..." />
                </Field>
              </div>

              <Field label="Twitter / X URL" hint="Optional">
                <SField name="twitter_url" placeholder="https://x.com/..." />
              </Field>

              {error && <p style={{ color: '#f87171', fontSize: '0.78rem' }}>{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #d97706 100%)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                  border: 'none', opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '0.25rem',
                }}>
                {loading ? 'Saving...' : 'Complete profile →'}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}
