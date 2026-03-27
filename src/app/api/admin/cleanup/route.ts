import { NextRequest, NextResponse } from 'next/server'
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

// DELETE /api/admin/cleanup
// Deletes trade_finder_results older than 10 days.
// Auth: admin session (browser) OR x-cleanup-secret header (GitHub Actions / curl).
export async function DELETE(request: NextRequest) {
  // Allow via secret token (for GitHub Actions / curl)
  const secret = request.headers.get('x-cleanup-secret')
  const validSecret = process.env.CLEANUP_SECRET
  const authorizedBySecret = validSecret && secret === validSecret

  // Allow via admin session (browser)
  if (!authorizedBySecret) {
    const adminUser = await verifyAdmin()
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = getAdminClient()
  if (!adminClient) return NextResponse.json({ error: 'Service not configured' }, { status: 500 })

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 10)
  const cutoffDate = cutoff.toISOString().split('T')[0] // 'YYYY-MM-DD'

  const { count, error } = await adminClient
    .from('trade_finder_results')
    .delete({ count: 'exact' })
    .lt('scan_date', cutoffDate)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    deleted: count ?? 0,
    cutoff: cutoffDate,
    message: `Deleted ${count ?? 0} rows older than 10 days`,
  })
}
