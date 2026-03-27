# DT's Terminal — Project Intelligence Guide

> Complete reference for AI agents and developers. Everything needed to understand, extend, and debug this project.

---

## 1. Project Overview

**DT's Terminal** is a real-time Indian stock market intelligence platform focused on NSE/BSE.

- **Purpose**: Give retail traders a Bloomberg-style terminal with live prices, smart news, and auto-detected trade signals
- **Target market**: Indian retail traders tracking NSE/BSE (NIFTY 50 stocks)
- **Data sources**: Yahoo Finance API (prices) + RSS feeds from Moneycontrol, Economic Times, LiveMint, NDTV Profit (news)
- **Auth**: Supabase (needed for Watchlist, Bookmarks, Admin Panel — dashboard works without login)

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
│   ├── layout.tsx               ← Root layout — includes <VisitorTracker /> component
│   ├── page.tsx                 ← Landing page (login/enter buttons)
│   ├── creator/
│   │   └── page.tsx             ← Meet the Creator page (UPI QR, GitHub, support)
│   ├── dashboard/
│   │   └── page.tsx             ← Main 3-column dashboard + StatusBar component
│   ├── admin/
│   │   └── page.tsx             ← Admin panel (user management + visitor analytics)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── auth/
│   │   ├── success/page.tsx     ← Email confirmation success page
│   │   └── reset-password/page.tsx ← Password reset form
│   └── api/
│       ├── stocks/route.ts      ← GET: indices/stocks/market-status | POST: opportunities
│       ├── news/route.ts        ← GET: RSS news with scoring + sentiment
│       ├── watchlist/route.ts   ← CRUD (requires Supabase auth)
│       ├── bookmarks/route.ts   ← CRUD (requires Supabase auth)
│       ├── cron/route.ts        ← Cron endpoint (CRON_SECRET protected)
│       ├── visitor/
│       │   └── track/route.ts   ← POST: session tracking (insert or heartbeat update)
│       ├── admin/
│       │   ├── users/route.ts         ← GET: list users | PATCH: toggle admin/blocked
│       │   ├── analytics/route.ts     ← GET: visitor stats (total/today/activeNow)
│       │   ├── cleanup/route.ts       ← DELETE: remove trade_finder_results > 10 days
│       │   └── cleanup-visitors/route.ts ← DELETE: remove visitor_logs > 30 days
│       └── auth/
│           └── callback/route.ts ← Supabase auth callback (signup/OAuth/recovery)
├── components/
│   ├── layout/
│   │   └── Header.tsx           ← Live ticker, search, alerts, branding, LIVE badge
│   ├── auth/
│   │   └── AuthLayout.tsx       ← Shared left-panel layout for all auth pages
│   ├── dashboard/
│   │   ├── MarketStats.tsx      ← Right panel default: indices, breadth, signals, gainers/losers
│   │   ├── MarketTicker.tsx     ← (alternate ticker component)
│   │   └── OpportunityCard.tsx  ← Trade signals section (collapsible)
│   ├── news/
│   │   ├── NewsFeed.tsx         ← Center feed: filter tabs, feed rows, NEW highlight
│   │   └── NewsDetail.tsx       ← Right panel when news selected
│   ├── stocks/
│   │   └── StockTable.tsx       ← Sortable stock table with view tabs
│   ├── watchlist/
│   │   └── WatchlistPanel.tsx   ← Left panel: add/remove stocks, live prices
│   └── VisitorTracker.tsx       ← Client component: localStorage session tracking (renders null)
├── hooks/
│   └── useMarketData.ts         ← Data fetching hook: auto-refresh, new item detection
├── lib/
│   ├── stocks.ts                ← Yahoo Finance fetcher (fetchIndices, fetchStocks)
│   ├── news.ts                  ← RSS parser + impact scoring + sentiment analysis
│   ├── intelligence.ts          ← Trade signal detection (breakout, gap, volume, news)
│   ├── trade-strategies.ts      ← Morning trend strategies for Trade Finder
│   └── supabase/
│       ├── client.ts            ← Browser Supabase client
│       ├── server.ts            ← Server Supabase client
│       └── middleware.ts        ← Auth middleware helper
├── store/
│   └── useStore.ts              ← Zustand global store (all app state)
├── types/
│   └── index.ts                 ← TypeScript interfaces
└── middleware.ts                ← Next.js middleware (Supabase session refresh)

public/
└── doc/
    ├── CLAUDE.md                ← This file
    ├── Changes.md               ← Quick file/line reference
    └── Scale.md                 ← Scaling guide

.github/
└── workflows/
    ├── cleanup.yml              ← Manual: delete trade_finder_results > 10 days
    └── cleanup-visitors.yml     ← Manual: delete visitor_logs > 30 days
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
/* Auth page classes */
.auth-input         /* Dark input field style */
.auth-btn-primary   /* Green primary button */
.auth-btn-secondary /* Ghost secondary button */
.auth-google-btn    /* Google OAuth button */
.auth-spinner       /* Loading spinner */
.auth-divider       /* "or" divider with lines */
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

## 6. Auth System

### Pages
| Route | File | Purpose |
|-------|------|---------|
| `/login` | `(auth)/login/page.tsx` | Email/password + Google OAuth + Guest mode |
| `/signup` | `(auth)/signup/page.tsx` | New account + email confirmation flow |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | Send password reset email |
| `/auth/success` | `auth/success/page.tsx` | Shown after email confirmation link clicked |
| `/auth/reset-password` | `auth/reset-password/page.tsx` | Set new password after reset link |

### Auth Callback (`/api/auth/callback`)
Handles all Supabase redirect scenarios:
- `?type=recovery` → redirect to `/auth/reset-password`
- `?type=signup` → redirect to `/auth/success`
- Google OAuth → upsert profile → redirect to `/dashboard`
- Any error → redirect to `/login?error=auth`

### Guest Mode
Login page has "Guest Mode" button that skips auth and goes directly to `/dashboard`. Dashboard works fully without login (no watchlist/bookmarks).

### Blocked Users
Login checks `profiles.is_blocked` — if true, signs user out and shows error message.

---

## 7. State Management (useStore.ts)

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

## 8. Data Flow

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

## 9. API Routes

### Public Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/stocks` | GET | `?type=indices/stocks/market-status` |
| `/api/stocks` | POST | `?type=opportunities` — detect trade signals |
| `/api/news` | GET | RSS news with scoring |
| `/api/watchlist` | GET/POST/DELETE | Requires auth |
| `/api/bookmarks` | GET/POST/DELETE | Requires auth |
| `/api/visitor/track` | POST | Session tracking (no auth needed) |
| `/api/auth/callback` | GET | Supabase auth callback |

### Admin Routes (requires `is_admin = true` in profiles)
| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/users` | GET | List all users with profiles |
| `/api/admin/users` | PATCH | Toggle `is_admin` or `is_blocked` |
| `/api/admin/analytics` | GET | Visitor stats: total/today/activeNow |
| `/api/admin/cleanup` | DELETE | Remove `trade_finder_results` older than 10 days |
| `/api/admin/cleanup-visitors` | DELETE | Remove `visitor_logs` older than 30 days |

**Cleanup routes** also accept `x-cleanup-secret` header (matching `CLEANUP_SECRET` env var) for GitHub Actions calls without a browser session.

---

## 10. Admin Panel (`/admin`)

Access: Only users with `profiles.is_admin = true` can reach this page (redirects to `/dashboard` otherwise).

### Features
- **Visitor Analytics cards** (top): Total Visitors, Today, Active Now — fetched from `/api/admin/analytics`, manual ↻ refresh button
- **User table**: Name, Email, Role badge, Status badge, Created date, Admin toggle, Blocked toggle
- **Search**: Debounced by name/email
- **Filter tabs**: All / Admin / Blocked
- **YOU badge**: Current admin's own row is highlighted and toggles are disabled

### Admin verifyAdmin pattern
All admin API routes use the same `verifyAdmin()` helper that:
1. Gets current session via `createServerClient()`
2. Queries `profiles.is_admin` for that user
3. Returns user object if admin, `null` otherwise

---

## 11. Visitor Tracking

### How It Works
- `<VisitorTracker />` in `layout.tsx` runs on every page (renders nothing visually)
- On mount: checks `localStorage` for `visitor_session_id`
  - **New visitor**: generates UUID, saves to localStorage, POSTs to `/api/visitor/track`
  - **Returning (same session)**: only tracks if `visitor_last_track` was >5 minutes ago (debounce)
- **Why debounced**: Dashboard auto-refreshes every 60s — without debounce, each refresh would create a false write

### Session Storage (localStorage)
```
visitor_session_id   — UUID per browser/tab (persistent across refreshes)
visitor_last_track   — Unix timestamp of last successful track call
```

### API (`/api/visitor/track`)
- Uses admin/service-role client (bypasses RLS)
- First visit: INSERT new row
- Heartbeat: UPDATE `last_active_at` only (preserves `first_visit_at`)
- Silently fails if table doesn't exist yet

### Metrics (via `/api/admin/analytics`)
- **Total Visitors**: COUNT all sessions
- **Today**: COUNT sessions where `first_visit_at` >= today 00:00
- **Active Now**: COUNT sessions where `last_active_at` >= 5 minutes ago

---

## 12. Trade Strategies (lib/trade-strategies.ts)

Two morning-trend strategies for the Trade Finder:

### Strict Morning Trend
- Window: **9:30 AM – 10:30 AM** IST
- Logic: ALL candles in that window moved in **one single direction** for **3 consecutive trading days**
- Score: 90 (highest confidence)
- Most reliable signal

### General Morning Trend
- Morning window: **9:30 AM – 10:30 AM** IST
- Afternoon window: **10:30 AM – 3:30 PM** IST
- Logic: Morning direction must **match** afternoon direction on ALL **3 of last 3** trading days, AND all 3 days must share the **same direction** (all bullish or all bearish)
- Score: 85
- Early exit (returns null) if ANY day has mismatch or insufficient candles

### Helper: `windowCandles(candles, startH, startM, endH, endM)`
Filters 5-min candles to a specific IST time window.

---

## 13. Intelligence Engine (lib/intelligence.ts)

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

## 14. News Scoring (lib/news.ts)

**Sources**: Moneycontrol (2 feeds), Economic Times (2 feeds), LiveMint, NDTV Profit

**Scoring factors:**
1. **Impact patterns** (regex weight 7-10): earnings, dividends, RBI policy, SEBI orders, M&A, buybacks, IPOs, bulk deals
2. **Freshness**: <1hr = 10pts, <2hr = 8pts, >24hr = excluded
3. **Sentiment**: BULLISH_WORDS vs BEARISH_WORDS count
4. **Stock correlation**: `STOCK_KEYWORDS` dict maps symbols to company name variants
5. **Deduplication**: by first 60 chars of title

**Output**: Top 60 items after dedup + 24hr cutoff, sorted by score.

---

## 15. Data Sources

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

## 16. Environment Variables

```env
# Required — Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   ← required for admin routes + visitor tracking

# App URL
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Cron job protection
CRON_SECRET=your-secret-here

# Manual cleanup (used by GitHub Actions workflows)
CLEANUP_SECRET=your-cleanup-secret-here
```

> `SUPABASE_SERVICE_ROLE_KEY` is required for admin panel, visitor tracking, and cleanup routes. Never expose it to the browser.

---

## 17. GitHub Actions Workflows

Both workflows are **manual-trigger only** (`workflow_dispatch`). Run from GitHub → Actions tab → select workflow → Run workflow.

### cleanup.yml — Trade Data Cleanup
- Calls `DELETE /api/admin/cleanup`
- Deletes `trade_finder_results` older than **10 days**
- Required GitHub secrets: `SITE_URL`, `CLEANUP_SECRET`

### cleanup-visitors.yml — Visitor Logs Cleanup
- Calls `DELETE /api/admin/cleanup-visitors`
- Deletes `visitor_logs` older than **30 days**
- Required GitHub secrets: `SITE_URL`, `CLEANUP_SECRET`

---

## 18. Supabase Schema

```sql
-- ── Core tables ──────────────────────────────────────────────────

CREATE TABLE profiles (
  id         uuid REFERENCES auth.users PRIMARY KEY,
  uid        serial,
  name       text,
  email      text,
  is_admin   boolean DEFAULT false,
  is_blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE watchlist (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users NOT NULL,
  symbol     text NOT NULL,
  name       text NOT NULL,
  exchange   text DEFAULT 'NSE',
  added_at   timestamptz DEFAULT now()
);

CREATE TABLE bookmarks (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users NOT NULL,
  news_id    text NOT NULL,
  news       jsonb NOT NULL,
  saved_at   timestamptz DEFAULT now()
);

-- ── Trade Finder ──────────────────────────────────────────────────

CREATE TABLE trade_finder_results (
  -- 15 columns, scan_date DATE is the partition key
  -- Cleaned up via /api/admin/cleanup (keep last 10 days)
);

-- ── Visitor Analytics ─────────────────────────────────────────────

CREATE TABLE visitor_logs (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id     text UNIQUE NOT NULL,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_visit_at timestamptz DEFAULT now() NOT NULL,
  last_active_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_visitor_first  ON visitor_logs (first_visit_at);
CREATE INDEX idx_visitor_active ON visitor_logs (last_active_at);
-- Cleaned up via /api/admin/cleanup-visitors (keep last 30 days)

-- ── RLS Policies ──────────────────────────────────────────────────

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own watchlist" ON watchlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
-- visitor_logs and trade_finder_results use service-role key (bypass RLS)
```

---

## 19. Key Components Reference

### Header (`components/layout/Header.tsx`)
- Green blinking dot (10px) before brand name
- Brand: "DT's" (#E6EDF3, weight 800) + "Terminal" (#3B82F6, weight 700), 18px Inter sans
- LIVE badge (green) ↔ REFRESHING badge (blue spinner) based on `isRefreshing` store state
- Scrolling ticker (55s loop) with indices + top movers
- Alerts panel with inline red pill badge (no absolute positioning)
- **Desktop nav** (`hidden md:flex`): DASHBOARD, TRADE FINDER tabs with active underline
- **CREATOR link** (`hidden sm:block`): before LIVE badge, purple underline when active
- **Mobile hamburger** (`block sm:hidden`): dropdown with Dashboard / Trade Finder / Creator

### AuthLayout (`components/auth/AuthLayout.tsx`)
- Left panel (hidden on mobile, `lg:flex`): branding, chart SVG, feature list, exchange tags
- Right panel: form area, max-width 360px centered
- Mobile: shows logo above form

### NewsFeed (`components/news/NewsFeed.tsx`)
- Filter tabs: All / ⚡ Actionable / 🔥 High Impact / ▲ Bullish / ▼ Bearish
- Feed rows use `.feed-row` CSS class + impact class for left border color
- NEW items: cyan background + `● NEW` badge (from `newItemIds` store), fades after 6s

### OpportunityCard (`components/dashboard/OpportunityCard.tsx`)
- Collapsible section with `⚡ TRADE SIGNALS` header
- Type badges: breakout=green, vol_spike=blue, gap_up=green, gap_down=red, news_correlation=yellow

### VisitorTracker (`components/VisitorTracker.tsx`)
- Renders `null` — zero visual footprint
- All logic in `useEffect` (runs once on mount)
- Silently swallows all errors — never breaks the app

---

## 20. Common Patterns

### Adding a new stock to tracking
Edit `src/lib/stocks.ts` — add symbol to the `NIFTY_50_STOCKS` array.

### Adding a new news source
Edit `src/lib/news.ts` — add to `RSS_FEEDS` array with name, url, category.

### Adding a new trade signal type
1. Add detection logic in `src/lib/intelligence.ts` → `detectOpportunities()`
2. Add type to `Opportunity.type` union in `src/types/index.ts`
3. Add `TYPE_META` entry in `src/components/dashboard/OpportunityCard.tsx`
4. Add signal button in `src/components/dashboard/MarketStats.tsx`

### Changing refresh interval
Edit `src/hooks/useMarketData.ts` — change `setInterval(fetchAllData, 60000)`.
Also update the StatusBar countdown initial value in `app/dashboard/page.tsx`.

### Running manual data cleanup
GitHub → Actions → "Cleanup Old Trade Data" or "Cleanup Old Visitor Logs" → Run workflow.
Or from browser console (logged in as admin):
```js
fetch('/api/admin/cleanup', { method: 'DELETE' }).then(r => r.json()).then(console.log)
fetch('/api/admin/cleanup-visitors', { method: 'DELETE' }).then(r => r.json()).then(console.log)
```

---

## 21. Known Constraints & Gotchas

1. **Layout height**: `html` and `body` MUST have `h-full` and `h-full overflow-hidden` respectively.

2. **Tailwind v4 opacity**: Use `rgba(59,130,246,0.15)` inline style if targeting older browsers.

3. **Mobile layout**: Side panels use `hidden lg:flex`. Mobile drawers use `fixed` overlay.

4. **Next.js cache**: After code changes, if webpack chunk errors appear, run `rm -rf .next && npm run build`.

5. **Yahoo Finance CORS**: Always fetched server-side via API routes — never from browser directly.

6. **No real-time WebSocket**: Data polled every 60 seconds — intentional for free API limits.

7. **Zustand store is in-memory**: Resets on page refresh. Only `theme` persisted to localStorage.

8. **`devIndicators: false`** in `next.config.ts` — disables the Next.js 15 dev toolbar "N" badge.

9. **Static assets** go in `public/` at project root. Access via `/filename.png` in `<Image>`.

10. **SUPABASE_SERVICE_ROLE_KEY** must be set in Vercel env vars for admin routes and visitor tracking to work. It is NOT `NEXT_PUBLIC_` prefixed — server-side only.

11. **visitor_logs table must be created manually** in Supabase SQL editor before visitor tracking activates. Until then, tracking silently fails without affecting the app.

12. **trade_finder_results grows ~2.7 MB/day**. Run cleanup workflow when storage approaches 50 MB (safe until ~6 months from start).

---

## 22. Run Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (run after major changes)
npm run start    # Serve production build
npm run lint     # ESLint check
```
