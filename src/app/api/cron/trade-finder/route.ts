import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { runDailyMarketScan, getTodaySession } from '@/lib/market-scan-pipeline'

/**
 * POST-MARKET DAILY CRON JOB
 * Schedule: 4:30 PM IST (11:00 AM UTC), Monday–Friday
 *
 * Flow:
 *  1. Validate CRON_SECRET
 *  2. Check it's a market day (weekday + NSE open check)
 *  3. Skip if today's scan already completed
 *  4. Run full market scan pipeline
 *  5. Store results in Supabase
 */

// Allow up to 5 minutes on Vercel Pro
export const maxDuration = 300

function getTodayIST(): string {
  // Returns YYYY-MM-DD in IST (UTC+5:30)
  const now  = new Date()
  const ist  = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  const y    = ist.getUTCFullYear()
  const m    = String(ist.getUTCMonth() + 1).padStart(2, '0')
  const d    = String(ist.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isMarketDay(): boolean {
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  const day = ist.getUTCDay() // 0=Sun, 6=Sat
  return day >= 1 && day <= 5
}

async function hasMarketDataToday(todayIST: string): Promise<boolean> {
  // Fetch RELIANCE.NS 5m candles for today — if no candles for today's date, market was closed
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS?interval=5m&range=1d',
      { signal: AbortSignal.timeout(10_000) }
    )
    if (!res.ok) return true // if fetch fails, don't block the cron

    const json = await res.json()
    const timestamps: number[] = json?.chart?.result?.[0]?.timestamp ?? []
    if (timestamps.length === 0) return false

    // Check if any timestamp falls on today's IST date
    return timestamps.some(ts => {
      const ist = new Date(ts * 1000 + 5.5 * 60 * 60 * 1000)
      const d = `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`
      return d === todayIST
    })
  } catch {
    return true // on error, don't block the cron
  }
}

export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const scanDate  = getTodayIST()
  const isForced  = request.nextUrl.searchParams.get('force') === '1'

  // ── Market day check (weekday) ──────────────────────────────────────────────
  if (!isMarketDay() && !isForced) {
    console.info(`[cron/trade-finder] Skipping — not a market day (${scanDate})`)
    return NextResponse.json({
      skipped: true,
      reason: 'Not a market day',
      date: scanDate,
    })
  }

  // ── Market holiday check (NSE closed on weekday) ─────────────────────────
  if (!isForced) {
    const marketOpen = await hasMarketDataToday(scanDate)
    if (!marketOpen) {
      console.info(`[cron/trade-finder] Skipping — Market Holiday. No trading data found for ${scanDate}. No need to re-run.`)
      return NextResponse.json({
        skipped: true,
        reason: `Market Holiday — No trading data for ${scanDate}. No need to re-run.`,
        date: scanDate,
      })
    }
  }

  // ── Supabase client ─────────────────────────────────────────────────────────
  let supabase
  try {
    supabase = getServiceClient()
  } catch (err) {
    console.error('[cron/trade-finder] Supabase not configured:', err)
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  // ── Idempotency: skip if already completed today ─────────────────────────
  if (!isForced) {
    const existing = await getTodaySession(supabase, scanDate)
    if (existing?.status === 'completed') {
      console.info(`[cron/trade-finder] Already completed for ${scanDate}`)
      return NextResponse.json({
        skipped: true,
        reason: 'Already completed today',
        date: scanDate,
        session: existing,
      })
    }
  }

  // ── Run pipeline ─────────────────────────────────────────────────────────
  console.info(`[cron/trade-finder] Starting daily scan for ${scanDate}`)

  try {
    const result = await runDailyMarketScan(supabase, scanDate)

    return NextResponse.json({
      success: true,
      date: scanDate,
      ...result,
      durationSec: (result.durationMs / 1000).toFixed(1),
    })
  } catch (err) {
    console.error('[cron/trade-finder] Pipeline failed:', err)
    return NextResponse.json(
      { error: 'Scan pipeline failed', detail: String(err) },
      { status: 500 }
    )
  }
}
