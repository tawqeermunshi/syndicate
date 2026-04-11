'use client'

import { useId } from 'react'

type MafiaLogoProps = {
  size?: 'sm' | 'md'
  showWordmark?: boolean
  muted?: boolean
}

/**
 * Mark: wide brim + crowned dome (classic noir silhouette) with a single smoke wisp —
 * reads as a private back-room circle, not a letterform.
 */
export default function MafiaLogo({
  size = 'md',
  showWordmark = true,
  muted = false,
}: MafiaLogoProps) {
  const rawId = useId().replace(/:/g, '')
  const gid = `mafia-g-${rawId}`
  const sid = `mafia-smoke-${rawId}`

  const iconSize = size === 'sm' ? 22 : 26
  const textSize = size === 'sm' ? '0.96rem' : '1.08rem'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.58rem',
      }}
    >
      {!showWordmark ? <span className="sr-only">Mafia</span> : null}
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="55%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id={sid} x1="18" y1="2" x2="23" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Brim */}
        <path
          d="M2.5 16.25 Q12 20.25 21.5 16.25"
          stroke={`url(#${gid})`}
          strokeWidth="2.15"
          strokeLinecap="round"
          fill="none"
        />

        {/* Crown */}
        <path
          d="M12 5.5 L6.8 13.2 5.2 16.8 Q12 18.8 18.8 16.8 L17.2 13.2 12 5.5Z"
          fill={`url(#${gid})`}
          opacity={0.94}
        />

        {/* Crease + hat band */}
        <path
          d="M12 7.2v3.5M7.4 14.55h9.2"
          stroke="rgba(12,10,20,0.42)"
          strokeWidth="0.85"
          strokeLinecap="round"
        />

        {/* Smoke */}
        <path
          d="M19.25 9.5 Q22.5 6.5 21.75 2.75 M20.4 11.2 Q23.8 8.8 23.25 5"
          stroke={`url(#${sid})`}
          strokeWidth="1.05"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showWordmark ? (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: textSize,
            color: muted ? 'rgba(240,236,230,0.58)' : 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Mafia
        </span>
      ) : null}
    </span>
  )
}
