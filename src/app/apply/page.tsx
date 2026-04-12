'use client'

import { useState } from 'react'
import { AuthScreenTopBar } from '@/components/nav/NavChrome'
import { motion } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserRole } from '@/types'
const ROLE_LABELS: Record<UserRole, string> = {
  founder: 'Founder',
  vc: 'VC / Angel Investor',
  operator: 'Operator (PM, Engineer, Designer)',
  angel: 'Angel Investor',
}

const bg = {
  background: 'var(--ink)',
  minHeight: '100vh',
  position: 'relative' as const,
  overflow: 'hidden' as const,
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(240,236,230,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: '0.75rem', color: 'rgba(240,236,230,0.25)', marginTop: '-2px' }}>{hint}</p>}
      {children}
    </div>
  )
}

function SField({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{
      width: '100%', height: '44px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px', padding: '0 14px',
      fontSize: '0.88rem', color: 'var(--text)', outline: 'none',
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
      borderRadius: '10px', padding: '12px 14px',
      fontSize: '0.88rem', color: 'var(--text)', outline: 'none', resize: 'none',
      transition: 'border-color 0.2s ease', lineHeight: 1.6, ...style,
    }}
      onFocus={e => (e.target.style.borderColor = 'rgba(124,58,237,0.45)')}
      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  )
}

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      full_name: (form.elements.namedItem('full_name') as HTMLInputElement).value,
      role,
      what_built: (form.elements.namedItem('what_built') as HTMLTextAreaElement).value,
      why_join: (form.elements.namedItem('why_join') as HTMLTextAreaElement).value,
      what_want: (form.elements.namedItem('what_want') as HTMLTextAreaElement).value,
      links: (form.elements.namedItem('links') as HTMLInputElement).value,
    }

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        redirect: 'manual',
        cache: 'no-store',
      })
      if (res.status >= 300 && res.status < 400) {
        throw new Error(
          'The app sent a redirect instead of saving your application. Hard-refresh this page (Cmd+Shift+R) and try again.',
        )
      }
      const raw = await res.text()
      let message: string | undefined
      if (raw) {
        try {
          const body = JSON.parse(raw) as { error?: string }
          message = body.error
        } catch {
          message = undefined
        }
      }
      if (!res.ok) {
        throw new Error(message || `Request failed (${res.status})`)
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const orbs = (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="orb-1" style={{ position: 'absolute', top: '-25%', left: '-20%', width: '70vw', height: '70vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      <div className="orb-2" style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
    </div>
  )

  if (submitted) {
    return (
      <main style={bg}>
        {orbs}
        <AuthScreenTopBar />
        <div style={{ position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 5rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', fontSize: '1.75rem', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
              ✦
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
              Application received
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.7 }}>
              We review every application manually. You&apos;ll hear from us within a few days.
              If approved, you&apos;ll receive an email with next steps.
            </p>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main style={bg}>
      {orbs}

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <AuthScreenTopBar />
      </div>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '640px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '100px', border: '1px solid rgba(217,119,6,0.3)', background: 'rgba(217,119,6,0.07)', color: 'rgba(251,191,36,0.85)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              By application only
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.75rem' }}>
              Apply for access
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.7 }}>
              We&apos;re building a closed network of people doing real things. Metrics, proof-of-work, and track record matter more than titles.
            </p>
          </div>

          {/* Form card */}
          <div style={{ borderRadius: '20px', padding: '2rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Full name">
                  <SField name="full_name" required placeholder="Rohan Sharma" />
                </Field>
                <Field label="Email">
                  <SField name="email" type="email" required placeholder="rohan@company.com" />
                </Field>
              </div>

              <Field label="I am a">
                <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                  <SelectTrigger style={{ height: '44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: role ? 'var(--text)' : 'rgba(240,236,230,0.3)', fontSize: '0.88rem' }}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#120f1e', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }}>
                    {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="What have you built, invested in, or shipped?" hint="Be specific — metrics, exits, companies, funds.">
                <STextarea name="what_built" required rows={4} placeholder="Founded Acme (B2B SaaS, $15K MRR, 200 customers). Previously PM at Razorpay..." />
              </Field>

              <Field label="What are you looking for right now?">
                <STextarea name="what_want" required rows={3} placeholder="Seed funding ($500K–$1M), a technical co-founder, early enterprise customers..." />
              </Field>

              <Field label="Why Nexus?">
                <STextarea name="why_join" required rows={3} placeholder="200 words max. Be honest." />
              </Field>

              <Field label="Links" hint="Optional — product URL, LinkedIn, portfolio, fund website">
                <SField name="links" placeholder="https://..." />
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
                {loading ? 'Submitting...' : 'Submit application →'}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
