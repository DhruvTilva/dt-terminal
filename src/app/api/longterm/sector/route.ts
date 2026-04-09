import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
const yahooFinance = new YahooFinance()

const SECTOR_INDEX_MAP: Record<string, string> = {
  'Technology': '^CNXIT', // Nifty IT
  'Financial Services': '^NSEBANK', // Bank Nifty
  'Consumer Defensive': '^CNXFMCG', // Nifty FMCG
  'Healthcare': '^CNXPHARMA', // Nifty Pharma
  'Basic Materials': '^CNXMETAL', // Nifty Metal
  'Consumer Cyclical': '^CNXAUTO', // Nifty Auto
  'Energy': '^CNXENERGY', // Nifty Energy
  'Industrials': '^CNXINFRA', // Nifty Infra
  'Real Estate': '^CNXREALTY', // Nifty Realty
}

async function getReturn(symbol: string, periodDays: number): Promise<number> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - periodDays)
  
  try {
    const chart = await yahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval: '1d'
    })
    const quotes = chart.quotes || []
    if (quotes.length < 2) return 0
    
    // Find first valid close and last valid close
    const first = quotes.find(q => q.close !== null)?.close || 1
    const last = quotes.slice().reverse().find(q => q.close !== null)?.close || 1
    
    return ((last - first) / first) * 100
  } catch {
    return 0
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolParam = searchParams.get('symbol')

  if (!symbolParam) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  try {
    const symbol = symbolParam.includes('.') ? symbolParam : `${symbolParam}.NS`

    // Fetch sector
    const summary = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile'] }).catch(() => null)
    const sectorName = summary?.assetProfile?.sector || 'Unknown'

    // Map sector name or fallback
    let indexSymbol = SECTOR_INDEX_MAP[sectorName]
    let isMapped = true
    if (!indexSymbol) {
      indexSymbol = '^NSEI' // default to broader market for comparison if unknown
      isMapped = false
    }

    // 1 Month = ~30 days, 3 Months = ~90 days, 6 Months = ~180 days
    const periods = [
      { label: '1M', days: 30 },
      { label: '3M', days: 90 },
      { label: '6M', days: 180 }
    ]

    const [niftyReturns, sectorReturns] = await Promise.all([
      Promise.all(periods.map(p => getReturn('^NSEI', p.days))),
      Promise.all(periods.map(p => getReturn(indexSymbol!, p.days)))
    ])

    const performance = periods.map((p, idx) => ({
      period: p.label,
      nifty: niftyReturns[idx],
      sector: sectorReturns[idx]
    }))

    // Determine Sector Phase
    const timeframe3M = performance[1]
    const diff = timeframe3M.sector - timeframe3M.nifty
    
    let phase = 'Neutral'
    let phaseDesc = 'Tracking broader market.'
    let color = 'yellow'

    if (isMapped) {
      if (timeframe3M.sector > 0 && diff > 0) {
        phase = 'Leading 🔥'
        phaseDesc = `Top performing sector, outperforming NIFTY by ${diff.toFixed(2)}% over 3M.`
        color = 'green'
      } else if (timeframe3M.sector < 0 && diff < 0) {
        phase = 'Lagging ❄️'
        phaseDesc = `Underperforming broader market, trailing NIFTY by ${Math.abs(diff).toFixed(2)}% over 3M.`
        color = 'red'
      } else if (timeframe3M.sector > 0 && diff < 0) {
        phase = 'Weakening 📉'
        phaseDesc = 'Absolute returns are positive, but losing momentum against the index.'
        color = 'yellow'
      } else {
        phase = 'Improving 📈'
        phaseDesc = 'Absolute returns negative, but showing relative strength against NIFTY.'
        color = 'blue'
      }
    } else {
      phase = 'N/A'
      phaseDesc = 'Sector mapping unavailable. Metrics reflect broader market.'
    }

    return NextResponse.json({
      sector: sectorName,
      mappedIndex: indexSymbol,
      performance,
      phase,
      phaseDesc,
      color
    })

  } catch (error: any) {
    console.error('Sector Engine Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
