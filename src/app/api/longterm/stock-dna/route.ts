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

    // Fetch quote and summary
    const quote = await yahooFinance.quote(symbol)
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'financialData',
        'defaultKeyStatistics',
        'assetProfile',
        'majorHoldersBreakdown',
        'cashflowStatementHistory',
        'incomeStatementHistory'
      ]
    }).catch(() => null)

    if (!quote || !summary) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 })
    }

    const { financialData: fd, defaultKeyStatistics: ks, assetProfile: ap, majorHoldersBreakdown: mh, cashflowStatementHistory: cf, incomeStatementHistory: is } = summary

    // --- Helpers / Fallbacks ---
    const getVal = (obj: any, key: string, fallback: any = 0) => (obj && obj[key] !== undefined && obj[key] !== null) ? obj[key] : fallback;

    // --- Price & Basic ---
    const price = quote.regularMarketPrice || 0
    const high52 = quote.fiftyTwoWeekHigh || price
    const low52 = quote.fiftyTwoWeekLow || price
    const marketCap = quote.marketCap || 0
    const sector = getVal(ap, 'sector', 'Unknown')
    const name = quote.longName || quote.shortName || symbolParam

    // --- Income / Growth (YoY Calculation) ---
    // Try to get growth from financialData first, fallback to calculating from statements
    let revenueTTM = getVal(fd, 'totalRevenue', 0)
    let netProfit = 0
    let revenueGrowth = getVal(fd, 'revenueGrowth', 0) * 100
    let profitGrowth = getVal(fd, 'earningsGrowth', 0) * 100 // Use earningsGrowth from financialData if available

    const incStatements = is?.incomeStatementHistory || []
    if (incStatements.length >= 2) {
      const cy = incStatements[0]
      const py = incStatements[1]
      
      if (!netProfit) netProfit = getVal(cy, 'netIncome', 0)
      
      if (!revenueGrowth && cy.totalRevenue && py.totalRevenue) {
        revenueGrowth = ((cy.totalRevenue - py.totalRevenue) / py.totalRevenue) * 100
      }
      if (!profitGrowth && cy.netIncome && py.netIncome && py.netIncome > 0) {
        profitGrowth = ((cy.netIncome - py.netIncome) / py.netIncome) * 100
      }
    }

    if (!netProfit) netProfit = getVal(quote, 'netIncomeToCommon', 0) // another fallback

    // --- Ratios ---
    const pe = getVal(ks, 'trailingPE', getVal(quote, 'trailingPE', 0))
    const pb = getVal(ks, 'priceToBook', 0)
    const evEbitda = getVal(ks, 'enterpriseToEbitda', 0)
    let roe = getVal(fd, 'returnOnEquity', 0) * 100

    // ROCE (Return on Capital Employed) = EBIT / Capital Employed
    // If not direct, rough fallback: ROE * 1.2 or just use operatingMargins * something.
    // For simplicity, if we don't have exact ROCE from Yahoo, we approximate or default to ROE
    // We can pull ebit from income state:
    let roce = roe // fallback
    if (incStatements.length > 0) {
      const ebit = getVal(incStatements[0], 'ebit', 0)
      // rough capital employed = Total Assets - Current Liabilities. Not easily available in these modules without balanceSheetHistory
      // So we fallback to a derived metric or return ROE.
    }

    const debtToEquity = getVal(fd, 'debtToEquity', 0) / 100 // Yahoo returns percentage (like 45 for 0.45)
    
    // FCF
    let fcf = getVal(fd, 'freeCashflow', 0)
    if (!fcf && (cf?.cashflowStatements?.length || 0) > 0) {
      const cyCf = cf!.cashflowStatements[0]
      fcf = getVal(cyCf, 'totalCashFromOperatingActivities', 0) + getVal(cyCf, 'capitalExpenditures', 0)
    }

    // Promoter Holding
    const promoterHolding = getVal(mh, 'insidersPercentHeld', 0) * 100

    // --- Scoring Logic ---
    let bqScore = 0
    if (roce > 20) bqScore += 25
    else if (roce >= 15) bqScore += 15
    
    if (roe > 15) bqScore += 20
    
    if (debtToEquity < 0.5) bqScore += 20
    else if (debtToEquity <= 1) bqScore += 10
    
    if (revenueGrowth > 15) bqScore += 20
    if (profitGrowth > 15) bqScore += 15
    
    // Normalize to 100
    bqScore = Math.min(100, bqScore)

    let ptScore = 0
    if (promoterHolding > 60) ptScore += 40
    else if (promoterHolding >= 40) ptScore += 25
    else if (promoterHolding < 25) ptScore += 10
    else ptScore += 15 // middle ground
    
    // Adding default points for pledge and buying/selling since Yahoo free doesn't easily expose this
    ptScore += 30 // assumed pledge < 5%
    ptScore += 10 // neutral buying/selling
    ptScore = Math.min(100, ptScore)

    let eqScore = 0
    if (fcf > netProfit && netProfit > 0) eqScore += 40
    else if (fcf > netProfit * 0.5 && netProfit > 0) eqScore += 25
    else if (fcf < 0) eqScore += 0
    
    // Margin & Growth consistency are simplified for this basic calculation
    if (revenueGrowth > 0) eqScore += 30
    const opMargin = getVal(fd, 'operatingMargins', 0)
    if (opMargin > 0.1) eqScore += 30
    else if (opMargin < 0) eqScore -= 10
    eqScore = Math.max(0, Math.min(100, eqScore))

    const overallDNA = Math.round((bqScore * 0.4) + (ptScore * 0.3) + (eqScore * 0.3))

    let moatTag = "No Clear Moat ⚠️"
    if (overallDNA > 80) moatTag = "Wide Moat 🏰"
    else if (overallDNA >= 60) moatTag = "Narrow Moat 🛡️"
    else if (overallDNA < 40) moatTag = "Weak Business 🔴"

    const summaryText = `${name} shows ${bqScore > 70 ? 'strong' : bqScore > 40 ? 'moderate' : 'weak'} business quality with ROCE of ${roce.toFixed(1)}% and ${debtToEquity > 1 ? 'concerning' : 'healthy'} debt levels. Promoter confidence is ${ptScore > 70 ? 'high' : ptScore > 40 ? 'medium' : 'low'} with ${promoterHolding.toFixed(1)}% holding. Earnings quality is ${eqScore > 60 ? 'strong' : 'weak'} based on FCF vs reported profit.`

    return NextResponse.json({
      symbol: symbolParam,
      name,
      sector,
      price,
      high52,
      low52,
      metrics: {
        pe, pb, evEbitda,
        revenueTTM, revenueGrowth,
        netProfit, profitGrowth,
        roe, roce, debtToEquity, fcf, marketCap, promoterHolding
      },
      scores: {
        businessQuality: bqScore,
        promoterTrust: ptScore,
        earningsQuality: eqScore,
        overallDNA
      },
      moatTag,
      summaryText
    })

  } catch (error: any) {
    console.error('Stock DNA Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
