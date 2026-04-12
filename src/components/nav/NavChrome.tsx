'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import NexusLogo from '@/components/brand/NexusLogo'

const backInteractive = {
  fontSize: '0.82rem' as const,
  fontWeight: 500 as const,
  color: 'var(--text3)',
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: '6px',
  textDecoration: 'none' as const,
}

export function BackLink({ href, children = 'Back to home' }: { href: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      style={backInteractive}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)' }}>
      <span aria-hidden style={{ opacity: 0.9 }}>←</span>
      {children}
    </Link>
  )
}

export function BackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...backInteractive,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)' }}>
      <span aria-hidden style={{ opacity: 0.9 }}>←</span>
      {children}
    </button>
  )
}

const closeBase = {
  width: 32,
  height: 32,
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--text3)',
  fontSize: '1.15rem',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  padding: 0,
}

export function ModalCloseButton({
  onClick,
  ariaLabel = 'Close',
  floating,
}: {
  onClick: () => void
  ariaLabel?: string
  /** Pin to top-right of a `position: relative` modal panel */
  floating?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        ...closeBase,
        ...(floating ? { position: 'absolute' as const, top: 14, right: 14 } : {}),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.09)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text3)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
      }}>
      ×
    </button>
  )
}

/** Top bar: back link + home logo (auth / marketing subpages) */
export function AuthScreenTopBar({
  backHref = '/',
  backLabel = 'Back to home',
}: {
  backHref?: string
  backLabel?: string
}) {
  return (
    <nav
      style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.75rem 2rem',
        gap: '1rem',
      }}>
      <BackLink href={backHref}>{backLabel}</BackLink>
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <NexusLogo size="sm" muted />
      </Link>
    </nav>
  )
}
