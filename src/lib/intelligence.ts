import type { Stock, NewsItem, Opportunity } from '@/types'

export function detectOpportunities(stocks: Stock[], news: NewsItem[]): Opportunity[] {
  const opportunities: Opportunity[] = []
  const now = new Date().toISOString()

  for (const stock of stocks) {
    // Volume spike detection
    if (stock.avgVolume && stock.volume > stock.avgVolume * 2) {
      const volumeMultiple = (stock.volume / stock.avgVolume).toFixed(1)
      opportunities.push({
        id: `vol-${stock.symbol}-${Date.now()}`,
        symbol: stock.symbol,
        stockName: stock.name,
        type: 'volume_spike',
        reason: `Volume is ${volumeMultiple}x the average — unusual institutional activity possible`,
        details: `Current volume: ${formatNumber(stock.volume)} vs Average: ${formatNumber(stock.avgVolume)}. High volume with ${stock.changePercent > 0 ? 'positive' : 'negative'} price action suggests ${stock.changePercent > 0 ? 'strong buying interest' : 'heavy selling pressure'}.`,
        price: stock.price,
        changePercent: stock.changePercent,
        volume: stock.volume,
        avgVolume: stock.avgVolume,
        detectedAt: now,
        impact: stock.volume > stock.avgVolume * 3 ? 'high' : 'medium',
      })
    }

    // Gap up detection (open significantly above previous close)
    const gapPercent = ((stock.open - stock.prevClose) / stock.prevClose) * 100
    if (gapPercent > 2) {
      opportunities.push({
        id: `gapup-${stock.symbol}-${Date.now()}`,
        symbol: stock.symbol,
        stockName: stock.name,
        type: 'gap_up',
        reason: `Opened ${gapPercent.toFixed(1)}% above previous close — gap up`,
        details: `Previous close: ₹${stock.prevClose.toFixed(2)}, Today's open: ₹${stock.open.toFixed(2)}. Gap ups often indicate strong overnight sentiment from news or global cues.`,
        price: stock.price,
        changePercent: stock.changePercent,
        detectedAt: now,
        impact: gapPercent > 4 ? 'high' : 'medium',
      })
    }

    // Gap down detection
    if (gapPercent < -2) {
      opportunities.push({
        id: `gapdn-${stock.symbol}-${Date.now()}`,
        symbol: stock.symbol,
        stockName: stock.name,
        type: 'gap_down',
        reason: `Opened ${Math.abs(gapPercent).toFixed(1)}% below previous close — gap down`,
        details: `Previous close: ₹${stock.prevClose.toFixed(2)}, Today's open: ₹${stock.open.toFixed(2)}. Gap downs may present buying opportunities if fundamentals are intact.`,
        price: stock.price,
        changePercent: stock.changePercent,
        detectedAt: now,
        impact: gapPercent < -4 ? 'high' : 'medium',
      })
    }

    // Breakout detection (price near day high with strong momentum)
    if (stock.changePercent > 3 && stock.price >= stock.high * 0.99) {
      opportunities.push({
        id: `brk-${stock.symbol}-${Date.now()}`,
        symbol: stock.symbol,
        stockName: stock.name,
        type: 'breakout',
        reason: `Trading near day high with ${stock.changePercent.toFixed(1)}% gain — potential breakout`,
        details: `Price at ₹${stock.price.toFixed(2)} is near day high of ₹${stock.high.toFixed(2)}. Strong momentum with price holding near highs suggests buyers are in control.`,
        price: stock.price,
        changePercent: stock.changePercent,
        detectedAt: now,
        impact: stock.changePercent > 5 ? 'high' : 'medium',
      })
    }

    // News + Price correlation
    const relatedNews = news.filter(n => n.relatedStocks.includes(stock.symbol))
    for (const newsItem of relatedNews) {
      if (newsItem.impact === 'high') {
        const direction = stock.changePercent > 0 ? 'positive' : 'negative'
        const sentiment = newsItem.sentiment
        opportunities.push({
          id: `news-${stock.symbol}-${newsItem.id}`,
          symbol: stock.symbol,
          stockName: stock.name,
          type: 'news_correlation',
          reason: `High-impact ${sentiment} news with ${direction} price movement`,
          details: `"${newsItem.title}" — This ${sentiment} news coincides with a ${Math.abs(stock.changePercent).toFixed(1)}% ${direction} move. News-driven moves often create short-term trading opportunities.`,
          price: stock.price,
          changePercent: stock.changePercent,
          relatedNewsId: newsItem.id,
          detectedAt: now,
          impact: 'high',
        })
      }
    }
  }

  // Sort by impact
  const impactOrder = { high: 0, medium: 1, low: 2 }
  opportunities.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])

  return opportunities.slice(0, 20)
}

function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function generateAlertReason(type: string, data: Record<string, any>): string {
  switch (type) {
    case 'volume_spike':
      return `Unusual volume detected in ${data.symbol}. Volume is ${data.multiple}x average, suggesting institutional activity.`
    case 'gap_up':
      return `${data.symbol} opened with a ${data.gap}% gap up. Strong overnight sentiment detected.`
    case 'gap_down':
      return `${data.symbol} opened with a ${data.gap}% gap down. Monitor for potential reversal or continuation.`
    case 'breakout':
      return `${data.symbol} is breaking out with ${data.change}% gain near day high. Momentum is strong.`
    case 'news_correlation':
      return `High-impact news for ${data.symbol} correlating with ${data.direction} price movement.`
    default:
      return 'Market event detected.'
  }
}
