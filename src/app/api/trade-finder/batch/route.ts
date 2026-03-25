import { NextRequest, NextResponse } from 'next/server'
import { runTradeFinder } from '@/lib/trade-strategies'
import { getSegmentStocks } from '@/lib/full-scan-universe'
import type { FullScanSegment } from '@/lib/full-scan-universe'

// Per-segment batch caches: segment → batchIndex → result
const batchCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 8 * 60 * 1000 // 8 minutes

const BATCH_SIZE = 15

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { segment, batchIndex, sessionId } = body as {
      segment: FullScanSegment
      batchIndex: number
      sessionId: string
    }

    if (!segment || batchIndex === undefined || !sessionId) {
      return NextResponse.json({ error: 'Missing segment, batchIndex or sessionId' }, { status: 400 })
    }

    const cacheKey = `${segment}:${batchIndex}:${sessionId}`
    const cached = batchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } })
    }

    const allStocks = getSegmentStocks(segment)
    const batchStocks = allStocks.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE)

    if (batchStocks.length === 0) {
      return NextResponse.json(
        { strict_morning: [], general_morning: [], candle_patterns: [], long_trend: [], high_volatility: [], scannedAt: new Date().toISOString(), totalScanned: 0 },
        { headers: { 'X-Batch-Empty': '1' } }
      )
    }

    const result = await runTradeFinder(batchStocks)
    batchCache.set(cacheKey, { data: result, timestamp: Date.now() })

    // Prune stale cache entries to avoid memory leak
    if (batchCache.size > 500) {
      const now = Date.now()
      for (const [key, val] of batchCache) {
        if (now - val.timestamp > CACHE_TTL) batchCache.delete(key)
      }
    }

    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } })
  } catch (error) {
    console.error('[trade-finder/batch] error:', error)
    return NextResponse.json({ error: 'Batch scan failed' }, { status: 500 })
  }
}
