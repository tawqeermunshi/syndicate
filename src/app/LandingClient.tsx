'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FormEvent } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NexusLogo from '@/components/brand/NexusLogo'
import { GoogleIcon, GradientButton, StyledInput } from '@/components/auth/AuthFormBits'

const ROTATING_WORDS = ['Founders', 'Investors', 'Operators', 'Builders']

// Particles config — generated once, stable across renders
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  size: 2 + (i % 3),
  x: (i * 4.17) % 100,
  delay: (i * 0.8) % 9,
  duration: 14 + (i % 8),
  color: i % 3 === 0 ? 'rgba(167,139,250,VAL)' : i % 3 === 1 ? 'rgba(59,130,246,VAL)' : 'rgba(217,119,6,VAL)',
  opacity: 0.3 + (i % 4) * 0.12,
}))

export default function LandingClient() {
  const router = useRouter()
  const [wordIndex, setWordIndex] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [signInError, setSignInError] = useState('')
  const [signInModalOpen, setSignInModalOpen] = useState(false)

  const closeSignInModal = useCallback(() => {
    setSignInModalOpen(false)
    setSignInError('')
  }, [])

  useEffect(() => {
    const id = setInterval(() => setWordIndex(i => (i + 1) % ROTATING_WORDS.length), 2400)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!signInModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSignInModal()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [signInModalOpen, closeSignInModal])

  function memberOAuthRedirect() {
    return `${window.location.origin}/auth/callback`
  }

  async function handleHomeSignIn(e: FormEvent) {
    e.preventDefault()
    setSignInLoading(true)
    setSignInError('')
    const supabase = createClient()
    const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signErr) {
      setSignInError(signErr.message)
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

  async function handleHomeGoogle() {
    setOauthLoading(true)
    setSignInError('')
    const supabase = createClient()
    const { error: oErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: memberOAuthRedirect() },
    })
    if (oErr) {
      setSignInError(oErr.message)
      setOauthLoading(false)
    }
  }

  return (
    <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

      {/* ── Aurora orbs ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="orb-1" style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '65vw', height: '65vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)',
          filter: 'blur(48px)',
        }} />
        <div className="orb-2" style={{
          position: 'absolute', bottom: '-20%', right: '-15%',
          width: '70vw', height: '70vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 65%)',
          filter: 'blur(56px)',
        }} />
        <div className="orb-3" style={{
          position: 'absolute', top: '30%', left: '40%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,0.09) 0%, transparent 65%)',
          filter: 'blur(64px)',
        }} />
      </div>

      {/* ── Grid ── */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* ── Floating particles ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {PARTICLES.map(p => (
          <div key={p.id} className="particle" style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, bottom: '-20px',
            background: p.color.replace('VAL', String(p.opacity)),
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }} />
        ))}
      </div>

      {/* ── Logo ── */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        style={{ position: 'absolute', top: 32, left: 32, zIndex: 20 }}>
        <NexusLogo muted />
      </motion.div>

      {/* ── Main content ── */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 1.5rem', maxWidth: '740px', width: '100%' }}>

        {/* Invite-only pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ display: 'inline-flex', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '100px',
            border: '1px solid rgba(217,119,6,0.35)',
            background: 'rgba(217,119,6,0.07)',
            color: 'rgba(251,191,36,0.85)',
            fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'glow-pulse 2s ease-in-out infinite' }} />
            Private · Invite only
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(3rem, 7.5vw, 5.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: 'var(--text)',
            marginBottom: '1rem',
          }}>
          Where{' '}
          <span style={{ display: 'inline-block', minWidth: '8ch', verticalAlign: 'bottom' }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                className="shimmer-text"
                style={{ display: 'inline-block' }}
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -18, filter: 'blur(8px)' }}
                transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}>
                {ROTATING_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
          <br />
          <span style={{ fontStyle: 'italic', color: 'rgba(240,236,230,0.7)' }}>find each other.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.38 }}
          style={{
            fontSize: '1.05rem', lineHeight: 1.7,
            color: 'var(--text2)', maxWidth: '440px',
            margin: '0 auto 3.35rem',
          }}>
          A closed network for people building things that matter.
          Signal over noise — every single time.
        </motion.p>

        {/* CTAs: Apply vs redeem (both = ways in without being a member); sign-in separate + quiet */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'stretch',
            width: '100%', maxWidth: '400px', margin: '0 auto',
          }}>

          <div
            style={{
              display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
              gap: '8px', width: '100%',
            }}>
            <Link href="/apply" style={{ flex: '2 1 200px', textDecoration: 'none', minWidth: 0 }}>
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="glow-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  height: '46px', borderRadius: '12px', padding: '0 1.1rem',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #d97706 100%)',
                  color: '#fff', fontSize: '0.86rem', fontWeight: 700,
                  letterSpacing: '-0.01em',
                }}>
                Apply for access
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                  →
                </motion.span>
              </motion.div>
            </Link>
            <span
              aria-hidden
              style={{
                flex: '0 0 auto', alignSelf: 'center',
                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--text3)',
                padding: '0 2px',
              }}>
              or
            </span>
            <Link href="/join" style={{ flex: '1 1 132px', textDecoration: 'none', minWidth: 0 }}>
              <motion.div
                whileHover={{ y: -1, borderColor: 'rgba(167,139,250,0.45)', background: 'rgba(124,58,237,0.1)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '46px', borderRadius: '12px', padding: '0 12px',
                  border: '1px solid rgba(167,139,250,0.28)',
                  background: 'rgba(124,58,237,0.05)',
                  color: 'rgba(224,213,254,0.95)', fontSize: '0.82rem', fontWeight: 600,
                  letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                }}>
                Redeem invite code
              </motion.div>
            </Link>
          </div>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.58 }}
            onClick={() => setSignInModalOpen(true)}
            whileHover={{ y: -1, borderColor: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.99 }}
            style={{
              marginTop: '1.35rem',
              width: '100%',
              height: '46px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text2)',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}>
            Member sign in
          </motion.button>
        </motion.div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {signInModalOpen && (
              <motion.div
                key="sign-in-overlay"
                role="presentation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeSignInModal}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 200,
                  background: 'rgba(6,4,12,0.72)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.25rem',
                }}>
                <motion.div
                  key="sign-in-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="sign-in-modal-title"
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '400px',
                    padding: '1.65rem 1.4rem',
                    borderRadius: '20px',
                    textAlign: 'left' as const,
                    background: 'rgba(22,18,32,0.94)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
                  }}>
                  <button
                    type="button"
                    onClick={closeSignInModal}
                    aria-label="Close"
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text3)',
                      fontSize: '1.1rem',
                      lineHeight: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    ×
                  </button>

                  <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', margin: '0 0 6px' }}>
                    Members
                  </p>
                  <h2 id="sign-in-modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', margin: '0 2.25rem 0.35rem 0', letterSpacing: '-0.02em' }}>
                    Sign in
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Use your account email and password, or Google.
                  </p>

                  <form onSubmit={(e) => void handleHomeSignIn(e)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    {signInError && <p style={{ color: '#f87171', fontSize: '0.76rem' }}>{signInError}</p>}
                    <GradientButton loading={signInLoading}>
                      {signInLoading ? 'Signing in…' : 'Sign in'}
                    </GradientButton>
                  </form>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text3)', letterSpacing: '0.06em' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => void handleHomeGoogle()}
                    disabled={oauthLoading}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', height: '44px', borderRadius: '10px',
                      background: '#fff', color: '#0c0a14',
                      fontSize: '0.86rem', fontWeight: 600,
                      border: 'none', cursor: oauthLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      opacity: oauthLoading ? 0.6 : 1,
                    }}>
                    <GoogleIcon />
                    Continue with Google
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

    </main>
  )
}
