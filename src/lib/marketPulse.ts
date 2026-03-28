import type { Stock, IndexData, NewsItem } from '@/types'

export interface MarketPulseResult {
  text: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

export function generateMarketPulse(
  stocks: Stock[],
  indices: IndexData[],
  news: NewsItem[]
): MarketPulseResult | null {
  if (stocks.length < 5) return null

  // ── Index data ────────────────────────────────────────────────────────────
  const nifty = indices.find(i => i.name?.toLowerCase().includes('nifty 50'))
  const niftyChange = nifty?.changePercent ?? null

  // ── Stock counts ──────────────────────────────────────────────────────────
  const advancing = stocks.filter(s => s.changePercent > 0.1).length
  const declining = stocks.filter(s => s.changePercent < -0.1).length
  const total = stocks.length

  // ── Top movers ────────────────────────────────────────────────────────────
  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent)
  const topGainer = sorted[0]
  const topLoser = sorted[sorted.length - 1]
  const secondGainer = sorted[1]

  // ── Sentiment ─────────────────────────────────────────────────────────────
  const advRatio = advancing / total
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  if (advRatio >= 0.6) sentiment = 'bullish'
  else if (advRatio <= 0.4) sentiment = 'bearish'

  // ── Top news headline ─────────────────────────────────────────────────────
  const topNews = news.find(n => n.impact === 'high')
  const newsSnippet = topNews?.title
    ? topNews.title.length > 60
      ? topNews.title.slice(0, 57) + '…'
      : topNews.title
    : null

  // ── Market mood phrase ────────────────────────────────────────────────────
  const niftyStr = niftyChange !== null
    ? `${niftyChange > 0 ? '+' : ''}${niftyChange.toFixed(2)}%`
    : null

  let openingLine = ''
  if (niftyChange === null) {
    openingLine = advRatio >= 0.6
      ? `Broad-based buying across ${advancing} of ${total} stocks today.`
      : advRatio <= 0.4
      ? `Selling pressure visible — only ${advancing} of ${total} stocks advancing.`
      : `Mixed session — market split with ${advancing} advancing, ${declining} declining.`
  } else if (niftyChange <= -1.5) {
    openingLine = `NIFTY under heavy pressure at ${niftyStr} — broad selloff with ${declining} stocks in the red.`
  } else if (niftyChange <= -0.3) {
    openingLine = `NIFTY slipping ${niftyStr} — cautious trade with ${declining} stocks declining.`
  } else if (niftyChange < 0.3) {
    openingLine = `NIFTY flat at ${niftyStr} — indecisive session with ${advancing} stocks up and ${declining} down.`
  } else if (niftyChange < 1.5) {
    openingLine = `NIFTY holding gains at ${niftyStr} — ${advancing} of ${total} stocks advancing.`
  } else {
    openingLine = `NIFTY surging ${niftyStr} — strong buying with ${advancing} of ${total} stocks in the green.`
  }

  // ── Movers line ───────────────────────────────────────────────────────────
  let moversLine = ''
  if (topGainer && topLoser && topGainer.symbol !== topLoser.symbol) {
    const gainerStr = `${topGainer.symbol} leading at +${topGainer.changePercent.toFixed(1)}%`
    const loserStr = `${topLoser.symbol} weakest at ${topLoser.changePercent.toFixed(1)}%`

    if (sentiment === 'bullish') {
      moversLine = `${gainerStr}${secondGainer && secondGainer.symbol !== topGainer.symbol ? `, ${secondGainer.symbol} +${secondGainer.changePercent.toFixed(1)}%` : ''} — ${loserStr}.`
    } else if (sentiment === 'bearish') {
      moversLine = `${loserStr}${topGainer.changePercent > 0 ? ` — ${gainerStr} against the trend` : ''}.`
    } else {
      moversLine = `${gainerStr} — ${loserStr}.`
    }
  }

  // ── News line ─────────────────────────────────────────────────────────────
  const newsLine = newsSnippet ? `Key headline: ${newsSnippet}` : ''

  // ── Combine ───────────────────────────────────────────────────────────────
  const parts = [openingLine, moversLine, newsLine].filter(Boolean)
  const text = parts.join(' ')

  return { text, sentiment }
}
