/**
 * auto-alerts.ts
 * Smart auto-alert detection engine.
 * Scans news + stock data and inserts global notifications into DB.
 * Called by /api/cron/auto-alerts — NOT by any frontend code.
 */

import { getServiceClient } from '@/lib/supabase/service'
import type { NewsItem, Stock } from '@/types'

type AlertCategory = 'insider' | 'bulk' | 'fii' | 'pump_dump' | 'promoter_selling' | 'weak_fundamentals'

interface PendingAlert {
  stock_symbol: string | null
  message: string
  category: AlertCategory
}

// ── Detection patterns ────────────────────────────────────────────────────
const P_BULK_DEAL      = /bulk deal|block deal/i
const P_INSIDER_BUY    = /insider buy|promoter buy|promoter increas|promoter acqui/i
const P_PROMOTER_SELL  = /promoter sell|promoter reduc|insider sell|promoter divest/i
const P_FII_ACTIVITY   = /fii (heavy|large|massive|record|significant)|dii (heavy|large|record)|foreign institutional.*(?:buy|sell)|fpi (?:buy|sell)/i
const P_WEAK_FUNDS     = /heavy loss|net loss (?:widen|increas|jump)|continuous loss|insolvency|npa (?:rise|increas)|debt default|financial stress/i

// ── Deduplication window (hours) ─────────────────────────────────────────
const DEDUP_HOURS = 12  // 12h prevents same alert repeating in the same trading day

/**
 * Main entry point.
 * Receives already-fetched news + stocks (no re-fetching here for efficiency).
 * Returns count of new alerts inserted.
 */
export async function generateAutoAlerts(news: NewsItem[], stocks: Stock[]): Promise<number> {
  const service = getServiceClient()

  // Fetch existing alerts in the dedup window to avoid spam
  const cutoff = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000).toISOString()
  const { data: recent } = await service
    .from('notifications')
    .select('stock_symbol, category')
    .eq('type', 'auto')
    .gte('created_at', cutoff)

  // Build a Set of "symbol::category" keys already alerted recently
  const alerted = new Set<string>(
    (recent || []).map(r => `${r.stock_symbol ?? '_'}::${r.category}`)
  )

  const pending: PendingAlert[] = []

  // ── 1. NEWS-BASED ALERTS ────────────────────────────────────────────────
  for (const article of news) {
    const text   = `${article.title} ${article.summary}`
    const symbol = article.relatedStocks?.[0] ?? null

    // Bulk / block deal
    if (P_BULK_DEAL.test(text) && symbol) {
      const key = `${symbol}::bulk`
      if (!alerted.has(key)) {
        pending.push({
          stock_symbol: symbol,
          message: `📊 Bulk deal detected in ${symbol} — high institutional activity`,
          category: 'bulk',
        })
        alerted.add(key)
      }
    }

    // Promoter / insider buying
    if (P_INSIDER_BUY.test(text) && symbol) {
      const key = `${symbol}::insider`
      if (!alerted.has(key)) {
        pending.push({
          stock_symbol: symbol,
          message: `🏢 Promoter/insider buying in ${symbol} — potentially bullish signal`,
          category: 'insider',
        })
        alerted.add(key)
      }
    }

    // Promoter selling (separate from insider buy — opposite signal)
    if (P_PROMOTER_SELL.test(text) && symbol) {
      const key = `${symbol}::promoter_selling`
      if (!alerted.has(key)) {
        pending.push({
          stock_symbol: symbol,
          message: `⚠️ Promoter stake reduced in ${symbol} — possible negative signal`,
          category: 'promoter_selling',
        })
        alerted.add(key)
      }
    }

    // FII / DII heavy activity
    if (P_FII_ACTIVITY.test(text)) {
      const key = `${symbol ?? '_'}::fii`
      if (!alerted.has(key)) {
        const isSell = /sell|exit|outflow/i.test(text)
        const dir    = isSell ? 'selling' : 'buying'
        const emoji  = isSell ? '📉' : '📈'
        pending.push({
          stock_symbol: symbol,
          message: `🏦 FII/DII heavy ${dir}${symbol ? ` in ${symbol}` : ' detected'} — ${emoji} ${isSell ? 'bearish' : 'bullish'} signal`,
          category: 'fii',
        })
        alerted.add(key)
      }
    }

    // Weak fundamentals warning
    if (P_WEAK_FUNDS.test(text) && symbol) {
      const key = `${symbol}::weak_fundamentals`
      if (!alerted.has(key)) {
        pending.push({
          stock_symbol: symbol,
          message: `📉 Weak fundamentals alert for ${symbol} — exercise caution`,
          category: 'weak_fundamentals',
        })
        alerted.add(key)
      }
    }
  }

  // ── 2. PUMP & DUMP DETECTION (from stock price + volume data) ──────────
  for (const stock of stocks) {
    if (!stock.avgVolume || stock.avgVolume === 0) continue

    const volRatio       = stock.volume / stock.avgVolume
    const isVolumeSpike  = volRatio >= 3          // 3× avg volume
    const isPriceExtreme = Math.abs(stock.changePercent) >= 7  // ≥7% move

    if (isVolumeSpike && isPriceExtreme) {
      const key = `${stock.symbol}::pump_dump`
      if (!alerted.has(key)) {
        const dir    = stock.changePercent > 0 ? 'surge' : 'crash'
        const sign   = stock.changePercent > 0 ? '+' : ''
        const pct    = `${sign}${stock.changePercent.toFixed(1)}%`
        const volX   = volRatio.toFixed(1)
        pending.push({
          stock_symbol: stock.symbol,
          message: `🚨 Unusual ${dir} in ${stock.symbol} (${pct}, vol ${volX}× avg) — trade with caution`,
          category: 'pump_dump',
        })
        alerted.add(key)
      }
    }
  }

  if (pending.length === 0) return 0

  // ── Insert all alerts as global (user_id = null) ───────────────────────
  const { error } = await service
    .from('notifications')
    .insert(
      pending.map(p => ({
        user_id:      null,
        stock_symbol: p.stock_symbol,
        message:      p.message,
        type:         'auto',
        category:     p.category,
        is_read:      false,
      }))
    )

  if (error) {
    console.error('[AUTO-ALERTS] DB insert error:', error.message)
    return 0
  }

  console.log(`[AUTO-ALERTS] Inserted ${pending.length} new alerts`)
  return pending.length
}
