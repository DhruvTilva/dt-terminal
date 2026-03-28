import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Join trade_finder_results with ml_predictions to get win rate per strategy
    // A "win" = ml_predictions.was_correct = true for that symbol+date
    const { data, error } = await client.rpc('get_strategy_win_rates')

    if (error) {
      // Fallback: raw query if RPC not available
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)

      const { data: raw, error: rawErr } = await client
        .from('trade_finder_results')
        .select('strategy_type, stock_symbol, scan_date')
        .gte('scan_date', cutoff.toISOString().split('T')[0])

      if (rawErr) throw rawErr

      // Fetch graded predictions for same period
      const { data: preds, error: predErr } = await client
        .from('ml_predictions')
        .select('stock_symbol, prediction_date, was_correct')
        .gte('prediction_date', cutoff.toISOString().split('T')[0])
        .not('was_correct', 'is', null)

      if (predErr) throw predErr

      // Build lookup: "SYMBOL_DATE" -> was_correct
      const lookup: Record<string, boolean> = {}
      for (const p of (preds ?? [])) {
        lookup[`${p.stock_symbol}_${p.prediction_date}`] = p.was_correct
      }

      // Aggregate per strategy
      const totals: Record<string, { total: number; correct: number }> = {}
      for (const row of (raw ?? [])) {
        const key = row.strategy_type
        if (!totals[key]) totals[key] = { total: 0, correct: 0 }
        const lookupKey = `${row.stock_symbol}_${row.scan_date}`
        if (lookupKey in lookup) {
          totals[key].total++
          if (lookup[lookupKey]) totals[key].correct++
        }
      }

      const result: Record<string, number | null> = {}
      for (const [strategy, { total, correct }] of Object.entries(totals)) {
        result[strategy] = total >= 10
          ? Math.round((correct / total) * 1000) / 10
          : null
      }

      return NextResponse.json(result)
    }

    return NextResponse.json(data ?? {})
  } catch {
    return NextResponse.json({})
  }
}
