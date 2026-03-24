/**
 * Trade Finder — Strategy Engine
 * 5 scanning strategies: Strict Morning, General Morning,
 * Candle Patterns, Long Trend, High Volatility Move
 */

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // UTC+5:30

// ─── Types ───────────────────────────────────────────────────────────────────

export type TradeDirection = 'bullish' | 'bearish'

export type StrategyType =
  | 'strict_morning'
  | 'general_morning'
  | 'candle_pattern'
  | 'long_trend'
  | 'high_volatility'

export interface TradeSignal {
  id: string
  symbol: string
  stockName: string
  price: number
  changePercent: number
  strategyType: StrategyType
  categoryLabel: string
  direction: TradeDirection
  score: number        // 0–100
  reason: string       // Full explanation
  matchInfo: string    // Short summary e.g. "5/5 days", "Hammer pattern"
  detectedAt: string
}

export interface TradeFinderResult {
  strict_morning: TradeSignal[]
  general_morning: TradeSignal[]
  candle_patterns: TradeSignal[]
  long_trend: TradeSignal[]
  high_volatility: TradeSignal[]
  scannedAt: string
  totalScanned: number
}

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface DayGroup {
  date: string
  candles: Candle[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIST(unixSec: number) {
  const ms = unixSec * 1000 + IST_OFFSET_MS
  const d = new Date(ms)
  const hours = d.getUTCHours()
  const minutes = d.getUTCMinutes()
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  return { hours, minutes, dateStr, totalMins: hours * 60 + minutes }
}

function parseCandles(result: any): Candle[] {
  const timestamps: number[] = result?.timestamp || []
  const q = result?.indicators?.quote?.[0] || {}
  const opens: number[] = q.open || []
  const highs: number[] = q.high || []
  const lows: number[] = q.low || []
  const closes: number[] = q.close || []
  const volumes: number[] = q.volume || []

  return timestamps
    .map((t, i) => ({
      timestamp: t,
      open: opens[i],
      high: highs[i],
      low: lows[i],
      close: closes[i],
      volume: volumes[i] || 0,
    }))
    .filter(
      c =>
        c.open != null && c.close != null && c.high != null && c.low != null &&
        !isNaN(c.open) && !isNaN(c.close) && !isNaN(c.high) && !isNaN(c.low)
    )
}

function groupByDay(candles: Candle[]): DayGroup[] {
  const map = new Map<string, Candle[]>()
  for (const c of candles) {
    const { dateStr } = getIST(c.timestamp)
    if (!map.has(dateStr)) map.set(dateStr, [])
    map.get(dateStr)!.push(c)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, arr]) => ({
      date,
      candles: arr.sort((a, b) => a.timestamp - b.timestamp),
    }))
}

function windowCandles(
  candles: Candle[],
  startH: number, startM: number,
  endH: number, endM: number
): Candle[] {
  const start = startH * 60 + startM
  const end = endH * 60 + endM
  return candles.filter(c => {
    const { totalMins } = getIST(c.timestamp)
    return totalMins >= start && totalMins < end
  })
}

async function fetchYahoo(
  symbol: string, interval: string, range: string,
  yahooSymbol?: string  // optional full ticker override e.g. 'M%26M.NS'
): Promise<any | null> {
  try {
    const ticker = yahooSymbol ?? `${symbol}.NS`
    const res = await fetch(
      `${YAHOO_BASE}/${ticker}?interval=${interval}&range=${range}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.chart?.result?.[0] || null
  } catch {
    return null
  }
}

// ─── Strategy 1: Strict Morning Trend (9:15–10:00) ───────────────────────────
// All consecutive 5-min candles must close higher (bullish) or lower (bearish)
// across 5 consecutive trading days.

function analyzeStrictMorningTrend(
  symbol: string, name: string, price: number, changePercent: number,
  days: DayGroup[]
): TradeSignal | null {
  if (days.length < 5) return null
  const recent = days.slice(-5)

  const dayResults = recent.map(day => {
    const morning = windowCandles(day.candles, 9, 15, 10, 0)
    if (morning.length < 4) return 'mixed' as const

    let bull = true, bear = true
    for (let i = 1; i < morning.length; i++) {
      if (morning[i].close <= morning[i - 1].close) bull = false
      if (morning[i].close >= morning[i - 1].close) bear = false
    }
    return bull ? 'bullish' as const : bear ? 'bearish' as const : 'mixed' as const
  })

  const bullCount = dayResults.filter(r => r === 'bullish').length
  const bearCount = dayResults.filter(r => r === 'bearish').length

  if (bullCount === 5) {
    return {
      id: `strict_morning_bull_${symbol}`,
      symbol, stockName: name, price, changePercent,
      strategyType: 'strict_morning',
      categoryLabel: 'Strict Morning Trend',
      direction: 'bullish',
      score: 92,
      reason: `Stock moved UP between 9:15–10:00 for 5 consecutive days. Every 5-min candle closed higher than the previous candle throughout the morning window on each of those days — a textbook strict bullish opening pattern.`,
      matchInfo: '5/5 days · strict bullish',
      detectedAt: new Date().toISOString(),
    }
  }

  if (bearCount === 5) {
    return {
      id: `strict_morning_bear_${symbol}`,
      symbol, stockName: name, price, changePercent,
      strategyType: 'strict_morning',
      categoryLabel: 'Strict Morning Trend',
      direction: 'bearish',
      score: 92,
      reason: `Stock moved DOWN between 9:15–10:00 for 5 consecutive days. Every 5-min candle closed lower than the previous candle throughout the morning window on each of those days — a textbook strict bearish opening pattern.`,
      matchInfo: '5/5 days · strict bearish',
      detectedAt: new Date().toISOString(),
    }
  }

  return null
}

// ─── Strategy 2: General Morning Trend (9:15–10:00) ──────────────────────────
// Net move from first open to last close in the window.
// At least 5 out of last 7 days must show same direction.

function analyzeGeneralMorningTrend(
  symbol: string, name: string, price: number, changePercent: number,
  days: DayGroup[]
): TradeSignal | null {
  if (days.length < 5) return null
  const recent = days.slice(-7)

  const dayDirections: ('bullish' | 'bearish')[] = []

  for (const day of recent) {
    const morning = windowCandles(day.candles, 9, 15, 10, 0)
    if (morning.length < 2) continue
    const firstOpen = morning[0].open
    const lastClose = morning[morning.length - 1].close
    if (lastClose > firstOpen) dayDirections.push('bullish')
    else if (lastClose < firstOpen) dayDirections.push('bearish')
  }

  if (dayDirections.length < 5) return null

  const total = dayDirections.length
  const bullCount = dayDirections.filter(d => d === 'bullish').length
  const bearCount = dayDirections.filter(d => d === 'bearish').length

  if (bullCount >= 5) {
    return {
      id: `general_morning_bull_${symbol}`,
      symbol, stockName: name, price, changePercent,
      strategyType: 'general_morning',
      categoryLabel: 'General Morning Trend',
      direction: 'bullish',
      score: Math.min(90, 60 + bullCount * 4),
      reason: `Net price movement from 9:15 open to 10:00 close was POSITIVE on ${bullCount} of last ${total} trading days. Stock has a strong bullish morning bias — consistently gains ground in the opening 45 minutes.`,
      matchInfo: `${bullCount}/${total} days bullish`,
      detectedAt: new Date().toISOString(),
    }
  }

  if (bearCount >= 5) {
    return {
      id: `general_morning_bear_${symbol}`,
      symbol, stockName: name, price, changePercent,
      strategyType: 'general_morning',
      categoryLabel: 'General Morning Trend',
      direction: 'bearish',
      score: Math.min(90, 60 + bearCount * 4),
      reason: `Net price movement from 9:15 open to 10:00 close was NEGATIVE on ${bearCount} of last ${total} trading days. Stock has a strong bearish morning bias — consistently loses ground in the opening 45 minutes.`,
      matchInfo: `${bearCount}/${total} days bearish`,
      detectedAt: new Date().toISOString(),
    }
  }

  return null
}

// ─── Strategy 3: 5-Min Candle Pattern Detection ───────────────────────────────
// Detects Hammer, Shooting Star, Strong Bullish, Strong Bearish
// in the last 5 candles of the latest session.

function analyzeCandlePatterns(
  symbol: string, name: string, price: number, changePercent: number,
  days: DayGroup[]
): TradeSignal | null {
  if (days.length === 0) return null

  const latestDay = days[days.length - 1]
  if (latestDay.candles.length < 3) return null

  const recent = latestDay.candles.slice(-5)

  for (let i = recent.length - 1; i >= 0; i--) {
    const c = recent[i]
    const body = Math.abs(c.close - c.open)
    const range = c.high - c.low
    if (range < 0.01 || body === 0) continue

    const upperWick = c.high - Math.max(c.open, c.close)
    const lowerWick = Math.min(c.open, c.close) - c.low
    const bodyRatio = body / range

    // Hammer: long lower wick >= 2x body, small upper wick <= 0.5x body, body in top 40% of range
    if (
      lowerWick >= body * 2 &&
      upperWick <= body * 0.5 &&
      bodyRatio <= 0.4
    ) {
      const wickPct = ((lowerWick / price) * 100).toFixed(1)
      return {
        id: `candle_hammer_${symbol}`,
        symbol, stockName: name, price, changePercent,
        strategyType: 'candle_pattern',
        categoryLabel: 'Candle Signals',
        direction: 'bullish',
        score: 75,
        reason: `Hammer candle detected in the latest 5-min session. Lower wick is ${wickPct}% of stock price — showing strong buying pressure after a sharp intraday dip. Bulls stepped in and rejected the lows. Classic bullish reversal signal.`,
        matchInfo: 'Hammer · Bullish Reversal',
        detectedAt: new Date().toISOString(),
      }
    }

    // Shooting Star: long upper wick >= 2x body, small lower wick, body in bottom 40%
    if (
      upperWick >= body * 2 &&
      lowerWick <= body * 0.5 &&
      bodyRatio <= 0.4
    ) {
      const wickPct = ((upperWick / price) * 100).toFixed(1)
      return {
        id: `candle_shooting_${symbol}`,
        symbol, stockName: name, price, changePercent,
        strategyType: 'candle_pattern',
        categoryLabel: 'Candle Signals',
        direction: 'bearish',
        score: 75,
        reason: `Shooting Star detected in the latest 5-min session. Upper wick is ${wickPct}% of stock price — price surged intraday but sellers aggressively pushed it back down to near the open. Bearish reversal signal after a rally.`,
        matchInfo: 'Shooting Star · Bearish Reversal',
        detectedAt: new Date().toISOString(),
      }
    }

    // Strong Bullish: close near high (upper wick ≤ 30% of body), body > 0.8% move
    if (
      c.close > c.open &&
      (c.close - c.open) / c.open > 0.008 &&
      upperWick <= body * 0.3
    ) {
      const movePct = (((c.close - c.open) / c.open) * 100).toFixed(2)
      return {
        id: `candle_strong_bull_${symbol}`,
        symbol, stockName: name, price, changePercent,
        strategyType: 'candle_pattern',
        categoryLabel: 'Candle Signals',
        direction: 'bullish',
        score: 80,
        reason: `Strong Bullish candle detected: price moved up ${movePct}% in a single 5-min candle and closed near the high of the candle. Minimal upper wick confirms sustained buying — bulls are firmly in control. Bullish continuation signal.`,
        matchInfo: `Strong Bullish +${movePct}% · Continuation`,
        detectedAt: new Date().toISOString(),
      }
    }

    // Strong Bearish: close near low (lower wick ≤ 30% of body), body > 0.8% drop
    if (
      c.open > c.close &&
      (c.open - c.close) / c.open > 0.008 &&
      lowerWick <= body * 0.3
    ) {
      const dropPct = (((c.open - c.close) / c.open) * 100).toFixed(2)
      return {
        id: `candle_strong_bear_${symbol}`,
        symbol, stockName: name, price, changePercent,
        strategyType: 'candle_pattern',
        categoryLabel: 'Candle Signals',
        direction: 'bearish',
        score: 80,
        reason: `Strong Bearish candle detected: price dropped ${dropPct}% in a single 5-min candle and closed near the low. Minimal lower wick confirms sustained selling — bears are firmly in control. Bearish continuation signal.`,
        matchInfo: `Strong Bearish −${dropPct}% · Continuation`,
        detectedAt: new Date().toISOString(),
      }
    }
  }

  return null
}

// ─── Strategy 4: Long Trend (≥1 month) ───────────────────────────────────────
// Uptrend: price > 20SMA > 50SMA for 20+ consecutive trading days.
// Exclude overextended stocks (>15% from 20SMA).

function analyzeLongTrend(
  symbol: string, name: string, price: number, changePercent: number,
  dailyCandles: Candle[]
): TradeSignal | null {
  if (dailyCandles.length < 50) return null

  const closes = dailyCandles.map(c => c.close)
  const n = closes.length

  // Precompute rolling 20-day SMA
  const sma20: number[] = []
  for (let i = 0; i < n; i++) {
    if (i < 19) { sma20.push(NaN); continue }
    sma20.push(closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20)
  }

  const sma50 = closes.slice(n - 50).reduce((a, b) => a + b, 0) / 50
  const currentSma20 = sma20[n - 1]
  const currentPrice = closes[n - 1]

  if (isNaN(currentSma20)) return null

  const distFromSma20Pct = ((currentPrice - currentSma20) / currentSma20) * 100

  // Determine trend direction
  let direction: 'bullish' | 'bearish' | null = null
  if (currentPrice > currentSma20 && currentSma20 > sma50) direction = 'bullish'
  else if (currentPrice < currentSma20 && currentSma20 < sma50) direction = 'bearish'
  if (!direction) return null

  // Exclude overextended (>15% from 20SMA)
  if (Math.abs(distFromSma20Pct) > 15) return null

  // Count consecutive days in trend from most recent
  let trendDays = 0
  for (let i = n - 1; i >= 19; i--) {
    if (isNaN(sma20[i])) break
    if (direction === 'bullish' && closes[i] > sma20[i]) trendDays++
    else if (direction === 'bearish' && closes[i] < sma20[i]) trendDays++
    else break
  }

  if (trendDays < 20) return null // Need ≥1 month

  const absDist = Math.abs(distFromSma20Pct)
  const entryNote =
    absDist <= 5
      ? 'Excellent entry zone — price is near 20-day MA'
      : absDist <= 10
      ? 'Acceptable entry — slightly extended from 20-day MA'
      : 'Extended — consider waiting for pullback to 20-day MA'

  const monthsApprox = Math.round(trendDays / 20)
  const trendLabel = trendDays >= 40 ? `${monthsApprox}+ months` : `~1 month (${trendDays} trading days)`

  return {
    id: `long_trend_${direction}_${symbol}`,
    symbol, stockName: name, price, changePercent,
    strategyType: 'long_trend',
    categoryLabel: 'Long Trend',
    direction,
    score: Math.min(95, 65 + Math.floor(trendDays * 0.5)),
    reason: `${direction === 'bullish' ? 'Uptrend' : 'Downtrend'} confirmed for ${trendLabel}. Price (₹${currentPrice.toFixed(2)}) is ${direction === 'bullish' ? 'above' : 'below'} 20-day MA (₹${currentSma20.toFixed(2)}) which is ${direction === 'bullish' ? 'above' : 'below'} 50-day MA (₹${sma50.toFixed(2)}). Price is ${Math.abs(distFromSma20Pct).toFixed(1)}% ${distFromSma20Pct > 0 ? 'above' : 'below'} 20MA. ${entryNote}.`,
    matchInfo: `${trendLabel} · ${distFromSma20Pct > 0 ? '+' : ''}${distFromSma20Pct.toFixed(1)}% from 20MA`,
    detectedAt: new Date().toISOString(),
  }
}

// ─── Strategy 5: High Volatility Morning Move (9:30–10:30) ───────────────────
// High – Low in the window must be ≥50 points for all 3 of last 3 trading days.

function analyzeHighVolatility(
  symbol: string, name: string, price: number, changePercent: number,
  days: DayGroup[]
): TradeSignal | null {
  if (days.length < 3) return null
  const recent3 = days.slice(-3)

  const ranges: number[] = []
  for (const day of recent3) {
    const morning = windowCandles(day.candles, 9, 30, 10, 30)
    if (morning.length < 3) return null // Not enough candles in window

    const high = Math.max(...morning.map(c => c.high))
    const low = Math.min(...morning.map(c => c.low))
    ranges.push(high - low)
  }

  if (!ranges.every(r => r >= 50)) return null

  const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length
  const minRange = Math.min(...ranges)

  return {
    id: `high_vol_${symbol}`,
    symbol, stockName: name, price, changePercent,
    strategyType: 'high_volatility',
    categoryLabel: 'High Volatility Move',
    direction: changePercent >= 0 ? 'bullish' : 'bearish',
    score: Math.min(95, 70 + Math.floor((avgRange - 50) / 10)),
    reason: `Price moved ≥50 points between 9:30–10:30 on all 3 of the last 3 trading days. Average morning range was ${avgRange.toFixed(0)} points. Minimum range was ${minRange.toFixed(0)} points. This stock shows consistent high intraday volatility in the morning window — suitable for momentum and scalping strategies.`,
    matchInfo: `3/3 days · avg ${avgRange.toFixed(0)} pts range`,
    detectedAt: new Date().toISOString(),
  }
}

// ─── Main Scanner ─────────────────────────────────────────────────────────────

export async function runTradeFinder(
  stocks: { symbol: string; name: string; yahooSymbol?: string }[]
): Promise<TradeFinderResult> {
  const BATCH_SIZE = 8

  interface StockData {
    symbol: string
    name: string
    price: number
    changePercent: number
    intradayDays: DayGroup[]
    dailyCandles: Candle[]
  }

  const stockDataList: StockData[] = []

  // Fetch all stocks in batches to avoid Yahoo Finance rate limiting
  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.allSettled(
      batch.map(async stock => {
        const [intradayRes, dailyRes] = await Promise.allSettled([
          fetchYahoo(stock.symbol, '5m', '10d', stock.yahooSymbol),
          fetchYahoo(stock.symbol, '1d', '60d', stock.yahooSymbol),
        ])

        const intraday = intradayRes.status === 'fulfilled' ? intradayRes.value : null
        const daily = dailyRes.status === 'fulfilled' ? dailyRes.value : null

        const intradayCandles = intraday ? parseCandles(intraday) : []
        const dailyCandles = daily ? parseCandles(daily) : []
        const intradayDays = groupByDay(intradayCandles)

        const meta = intraday?.meta || daily?.meta || {}
        const rawPrice = meta.regularMarketPrice || 0
        const prevClose = meta.chartPreviousClose || meta.previousClose || rawPrice
        const changePercent = prevClose ? ((rawPrice - prevClose) / prevClose) * 100 : 0

        return {
          symbol: stock.symbol,
          name: stock.name,
          price: parseFloat(rawPrice.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          intradayDays,
          dailyCandles,
        } satisfies StockData
      })
    )

    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value.price > 0) {
        stockDataList.push(r.value)
      }
    }
  }

  // Run all strategies
  const result: TradeFinderResult = {
    strict_morning: [],
    general_morning: [],
    candle_patterns: [],
    long_trend: [],
    high_volatility: [],
    scannedAt: new Date().toISOString(),
    totalScanned: stockDataList.length,
  }

  for (const sd of stockDataList) {
    const { symbol, name, price, changePercent, intradayDays, dailyCandles } = sd

    const s1 = analyzeStrictMorningTrend(symbol, name, price, changePercent, intradayDays)
    if (s1) result.strict_morning.push(s1)

    const s2 = analyzeGeneralMorningTrend(symbol, name, price, changePercent, intradayDays)
    if (s2) result.general_morning.push(s2)

    const s3 = analyzeCandlePatterns(symbol, name, price, changePercent, intradayDays)
    if (s3) result.candle_patterns.push(s3)

    const s4 = analyzeLongTrend(symbol, name, price, changePercent, dailyCandles)
    if (s4) result.long_trend.push(s4)

    const s5 = analyzeHighVolatility(symbol, name, price, changePercent, intradayDays)
    if (s5) result.high_volatility.push(s5)
  }

  // Sort each category by score descending
  const sortByScore = (a: TradeSignal, b: TradeSignal) => b.score - a.score
  result.strict_morning.sort(sortByScore)
  result.general_morning.sort(sortByScore)
  result.candle_patterns.sort(sortByScore)
  result.long_trend.sort(sortByScore)
  result.high_volatility.sort(sortByScore)

  return result
}
