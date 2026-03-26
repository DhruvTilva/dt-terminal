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

export async function GET(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminClient = getAdminClient()
  if (!adminClient) return NextResponse.json({ error: 'Service not configured' }, { status: 500 })

  const search = request.nextUrl.searchParams.get('search') || ''
  const filter = request.nextUrl.searchParams.get('filter') || 'all'

  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, name, is_admin, is_blocked')

  const profileMap = new Map((profiles || []).map((p: { id: string; name: string; is_admin: boolean; is_blocked: boolean }) => [p.id, p]))

  let users = authData.users.map(u => ({
    id: u.id,
    email: u.email || '',
    name: (profileMap.get(u.id) as { name?: string })?.name || '',
    is_admin: (profileMap.get(u.id) as { is_admin?: boolean })?.is_admin || false,
    is_blocked: (profileMap.get(u.id) as { is_blocked?: boolean })?.is_blocked || false,
    created_at: u.created_at,
  }))

  if (search) {
    const q = search.toLowerCase()
    users = users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q)
    )
  }

  if (filter === 'admin') users = users.filter(u => u.is_admin)
  if (filter === 'blocked') users = users.filter(u => u.is_blocked)

  return NextResponse.json({ users })
}

export async function PATCH(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, field, value } = await request.json()

  if (!['is_admin', 'is_blocked'].includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  if (userId === adminUser.id) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
  }

  const adminClient = getAdminClient()
  if (!adminClient) return NextResponse.json({ error: 'Service not configured' }, { status: 500 })

  const { error } = await adminClient
    .from('profiles')
    .update({ [field]: value })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
