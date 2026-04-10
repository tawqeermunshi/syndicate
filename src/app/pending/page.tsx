import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.status === 'approved') redirect('/feed')

  const isRejected = profile?.status === 'rejected'
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="orb-1" style={{ position: 'absolute', top: '-20%', left: '-15%', width: '65vw', height: '65vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="orb-2" style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="grid-bg" style={{ position: 'absolute', inset: 0 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '420px', padding: '2rem 1.5rem' }}>
        {isRejected ? (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', fontSize: '1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              ✕
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
              Not this time
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.7 }}>
              Your application wasn&apos;t approved for this cohort.
              We&apos;re selective by design — it&apos;s not a reflection of your work.
              You can re-apply in 6 months.
            </p>
          </>
        ) : (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', fontSize: '1.5rem', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.25)' }}>
              ⏳
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
              {firstName ? `Hey ${firstName} —` : "You're in the queue"}
            </h1>
            {firstName && (
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text2)', marginBottom: '0.75rem' }}>
                you&apos;re in the queue.
              </p>
            )}
            <p style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.7 }}>
              Your application is under review. We read every application manually.
              You&apos;ll get an email when a decision is made — usually within a few days.
            </p>

            {/* Divider with status */}
            <div style={{ margin: '1.75rem 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '100px', border: '1px solid rgba(217,119,6,0.3)', background: 'rgba(217,119,6,0.07)', color: 'rgba(251,191,36,0.85)', fontSize: '0.78rem', fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'glow-pulse 2s ease-in-out infinite' }} />
              Under review
            </div>
          </>
        )}

        <div style={{ marginTop: '2.5rem' }}>
          <Link href="/" style={{ fontSize: '0.82rem', color: 'var(--text3)', textDecoration: 'none' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
