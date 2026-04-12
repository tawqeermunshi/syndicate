/** Normalize user-entered invite codes before compare or API calls. */
export function normalizeInviteCode(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}
