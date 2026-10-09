import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, full_name, role, password } = await request.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
  if (userError) return NextResponse.json({ error: userError.message }, { status: 400 })
  const { error: profileError } = await supabase.from('profiles').insert({ id: userData.user.id, full_name, role })
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
