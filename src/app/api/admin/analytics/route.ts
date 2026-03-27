import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  return profile?.is_admin ? user : null
}

// GET /api/admin/analytics
// Returns: { total, today, activeNow }
export async function GET() {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const client = getAdminClient()
  if (!client) return NextResponse.json({ error: 'Service not configured' }, { status: 500 })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const activeThreshold = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago

  const [totalRes, todayRes, activeRes] = await Promise.all([
    client.from('visitor_logs').select('*', { count: 'exact', head: true }),
    client.from('visitor_logs').select('*', { count: 'exact', head: true })
      .gte('first_visit_at', todayStart.toISOString()),
    client.from('visitor_logs').select('*', { count: 'exact', head: true })
      .gte('last_active_at', activeThreshold.toISOString()),
  ])

  return NextResponse.json({
    total:     totalRes.count  ?? 0,
    today:     todayRes.count  ?? 0,
    activeNow: activeRes.count ?? 0,
  })
}
