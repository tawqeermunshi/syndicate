import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    if (!code) return NextResponse.json({ error: 'No invite code provided' }, { status: 400 })

    const supabase = await createClient()
    const { data: invite } = await supabase
      .from('invites')
      .select('id, used_by, expires_at')
      .eq('code', code.toUpperCase())
      .single()

    if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    if (invite.used_by) return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 })
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
