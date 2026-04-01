import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// GET /api/notifications
// Returns up to 30 notifications for the current user (own + global)
// Computes is_read for global ones via notification_reads table
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [] })

  // Compute start of today in IST (UTC+5:30)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const nowUtc = Date.now()
  const istNow = new Date(nowUtc + IST_OFFSET_MS)
  const istMidnight = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()))
  const startOfDayUtc = new Date(istMidnight.getTime() - IST_OFFSET_MS).toISOString()

  // Fetch user-specific + global notifications — today only (IST), newest first, max 15
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, user_id, stock_symbol, message, type, category, is_read, created_at')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .gte('created_at', startOfDayUtc)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error || !notifications) {
    return NextResponse.json({ notifications: [] })
  }

  // For global notifications, check which ones this user has already read
  const globalIds = notifications
    .filter(n => n.user_id === null)
    .map(n => n.id)

  const readSet = new Set<string>()
  if (globalIds.length > 0) {
    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id)
      .in('notification_id', globalIds)
    reads?.forEach(r => readSet.add(r.notification_id))
  }

  // Merge is_read: use notification_reads for global, is_read column for user-specific
  const result = notifications.map(n => ({
    ...n,
    is_read: n.user_id === null ? readSet.has(n.id) : n.is_read,
  }))

  return NextResponse.json({ notifications: result })
}

// PATCH /api/notifications
// Body: { id?: string, all?: boolean }
// Marks one notification or all as read for the current user
export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { id, all } = body as { id?: string; all?: boolean }

  if (all) {
    // Mark all user-specific notifications as read
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    // Fetch all global notification IDs
    const { data: globals } = await supabase
      .from('notifications')
      .select('id')
      .is('user_id', null)

    if (globals && globals.length > 0) {
      // Upsert reads for each global notification (ignore duplicates)
      await supabase
        .from('notification_reads')
        .upsert(
          globals.map(n => ({ notification_id: n.id, user_id: user.id })),
          { onConflict: 'notification_id,user_id', ignoreDuplicates: true }
        )
    }
    return NextResponse.json({ success: true })
  }

  if (id) {
    // Fetch the notification to determine type (global vs user-specific)
    const { data: notif } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (notif.user_id === null) {
      // Global — insert into notification_reads
      await supabase
        .from('notification_reads')
        .upsert(
          { notification_id: id, user_id: user.id },
          { onConflict: 'notification_id,user_id', ignoreDuplicates: true }
        )
    } else if (notif.user_id === user.id) {
      // User-specific — update is_read directly
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id)
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Provide id or all:true' }, { status: 400 })
}
