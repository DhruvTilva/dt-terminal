import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery') return NextResponse.redirect(`${origin}/auth/reset-password`)
      if (type === 'signup')   return NextResponse.redirect(`${origin}/auth/success`)

      // Google OAuth — ensure profile exists then go to dashboard
      if (data.user) {
        await supabase.from('profiles').upsert({
          id:   data.user.id,
          name: data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? 'Trader',
        }, { onConflict: 'id', ignoreDuplicates: true })
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
