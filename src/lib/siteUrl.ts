import type { NextRequest } from 'next/server'

/** Canonical app base URL for server-only flows (no trailing slash). */
export function resolveAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

/**
 * Public origin for redirects. Prefer proxy headers on Vercel so Location
 * never uses an internal/wrong host; fall back to NEXT_PUBLIC_APP_URL, then request.url.
 */
export function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`
  }

  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (env) {
    try {
      return new URL(env).origin
    } catch {
      /* ignore */
    }
  }

  return new URL(request.url).origin
}
