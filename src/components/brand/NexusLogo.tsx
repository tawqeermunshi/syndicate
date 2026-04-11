'use client'

import { useId } from 'react'

type NexusLogoProps = {
  size?: 'sm' | 'md'
  showWordmark?: boolean
  muted?: boolean
}

/**
 * Mark: central junction with four linked nodes — reads as a meeting point / network
 * hub (nexus), not a letterform. Indigo → cyan gradient.
 */
export default function NexusLogo({
  size = 'md',
  showWordmark = true,
  muted = false,
}: NexusLogoProps) {
  const rawId = useId().replace(/:/g, '')
  const gid = `nexus-g-${rawId}`
  const rid = `nexus-ring-${rawId}`

  const iconSize = size === 'sm' ? 22 : 26
  const textSize = size === 'sm' ? '0.96rem' : '1.08rem'

  const nodeR = 1.85
  const outer = [
    { cx: 12, cy: 5.2 },
    { cx: 18.8, cy: 12 },
    { cx: 12, cy: 18.8 },
    { cx: 5.2, cy: 12 },
  ]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.58rem',
      }}
    >
      {!showWordmark ? <span className="sr-only">Nexus</span> : null}
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="45%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id={rid} x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* faint orbit tying the outer nodes */}
        <circle
          cx="12"
          cy="12"
          r="6.85"
          stroke={`url(#${rid})`}
          strokeWidth="1"
          fill="none"
        />

        {/* spokes */}
        {outer.map((p) => (
          <line
            key={`${p.cx}-${p.cy}`}
            x1="12"
            y1="12"
            x2={p.cx}
            y2={p.cy}
            stroke={`url(#${gid})`}
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        ))}

        {/* outer nodes */}
        {outer.map((p) => (
          <circle
            key={`n-${p.cx}-${p.cy}`}
            cx={p.cx}
            cy={p.cy}
            r={nodeR}
            fill={`url(#${gid})`}
          />
        ))}

        {/* center hub */}
        <circle cx="12" cy="12" r="2.85" fill={`url(#${gid})`} />
        <circle cx="12" cy="12" r="1.15" fill="#0c0a14" opacity={0.55} />
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
          Nexus
        </span>
      ) : null}
    </span>
  )
}
