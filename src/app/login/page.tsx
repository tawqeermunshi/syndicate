'use client'

import { motion } from 'framer-motion'
import type { FormEvent } from 'react'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GoogleIcon, GradientButton, StyledInput } from '@/components/auth/AuthFormBits'
import { AuthScreenTopBar } from '@/components/nav/NavChrome'

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const join = searchParams.get('join')
    const inv = searchParams.get('invite')?.trim()
    if (join !== 'invite' && !inv) return
    const qs = new URLSearchParams()
    if (inv) qs.set('invite', inv)
    const s = qs.toString()
    router.replace(`/join${s ? `?${s}` : ''}`)
  }, [router, searchParams])

  function memberOAuthRedirect() {
    return `${window.location.origin}/auth/callback`
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault()
    setSignInLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signErr) {
      setError(signErr.message)
      setSignInLoading(false)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('status').eq('id', data.user.id).single()
    if (!profile) {
      router.push('/onboarding')
    } else if (profile.status === 'approved') {
      router.push('/feed')
    } else {
      router.push('/pending')
    }
  }

  async function handleGoogle() {
    setOauthLoading(true)
    setError('')
    const supabase = createClient()
    const { error: oErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: memberOAuthRedirect() },
    })
    if (oErr) {
      setError(oErr.message)
      setOauthLoading(false)
    }
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

      <AuthScreenTopBar />

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ borderRadius: '20px', padding: '2.25rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>
              Sign in
            </h1>
            <p style={{ fontSize: '0.83rem', color: 'var(--text3)', marginBottom: '1.35rem', lineHeight: 1.55 }}>
              Use your email and password, or Google. If you are joining with an invite code, use{' '}
              <Link href="/join" style={{ color: 'rgba(167,139,250,0.85)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Redeem invite
              </Link>
              {' '}instead.
            </p>

            <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <StyledInput
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <StyledInput
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              {error && <p style={{ color: '#f87171', fontSize: '0.78rem' }}>{error}</p>}
              <GradientButton loading={signInLoading}>
                {signInLoading ? 'Signing in…' : 'Sign in'}
              </GradientButton>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text3)', letterSpacing: '0.06em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>

            <motion.button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={oauthLoading}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', height: '44px', borderRadius: '10px',
                background: '#fff', color: '#0c0a14',
                fontSize: '0.88rem', fontWeight: 600,
                border: 'none', cursor: oauthLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                opacity: oauthLoading ? 0.6 : 1,
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)' }}>
          Loading…
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  )
}
