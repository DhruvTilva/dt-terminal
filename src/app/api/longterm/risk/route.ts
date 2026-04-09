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

    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ['financialData', 'defaultKeyStatistics', 'incomeStatementHistory']
    }).catch(() => null)

    if (!summary) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 })
    }

    const { financialData: fd, defaultKeyStatistics: ks, incomeStatementHistory: is } = summary
    const getVal = (obj: any, key: string, fallback: any = 0) => (obj && obj[key] !== undefined && obj[key] !== null) ? obj[key] : fallback;

    const risks = []

    // 1. Debt Risk
    const debtToEquity = getVal(fd, 'debtToEquity', 0) / 100
    if (debtToEquity > 1.5) {
      risks.push({ category: 'Debt', type: 'High', message: `High Debt-to-Equity Ratio (${debtToEquity.toFixed(2)})` })
    } else if (debtToEquity > 0.8) {
      risks.push({ category: 'Debt', type: 'Medium', message: `Moderate Debt-to-Equity Ratio (${debtToEquity.toFixed(2)})` })
    } else {
      risks.push({ category: 'Debt', type: 'Safe', message: `Healthy Debt Levels (${debtToEquity.toFixed(2)})` })
    }

    // 2. Liquidity Risk (Current Ratio)
    let currentRatio = getVal(fd, 'currentRatio', 0)
    // If Yahoo is missing it, we try to use quick ratio
    if (!currentRatio) currentRatio = getVal(fd, 'quickRatio', 1.5) // Default safe if completely unknown
    
    if (currentRatio > 0 && currentRatio < 1) {
      risks.push({ category: 'Liquidity', type: 'High', message: `Current Ratio < 1 (${currentRatio.toFixed(2)}). Potential short-term liquidity issues.` })
    } else if (currentRatio >= 1 && currentRatio < 1.5) {
      risks.push({ category: 'Liquidity', type: 'Medium', message: `Average Liquidity. Current Ratio: ${currentRatio.toFixed(2)}` })
    } else {
      risks.push({ category: 'Liquidity', type: 'Safe', message: `Strong Liquidity. Current Ratio: ${currentRatio.toFixed(2)}` })
    }

    // 3. Volatility Risk (Beta)
    const beta = getVal(ks, 'beta', 1)
    if (beta > 1.5) {
      risks.push({ category: 'Volatility', type: 'High', message: `High Beta (${beta.toFixed(2)}). Stock is highly volatile compared to NIFTY.` })
    } else if (beta > 1.1) {
      risks.push({ category: 'Volatility', type: 'Medium', message: `Slightly Above Market Volatility (Beta: ${beta.toFixed(2)})` })
    } else {
      risks.push({ category: 'Volatility', type: 'Safe', message: `Low Volatility (Beta: ${beta.toFixed(2)})` })
    }

    // 4. Earnings / Profit Risk
    const statements = is?.incomeStatementHistory || []
    if (statements.length >= 3) {
      const y1 = getVal(statements[0], 'netIncome', 0)
      const y2 = getVal(statements[1], 'netIncome', 0)
      const y3 = getVal(statements[2], 'netIncome', 0)
      
      if (y1 < y2 && y2 < y3) {
        risks.push({ category: 'Earnings', type: 'High', message: 'Net profit has dropped for 2 consecutive years.' })
      } else if (y1 < 0) {
        risks.push({ category: 'Earnings', type: 'High', message: 'Company is currently posting net losses.' })
      } else {
        risks.push({ category: 'Earnings', type: 'Safe', message: 'Earnings trend is stable or growing.' })
      }
    } else {
       risks.push({ category: 'Earnings', type: 'Safe', message: 'Standard earnings profile (insufficient historical span for decline check).' })
    }

    // General Risk Score
    let riskScore = 0 // 100 = Max Risk
    risks.forEach(r => {
      if (r.type === 'High') riskScore += 30
      else if (r.type === 'Medium') riskScore += 15
    })
    riskScore = Math.min(100, riskScore)

    let finalVerdict = 'Safe / Low Risk 🟢'
    if (riskScore > 60) finalVerdict = 'High Risk 🔴'
    else if (riskScore > 30) finalVerdict = 'Moderate Risk 🟡'

    return NextResponse.json({
      symbol: symbolParam,
      verdict: finalVerdict,
      score: riskScore,
      flags: risks,
      beta,
      debtToEquity,
      currentRatio
    })

  } catch (error: any) {
    console.error('Risk Radar Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
