import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.id)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin-generated invites use the admin's own profile as creator
  const { data, error } = await supabase
    .from('invites')
    .insert({ created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invite: data })
}
