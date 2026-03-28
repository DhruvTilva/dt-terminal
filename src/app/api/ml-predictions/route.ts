import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await client
      .from('ml_predictions')
      .select('stock_symbol, predicted_direction, confidence, model_accuracy')
      .eq('prediction_date', today)

    if (error) throw error

    // Return as symbol → prediction map for O(1) UI lookup
    const map: Record<string, { direction: string; confidence: number; accuracy: number }> = {}
    for (const row of data ?? []) {
      map[row.stock_symbol] = {
        direction: row.predicted_direction,
        confidence: row.confidence,
        accuracy: row.model_accuracy,
      }
    }

    return NextResponse.json(map)
  } catch {
    // Silent fail — returns empty map if table not created yet or any error
    return NextResponse.json({})
  }
}
