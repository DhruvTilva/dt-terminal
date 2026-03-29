/**
 * Daily Market Scan — GitHub Actions Runner
 */

import { createClient } from '@supabase/supabase-js'
import { runDailyMarketScan, getTodaySession } from '../src/lib/market-scan-pipeline'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayIST(): string {
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  const y = ist.getUTCFullYear()
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0')
  const d = String(ist.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isMarketDay(): boolean {
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  const day = ist.getUTCDay() // 0=Sun, 6=Sat
  return day >= 1 && day <= 5
}

function log(msg: string) {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${msg}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const isForced = process.argv.includes('--force')
  const scanDate = getTodayIST()

  log(`=== DT Terminal — Daily Market Scan ===`)
  log(`Scan date : ${scanDate}`)
  log(`Forced    : ${isForced}`)

  // ── Validate env ────────────────────────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    log('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // ── Market day check ─────────────────────────────────────────────────────────
  if (!isMarketDay() && !isForced) {
    log(`Skipping — not a market day (${scanDate}). Use --force to override.`)
    process.exit(0)
  }

  // ── Idempotency check ─────────────────────────────────────────────────────────
  if (!isForced) {
    const existing = await getTodaySession(supabase, scanDate)
    if (existing?.status === 'completed') {
      log(`Skipping — scan already completed for ${scanDate}. Use --force to re-run.`)
      process.exit(0)
    }
    if (existing?.status === 'running') {
      log(`WARNING: A scan for ${scanDate} is already running (session ${existing.id}). Proceeding anyway.`)
    }
  }

  // ── Run pipeline ──────────────────────────────────────────────────────────────
  log(`Starting full market scan…`)
  const startMs = Date.now()

  try {
    const result = await runDailyMarketScan(supabase, scanDate)

    const durationMin = (result.durationMs / 60000).toFixed(1)
    log(``)
    log(`=== SCAN COMPLETE ===`)
    log(`Status           : ${result.status.toUpperCase()}`)
    log(`Stocks processed : ${result.processedStocks} / ${result.totalStocks}`)
    log(`Signals found    : ${result.signalsFound}`)
    log(`Errors           : ${result.errorCount}`)
    log(`Duration         : ${durationMin} minutes`)
    log(`Session ID       : ${result.sessionId}`)

    process.exit(result.status === 'completed' ? 0 : 1)
  } catch (err) {
    log(`FATAL: Pipeline crashed — ${err}`)
    const elapsed = ((Date.now() - startMs) / 60000).toFixed(1)
    log(`Failed after ${elapsed} minutes`)
    process.exit(1)
  }
}

main()
