import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
const yahooFinance = new YahooFinance()

function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50
  
  let gains = 0
  let losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  
  let avgGain = gains / period
  let avgLoss = losses / period
  
  if (avgLoss === 0) return 100
  let rs = avgGain / avgLoss
  let rsi = 100 - (100 / (1 + rs))

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    if (avgLoss === 0) {
      rsi = 100
    } else {
      rs = avgGain / avgLoss
      rsi = 100 - (100 / (1 + rs))
    }
  }
  return rsi
}

function calculateSMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0
  const slice = closes.slice(closes.length - period)
  return slice.reduce((acc, val) => acc + val, 0) / period
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolParam = searchParams.get('symbol')

  if (!symbolParam) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  try {
    const symbol = symbolParam.includes('.') ? symbolParam : `${symbolParam}.NS`

    // Fetch ~1.5 years of daily data to ensure a smooth 200 DMA calculation
    const end = new Date()
    const start = new Date()
    start.setFullYear(start.getFullYear() - 1)
    start.setMonth(start.getMonth() - 5) // 17 months ago

    const chart = await yahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval: '1d'
    }).catch(() => null)

    if (!chart || !chart.quotes || chart.quotes.length === 0) {
      return NextResponse.json({ error: 'Chart data not found' }, { status: 404 })
    }

    const quotes = chart.quotes.filter(q => q.close !== null) as { close: number, volume: number }[]
    const closes = quotes.map(q => q.close)
    const currentPrice = closes[closes.length - 1]

    if (closes.length < 50) {
      return NextResponse.json({ error: 'Not enough data for entry analysis' }, { status: 400 })
    }

    // Technical Indicators
    const rsi14 = calculateRSI(closes, 14)
    const sma50 = calculateSMA(closes, 50)
    const sma200 = calculateSMA(closes, 200)

    // Entry Logic
    let verdict = 'Neutral Zone 🟡'
    let score = 50 // 0 = Overbought, 100 = Oversold (Deep Value entry)
    let action = 'Systematic accumulation is fine. No extreme signals.'

    const distFrom200DMA = ((currentPrice - sma200) / sma200) * 100

    if (rsi14 > 70) {
      verdict = 'Overheated 🔴'
      score = 20
      action = 'Stock is technically overbought. Wait for a cooling off period or dip before deploying large capital.'
    } else if (distFrom200DMA > 30) {
      verdict = 'Overextended 🔴'
      score = 30
      action = 'Price has run up significantly above its 200-Day Moving Average. Risk of mean reversion is high.'
    } else if (rsi14 < 35 && currentPrice > sma200) {
      verdict = 'Dip Buy Zone 🟢'
      score = 80
      action = 'Stock is in a long-term uptrend (Above 200 DMA) but technically oversold short-term. Great entry.'
    } else if (currentPrice < sma200 && currentPrice > sma200 * 0.9 && rsi14 < 45) {
      verdict = 'Deep Value Entry 🟢'
      score = 90
      action = 'Price is pulling back near/slightly below its 200 DMA with low momentum. Excellent long-term accumulation point.'
    } else if (currentPrice < sma200 * 0.8) {
      verdict = 'Falling Knife ⚠️'
      score = 40
      action = 'Deep under 200 DMA. Could be a turnaround play, but ensure fundamental thesis is completely intact before buying.'
    }

    return NextResponse.json({
      symbol: symbolParam,
      currentPrice: Number(currentPrice.toFixed(2)),
      indicators: {
        rsi14: Number(rsi14.toFixed(1)),
        sma50: Number(sma50.toFixed(2)),
        sma200: Number(sma200.toFixed(2)),
        distFrom200DMA: Number(distFrom200DMA.toFixed(2))
      },
      verdict,
      score,
      action
    })

  } catch (error: any) {
    console.error('Entry Timing Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
