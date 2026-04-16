export function isAdmin(userId: string): boolean {
  // Prefer NEXT_PUBLIC_ADMIN_USER_IDS so client + server share a single source of truth.
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_USER_IDS
    || process.env.ADMIN_USER_IDS
    || ''
  const adminIds = raw.split(',').map(s => s.trim()).filter(Boolean)
  return adminIds.includes(userId)
}
