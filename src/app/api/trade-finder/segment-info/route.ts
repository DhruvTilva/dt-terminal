import { NextRequest, NextResponse } from 'next/server'
import { getSegmentStocksLive } from '@/lib/full-scan-universe'
import type { FullScanSegment } from '@/lib/full-scan-universe'
import { BATCH_SIZE } from '@/app/api/trade-finder/batch/route'

/**
 * GET /api/trade-finder/segment-info?segment=large|mid|small
 *
 * Returns the live stock count + batch count for a segment.
 * Triggers NSE CSV fetch/cache warm-up.
 * Used by the page to show accurate progress totals before Full Scan starts.
 */
export async function GET(req: NextRequest) {
  const segment = req.nextUrl.searchParams.get('segment') as FullScanSegment | null
  if (!segment || !['large', 'mid', 'small'].includes(segment)) {
    return NextResponse.json({ error: 'Invalid segment' }, { status: 400 })
  }

  const stocks = await getSegmentStocksLive(segment)
  const count = stocks.length
  const totalBatches = Math.ceil(count / BATCH_SIZE)

  return NextResponse.json({
    segment,
    count,
    totalBatches,
    source: 'live', // may be 'cache' or 'fallback' internally — this is fine
  })
}
