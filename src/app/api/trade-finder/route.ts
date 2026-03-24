import { NextResponse } from 'next/server'
import { runTradeFinder } from '@/lib/trade-strategies'
import { NIFTY_100_STOCKS } from '@/lib/stock-universe'

// In-memory cache — avoids rescanning on every request (5-min TTL)
let cache: { data: unknown; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    const result = await runTradeFinder(NIFTY_100_STOCKS)
    cache = { data: result, timestamp: Date.now() }

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (error) {
    console.error('[trade-finder] scan failed:', error)
    return NextResponse.json({ error: 'Scan failed. Please retry.' }, { status: 500 })
  }
}
