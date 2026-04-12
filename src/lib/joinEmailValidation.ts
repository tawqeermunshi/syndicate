import { resolveMx } from 'node:dns/promises'

/** Domains that accept mail syntactically but are not acceptable for signup. */
const BLOCKED_EMAIL_DOMAINS = new Set([
  'hello.com',
  'example.com',
  'example.org',
  'test.com',
  'localhost',
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'tempmail.com',
  '10minutemail.com',
  'throwaway.email',
])

export function emailDomain(email: string): string | null {
  const t = email.trim().toLowerCase()
  const i = t.lastIndexOf('@')
  if (i <= 0 || i === t.length - 1) return null
  return t.slice(i + 1)
}

/** Returns an error message, or null if the address looks deliverable. */
export async function assertDeliverableEmail(email: string): Promise<string | null> {
  const t = email.trim().toLowerCase()
  if (!t.includes('@')) return 'Enter a valid email address.'
  const domain = emailDomain(t)
  if (!domain) return 'Enter a valid email address.'
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return 'Use a real email inbox you control (work or personal), not a disposable or placeholder domain.'
  }

  try {
    const mx = await resolveMx(domain)
    if (!mx?.length) return 'This email domain does not accept mail. Use a different address.'
  } catch {
    return 'Could not verify this email domain. Use a different address.'
  }
  return null
}
