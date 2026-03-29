import { NextRequest, NextResponse } from 'next/server'
import { getSegmentStocks } from '@/lib/full-scan-universe'
import type { FullScanSegment } from '@/lib/full-scan-universe'

const BATCH_SIZE = 15

/**
 * GET /api/trade-finder/segment-info?segment=large|mid|small.
 */
export async function GET(req: NextRequest) {
  const segment = req.nextUrl.searchParams.get('segment') as FullScanSegment | null
  if (!segment || !['large', 'mid', 'small'].includes(segment)) {
    return NextResponse.json({ error: 'Invalid segment' }, { status: 400 })
  }

  const stocks = getSegmentStocks(segment)
  const count = stocks.length
  const totalBatches = Math.ceil(count / BATCH_SIZE)

  return NextResponse.json({ segment, count, totalBatches })
}
