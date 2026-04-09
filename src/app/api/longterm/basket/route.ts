import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
const yahooFinance = new YahooFinance()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols')

  if (!symbolsParam) {
    return NextResponse.json({ error: 'Symbols are required' }, { status: 400 })
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().includes('.') ? s : `${s}.NS`)

  try {
    const quotes = await yahooFinance.quote(symbols)
    
    // Aggregate values
    let totalMarketCap = 0
    let totalPE = 0
    let validPECount = 0
    
    const holdings = quotes.map(q => {
      totalMarketCap += q.marketCap || 0
      if (q.trailingPE) {
        totalPE += q.trailingPE
        validPECount++
      }
      
      return {
        symbol: q.symbol.replace('.NS', ''),
        name: q.longName || q.shortName || q.symbol,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChangePercent || 0,
        marketCap: q.marketCap || 0,
        pe: q.trailingPE || 0
      }
    })

    const avgPE = validPECount > 0 ? totalPE / validPECount : 0

    return NextResponse.json({
      basketCap: totalMarketCap,
      avgPE: Number(avgPE.toFixed(2)),
      holdings
    })

  } catch (error: any) {
    console.error('Portfolio Engine Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
