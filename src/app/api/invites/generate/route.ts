import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check slot count
    const { data: profile } = await supabase
      .from('profiles')
      .select('invite_slots')
      .eq('id', user.id)
      .single()

    if (!profile || profile.invite_slots <= 0) {
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
