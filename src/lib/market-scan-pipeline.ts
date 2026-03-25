/**
 * Daily Market Scan Pipeline
 *
 * Orchestrates the full post-market scan:
 *  1. Load NSE equity universe (live from NSE archives + index CSVs)
 *  2. Process stocks in batches
 *  3. Run 5 strategy engines per batch
 *  4. Write results to Supabase incrementally
 *  5. Track progress in scan_sessions table
 *
 * Called by /api/cron/trade-finder after market close.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { runTradeFinder } from './trade-strategies'
import { fetchNSEIndex } from './nse-index-fetcher'
import type { StockEntry } from './stock-universe'
import { NIFTY_100_STOCKS } from './stock-universe'
import { MID_CAP_STOCKS, SMALL_CAP_STOCKS } from './full-scan-universe'

// ─── Config ───────────────────────────────────────────────────────────────────

const PIPELINE_BATCH_SIZE = 20   // stocks per runTradeFinder call
const INTER_BATCH_DELAY_MS = 500 // pause between batches to avoid Yahoo rate limiting
const NSE_EQUITY_CSV_URL  = 'https://archives.nseindia.com/content/equities/EQUITY_L.csv'
const BSE_EQUITY_API_URL  = 'https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active'

// ─── NSE Full Equity Universe ─────────────────────────────────────────────────

/**
 * Fetches ALL NSE-listed equity stocks from NSE archives.
 * CSV format: SYMBOL, NAME OF COMPANY, SERIES, DATE OF LISTING, ...
 * Filters for EQ (regular equity) series only.
 */
async function fetchNSEEquityList(): Promise<StockEntry[]> {
  try {
    const res = await fetch(NSE_EQUITY_CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.nseindia.com/',
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    return parseNSEEquityCsv(text)
  } catch (err) {
    console.warn('[pipeline] NSE EQUITY_L.csv fetch failed:', err)
    return []
  }
}

function parseNSEEquityCsv(text: string): StockEntry[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const symIdx  = headers.indexOf('symbol')
  const nameIdx = headers.indexOf('name of company')
  const serIdx  = headers.indexOf('series')

  if (symIdx === -1) return []

  const results: StockEntry[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols   = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const series = serIdx >= 0 ? cols[serIdx] : 'EQ'
    if (series !== 'EQ') continue           // skip ETFs, SME, bonds, etc.

    const symbol = cols[symIdx]?.trim()
    if (!symbol) continue

    const rawName = nameIdx >= 0 ? (cols[nameIdx] ?? '') : ''
    const name = rawName
      ? rawName.replace(/\b\w/g, c => c.toUpperCase()).slice(0, 60)
      : symbol

    const yahooSymbol = symbol.includes('&')
      ? `${symbol.replace(/&/g, '%26')}.NS`
      : undefined

    results.push({ symbol, name, yahooSymbol })
  }
  return results
}

// ─── BSE Equity Universe ──────────────────────────────────────────────────────

interface BSEScrip {
  SCRIP_CD: string   // numeric code e.g. "500325"
  Scrip_Name: string // e.g. "RELIANCE INDUSTRIES LTD"
}

/**
 * Fetches ALL active BSE equity stocks from BSE API.
 * Yahoo Finance BSE ticker = {SCRIP_CODE}.BO (e.g. "500325.BO")
 * We skip stocks already covered by NSE list (passed as `nseSymbols` set).
 */
async function fetchBSEEquityList(nseSymbols: Set<string>): Promise<StockEntry[]> {
  try {
    const res = await fetch(BSE_EQUITY_API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bseindia.com/',
      },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json: BSEScrip[] = await res.json()
    if (!Array.isArray(json) || json.length === 0) throw new Error('Empty BSE response')

    const results: StockEntry[] = []
    for (const scrip of json) {
      const code = scrip.SCRIP_CD?.trim()
      const rawName = scrip.Scrip_Name?.trim() || ''
      if (!code) continue

      // Use BSE scrip code as symbol, prefixed with 'BSE:' to avoid NSE collisions
      const symbol = `BSE:${code}`

      // Skip if same company already in NSE list (rough check by name prefix)
      // This avoids double-scanning the same company
      const name = rawName.replace(/\b\w/g, c => c.toUpperCase()).slice(0, 60) || symbol
      const yahooSymbol = `${code}.BO`

      results.push({ symbol, name, yahooSymbol })
    }

    console.info(`[pipeline] BSE equity list: ${results.length} stocks (after NSE dedup)`)
    return results
  } catch (err) {
    console.warn('[pipeline] BSE equity list fetch failed:', err)
    return []
  }
}

/**
 * Build the full scan universe:
 *  1. Live from NSE archives (all equity EQ series, ~2000+ stocks)
 *  2. Supplement with NSE index CSVs (NIFTY 100 / Midcap 150 / Smallcap 250)
 *  3. Fall back to static lists if all live sources fail
 * Deduplicates by symbol.
 */
export async function buildScanUniverse(): Promise<StockEntry[]> {
  const seen   = new Set<string>()
  const merged: StockEntry[] = []

  const addAll = (stocks: StockEntry[]) => {
    for (const s of stocks) {
      if (!seen.has(s.symbol)) {
        seen.add(s.symbol)
        merged.push(s)
      }
    }
  }

  // 1. Full NSE equity list (primary — ~2000 EQ series stocks)
  const nseEquity = await fetchNSEEquityList()
  if (nseEquity.length > 100) {
    addAll(nseEquity)
    console.info(`[pipeline] NSE EQUITY_L: ${nseEquity.length} stocks`)
  }

  // 2. Supplement from NSE index CSVs (covers any gaps in EQUITY_L)
  const [idx100, midcap, smallcap] = await Promise.allSettled([
    fetchNSEIndex('nifty100'),
    fetchNSEIndex('midcap150'),
    fetchNSEIndex('smallcap250'),
  ])
  if (idx100.status   === 'fulfilled' && idx100.value)   addAll(idx100.value.stocks)
  if (midcap.status   === 'fulfilled' && midcap.value)   addAll(midcap.value.stocks)
  if (smallcap.status === 'fulfilled' && smallcap.value) addAll(smallcap.value.stocks)

  // Track NSE symbol names for BSE dedup
  const nseSymbolSet = new Set(merged.map(s => s.symbol))

  // 3. BSE equity list (adds BSE-only listed companies)
  const bseEquity = await fetchBSEEquityList(nseSymbolSet)
  if (bseEquity.length > 0) {
    addAll(bseEquity)
    console.info(`[pipeline] BSE equity: +${bseEquity.length} additional stocks`)
  }

  // 4. Final fallback: static lists if all live sources fail
  if (merged.length < 50) {
    console.warn('[pipeline] All live sources failed — using static lists')
    addAll(NIFTY_100_STOCKS)
    addAll(MID_CAP_STOCKS)
    addAll(SMALL_CAP_STOCKS)
  }

  console.info(`[pipeline] Total scan universe: ${merged.length} stocks`)
  return merged
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

export interface ScanSessionRow {
  id: string
  scan_date: string
  status: string
  total_stocks: number
  processed_stocks: number
  signals_found: number
  error_count: number
  started_at: string
  completed_at: string | null
  meta: Record<string, unknown>
}

export async function createScanSession(
  supabase: SupabaseClient,
  scanDate: string,
  totalStocks: number
): Promise<string> {
  const { data, error } = await supabase
    .from('scan_sessions')
    .insert({ scan_date: scanDate, status: 'running', total_stocks: totalStocks })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create scan session: ${error.message}`)
  return data.id as string
}

export async function updateSessionProgress(
  supabase: SupabaseClient,
  sessionId: string,
  processed: number,
  signals: number,
  errors: number
): Promise<void> {
  await supabase
    .from('scan_sessions')
    .update({ processed_stocks: processed, signals_found: signals, error_count: errors })
    .eq('id', sessionId)
}

export async function finalizeSession(
  supabase: SupabaseClient,
  sessionId: string,
  status: 'completed' | 'partial' | 'failed',
  meta: Record<string, unknown> = {}
): Promise<void> {
  await supabase
    .from('scan_sessions')
    .update({ status, completed_at: new Date().toISOString(), meta })
    .eq('id', sessionId)
}

export async function getTodaySession(
  supabase: SupabaseClient,
  scanDate: string
): Promise<ScanSessionRow | null> {
  const { data } = await supabase
    .from('scan_sessions')
    .select('*')
    .eq('scan_date', scanDate)
    .single()
  return data ?? null
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

export interface PipelineResult {
  sessionId: string
  totalStocks: number
  processedStocks: number
  signalsFound: number
  errorCount: number
  durationMs: number
  status: 'completed' | 'partial'
}

export async function runDailyMarketScan(
  supabase: SupabaseClient,
  scanDate: string
): Promise<PipelineResult> {
  const startMs = Date.now()

  // ── 1. Build universe ─────────────────────────────────────────────────────
  const universe = await buildScanUniverse()
  const totalStocks = universe.length

  // ── 2. Create session ─────────────────────────────────────────────────────
  const sessionId = await createScanSession(supabase, scanDate, totalStocks)
  console.info(`[pipeline] Session ${sessionId} | ${totalStocks} stocks to scan`)

  // Delete any stale results for this date (idempotent re-run)
  await supabase.from('trade_finder_results').delete().eq('scan_date', scanDate)

  // ── 3. Batch processing ───────────────────────────────────────────────────
  let processedStocks = 0
  let signalsFound    = 0
  let errorCount      = 0
  const totalBatches  = Math.ceil(totalStocks / PIPELINE_BATCH_SIZE)

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batch = universe.slice(
      batchIdx * PIPELINE_BATCH_SIZE,
      (batchIdx + 1) * PIPELINE_BATCH_SIZE
    )

    // ── 3a. Fetch + run strategies ──────────────────────────────────────────
    let batchResult
    try {
      batchResult = await runTradeFinder(batch)
    } catch (err) {
      console.error(`[pipeline] Batch ${batchIdx} strategy run failed:`, err)
      errorCount++
      processedStocks += batch.length
      continue
    }

    // ── 3b. Collect all signals from this batch ────────────────────────────
    const rows: Record<string, unknown>[] = []

    const categories = [
      { key: 'strict_morning'  as const, signals: batchResult.strict_morning  },
      { key: 'general_morning' as const, signals: batchResult.general_morning },
      { key: 'candle_patterns' as const, signals: batchResult.candle_patterns },
      { key: 'long_trend'      as const, signals: batchResult.long_trend      },
      { key: 'high_volatility' as const, signals: batchResult.high_volatility },
    ]

    for (const { key, signals } of categories) {
      for (const s of signals) {
        rows.push({
          scan_date:      scanDate,
          session_id:     sessionId,
          stock_symbol:   s.symbol,
          stock_name:     s.stockName,
          exchange:       'NSE',
          strategy_type:  key === 'candle_patterns' ? 'candle_pattern' : key,
          direction:      s.direction,
          score:          s.score,
          match_info:     s.matchInfo,
          reason:         s.reason,
          price:          s.price,
          change_percent: s.changePercent,
          rank:           null,   // set after insert
        })
      }
    }

    // ── 3c. Upsert batch results to DB ─────────────────────────────────────
    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from('trade_finder_results')
        .upsert(rows, { onConflict: 'scan_date,stock_symbol,strategy_type' })

      if (insertErr) {
        console.error(`[pipeline] Batch ${batchIdx} DB insert failed:`, insertErr.message)
        errorCount++
      } else {
        signalsFound += rows.length
      }
    }

    processedStocks += batch.length

    // ── 3d. Update progress in DB every 5 batches ─────────────────────────
    if (batchIdx % 5 === 0 || batchIdx === totalBatches - 1) {
      await updateSessionProgress(supabase, sessionId, processedStocks, signalsFound, errorCount)
      console.info(
        `[pipeline] Batch ${batchIdx + 1}/${totalBatches} | ` +
        `${processedStocks}/${totalStocks} stocks | ${signalsFound} signals`
      )
    }

    // ── 3e. Rate limit guard — pause between batches ───────────────────────
    if (batchIdx < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, INTER_BATCH_DELAY_MS))
    }
  }

  // ── 4. Rank signals per strategy per day (score DESC) ────────────────────
  await rankResults(supabase, scanDate)

  // ── 5. Finalize session ───────────────────────────────────────────────────
  const durationMs = Date.now() - startMs
  const status     = processedStocks >= totalStocks ? 'completed' : 'partial'

  await finalizeSession(supabase, sessionId, status, {
    durationMs,
    processedStocks,
    signalsFound,
    errorCount,
    universeSize: totalStocks,
  })

  console.info(
    `[pipeline] ✓ ${status.toUpperCase()} | ` +
    `${processedStocks} stocks | ${signalsFound} signals | ` +
    `${errorCount} errors | ${(durationMs / 1000).toFixed(1)}s`
  )

  return { sessionId, totalStocks, processedStocks, signalsFound, errorCount, durationMs, status }
}

/**
 * Assigns rank within each strategy group for a given date (ordered by score DESC).
 */
async function rankResults(supabase: SupabaseClient, scanDate: string): Promise<void> {
  const strategies = ['strict_morning','general_morning','candle_pattern','long_trend','high_volatility']

  for (const strategy of strategies) {
    const { data } = await supabase
      .from('trade_finder_results')
      .select('id, score')
      .eq('scan_date', scanDate)
      .eq('strategy_type', strategy)
      .order('score', { ascending: false })

    if (!data || data.length === 0) continue

    // Batch-update ranks
    const updates = data.map((row, idx) => ({ id: row.id, rank: idx + 1 }))
    for (const u of updates) {
      await supabase.from('trade_finder_results').update({ rank: u.rank }).eq('id', u.id)
    }
  }
}
