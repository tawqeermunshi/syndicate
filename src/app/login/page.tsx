'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SyndicateLogo from '@/components/brand/SyndicateLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    // Check profile to determine where to send them
    const { data: profile } = await supabase.from('profiles').select('status').eq('id', data.user.id).single()
    if (!profile) router.push('/onboarding')
    else if (profile.status === 'approved') router.push('/feed')
    else router.push('/pending')
  }

  async function handleGoogle() {
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const bg = {
    background: 'var(--ink)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
    overflow: 'hidden',
  }

  const orbs = (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="orb-1" style={{ position: 'absolute', top: '-20%', left: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)', filter: 'blur(50px)' }} />
      <div className="orb-2" style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.1) 0%, transparent 65%)', filter: 'blur(50px)' }} />
      <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
    </div>
  )

  return (
    <main style={bg}>
      {orbs}

      <div style={{ position: 'relative', zIndex: 10, padding: '1.75rem 2rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <SyndicateLogo size="sm" muted />
        </Link>
      </div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          style={{ width: '100%', maxWidth: '380px' }}>

          <div style={{ borderRadius: '20px', padding: '2.25rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.83rem', color: 'var(--text3)', marginBottom: '1.75rem' }}>
              Not a member?{' '}
              <Link href="/apply" style={{ color: 'rgba(167,139,250,0.8)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Apply for access
              </Link>
            </p>

            <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <StyledInput
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <StyledInput
                type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password"
              />
              {error && <p style={{ color: '#f87171', fontSize: '0.78rem' }}>{error}</p>}
              <GradientButton loading={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </GradientButton>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text3)', letterSpacing: '0.06em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>

            <motion.button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', height: '44px', borderRadius: '10px',
                background: '#fff', color: '#0c0a14',
                fontSize: '0.88rem', fontWeight: 600,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                opacity: loading ? 0.6 : 1,
              }}>
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function StyledInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
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

function GradientButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <motion.button type="submit" disabled={loading}
      whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
      style={{
        width: '100%', height: '44px', borderRadius: '10px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #d97706 100%)',
        color: '#fff', fontSize: '0.88rem', fontWeight: 700,
        border: 'none', opacity: loading ? 0.5 : 1,
        cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s',
      }}>
      {children}
    </motion.button>
  )
}
