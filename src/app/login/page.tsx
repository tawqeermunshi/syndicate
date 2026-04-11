'use client'

import { motion } from 'framer-motion'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NexusLogo from '@/components/brand/NexusLogo'

function LoginInner() {
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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')
  const inviteParamAttempted = useRef<string | null>(null)
  /** Invite UI is only for pre-approved signup — not part of member sign-in. */
  const [showInviteJoin, setShowInviteJoin] = useState(false)

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
    const join = searchParams.get('join')
    const inv = searchParams.get('invite')?.trim()
    if (join === 'invite' || inv) setShowInviteJoin(true)
  }, [searchParams])

  useEffect(() => {
    const q = searchParams.get('invite')?.trim()
    if (!q || inviteParamAttempted.current === q) return
    inviteParamAttempted.current = q
    setShowInviteJoin(true)
    setInviteCode(q)
    void verifyInvite(q)
  }, [searchParams, verifyInvite])

  function clearInvite() {
    setVerifiedInvite(null)
    setVerifyError('')
    setJoinSuccess('')
    setJoinError('')
  }

  function memberOAuthRedirect() {
    return `${window.location.origin}/auth/callback`
  }

  function inviteOAuthRedirect(invite: string) {
    return `${window.location.origin}/auth/callback?invite=${encodeURIComponent(invite)}`
  }

  function closeInviteJoin() {
    inviteParamAttempted.current = null
    setShowInviteJoin(false)
    clearInvite()
    setInviteCode('')
    router.replace('/login')
  }

  async function handlePassword(e: React.FormEvent) {
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

  async function handleSignUp(e: React.FormEvent) {
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
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>
              Sign in
            </h1>
            <p style={{ fontSize: '0.83rem', color: 'var(--text3)', marginBottom: '1.35rem', lineHeight: 1.55 }}>
              Use your email and password, or Google. Invite codes are only for creating a new account with pre-approval — not for signing in.
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

            <p style={{ fontSize: '0.78rem', color: 'var(--text3)', textAlign: 'center', marginTop: '1.2rem', lineHeight: 1.55 }}>
              New here?{' '}
              <Link href="/apply" style={{ color: 'rgba(167,139,250,0.85)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Apply for access
              </Link>
              {!showInviteJoin ? (
                <>
                  {' · '}
                  <Link href="/login?join=invite" style={{ color: 'rgba(167,139,250,0.85)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                    Join with an invite code
                  </Link>
                </>
              ) : null}
            </p>

            {showInviteJoin && (
              <div style={{ marginTop: '1.35rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '0.9rem' }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.65)', margin: '0 0 4px' }}>
                      Pre-approved
                    </p>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text2)', margin: 0, letterSpacing: '-0.02em' }}>
                      Join with an invite
                    </h2>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text3)', margin: '6px 0 0', lineHeight: 1.45 }}>
                      Your code skips the application queue. You still create a normal account and complete onboarding like everyone else.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => closeInviteJoin()}
                    style={{
                      flexShrink: 0, padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 500,
                      background: 'transparent', color: 'var(--text3)', border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                    }}>
                    Close
                  </button>
                </div>

                <div style={{ marginBottom: verifiedInvite ? '1rem' : 0, padding: '0.9rem', borderRadius: '14px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.06)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.7)', marginBottom: '0.6rem' }}>
                    Invite code
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <StyledInput
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value.toUpperCase())
                        if (verifiedInvite) clearInvite()
                      }}
                      placeholder="e.g. ABCD12"
                      disabled={!!verifiedInvite}
                      style={{ flex: 1, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em' }}
                    />
                    {!verifiedInvite ? (
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
                    ) : (
                      <button
                        type="button"
                        onClick={clearInvite}
                        style={{
                          padding: '0 12px', borderRadius: '10px', fontSize: '0.75rem',
                          background: 'transparent', color: 'rgba(248,113,113,0.85)', border: '1px solid rgba(248,113,113,0.25)',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                        Change
                      </button>
                    )}
                  </div>
                  {verifyError && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '8px' }}>{verifyError}</p>}
                  {verifiedInvite && (
                    <p style={{ color: 'rgba(52,211,153,0.9)', fontSize: '0.78rem', marginTop: '8px' }}>
                      Code accepted — create your account below, then you will finish your profile.
                    </p>
                  )}
                </div>

                {verifiedInvite && (
                  <>
                    <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Create account</p>
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
                  </>
                )}
              </div>
            )}
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function StyledInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        height: '44px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '0 14px',
        fontSize: '0.88rem',
        color: 'var(--text)',
        outline: 'none',
        transition: 'border-color 0.2s ease',
        ...style,
      }}
      onFocus={(e) => (e.target.style.borderColor = 'rgba(124,58,237,0.45)')}
      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
    />
  )
}

function GradientButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: '100%',
        height: '44px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #d97706 100%)',
        color: '#fff',
        fontSize: '0.88rem',
        fontWeight: 700,
        border: 'none',
        opacity: loading ? 0.5 : 1,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s',
      }}
    >
      {children}
    </motion.button>
  )
}
