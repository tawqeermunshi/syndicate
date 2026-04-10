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

const STORAGE_KEY = 'syndicate_demo_intro_requests'

export function getDemoIntroRequests(): DemoIntroRequest[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveDemoIntroRequest(request: Omit<DemoIntroRequest, 'id' | 'created_at' | 'status'>) {
  if (typeof window === 'undefined') return
  const current = getDemoIntroRequests()
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
