import type { NewsItem } from '@/types'

interface RSSFeed {
  name: string
  url: string
  category: string
}

const RSS_FEEDS: RSSFeed[] = [
  // ── Google News RSS (permanent — aggregates ALL Indian sources automatically)
  // Google never blocks, never changes format, pulls from Moneycontrol/ET/LiveMint/BS/CNBCTV18 etc.
  { name: 'Google News', url: 'https://news.google.com/rss/search?q=NSE+BSE+stock+market+india&hl=en-IN&gl=IN&ceid=IN:en', category: 'Market' },
  { name: 'Google News', url: 'https://news.google.com/rss/search?q=nifty+sensex+today&hl=en-IN&gl=IN&ceid=IN:en', category: 'Market' },
  { name: 'Google News', url: 'https://news.google.com/rss/search?q=india+stock+earnings+results+quarterly&hl=en-IN&gl=IN&ceid=IN:en', category: 'Stocks' },
  { name: 'Google News', url: 'https://news.google.com/rss/search?q=RBI+SEBI+india+economy+policy&hl=en-IN&gl=IN&ceid=IN:en', category: 'Economy' },
  { name: 'Google News', url: 'https://news.google.com/rss/search?q=india+IPO+bulk+deal+block+deal+buyback&hl=en-IN&gl=IN&ceid=IN:en', category: 'Stocks' },
  { name: 'Google News', url: 'https://news.google.com/rss/search?q=india+merger+acquisition+order+win+contract&hl=en-IN&gl=IN&ceid=IN:en', category: 'Business' },

  // ── Economic Times direct (most reliable direct feed, keep as backup)
  { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', category: 'Market' },
  { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms', category: 'Stocks' },
]

const STOCK_KEYWORDS: Record<string, string[]> = {
  'RELIANCE': ['reliance', 'ril', 'jio', 'mukesh ambani'],
  'TCS': ['tcs', 'tata consultancy'],
  'HDFCBANK': ['hdfc bank', 'hdfcbank'],
  'INFY': ['infosys', 'infy'],
  'ICICIBANK': ['icici bank', 'icicibank'],
  'HINDUNILVR': ['hindustan unilever', 'hul'],
  'ITC': ['itc limited', 'itc '],
  'SBIN': ['sbi', 'state bank of india'],
  'BHARTIARTL': ['bharti airtel', 'airtel'],
  'TATAMOTORS': ['tata motors'],
  'BAJFINANCE': ['bajaj finance'],
  'MARUTI': ['maruti suzuki', 'maruti'],
  'SUNPHARMA': ['sun pharma', 'sun pharmaceutical'],
  'WIPRO': ['wipro'],
  'HCLTECH': ['hcl tech', 'hcl technologies'],
  'TITAN': ['titan company', 'titan '],
  'ADANIENT': ['adani', 'adani enterprises', 'adani group'],
  'TATASTEEL': ['tata steel'],
  'COALINDIA': ['coal india'],
  'LT': ['larsen', 'l&t'],
  'AXISBANK': ['axis bank'],
  'KOTAKBANK': ['kotak bank', 'kotak mahindra'],
  'NTPC': ['ntpc'],
  'ONGC': ['ongc', 'oil and natural gas'],
  'JSWSTEEL': ['jsw steel'],
}

// ─── FORWARD-LOOKING HIGH IMPACT PATTERNS ──────────────────────────────────
// These signal something that will affect price NEXT, not what already moved
const HIGH_IMPACT_PATTERNS = [
  // Corporate actions (announce future events)
  { pattern: /bulk deal|block deal/i, weight: 10, timing: 'immediate' as const },
  { pattern: /insider buy|promoter buy|promoter increas/i, weight: 10, timing: 'immediate' as const },
  { pattern: /insider sell|promoter sell|promoter reduc/i, weight: 9, timing: 'immediate' as const },
  { pattern: /buyback|share repurchas/i, weight: 9, timing: 'immediate' as const },
  { pattern: /dividend (announc|declar|pay)|bonus issue|stock split/i, weight: 9, timing: 'short-term' as const },
  { pattern: /ipo (open|clos|list|subscri)|listing/i, weight: 8, timing: 'immediate' as const },

  // Results & earnings (upcoming or just released)
  { pattern: /q[1-4] result|quarterly result|earning|profit (up|down|rise|fall|jump|drop)|revenue (up|down|rise|fall)/i, weight: 10, timing: 'immediate' as const },
  { pattern: /guidance|outlook|forecast|target price/i, weight: 8, timing: 'short-term' as const },
  { pattern: /beat estimate|miss estimate|above expectation|below expectation/i, weight: 9, timing: 'immediate' as const },

  // Orders & contracts
  { pattern: /order win|order bag|large order|order worth|contract win|new contract|secures order/i, weight: 9, timing: 'short-term' as const },
  { pattern: /tender win|bid win|wins contract/i, weight: 8, timing: 'short-term' as const },

  // M&A / Corporate events
  { pattern: /acqui|merger|takeover|demerger|spin.?off|joint venture|stake buy/i, weight: 9, timing: 'short-term' as const },
  { pattern: /fundrais|raises fund|fund rais|series [a-e] round|qip|fpo/i, weight: 8, timing: 'short-term' as const },

  // Regulatory & Government
  { pattern: /rbi (rate|policy|monetary|cut|hike)|repo rate|reverse repo/i, weight: 10, timing: 'immediate' as const },
  { pattern: /sebi (order|action|approv|ban|penalty)|market regulator/i, weight: 9, timing: 'immediate' as const },
  { pattern: /government (approv|order|tender|polic|scheme)|ministry approv/i, weight: 8, timing: 'short-term' as const },
  { pattern: /fdi (approv|allow|polic)|foreign investment|fii buy|fii sell|dii buy/i, weight: 8, timing: 'short-term' as const },
  { pattern: /drug approval|fda approv|dcgi approv|nclat|nclt/i, weight: 9, timing: 'immediate' as const },

  // Sector catalysts
  { pattern: /oil price|crude oil|brent|wti/i, weight: 7, timing: 'immediate' as const },
  { pattern: /interest rate|inflation data|cpi|iip data|gdp data/i, weight: 8, timing: 'immediate' as const },
  { pattern: /budget|union budget|finance minister|fiscal/i, weight: 9, timing: 'short-term' as const },
  { pattern: /import duty|export ban|custom duty|gst (rate|change|council)/i, weight: 8, timing: 'short-term' as const },
]

// Noise patterns — downrank these
const LOW_VALUE_PATTERNS = [
  /expert says|analyst says|market expert|market watch|here.s why/i,
  /stocks to watch|top picks|best stocks/i,
  /5 things|10 things|things to know/i,
  /how to (invest|trade)|investment tips/i,
]

const BULLISH_WORDS = [
  'surge', 'rally', 'gain', 'jump', 'soar', 'rise', 'high', 'profit', 'growth',
  'beat', 'outperform', 'upgrade', 'positive', 'record', 'strong', 'robust',
  'breakout', 'uptrend', 'expansion', 'wins', 'secures', 'approved', 'bags',
]

const BEARISH_WORDS = [
  'fall', 'drop', 'crash', 'plunge', 'sink', 'decline', 'loss', 'miss',
  'underperform', 'downgrade', 'negative', 'weak', 'slump', 'correction',
  'breakdown', 'downtrend', 'fine', 'penalty', 'ban', 'probe', 'default',
]

// ─── ANALYSIS FUNCTIONS ────────────────────────────────────────────────────

function analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = text.toLowerCase()
  let bull = 0, bear = 0
  BULLISH_WORDS.forEach(w => { if (lower.includes(w)) bull++ })
  BEARISH_WORDS.forEach(w => { if (lower.includes(w)) bear++ })
  if (bull > bear && bull >= 1) return 'bullish'
  if (bear > bull && bear >= 1) return 'bearish'
  return 'neutral'
}

function analyzeImpactAndTiming(text: string): {
  impact: 'high' | 'medium' | 'low'
  timing: 'immediate' | 'short-term' | 'informational'
  score: number
  isNoise: boolean
} {
  const lower = text.toLowerCase()

  // Check noise first
  const isNoise = LOW_VALUE_PATTERNS.some(p => p.test(text))

  let totalScore = 0
  let timing: 'immediate' | 'short-term' | 'informational' = 'informational'
  let highestWeight = 0

  for (const { pattern, weight, timing: t } of HIGH_IMPACT_PATTERNS) {
    if (pattern.test(text)) {
      totalScore += weight
      if (weight > highestWeight) {
        highestWeight = weight
        timing = t
      }
    }
  }

  // If noise, downrank
  if (isNoise) totalScore = Math.max(0, totalScore - 5)

  const impact: 'high' | 'medium' | 'low' =
    totalScore >= 9 ? 'high' : totalScore >= 5 ? 'medium' : 'low'

  return { impact, timing, score: totalScore, isNoise }
}

function calcFreshnessScore(publishedAt: string): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime()
  const ageHours = ageMs / (1000 * 60 * 60)
  // Fresh < 1h = 10, 1-2h = 8, 2-4h = 6, 4-8h = 4, >8h = 2, >24h = 0
  if (ageHours < 1) return 10
  if (ageHours < 2) return 8
  if (ageHours < 4) return 6
  if (ageHours < 8) return 4
  if (ageHours < 24) return 2
  return 0
}

function findRelatedStocks(text: string): string[] {
  const lower = text.toLowerCase()
  const related: string[] = []
  for (const [symbol, kws] of Object.entries(STOCK_KEYWORDS)) {
    if (kws.some(kw => lower.includes(kw))) related.push(symbol)
  }
  return related.slice(0, 4)
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeSummary(title: string, description?: string): string {
  const source = description || title
  const clean = cleanText(source)
  if (clean.length <= 160) return clean
  // Cut at last word boundary before 160
  const cut = clean.substring(0, 160)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 100 ? cut.substring(0, lastSpace) : cut) + '…'
}

function generateId(title: string, source: string): string {
  const str = `${title}-${source}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + c
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

// ─── RSS PARSER ──────────────────────────────────────────────────────────────

interface ParsedItem {
  title: string
  link: string
  description?: string
  pubDate?: string
  sourceName?: string  // extracted from Google News <source> tag
}

async function parseRSS(url: string): Promise<ParsedItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 60 }, // 60s cache — matches dashboard refresh
    }).finally(() => clearTimeout(timeout))
    if (!res.ok) return []
    const xml = await res.text()
    const items: ParsedItem[] = []
    const itemRx = /<item>([\s\S]*?)<\/item>/gi
    let m: RegExpExecArray | null

    while ((m = itemRx.exec(xml)) !== null) {
      const chunk = m[1]
      const title = cleanText(
        (chunk.match(/<title><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ||
         chunk.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '')
      )
      const link = cleanText(
        (chunk.match(/<link><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ||
         chunk.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '')
      )
      const desc = cleanText(
        (chunk.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/s)?.[1] ||
         chunk.match(/<description>([\s\S]*?)<\/description>/s)?.[1] || '')
      )
      const pubDate = chunk.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      // Google News includes <source url="...">Publisher Name</source>
      const sourceName = chunk.match(/<source[^>]*>(.*?)<\/source>/)?.[1]?.trim() || undefined
      if (title && link) items.push({ title, link, description: desc, pubDate, sourceName })
    }

    return items.slice(0, 20)
  } catch {
    return []
  }
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────

export async function fetchNews(): Promise<NewsItem[]> {
  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const items = await parseRSS(feed.url)
      return items.map(item => {
        const fullText = `${item.title} ${item.description || ''}`
        const { impact, timing, score, isNoise } = analyzeImpactAndTiming(fullText)
        const publishedAt = item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString()
        const freshness = calcFreshnessScore(publishedAt)
        const relatedStocks = findRelatedStocks(fullText)

        const displaySource = item.sourceName || feed.name
        return {
          id: generateId(item.title, displaySource),
          title: item.title,
          summary: makeSummary(item.title, item.description),
          source: displaySource,
          sourceUrl: item.link,
          publishedAt,
          sentiment: analyzeSentiment(fullText),
          impact,
          timing,
          relatedStocks,
          category: feed.category,
          // Extra fields for ranking
          _score: score + freshness + (relatedStocks.length > 0 ? 2 : 0),
          _isNoise: isNoise,
          _freshness: freshness,
        } as NewsItem & { _score: number; _isNoise: boolean; _freshness: number }
      })
    })
  )

  const all: (NewsItem & { _score?: number; _isNoise?: boolean })[] = []
  for (const r of feedResults) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  // Drop anything older than 24 hours — old news is useless for trading
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  const fresh = all.filter(item => new Date(item.publishedAt).getTime() > cutoff)

  // Dedup by title similarity
  const seen = new Set<string>()
  const unique = fresh.filter(item => {
    const key = item.title.toLowerCase().substring(0, 60)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort: high score + fresh first, noise last
  unique.sort((a: any, b: any) => {
    if (a._isNoise !== b._isNoise) return a._isNoise ? 1 : -1
    return (b._score ?? 0) - (a._score ?? 0)
  })

  return unique.slice(0, 80)
}

export { STOCK_KEYWORDS }
