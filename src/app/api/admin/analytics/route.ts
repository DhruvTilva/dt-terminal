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

  const [totalRes, todayRes, activeRes, metaRes] = await Promise.all([
    client.from('visitor_logs').select('*', { count: 'exact', head: true }),
    client.from('visitor_logs').select('*', { count: 'exact', head: true })
      .gte('first_visit_at', todayStart.toISOString()),
    client.from('visitor_logs').select('*', { count: 'exact', head: true })
      .gte('last_active_at', activeThreshold.toISOString()),
    client.from('visitor_logs').select('device_type, browser, country, page_path'),
  ])

  // Compute breakdowns from metadata
  const rows = (metaRes.data ?? []) as { device_type: string | null; browser: string | null; country: string | null; page_path: string | null }[]
  const total = totalRes.count ?? 0

  const mobileCount = rows.filter(r => r.device_type === 'mobile').length
  const mobilePct   = total > 0 ? Math.round((mobileCount / total) * 100) : 0

  const browserCount: Record<string, number> = {}
  for (const r of rows) if (r.browser) browserCount[r.browser] = (browserCount[r.browser] ?? 0) + 1
  const topBrowser = Object.entries(browserCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const countryCount: Record<string, number> = {}
  for (const r of rows) if (r.country) countryCount[r.country] = (countryCount[r.country] ?? 0) + 1
  const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const pageCount: Record<string, number> = {}
  for (const r of rows) if (r.page_path) pageCount[r.page_path] = (pageCount[r.page_path] ?? 0) + 1
  const topPage = Object.entries(pageCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return NextResponse.json({
    total,
    today:     todayRes.count  ?? 0,
    activeNow: activeRes.count ?? 0,
    mobilePct,
    topBrowser,
    topCountry,
    topPage,
  })
}
