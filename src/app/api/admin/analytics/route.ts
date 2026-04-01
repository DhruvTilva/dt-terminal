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

  const [totalRes, todayRes, activeRes, metaRes, profilesRes] = await Promise.all([
    client.from('visitor_logs').select('*', { count: 'exact', head: true }),
    client.from('visitor_logs').select('*', { count: 'exact', head: true })
      .gte('first_visit_at', todayStart.toISOString()),
    client.from('visitor_logs').select('*', { count: 'exact', head: true })
      .gte('last_active_at', activeThreshold.toISOString()),
    client.from('visitor_logs').select('device_type, browser, country, page_path, first_visit_at'),
    client.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  // Compute breakdowns from metadata
  const rows = (metaRes.data ?? []) as { device_type: string | null; browser: string | null; country: string | null; page_path: string | null; first_visit_at: string | null }[]
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

  // Conversion rate: registered users / total visitors
  const registeredUsers = profilesRes.count ?? 0
  const conversionPct = total > 0 ? Math.round((registeredUsers / total) * 100) : 0

  // New vs Returning: returning = first_visit_at before today
  const returningCount = rows.filter(r => r.first_visit_at && r.first_visit_at < todayStart.toISOString()).length
  const returningPct = total > 0 ? Math.round((returningCount / total) * 100) : 0

  // Peak hour in IST (UTC+5:30)
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
  const hourCount: Record<number, number> = {}
  for (const r of rows) {
    if (r.first_visit_at) {
      const h = new Date(new Date(r.first_visit_at).getTime() + IST_OFFSET_MS).getUTCHours()
      hourCount[h] = (hourCount[h] ?? 0) + 1
    }
  }
  const peakHourNum = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0]
  const peakHour = peakHourNum !== undefined
    ? (Number(peakHourNum) === 0 ? '12 AM' : Number(peakHourNum) < 12 ? `${peakHourNum} AM` : Number(peakHourNum) === 12 ? '12 PM' : `${Number(peakHourNum) - 12} PM`)
    : null

  // Most recent named visitor — excluding admins
  let lastVisitorName: string | null = null
  const { data: adminProfiles } = await client
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
  const adminIds = (adminProfiles as { id: string }[] | null)?.map(p => p.id) ?? []

  const { data: recentLogs } = await client
    .from('visitor_logs')
    .select('user_id')
    .not('user_id', 'is', null)
    .order('last_active_at', { ascending: false })
    .limit(20)
  const nonAdminLog = (recentLogs as { user_id: string }[] | null)?.find(r => !adminIds.includes(r.user_id))
  if (nonAdminLog?.user_id) {
    const { data: profile } = await client
      .from('profiles')
      .select('name, email')
      .eq('id', nonAdminLog.user_id)
      .single()
    lastVisitorName = (profile as { name: string | null; email: string | null } | null)?.name
      || (profile as { name: string | null; email: string | null } | null)?.email?.split('@')[0]
      || null
  }

  // DB storage size via SQL function (graceful fallback if not created)
  let storageBytes = 0
  try {
    const { data: sizeData } = await client.rpc('get_db_size_bytes')
    if (typeof sizeData === 'number') storageBytes = sizeData
  } catch { /* function not yet created */ }

  return NextResponse.json({
    total,
    today:        todayRes.count ?? 0,
    activeNow:    activeRes.count ?? 0,
    mobilePct,
    topBrowser,
    topCountry,
    topPage,
    storageBytes,
    conversionPct,
    returningPct,
    peakHour,
    lastVisitorName,
  })
}
