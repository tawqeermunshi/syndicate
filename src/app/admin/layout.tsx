import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AdminNav from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.id)) redirect('/')

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <AdminNav />
      <main className="flex-1 ml-56 min-h-screen p-8">
        {children}
      </main>
    </div>
  )
}
