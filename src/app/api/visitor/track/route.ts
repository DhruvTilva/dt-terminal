import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// POST /api/visitor/track
// Body: { session_id, user_id?, device_type?, browser?, page_path?, referrer? }
// - New session  → INSERT (stores all metadata)
// - Heartbeat    → UPDATE last_active_at only (metadata doesn't change)
export async function POST(request: NextRequest) {
  try {
    const { session_id, user_id, device_type, browser, page_path, referrer } = await request.json()
    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
    }

    const client = getAdminClient()
    if (!client) return NextResponse.json({ error: 'Service not configured' }, { status: 500 })

    const now = new Date().toISOString()
    // Country from Vercel header — free, automatic on Vercel deployments
    const country = request.headers.get('x-vercel-ip-country') ?? null

    // Try insert first (new visitor) — store all metadata
    const { error: insertError } = await client
      .from('visitor_logs')
      .insert({
        session_id, user_id: user_id ?? null,
        first_visit_at: now, last_active_at: now,
        device_type: device_type ?? null,
        browser:     browser     ?? null,
        country,
        page_path:   page_path   ?? null,
        referrer:    referrer    ?? null,
      })

    if (insertError?.code === '23505') {
      // Duplicate session — heartbeat: only update last_active_at
      const { error: updateError } = await client
        .from('visitor_logs')
        .update({ last_active_at: now, ...(user_id ? { user_id } : {}) })
        .eq('session_id', session_id)
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    } else if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
