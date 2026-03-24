import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!url || url.includes('placeholder') || !key || key.includes('placeholder')) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured' } }),
        exchangeCodeForSession: async () => ({ error: { message: 'Supabase not configured' } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }), data: [], error: null }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        delete: () => ({ eq: () => ({ eq: () => ({ error: null }) }) }),
      }),
    } as any
  }

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}
