'use client'

import { motion } from 'framer-motion'
import type { FormEvent } from 'react'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NexusLogo from '@/components/brand/NexusLogo'
import { GoogleIcon, GradientButton, StyledInput } from '@/components/auth/AuthFormBits'

function JoinInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [inviteCode, setInviteCode] = useState('')
  const [verifiedInvite, setVerifiedInvite] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  const [joinEmail, setJoinEmail] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [joinConfirm, setJoinConfirm] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const inviteParamAttempted = useRef<string | null>(null)

  const verifyInvite = useCallback(async (codeRaw: string) => {
    const code = codeRaw.trim()
    if (!code) {
      setVerifyError('Enter an invite code')
      return
    }
    setVerifyError('')
    setVerifyLoading(true)
    try {
      const res = await fetch('/api/invite/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const raw = await res.text()
      let body: { error?: string; valid?: boolean } = {}
      if (raw) {
        try {
          body = JSON.parse(raw) as typeof body
        } catch {
          /* ignore */
        }
      }
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
      setVerifiedInvite(code.toUpperCase())
      setJoinError('')
      setJoinSuccess('')
    } catch (e) {
      setVerifiedInvite(null)
      setVerifyError(e instanceof Error ? e.message : 'Could not verify code')
    } finally {
      setVerifyLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = searchParams.get('invite')?.trim()
    if (!q || inviteParamAttempted.current === q) return
    inviteParamAttempted.current = q
    setInviteCode(q)
    void verifyInvite(q)
  }, [searchParams, verifyInvite])

  function clearInvite() {
    setVerifiedInvite(null)
    setVerifyError('')
    setJoinSuccess('')
    setJoinError('')
  }

  function inviteOAuthRedirect(invite: string) {
    return `${window.location.origin}/auth/callback?invite=${encodeURIComponent(invite)}`
  }

  async function handleGoogleInvite() {
    if (!verifiedInvite) return
    setOauthLoading(true)
    setJoinError('')
    const supabase = createClient()
    const { error: oErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: inviteOAuthRedirect(verifiedInvite) },
    })
    if (oErr) {
      setJoinError(oErr.message)
      setOauthLoading(false)
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    if (!verifiedInvite) return
    setJoinError('')
    setJoinSuccess('')
    if (joinPassword.length < 8) {
      setJoinError('Password must be at least 8 characters.')
      return
    }
    if (joinPassword !== joinConfirm) {
      setJoinError('Passwords do not match.')
      return
    }
    setJoinLoading(true)
    const supabase = createClient()
    const { data, error: upErr } = await supabase.auth.signUp({
      email: joinEmail.trim(),
      password: joinPassword,
      options: {
        emailRedirectTo: inviteOAuthRedirect(verifiedInvite),
      },
    })
    if (upErr) {
      setJoinError(upErr.message)
      setJoinLoading(false)
      return
    }
    if (data.session) {
      router.push(`/onboarding?invite=${encodeURIComponent(verifiedInvite)}`)
      return
    }
    setJoinSuccess(
      'Check your email for a confirmation link. After you confirm, you’ll finish onboarding and your invite will apply.',
    )
    setJoinLoading(false)
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
          <NexusLogo size="sm" muted />
        </Link>
      </div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ borderRadius: '20px', padding: '2.25rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>

            {!verifiedInvite ? (
              <>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.65)', margin: '0 0 6px' }}>
                  Pre-approved access
                </p>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                  Redeem invite code
                </h1>
                <p style={{ fontSize: '0.83rem', color: 'var(--text3)', marginBottom: '1.35rem', lineHeight: 1.55 }}>
                  Enter the code you were given. After it is verified, you will create your account and then complete your profile like any new member.
                </p>

                <div style={{ marginBottom: '1.25rem', padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.06)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.7)', marginBottom: '0.6rem' }}>
                    Invite code
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <StyledInput
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCD12"
                      style={{ flex: 1, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em' }}
                    />
                    <motion.button
                      type="button"
                      disabled={verifyLoading || !inviteCode.trim()}
                      onClick={() => void verifyInvite(inviteCode)}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '0 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
                        background: 'rgba(255,255,255,0.1)', color: '#e9e7ef', border: '1px solid rgba(255,255,255,0.12)',
                        cursor: verifyLoading || !inviteCode.trim() ? 'not-allowed' : 'pointer', opacity: verifyLoading || !inviteCode.trim() ? 0.45 : 1,
                        whiteSpace: 'nowrap',
                      }}>
                      {verifyLoading ? '…' : 'Verify'}
                    </motion.button>
                  </div>
                  {verifyError && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '8px' }}>{verifyError}</p>}
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.75)', margin: '0 0 6px' }}>
                  Code accepted
                </p>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                  Create your account
                </h1>
                <p style={{ fontSize: '0.83rem', color: 'var(--text3)', marginBottom: '1rem', lineHeight: 1.55 }}>
                  Choose email and password or Google. Next you will enter your profile details on onboarding.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '1rem', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em', color: 'var(--text2)' }}>{verifiedInvite}</span>
                  <button
                    type="button"
                    onClick={() => {
                      inviteParamAttempted.current = null
                      clearInvite()
                      setInviteCode('')
                      router.replace('/join')
                    }}
                    style={{
                      padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 500,
                      background: 'transparent', color: 'rgba(248,113,113,0.85)', border: '1px solid rgba(248,113,113,0.25)',
                      cursor: 'pointer', flexShrink: 0,
                    }}>
                    Change code
                  </button>
                </div>

                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
                  <StyledInput
                    type="email"
                    required
                    autoComplete="email"
                    value={joinEmail}
                    onChange={(e) => setJoinEmail(e.target.value)}
                    placeholder="Work email"
                  />
                  <StyledInput
                    type="password"
                    required
                    autoComplete="new-password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Password (8+ characters)"
                  />
                  <StyledInput
                    type="password"
                    required
                    autoComplete="new-password"
                    value={joinConfirm}
                    onChange={(e) => setJoinConfirm(e.target.value)}
                    placeholder="Confirm password"
                  />
                  {joinError && <p style={{ color: '#f87171', fontSize: '0.78rem' }}>{joinError}</p>}
                  {joinSuccess && <p style={{ color: 'rgba(52,211,153,0.85)', fontSize: '0.78rem' }}>{joinSuccess}</p>}
                  <GradientButton loading={joinLoading}>
                    {joinLoading ? 'Creating account…' : 'Create account'}
                  </GradientButton>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 1rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text3)', letterSpacing: '0.06em' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                </div>

                <motion.button
                  type="button"
                  onClick={() => void handleGoogleInvite()}
                  disabled={oauthLoading}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', height: '44px', borderRadius: '10px', marginBottom: '1rem',
                    background: '#fff', color: '#0c0a14',
                    fontSize: '0.88rem', fontWeight: 600,
                    border: 'none', cursor: oauthLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    opacity: oauthLoading ? 0.6 : 1,
                  }}>
                  <GoogleIcon />
                  Continue with Google
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)' }}>
          Loading…
        </main>
      }
    >
      <JoinInner />
    </Suspense>
  )
}
