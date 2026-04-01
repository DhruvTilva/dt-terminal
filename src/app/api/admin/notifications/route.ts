import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

// POST /api/admin/notifications
// Admin sends a notification to a specific user (user_id) or all users (user_id omitted / null)
export async function POST(request: NextRequest) {
  // ── 1. Auth: must be a logged-in admin ──────────────────────────────────
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({}))
  const { user_id, message } = body as { user_id?: string; message?: string }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // ── 3. Insert using service client (bypasses RLS) ────────────────────────
  const service = getServiceClient()
  const { error } = await service
    .from('notifications')
    .insert({
      user_id:      user_id?.trim() || null, // null = broadcast to all users
      message:      message.trim(),
      type:         'admin',
      category:     null,
      stock_symbol: null,
      is_read:      false,
    })

  if (error) {
    console.error('[ADMIN-NOTIF] Insert error:', error.message)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
