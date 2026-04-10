import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')
  if (profile.status !== 'approved') redirect('/pending')

  return (
    <div className="min-h-screen text-white flex" style={{ background: '#07050f' }}>
      {/* Ambient orbs in app too */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb-1 absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="orb-2 absolute -bottom-60 -right-60 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>
      <Sidebar profile={profile} />
      <main className="relative z-10 flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
