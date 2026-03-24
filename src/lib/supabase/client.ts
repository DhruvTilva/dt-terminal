import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Return a minimal stub if Supabase isn't configured
  if (!url || url.includes('placeholder') || !key || key.includes('placeholder')) {
    return {
      auth: {
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }), data: [], error: null }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        delete: () => ({ eq: () => ({ eq: () => ({ error: null }) }) }),
      }),
    } as any
  }

  client = createBrowserClient(url, key)
  return client
}
