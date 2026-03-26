import { NextRequest, NextResponse } from 'next/server'

interface YFQuote {
  symbol: string
  shortname?: string
  longname?: string
  quoteType?: string
  typeDisp?: string
  exchDisp?: string
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 1) return NextResponse.json([])

  try {
    const url =
      `https://query1.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(q)}&lang=en-US&region=IN` +
      `&quotesCount=12&newsCount=0&enableFuzzyQuery=false`

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) return NextResponse.json([])

    const data = await res.json()
    // Yahoo Finance returns { quotes: [...] } or { finance: { result: [{ quotes: [...] }] } }
    const quotes: YFQuote[] =
      data?.quotes ||
      data?.finance?.result?.[0]?.quotes ||
      []

    const results = quotes
      .filter(
        (item) =>
          (item.quoteType === 'EQUITY' || item.typeDisp === 'Equity') &&
          (item.symbol?.endsWith('.NS') || item.symbol?.endsWith('.BO'))
      )
      .map((item) => ({
        symbol: item.symbol.replace(/\.(NS|BO)$/, ''),
        name:
          item.shortname ||
          item.longname ||
          item.symbol.replace(/\.(NS|BO)$/, ''),
        exchange: item.symbol.endsWith('.NS') ? 'NSE' : ('BSE' as 'NSE' | 'BSE'),
      }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
