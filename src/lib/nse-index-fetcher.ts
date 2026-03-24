/**
 * NSE Index Constituent Fetcher
 *
 * Downloads official index CSV files from NSE archives.
 * Caches results for 24 hours in memory.
 * Falls back to static lists if NSE is unreachable.
 *
 * Official indices:
 *   NIFTY 100       → Large Cap  (top 100 by market cap)
 *   NIFTY Midcap 150 → Mid Cap   (rank 101–250)
 *   NIFTY Smallcap 250 → Small Cap (rank 251–500)
 */

import type { StockEntry } from './stock-universe'

export type NSEIndexKey = 'nifty100' | 'midcap150' | 'smallcap250'

// Primary + fallback URLs (tried in order)
const INDEX_URLS: Record<NSEIndexKey, string[]> = {
  nifty100: [
    'https://archives.nseindia.com/content/indices/ind_nifty100list.csv',
    'https://www.niftyindices.com/IndexConstituents/ind_nifty100list.csv',
  ],
  midcap150: [
    'https://archives.nseindia.com/content/indices/ind_niftymidcap150list.csv',
    'https://www.niftyindices.com/IndexConstituents/ind_niftymidcap150list.csv',
  ],
  smallcap250: [
    'https://archives.nseindia.com/content/indices/ind_niftysmlcap250list.csv',
    'https://www.niftyindices.com/IndexConstituents/ind_niftysmlcap250list.csv',
  ],
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/csv, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/',
  'Origin': 'https://www.nseindia.com',
}

// ─── In-memory cache (24h TTL) ────────────────────────────────────────────────

const cache = new Map<NSEIndexKey, { stocks: StockEntry[]; fetchedAt: number; source: string }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function stripQuotes(s: string): string {
  return s.trim().replace(/^["']|["']$/g, '')
}

/**
 * NSE CSV format:
 * Company Name,Industry,Symbol,Series,ISIN Code
 * ADANI ENTERPRISES LIMITED,METALS & MINING,ADANIENT,EQ,INE423A01024
 */
function parseNSECsv(text: string): StockEntry[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => stripQuotes(h).toLowerCase())
  const symbolIdx = headers.indexOf('symbol')
  const nameIdx = headers.indexOf('company name')

  if (symbolIdx === -1) {
    console.warn('[nse-fetcher] "Symbol" column not found in CSV headers:', headers)
    return []
  }

  const results: StockEntry[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(stripQuotes)
    const symbol = cols[symbolIdx]?.trim()
    if (!symbol || symbol.length === 0) continue

    const rawName = nameIdx >= 0 ? cols[nameIdx]?.trim() : ''
    // Title-case the name (NSE CSVs are ALL CAPS)
    const name = rawName
      ? rawName.replace(/\b\w/g, c => c.toUpperCase())
      : symbol

    // Yahoo Finance requires URL-encoding of & in the path
    const yahooSymbol = symbol.includes('&')
      ? `${symbol.replace(/&/g, '%26')}.NS`
      : undefined

    results.push({ symbol, name, yahooSymbol })
  }

  return results
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function tryFetchCsv(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10_000), // 10s timeout
    })
    if (!res.ok) return null
    const text = await res.text()
    // Sanity: must look like a CSV with Symbol column
    if (!text.toLowerCase().includes('symbol')) return null
    return text
  } catch {
    return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface FetchResult {
  stocks: StockEntry[]
  source: 'live' | 'cache' | 'fallback'
  fetchedAt: number
  count: number
}

/**
 * Fetch NSE index constituents.
 * Returns live data when available, cached data if fresh, null if all sources fail.
 */
export async function fetchNSEIndex(key: NSEIndexKey): Promise<FetchResult | null> {
  // Return cache if fresh
  const hit = cache.get(key)
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
    return { stocks: hit.stocks, source: 'cache', fetchedAt: hit.fetchedAt, count: hit.stocks.length }
  }

  // Try each URL in order
  const urls = INDEX_URLS[key]
  for (const url of urls) {
    const csv = await tryFetchCsv(url)
    if (!csv) continue

    const stocks = parseNSECsv(csv)
    if (stocks.length < 10) continue // Reject malformed response

    const now = Date.now()
    cache.set(key, { stocks, fetchedAt: now, source: url })
    console.info(`[nse-fetcher] ✓ Loaded ${stocks.length} stocks for "${key}" from ${url}`)

    return { stocks, source: 'live', fetchedAt: now, count: stocks.length }
  }

  // All URLs failed — return stale cache if available
  if (hit) {
    console.warn(`[nse-fetcher] All URLs failed for "${key}", serving stale cache (${Math.round((Date.now() - hit.fetchedAt) / 3600000)}h old)`)
    return { stocks: hit.stocks, source: 'cache', fetchedAt: hit.fetchedAt, count: hit.stocks.length }
  }

  console.warn(`[nse-fetcher] All URLs failed for "${key}" and no cache available — will use static fallback`)
  return null
}

/**
 * Warms up the cache for all three indices in parallel.
 * Call this from an API route or startup hook.
 */
export async function warmNSECache(): Promise<void> {
  await Promise.allSettled([
    fetchNSEIndex('nifty100'),
    fetchNSEIndex('midcap150'),
    fetchNSEIndex('smallcap250'),
  ])
}

/** Returns cached stock count without triggering a fresh fetch. */
export function getCachedCount(key: NSEIndexKey): number | null {
  return cache.get(key)?.stocks.length ?? null
}
