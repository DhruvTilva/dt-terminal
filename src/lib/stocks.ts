import type { Stock, IndexData, MarketStatus } from '@/types'

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

const NIFTY_50_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
  { symbol: 'ITC', name: 'ITC' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
  { symbol: 'LT', name: 'Larsen & Toubro' },
  { symbol: 'AXISBANK', name: 'Axis Bank' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma' },
  { symbol: 'WIPRO', name: 'Wipro' },
  { symbol: 'HCLTECH', name: 'HCL Technologies' },
  { symbol: 'TITAN', name: 'Titan Company' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement' },
  { symbol: 'NESTLEIND', name: 'Nestle India' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp' },
  { symbol: 'NTPC', name: 'NTPC' },
  { symbol: 'TATASTEEL', name: 'Tata Steel' },
  { symbol: 'TECHM', name: 'Tech Mahindra' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises' },
  { symbol: 'COALINDIA', name: 'Coal India' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel' },
]

const INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY' },
]

async function fetchYahooQuote(symbol: string): Promise<any> {
  try {
    const yahooSymbol = symbol.startsWith('^') ? symbol : `${symbol}.NS`
    const res = await fetch(
      `${YAHOO_BASE}/${yahooSymbol}?interval=1d&range=2d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 60 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.chart?.result?.[0] || null
  } catch {
    return null
  }
}

export async function fetchIndices(): Promise<IndexData[]> {
  const results = await Promise.allSettled(
    INDICES.map(async (idx) => {
      const data = await fetchYahooQuote(idx.symbol)
      if (!data) return null
      const meta = data.meta
      const price = meta.regularMarketPrice
      const prevClose = meta.chartPreviousClose || meta.previousClose
      const change = price - prevClose
      const changePercent = (change / prevClose) * 100
      return {
        name: idx.name,
        value: price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        lastUpdated: new Date().toISOString(),
      }
    })
  )
  return results
    .filter((r) => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<IndexData | null>).value)
    .filter((v): v is IndexData => v !== null)
}

export async function fetchStocks(symbols?: string[]): Promise<Stock[]> {
  const stockList = symbols
    ? symbols.map(s => {
        const found = NIFTY_50_STOCKS.find(st => st.symbol === s)
        return { symbol: s, name: found?.name || s }
      })
    : NIFTY_50_STOCKS.slice(0, 15) // Default: top 15

  const results = await Promise.allSettled(
    stockList.map(async (stock) => {
      const data = await fetchYahooQuote(stock.symbol)
      if (!data) return null
      const meta = data.meta
      const quotes = data.indicators?.quote?.[0]
      const price = meta.regularMarketPrice
      const prevClose = meta.chartPreviousClose || meta.previousClose
      const change = price - prevClose
      const changePercent = (change / prevClose) * 100
      const lastVolume = quotes?.volume?.slice(-1)[0] || 0
      const avgVolume = quotes?.volume
        ? quotes.volume.reduce((a: number, b: number) => a + (b || 0), 0) / quotes.volume.filter((v: number) => v).length
        : 0

      return {
        symbol: stock.symbol,
        name: stock.name,
        exchange: 'NSE' as 'NSE' | 'BSE',
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: lastVolume as number,
        avgVolume: Math.round(avgVolume),
        high: (meta.regularMarketDayHigh || price) as number,
        low: (meta.regularMarketDayLow || price) as number,
        open: (meta.regularMarketOpen || prevClose) as number,
        prevClose: prevClose as number,
        lastUpdated: new Date().toISOString(),
      } satisfies Stock
    })
  )

  return results
    .filter((r) => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<Stock | null>).value)
    .filter((v): v is Stock => v !== null)
}

export async function fetchSingleStock(symbol: string): Promise<Stock | null> {
  const stocks = await fetchStocks([symbol])
  return stocks[0] || null
}

export function getMarketStatus(): MarketStatus {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hours = ist.getHours()
  const minutes = ist.getMinutes()
  const day = ist.getDay()
  const timeInMinutes = hours * 60 + minutes

  const isWeekday = day >= 1 && day <= 5
  const marketOpen = 9 * 60 + 15 // 9:15 AM
  const marketClose = 15 * 60 + 30 // 3:30 PM

  const isOpen = isWeekday && timeInMinutes >= marketOpen && timeInMinutes <= marketClose

  return { isOpen }
}

export function getTopGainers(stocks: Stock[]): Stock[] {
  return [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
}

export function getTopLosers(stocks: Stock[]): Stock[] {
  return [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5)
}

export function getVolumeSpikes(stocks: Stock[]): Stock[] {
  return stocks.filter(s => s.avgVolume && s.volume > s.avgVolume * 1.5)
}

export { NIFTY_50_STOCKS }
