import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, full_name, role, what_built, why_join, what_want, links } = body

    if (!email || !full_name || !role || !what_built || !why_join || !what_want) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check for existing application
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({ error: 'This email is already a member.' }, { status: 400 })
      }
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'You already have a pending application.' }, { status: 400 })
      }
    }

    const { error } = await supabase.from('applications').insert({
      email: email.toLowerCase(),
      full_name,
      role,
      what_built,
      why_join,
      what_want,
      links: links || null,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Apply error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
