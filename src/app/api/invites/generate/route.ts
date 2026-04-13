import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check slot count against currently unused invites.
    const [{ data: profile }, { count: unusedCount, error: countError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('invite_slots')
        .eq('id', user.id)
        .single(),
      supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .is('used_by', null),
    ])

    if (!profile || profile.invite_slots <= 0) {
      return NextResponse.json({ error: 'No invite slots remaining' }, { status: 400 })
    }
    if (countError) throw countError
    if ((unusedCount ?? 0) >= profile.invite_slots) {
      return NextResponse.json({ error: 'No invite slots remaining' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('invites')
      .insert({ created_by: user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ invite: data })
  } catch (err) {
    console.error('Generate invite error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
