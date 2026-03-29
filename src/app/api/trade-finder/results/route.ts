import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'

export const revalidate = 0

/**
 * GET /api/trade-finder/results
 * Query params:
 *   ?strategy=all|strict_morning|general_morning|candle_pattern|long_trend|high_volatility
 *   ?direction=all|bullish|bearish
 *   ?limit=50  (per strategy, default 50)
 *
 * Returns precomputed trade signals from the latest completed daily scan.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const strategy  = searchParams.get('strategy')  || 'all'
  const direction = searchParams.get('direction') || 'all'
  const limit     = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

  let supabase
  try {
    supabase = getServiceClient()
  } catch {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  // ── Find latest completed session ──────────────────────────────────────────
  const { data: session, error: sessErr } = await supabase
    .from('scan_sessions')
    .select('*')
    .eq('status', 'completed')
    .order('scan_date', { ascending: false })
    .limit(1)
    .single()

  if (sessErr || !session) {
    return NextResponse.json(
      { error: 'No completed scan available yet', results: [], session: null },
      { status: 404 }
    )
  }

  // ── Query results ──────────────────────────────────────────────────────────
  const STRATEGIES = ['strict_morning', 'general_morning', 'candle_pattern', 'long_trend', 'high_volatility']
  const targetStrategies = strategy === 'all' ? STRATEGIES : [strategy]

  const grouped: Record<string, unknown[]> = {}

  for (const strat of targetStrategies) {
    let q = supabase
      .from('trade_finder_results')
      .select('id, stock_symbol, stock_name, exchange, strategy_type, direction, score, match_info, reason, price, change_percent, rank')
      .eq('scan_date', session.scan_date)
      .eq('strategy_type', strat)
      .order('rank', { ascending: true })
      .limit(limit)

    if (direction !== 'all') {
      q = q.eq('direction', direction)
    }

    const { data, error } = await q

    if (error) {
      console.error(`[results] Query failed for ${strat}:`, error.message)
      grouped[strat] = []
    } else {
      grouped[strat] = data ?? []
    }
  }

  const totalSignals = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)

  return NextResponse.json({
    session: {
      scanDate:        session.scan_date,
      status:          session.status,
      totalStocks:     session.total_stocks,
      processedStocks: session.processed_stocks,
      signalsFound:    session.signals_found,
      completedAt:     session.completed_at,
    },
    results:       grouped,
    totalSignals,
    generatedAt:   session.completed_at,
  })
}
