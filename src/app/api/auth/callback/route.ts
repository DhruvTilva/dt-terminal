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

      if (type === 'signup') {
        // Fire welcome email — silent fail, never blocks redirect
        if (data.user?.email) {
          fetch(`${origin}/api/email/welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.user.email,
              name:  data.user.user_metadata?.name ?? data.user.user_metadata?.full_name ?? 'Trader',
            }),
          }).catch(() => {})
        }
        return NextResponse.redirect(`${origin}/auth/success`)
      }

      // Google OAuth — ensure profile exists then go to dashboard
      if (data.user) {
        await supabase.from('profiles').upsert({
          id:   data.user.id,
          name: data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? 'Trader',
        }, { onConflict: 'id', ignoreDuplicates: true })

        // Fire welcome email only on first-time Google sign-in
        const createdAt     = new Date(data.user.created_at).getTime()
        const lastSignIn    = new Date(data.user.last_sign_in_at ?? data.user.created_at).getTime()
        const isNewUser     = Math.abs(lastSignIn - createdAt) < 10000 // within 10 seconds = new account
        if (data.user.email && isNewUser) {
          fetch(`${origin}/api/email/welcome`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.user.email,
              name:  data.user.user_metadata?.full_name ?? 'Trader',
            }),
          }).catch(() => {})
        }
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
