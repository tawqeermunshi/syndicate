export type DemoIntroRequest = {
  id: string
  from_user_id: string
  to_user_id: string
  purpose: string
  context: string
  proposed_duration: number
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

const STORAGE_KEY = 'nexus_demo_intro_requests'
const LEGACY_STORAGE_KEYS = ['mafia_demo_intro_requests', 'syndicate_demo_intro_requests']

function readStoredIntroRequests(): DemoIntroRequest[] {
  if (typeof window === 'undefined') return []
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        raw = window.localStorage.getItem(legacyKey)
        if (raw) {
          window.localStorage.setItem(STORAGE_KEY, raw)
          window.localStorage.removeItem(legacyKey)
          break
        }
      }
    }
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function getDemoIntroRequests(): DemoIntroRequest[] {
  return readStoredIntroRequests()
}

export function saveDemoIntroRequest(request: Omit<DemoIntroRequest, 'id' | 'created_at' | 'status'>) {
  if (typeof window === 'undefined') return
  const current = readStoredIntroRequests()
  const next: DemoIntroRequest[] = [
    {
      id: `demo-intro-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      ...request,
    },
    ...current,
  ]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
