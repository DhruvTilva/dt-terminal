import { NextRequest, NextResponse } from 'next/server'
import { fetchIndices, fetchStocks, getMarketStatus } from '@/lib/stocks'
import { detectOpportunities } from '@/lib/intelligence'

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') || 'stocks'
  const symbols = request.nextUrl.searchParams.get('symbols')

  try {
    switch (type) {
      case 'indices':
        const indices = await fetchIndices()
        return NextResponse.json(indices)

      case 'stocks':
        const symbolList = symbols ? symbols.split(',') : undefined
        const stocks = await fetchStocks(symbolList)
        return NextResponse.json(stocks)

      case 'market-status':
        return NextResponse.json(getMarketStatus())

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Stocks API error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')

  if (type === 'opportunities') {
    try {
      const { stocks, news } = await request.json()
      const opportunities = detectOpportunities(stocks, news)
      return NextResponse.json(opportunities)
    } catch (error) {
      console.error('Opportunities API error:', error)
      return NextResponse.json({ error: 'Failed to detect opportunities' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
