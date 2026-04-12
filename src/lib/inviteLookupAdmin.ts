import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeInviteCode } from '@/lib/inviteCode'

export type InviteGateRow = { id: string; used_by: string | null; expires_at: string | null }

/** Service-role lookup of an invite row by user-entered code (RPC + ilike fallback). */
export async function lookupInviteRow(
  admin: SupabaseClient,
  rawCode: string,
): Promise<{ invite: InviteGateRow | null; queryError: string | null }> {
  const normalized = normalizeInviteCode(rawCode)
  if (!normalized) return { invite: null, queryError: null }

  let invite: InviteGateRow | null = null

  const rpc = await admin.rpc('match_invite_code', { p_raw: normalized })
  if (!rpc.error && rpc.data !== null && rpc.data !== undefined) {
    const rows = rpc.data as InviteGateRow | InviteGateRow[]
    invite = Array.isArray(rows) ? rows[0] ?? null : rows
  }

  if (!invite) {
    const { data: row, error } = await admin
      .from('invites')
      .select('id, used_by, expires_at')
      .ilike('code', normalized)
      .maybeSingle()
    if (error) return { invite: null, queryError: error.message }
    invite = row
  }

  return { invite, queryError: null }
}
