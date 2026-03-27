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

// DELETE /api/admin/cleanup-visitors
// Deletes visitor_logs older than 30 days.
// Auth: admin session (browser) OR x-cleanup-secret header (GitHub Actions).
export async function DELETE(request: NextRequest) {
  const secret = request.headers.get('x-cleanup-secret')
  const validSecret = process.env.CLEANUP_SECRET
  const authorizedBySecret = validSecret && secret === validSecret

  if (!authorizedBySecret) {
    const adminUser = await verifyAdmin()
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = getAdminClient()
  if (!client) return NextResponse.json({ error: 'Service not configured' }, { status: 500 })

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const { count, error } = await client
    .from('visitor_logs')
    .delete({ count: 'exact' })
    .lt('last_active_at', cutoff.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    deleted: count ?? 0,
    cutoff: cutoff.toISOString().split('T')[0],
    message: `Deleted ${count ?? 0} visitor sessions older than 30 days`,
  })
}
