import { NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
const yahooFinance = new YahooFinance()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolParam = searchParams.get('symbol')

  if (!symbolParam) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  try {
    const symbol = symbolParam.includes('.') ? symbolParam : `${symbolParam}.NS`

    // Fetch quote, summary, and 3-year chart for historical P/E band
    const quote = await yahooFinance.quote(symbol)
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ['financialData', 'defaultKeyStatistics']
    }).catch(() => null)
    
    // Fetch monthly chart for last 3 years to build P/E history
    const date3YearsAgo = new Date()
    date3YearsAgo.setFullYear(date3YearsAgo.getFullYear() - 3)
    const chart = await yahooFinance.chart(symbol, {
      period1: date3YearsAgo,
      interval: '1mo'
    }).catch(() => null)

    if (!quote || !summary) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 })
    }

    const { financialData: fd, defaultKeyStatistics: ks } = summary
    const getVal = (obj: any, key: string, fallback: any = 0) => (obj && obj[key] !== undefined && obj[key] !== null) ? obj[key] : fallback;

    const price = quote.regularMarketPrice || 0
    const marketCap = quote.marketCap || 0
    const trailingPE = getVal(ks, 'trailingPE', getVal(quote, 'trailingPE', 0))
    const eps = getVal(ks, 'trailingEps', getVal(quote, 'epsTrailingTwelveMonths', 0))
    const earningsGrowth = getVal(fd, 'earningsGrowth', 0) // fraction

    // 1. PEG Ratio
    let pegRatio = getVal(ks, 'pegRatio', 0)
    if (!pegRatio && trailingPE && earningsGrowth > 0) {
      pegRatio = trailingPE / (earningsGrowth * 100)
    }

    // 2. Price to FCF
    let fcf = getVal(fd, 'freeCashflow', 0)
    let priceToFCF = fcf > 0 ? marketCap / fcf : 0

    // 3. DCF
    // Very simple 10-year DCF model using current FCF
    // If fcf is negative or zero, we fallback to net income or a proxy
    const baseFcf = fcf > 0 ? fcf : (getVal(fd, 'operatingCashflow', getVal(quote, 'netIncomeToCommon', 0)))
    const terminalGrowth = 0.04
    const outstandingShares = getVal(ks, 'sharesOutstanding', quote.sharesOutstanding || 1)

    const calculateDCF = (growthRate: number, discountRate: number) => {
      if (baseFcf <= 0 || outstandingShares <= 0) return 0
      let value = 0
      let currentFcf = baseFcf
      for (let i = 1; i <= 10; i++) {
        currentFcf *= (1 + growthRate)
        value += currentFcf / Math.pow(1 + discountRate, i)
      }
      const terminalValue = (currentFcf * (1 + terminalGrowth)) / (discountRate - terminalGrowth)
      value += terminalValue / Math.pow(1 + discountRate, 10)
      return value / outstandingShares
    }

    const bearBase = calculateDCF(0.08, 0.12)
    const baseBase = calculateDCF(0.15, 0.12)
    const bullBase = calculateDCF(0.22, 0.12)

    // Historical P/E Band
    const peHistory = []
    let minPE = Infinity
    let maxPE = -Infinity
    let sumPE = 0

    if (chart?.quotes && eps > 0) {
      for (const q of chart.quotes) {
        if (q.close) {
          const histPE = q.close / eps // Rough assumption: trailing EPS stays constant as a proxy, since free API lacks true historical EPS
          peHistory.push({
            date: q.date.toISOString(),
            pe: Number(histPE.toFixed(1))
          })
          if (histPE < minPE) minPE = histPE
          if (histPE > maxPE) maxPE = histPE
          sumPE += histPE
        }
      }
    }
    const avgPE = peHistory.length > 0 ? sumPE / peHistory.length : trailingPE

    // Verdict
    let verdict = 'Fair Value 🟡'
    let score = 50 // 0 = cheap, 100 = expensive
    
    if (bearBase > 0) {
      if (price < bearBase) {
        verdict = 'Deep Value 🟢'
        score = 20
      } else if (price > bullBase) {
        verdict = 'Overvalued 🔴'
        score = 85
      } else {
        score = 50 + ((price - baseBase) / (bullBase - bearBase) * 30) // Scale nicely
      }
    } else {
      // Fallback relative valuation if DCF fails (e.g. no cashflow)
      if (pegRatio > 2 || (priceToFCF > 25 && priceToFCF !== 0)) score = 80
      else if ((pegRatio > 0 && pegRatio < 1) || (priceToFCF > 0 && priceToFCF < 15)) score = 20
      verdict = score > 70 ? 'Overvalued 🔴' : score < 30 ? 'Deep Value 🟢' : 'Fair Value 🟡'
    }

    // Explanation
    let explanation = `Currently trading at ₹${price.toFixed(2)}, which is `
    if (score < 30) explanation += 'below our bear-case intrinsic value.'
    else if (score > 70) explanation += 'above our bull-case intrinsic value.'
    else explanation += 'within the fair value range of our DCF models.'

    return NextResponse.json({
      price,
      pegRatio,
      priceToFCF,
      dcf: {
        bear: Math.round(bearBase),
        base: Math.round(baseBase),
        bull: Math.round(bullBase)
      },
      historicalPE: {
        current: trailingPE,
        min: minPE === Infinity ? 0 : minPE,
        max: maxPE === -Infinity ? 0 : maxPE,
        avg: avgPE,
        history: peHistory
      },
      verdict,
      score: Math.min(100, Math.max(0, score)),
      explanation
    })

  } catch (error: any) {
    console.error('Valuation Engine Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
