# DT's Terminal — Project Intelligence Guide

> Complete reference for AI agents and developers. Everything needed to understand, extend, and debug this project.

---

## 1. Project Overview

**DT's Terminal** is a real-time Indian stock market intelligence platform focused on NSE/BSE.

- **Purpose**: Give retail traders a Bloomberg-style terminal with live prices, smart news, and auto-detected trade signals
- **Target market**: Indian retail traders tracking NSE/BSE (NIFTY 50 stocks)
- **Data sources**: Yahoo Finance API (prices) + RSS feeds from Moneycontrol, Economic Times, LiveMint, NDTV Profit (news)
- **Auth**: Supabase (only needed for Watchlist persistence and Bookmarks — dashboard works without login)

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.3.3 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (`@theme` block, no tailwind.config.js) |
| State | Zustand v5 (client-side only, no persistence except theme) |
| Auth | Supabase SSR (`@supabase/ssr`) |
| Fonts | Inter (sans), JetBrains Mono / Fira Code (mono) |
| Key libs | `date-fns`, `rss-parser`, `xml2js`, `lucide-react` |

**Important Tailwind v4 notes:**
- Config is inside `src/app/globals.css` under `@theme { }` — NOT in `tailwind.config.js`
- Color tokens: `--color-bg-primary`, `--color-green`, etc. become `bg-bg-primary`, `text-green` Tailwind classes
- Opacity modifiers like `bg-blue/15` use `color-mix(in oklch, ...)` — for reliability, prefer explicit `rgba(...)` inline styles in critical UI
- No `tailwind.config.js` file exists; all customization is in `globals.css`

---

## 3. Directory Structure

```
src/
├── app/
│   ├── globals.css              ← Design system: colors, fonts, animations, skeleton
│   ├── layout.tsx               ← Root layout — MUST have h-full on html + body
│   ├── page.tsx                 ← Landing page (login/enter buttons)
│   ├── dashboard/
│   │   └── page.tsx             ← Main 3-column dashboard + StatusBar component
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   └── api/
│       ├── stocks/route.ts      ← GET: indices/stocks/market-status | POST: opportunities
│       ├── news/route.ts        ← GET: RSS news with scoring + sentiment
│       ├── watchlist/route.ts   ← CRUD (requires Supabase auth)
│       ├── bookmarks/route.ts   ← CRUD (requires Supabase auth)
│       ├── cron/route.ts        ← Cron endpoint (CRON_SECRET protected)
│       └── auth/                ← Supabase auth callbacks
├── components/
│   ├── layout/
│   │   └── Header.tsx           ← Live ticker, search, alerts, branding, LIVE badge
│   ├── dashboard/
│   │   ├── MarketStats.tsx      ← Right panel default: indices, breadth, signals, gainers/losers
│   │   ├── MarketTicker.tsx     ← (alternate ticker component)
│   │   └── OpportunityCard.tsx  ← Trade signals section (collapsible)
│   ├── news/
│   │   ├── NewsFeed.tsx         ← Center feed: filter tabs, feed rows, NEW highlight
│   │   └── NewsDetail.tsx       ← Right panel when news selected
│   ├── stocks/
│   │   └── StockTable.tsx       ← Sortable stock table with view tabs
│   └── watchlist/
│       └── WatchlistPanel.tsx   ← Left panel: add/remove stocks, live prices
├── hooks/
│   └── useMarketData.ts         ← Data fetching hook: auto-refresh, new item detection
├── lib/
│   ├── stocks.ts                ← Yahoo Finance fetcher (fetchIndices, fetchStocks)
│   ├── news.ts                  ← RSS parser + impact scoring + sentiment analysis
│   ├── intelligence.ts          ← Trade signal detection (breakout, gap, volume, news)
│   └── supabase/
│       ├── client.ts            ← Browser Supabase client
│       ├── server.ts            ← Server Supabase client
│       └── middleware.ts        ← Auth middleware helper
├── store/
│   └── useStore.ts              ← Zustand global store (all app state)
├── types/
│   └── index.ts                 ← TypeScript interfaces
└── middleware.ts                ← Next.js middleware (Supabase session refresh)
```

---

## 4. Design System (globals.css)

### Color Tokens
```css
/* Backgrounds */
--color-bg-primary:    #0B1220   /* Page background */
--color-bg-secondary:  #121A2B   /* Panel/header background */
--color-bg-tertiary:   #1A2336   /* Cards, inputs */
--color-bg-hover:      #18243A   /* Row hover */
--color-bg-active:     #1E2E4A
--color-bg-selected:   #1B2C44   /* Selected news row */

/* Text */
--color-text-primary:   #E6EDF3  /* Main text */
--color-text-secondary: #9FB0C0  /* Subtitles, summaries */
--color-text-muted:     #6B7A90  /* Labels, metadata */

/* Borders */
--color-border-primary:   #263042
--color-border-secondary: #354558

/* Semantic */
--color-green:  #22C55E   /* Gains, live, bullish */
--color-red:    #F43F5E   /* Losses, bearish, high-impact */
--color-yellow: #F59E0B   /* Warnings, medium-impact, amber */
--color-blue:   #3B82F6   /* Primary accent, active states */
--color-cyan:   #22D3EE   /* NEW item highlights */
--color-purple: #8B5CF6
--color-orange: #F97316

/* Fonts */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace
--font-sans: 'Inter', -apple-system, sans-serif
```

### CSS Classes (non-Tailwind)
```css
.section-label      /* 9px mono uppercase tracked label */
.feed-row           /* News row: hover + border-left indicator */
.feed-row.high-impact    /* 2px red left border */
.feed-row.medium-impact  /* 2px yellow left border */
.feed-row.selected       /* Blue left border + bg-selected */
.skeleton           /* Shimmer loading placeholder */
.live-dot           /* Green pulsing animation */
.ticker-track       /* Auto-scrolling ticker animation */
.animate-fade       /* fade-in 0.15s */
.animate-slide-up   /* slide-up 0.2s */
/* keyframe: spin — used for refresh spinner */
```

### Typography Scale
- **Titles**: high-impact 16px / medium 15px / low 14px, lineHeight 1.5
- **Body/Summary**: 13px, lineHeight 1.6
- **Meta/Labels**: 11-12px
- **Section labels**: 9px mono uppercase
- **Brand**: 18px sans, weight 800/700, letter-spacing -0.3px

---

## 5. Layout Architecture

### Critical: Height Chain
This must be maintained or the layout breaks (panels overflow instead of scroll):
```
html { h-full }
  body { h-full overflow-hidden }
    page div { height: 100dvh, overflow: hidden }
      flex children { flex-1 min-h-0 }
        scrollable area { overflow-y-auto }
```
`layout.tsx` must have `className="h-full"` on `<html>` and `className="h-full overflow-hidden"` on `<body>`.

### 3-Column Layout
```
┌──────────────┬──────────────────────────┬────────────────┐
│ LEFT 220px   │ CENTER (flex-1)           │ RIGHT 300px    │
│ Watchlist    │ OpportunityCard           │ NewsDetail     │
│              │ NewsFeed                  │  OR            │
│              │ StockTable                │ MarketStats    │
└──────────────┴──────────────────────────┴────────────────┘
```
- Desktop: `hidden lg:flex` for side panels (always visible)
- Mobile: `fixed` overlay drawers triggered by buttons in center top bar

### Status Bar (bottom, h-7)
Live dot + status text + countdown timer + refresh button. Isolated as `<StatusBar>` component to prevent whole-page re-render from 1s countdown tick.

---

## 6. State Management (useStore.ts)

### Market Data
```typescript
indices: IndexData[]       // NIFTY 50, SENSEX, BANK NIFTY
stocks: Stock[]            // 30 NIFTY stocks with OHLCV
news: NewsItem[]           // Up to 60 items, sorted by impact+freshness
opportunities: Opportunity[] // Up to 20 trade signals
alerts: Alert[]            // Max 50 (FIFO), with read status
```

### UI State
```typescript
isLoading: boolean          // Initial load
isRefreshing: boolean       // Active fetch in progress (shows spinner/REFRESHING)
lastUpdated: string | null  // ISO timestamp of last successful fetch
newItemIds: string[]        // IDs of newly detected news after refresh (cleared after 6s)
selectedNews: NewsItem | null  // Selected item → shows NewsDetail in right panel
opportunityTypeFilter: string | null  // Filter trade signals by type
activeFilter: 'all' | 'high_impact' | 'opportunities' | 'bullish' | 'bearish'
searchQuery: string         // Global search across news + stocks
```

### User Data
```typescript
watchlist: WatchlistItem[]  // Persisted in Supabase
bookmarks: BookmarkItem[]   // Persisted in Supabase
```

---

## 7. Data Flow

```
useMarketData hook (mounted in dashboard/page.tsx)
  │
  ├─ On mount: fetchAllData() immediately
  ├─ Every 60s: setInterval(fetchAllData, 60000)
  │
  fetchAllData():
    1. setRefreshing(true)
    2. Promise.allSettled([
         GET /api/stocks?type=indices   → setIndices()
         GET /api/stocks?type=stocks    → setStocks()
         GET /api/news                  → setNews() + detect new item IDs
       ])
    3. POST /api/stocks?type=opportunities → setOpportunities() + addAlert() for high-impact
    4. setLastUpdated(now)
    5. setRefreshing(false)
```

### New Item Detection
After each refresh (not the first), `useMarketData` compares new news IDs against `prevNewsIdsRef`. New IDs → stored in `newItemIds` store for 6 seconds → NewsFeed applies cyan highlight + "NEW" badge.

---

## 8. API Routes

### `GET /api/stocks`
| Param | Returns |
|-------|---------|
| `?type=indices` | `IndexData[]` — NIFTY 50, SENSEX, BANK NIFTY from Yahoo Finance |
| `?type=stocks` | `Stock[]` — 30 NIFTY stocks (can pass `?symbols=RELIANCE,TCS` to override) |
| `?type=market-status` | `{ isOpen, nextOpenTime, nextCloseTime }` |

### `POST /api/stocks?type=opportunities`
- **Body**: `{ stocks: Stock[], news: NewsItem[] }`
- **Returns**: `Opportunity[]` (max 20, sorted by impact)

### `GET /api/news`
- Fetches 6 RSS feeds, parses, scores, deduplicates, returns top 60 items
- Cached: `revalidate = 180` seconds

### `POST/GET/DELETE /api/watchlist`
- Requires Supabase auth session
- POST: add symbol, GET: list, DELETE: `?symbol=RELIANCE`

### `POST/GET/DELETE /api/bookmarks`
- Requires Supabase auth session

---

## 9. Intelligence Engine (lib/intelligence.ts)

Detects 5 signal types from stock + news data:

| Type | Condition | Impact |
|------|-----------|--------|
| `volume_spike` | `volume > avgVolume × 2` | high if >3x, else medium |
| `gap_up` | `open > prevClose + 2%` | high if >4%, else medium |
| `gap_down` | `open < prevClose - 2%` | high if >4%, else medium |
| `breakout` | `changePercent > 3% AND price ≥ high × 0.99` | high if >5%, else medium |
| `news_correlation` | High-impact news with matching stock move | always high |

Max 20 opportunities returned, sorted by impact.

---

## 10. News Scoring (lib/news.ts)

**Sources**: Moneycontrol (2 feeds), Economic Times (2 feeds), LiveMint, NDTV Profit

**Scoring factors:**
1. **Impact patterns** (regex weight 7-10): earnings, dividends, RBI policy, SEBI orders, M&A, buybacks, IPOs, bulk deals
2. **Freshness**: <1hr = 10pts, <2hr = 8pts, >24hr = excluded
3. **Sentiment**: BULLISH_WORDS vs BEARISH_WORDS count
4. **Stock correlation**: `STOCK_KEYWORDS` dict maps symbols to company name variants
5. **Deduplication**: by first 60 chars of title

**Output**: Top 60 items after dedup + 24hr cutoff, sorted by score.

---

## 11. Data Sources

### Yahoo Finance (Stocks)
```
https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=2d
```
- Indices: `^NSEI` (NIFTY 50), `^BSESN` (SENSEX), `^NSEBANK` (BANK NIFTY)
- Stocks: append `.NS` suffix (e.g., `RELIANCE.NS`)
- Default: 30 NIFTY 50 stocks
- Provides: price, change, OHLC, volume, avgVolume, prevClose

### RSS Feeds (News)
- `https://www.moneycontrol.com/rss/marketreports.xml`
- `https://www.moneycontrol.com/rss/business.xml`
- `https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms`
- `https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms`
- `https://www.livemint.com/rss/markets`
- `https://feeds.feedburner.com/ndtvprofit-latest`

---

## 12. Environment Variables

```env
# Required for Watchlist/Bookmarks persistence
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cron job protection
CRON_SECRET=your-secret-here
```

> The dashboard works fully **without Supabase** — prices and news load without auth. Only watchlist/bookmarks require Supabase.

---

## 13. Key Components Reference

### Header (`components/layout/Header.tsx`)
- Green blinking dot (10px) before brand name
- Brand: "DT's" (#E6EDF3, weight 800) + "Terminal" (#3B82F6, weight 700), 18px Inter sans
- LIVE badge (green) ↔ REFRESHING badge (blue spinner) based on `isRefreshing` store state
- Scrolling ticker (55s loop) with indices + top movers
- Alerts panel with inline red pill badge (no absolute positioning)

### NewsFeed (`components/news/NewsFeed.tsx`)
- Filter tabs: All / ⚡ Actionable / 🔥 High Impact / ▲ Bullish / ▼ Bearish
- Feed rows use `.feed-row` CSS class + impact class for left border color
- NEW items: cyan background + `● NEW` badge (from `newItemIds` store), fades after 6s
- Title sizing: high=16px, med=15px, low=14px
- Summary: 13px, 2-line clamp, only for high+medium impact
- Tags: max 3 stock tags per row

### OpportunityCard (`components/dashboard/OpportunityCard.tsx`)
- Collapsible section with `⚡ TRADE SIGNALS` header
- Type badges: breakout=green, vol_spike=blue, gap_up=green, gap_down=red, news_correlation=yellow
- High-impact items get 2px red left border
- Clicking a signal type in MarketStats filters this list and scrolls to it

### MarketStats (`components/dashboard/MarketStats.tsx`)
- Shown in right panel when no news is selected
- Sections: Indices / Market Breadth / Signals Today (clickable filter buttons) / Top Gainers / Top Losers
- Signal buttons filter OpportunityCard by type when clicked

### StatusBar (inline in `app/dashboard/page.tsx`)
- Isolated component — contains 1s countdown state so only it re-renders each second
- Shows: green dot + LIVE → REFRESHING (blue) → "Updated just now" (8s) → "Auto refresh in Xs"
- Refresh button: spinning ↻ + disabled while fetching

---

## 14. Common Patterns

### Adding a new stock to tracking
Edit `src/lib/stocks.ts` — add symbol to the `NIFTY_50_STOCKS` array and optionally to `DEFAULT_SYMBOLS`.

### Adding a new news source
Edit `src/lib/news.ts` — add to `RSS_FEEDS` array with name, url, category.

### Adding a new trade signal type
1. Add detection logic in `src/lib/intelligence.ts` → `detectOpportunities()`
2. Add type to `Opportunity.type` union in `src/types/index.ts`
3. Add `TYPE_META` entry in `src/components/dashboard/OpportunityCard.tsx`
4. Add signal button in `src/components/dashboard/MarketStats.tsx`

### Changing refresh interval
Edit `src/hooks/useMarketData.ts` — change the `setInterval(fetchAllData, 60000)` value (ms).
Also update the StatusBar countdown initial value in `app/dashboard/page.tsx`.

---

## 15. Known Constraints & Gotchas

1. **Layout height**: `html` and `body` MUST have `h-full` and `h-full overflow-hidden` respectively. Without this, the 3-column layout breaks and content overflows vertically.

2. **Tailwind v4 opacity**: `bg-blue/15` uses `color-mix()` (Chrome 111+ / Firefox 113+ / Safari 16.2+). Use `rgba(59,130,246,0.15)` inline style if targeting older browsers.

3. **Mobile layout**: Side panels use `hidden lg:flex` (not `translate-x-full`). Mobile drawers use `fixed` overlay with conditional render. Do not use `absolute + translate` approach — it fails without constrained parent height.

4. **Next.js cache**: After code changes, if webpack chunk errors appear, run `rm -rf .next && npm run build`.

5. **Yahoo Finance CORS**: Fetched server-side via API routes — never call Yahoo Finance from the browser directly.

6. **No real-time WebSocket**: Data is polled every 60 seconds. This is intentional to stay within free API limits.

7. **Zustand store is in-memory**: All state resets on page refresh. Only `theme` is persisted to localStorage. Watchlist/bookmarks are re-fetched from Supabase on each session.

---

## 16. Run Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (run after major changes)
npm run start    # Serve production build
npm run lint     # ESLint check
```

---

## 17. Supabase Schema (for Watchlist/Bookmarks)

```sql
-- watchlist table
CREATE TABLE watchlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  exchange text DEFAULT 'NSE',
  added_at timestamptz DEFAULT now()
);

-- bookmarks table
CREATE TABLE bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  news_id text NOT NULL,
  news jsonb NOT NULL,
  saved_at timestamptz DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own rows
CREATE POLICY "users own watchlist" ON watchlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
```
