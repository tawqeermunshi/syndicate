'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import NexusLogo from '@/components/brand/NexusLogo'

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

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

export default function LandingClient() {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setWordIndex(i => (i + 1) % ROTATING_WORDS.length), 2400)
    return () => clearInterval(id)
  }, [])

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
        style={{ position: 'absolute', top: 32, left: 32 }}>
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
            margin: '0 auto 3rem',
          }}>
          A closed network for people building things that matter.
          Signal over noise — every single time.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>

          <Link href="/apply">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="glow-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0 2.5rem', height: '54px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #d97706 100%)',
                color: '#fff', fontSize: '0.92rem', fontWeight: 700,
                letterSpacing: '-0.01em',
              }}>
              Apply for access
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                →
              </motion.span>
            </motion.div>
          </Link>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/login" style={{ fontSize: '0.83rem', color: 'var(--text3)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              Already a member? Sign in
            </Link>
            <Link href="/login" style={{ fontSize: '0.8rem', color: 'rgba(167,139,250,0.65)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(167,139,250,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(167,139,250,0.65)')}>
              Have an invite code? Join without applying →
            </Link>
          </div>
        </motion.div>
      </div>

    </main>
  )
}
