import { createHash, randomInt } from 'node:crypto'

export const JOIN_OTP_TTL_MS = 10 * 60 * 1000

export function hashJoinOtp(email: string, code: string): string {
  const pepper = process.env.JOIN_OTP_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY || 'join-otp-dev'
  const norm = email.trim().toLowerCase()
  const digits = code.trim().replace(/\D/g, '')
  return createHash('sha256').update(`${norm}:${digits}:${pepper}`).digest('hex')
}

export function generateJoinOtpCode(): string {
  return String(randomInt(100000, 1000000))
}
