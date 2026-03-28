import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Last 14 days from the daily accuracy view
    const { data, error } = await client
      .from('ml_daily_accuracy')
      .select('prediction_date, total_predictions, correct_predictions, accuracy_pct')
      .order('prediction_date', { ascending: false })
      .limit(14)

    if (error) throw error

    const rows = data ?? []

    // 7-day rolling average
    const last7 = rows.slice(0, 7)
    const avg7 = last7.length > 0
      ? Math.round(last7.reduce((s, r) => s + Number(r.accuracy_pct), 0) / last7.length * 10) / 10
      : null

    return NextResponse.json({ rows, avg7 })
  } catch {
    return NextResponse.json({ rows: [], avg7: null })
  }
}
