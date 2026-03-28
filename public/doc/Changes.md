# DT's Terminal — Changes Reference

> Quick lookup file. Every section tells you **exactly which file + line number** to edit for a specific change.
> No guessing. Find → Edit → Done.

---

## BRANDING & IDENTITY

### Change app name or tagline
| What | File | Line |
|------|------|------|
| Header brand text ("DT's Terminal") | `src/components/layout/Header.tsx` | ~82–83 |
| AuthLayout desktop brand | `src/components/auth/AuthLayout.tsx` | ~23 |
| AuthLayout mobile brand | `src/components/auth/AuthLayout.tsx` | ~99 |
| AuthLayout desktop tagline | `src/components/auth/AuthLayout.tsx` | ~27–28 |
| Creator page name ("Dhruv Tilva") | `src/app/creator/page.tsx` | 44 |
| Creator page founder tag | `src/app/creator/page.tsx` | 45 |
| Creator page tagline | `src/app/creator/page.tsx` | 47 |
| Footer text ("Built in India…") | `src/app/creator/page.tsx` | 163 |

---

## COLORS & DESIGN SYSTEM

All colors are in one place: `src/app/globals.css`

| Token | Line | Current Value |
|-------|------|---------------|
| Background primary | 5 | `#0B1220` |
| Background secondary (panels) | ~6 | `#121A2B` |
| Background tertiary (cards) | ~7 | `#1A2336` |
| Background hover | ~8 | `#18243A` |
| Text primary | ~13 | `#E6EDF3` |
| Text secondary | ~14 | `#9FB0C0` |
| Text muted | ~15 | `#6B7A90` |
| Border primary | ~18 | `#263042` |
| Green (gains, live) | 22 | `#22C55E` |
| Red (losses, high impact) | ~23 | `#F43F5E` |
| Yellow (warnings) | ~24 | `#F59E0B` |
| Blue (primary accent) | 28 | `#3B82F6` |
| Cyan (NEW highlights) | ~26 | `#22D3EE` |
| Purple (creator accent) | ~27 | `#8B5CF6` |
| Orange (trade finder accent) | ~29 | `#F97316` |
| Font sans | 37 | `'Inter', -apple-system, sans-serif` |
| Font mono | ~36 | `'JetBrains Mono', 'Fira Code', monospace` |

---

## ANIMATIONS & TICKER

| What | File | Line | Current Value |
|------|------|------|---------------|
| Ticker scroll speed | `src/app/globals.css` | 65 | `55s linear infinite` |
| Ticker scroll keyframes | `src/app/globals.css` | ~61–64 | `translateX(0 → -50%)` |
| Live dot pulse animation | `src/app/globals.css` | 97 | `pulse 2s infinite` |
| Section label style | `src/app/globals.css` | 100 | `9px mono uppercase` |

---

## DATA REFRESH & TIMING

| What | File | Line | Current Value |
|------|------|------|---------------|
| Auto-refresh interval | `src/hooks/useMarketData.ts` | 108 | `60000` ms (60s) |
| Initial fetch on mount | `src/hooks/useMarketData.ts` | 105 | `fetchAllData()` |
| StatusBar countdown start | `src/app/dashboard/page.tsx` | 20 | `useState(60)` |
| News cache revalidate | `src/lib/news.ts` | 233 | `revalidate: 60` |
| "NEW" badge timeout | `src/store/useStore.ts` | 52 | `6000` ms (6s) |

> **Rule**: If you change the refresh interval in `useMarketData.ts` line 108, also update the countdown at `dashboard/page.tsx` line 20 to match.

---

## NAVIGATION

### Add or rename a nav item (desktop)
File: `src/components/layout/Header.tsx`

| Nav Item | Line Range |
|----------|------------|
| DASHBOARD button | ~104–114 |
| TRADE FINDER button | ~115–134 |
| CREATOR link (desktop, `hidden sm:block`) | ~205–212 |
| Mobile hamburger button | ~141–148 |
| Mobile menu dropdown | ~151–201 |
| Mobile DASHBOARD item | ~153–163 |
| Mobile TRADE FINDER item | ~164–189 |
| Mobile CREATOR item | ~190–200 |
| ALERTS button | ~244 |
| SAVED button | ~207–209 |
| SIGN IN button | ~312 |
| LIVE badge | ~219–222 |
| REFRESHING badge | ~215–218 |

### Add a new nav page (both desktop + mobile)
1. Add desktop button in `Header.tsx` around line 135 (after TRADE FINDER)
2. Add mobile dropdown item in `Header.tsx` around line 201 (after CREATOR item)
3. Create the page at `src/app/your-page/page.tsx`

---

## STOCKS & MARKET DATA

### Change tracked stocks
File: `src/lib/stocks.ts`

| What | Line |
|------|------|
| NIFTY_50_STOCKS list | 5 |
| Symbols override logic | ~95 |

### Change number of stocks fetched
- Edit the slice in `src/lib/stocks.ts` around where the array is used
- Default fetches 30 NIFTY stocks

### Change stock data source URL
File: `src/lib/stocks.ts` — look for `query1.finance.yahoo.com`

---

## NEWS

### Add a new RSS feed source
File: `src/lib/news.ts`

| What | Line |
|------|------|
| RSS_FEEDS array | 9 |
| HIGH_IMPACT_PATTERNS (scoring) | 54 |
| BULLISH_WORDS | 98 |
| BEARISH_WORDS | 104 |
| Max news items returned | ~328 (`slice(0, 80)`) |

### Change news item limit
File: `src/lib/news.ts` line ~328 — change `slice(0, 80)`

### Change 24-hour freshness cutoff
File: `src/lib/news.ts` — search for `24` or `86400` (seconds)

---

## TRADE SIGNALS (Intelligence Engine)

File: `src/lib/intelligence.ts`

| What | Line | Current Value |
|------|------|---------------|
| Volume spike threshold | 9 | `2` (× avgVolume) |
| High volume spike threshold | ~12 | `3` (× avgVolume for "high" impact) |
| Gap up threshold | 29 | `2%` |
| Gap up "high" threshold | ~32 | `4%` |
| Gap down threshold | ~40 | `2%` |
| Breakout % threshold | 61 | `3%` |
| Breakout "high" threshold | ~64 | `5%` |
| Max opportunities returned | 103 | `slice(0, 20)` |

---

## LAYOUT DIMENSIONS

File: `src/app/dashboard/page.tsx`

| Panel | Line | Current Value |
|-------|------|---------------|
| Left panel (Watchlist) width | 151 | `width: 220` |
| Right panel (MarketStats/NewsDetail) width | 223 | `width: 300` |

> If you change panel widths, make sure center column still has `flex-1` to fill remaining space.

---

## ALERTS

File: `src/store/useStore.ts`

| What | Line |
|------|------|
| Max alerts stored (FIFO after this) | 79 |

---

## CREATOR PAGE

File: `src/app/creator/page.tsx`

| What | Line |
|------|------|
| UPI ID (clipboard copy) | 12 |
| UPI ID (display text) | 144 |
| GitHub profile URL | 73 |
| GitHub Sponsors URL | 98 |
| QR image file (`/qr-upi.png`) | 128 |
| Copy feedback timeout (2s) | 14 |

> QR image must be placed at: `public/qr-upi.png` (project root → public folder)

---

## AUTH PAGES

### Login page
File: `src/app/(auth)/login/page.tsx`

| What | Line |
|------|------|
| Email placeholder | 76 |
| Password placeholder | 95 |
| Redirect after login | 38 (`router.push('/dashboard')`) |
| "Forgot password" link | 86 |
| Guest mode button | 126–131 |

### Signup page
File: `src/app/(auth)/signup/page.tsx`

| What | Line |
|------|------|
| Name placeholder | 105 |
| Email placeholder | 120 |
| Password placeholder | 137 |
| Password min length (6) | 33 |
| Submit button spacing | 153 (`mt-3`) |

### Auth layout (left panel)
File: `src/components/auth/AuthLayout.tsx`

| What | Line |
|------|------|
| Left panel width | ~9 (`lg:w-[360px] xl:w-[400px]`) |
| Content top padding | 16 (`paddingTop: 32`) |
| Brand → heading spacing | 20 (`mb-10`) |
| Feature list items | ~73–77 |
| Exchange tags (NSE · BSE…) | ~87 |

---

## ADMIN PANEL

File: `src/app/admin/page.tsx`

| What | Line |
|------|------|
| Analytics fetch (Total / Today / Active Now) | ~fetchAnalytics callback |
| StatCard component (visitor stat card UI) | ~StatCard function |
| Analytics auto-refresh on auth confirmed | ~useEffect on authChecking |
| Analytics section header + Refresh button | ~"VISITOR ANALYTICS" label |
| Stat card colors (blue/amber/green) | ~StatCard calls |

---

## VISITOR TRACKING

File: `src/components/VisitorTracker.tsx`

| What | Line |
|------|------|
| Heartbeat interval (5 min = skip re-track) | `HEARTBEAT_INTERVAL = 5 * 60 * 1000` |
| localStorage key for session ID | `SESSION_KEY = 'visitor_session_id'` |
| localStorage key for last track time | `LAST_TRACK_KEY = 'visitor_last_track'` |
| Track API endpoint | `/api/visitor/track` (POST) |

> VisitorTracker renders `null` — it's a silent client component in `layout.tsx`.

### Analytics API endpoint
File: `src/app/api/admin/analytics/route.ts`

| What | Line |
|------|------|
| "Active Now" threshold (5 min) | `5 * 60 * 1000` |
| Today cutoff (midnight IST) | `todayStart.setHours(0,0,0,0)` |

---

## DATA CLEANUP / MAINTENANCE

### Trade Finder results cleanup (10-day retention)
File: `src/app/api/admin/cleanup/route.ts`

| What | Note |
|------|------|
| Retention period | 10 days (`cutoff.setDate - 10`) |
| Column compared | `scan_date` (DATE type) |
| Auth: admin session | via `verifyAdmin()` |
| Auth: GitHub Actions | `x-cleanup-secret` header |

GitHub Actions workflow: `.github/workflows/cleanup.yml`
- Manual trigger only (`workflow_dispatch`)
- Required secrets: `SITE_URL`, `CLEANUP_SECRET`

### Visitor logs cleanup (30-day retention)
File: `src/app/api/admin/cleanup-visitors/route.ts`

| What | Note |
|------|------|
| Retention period | 30 days (`cutoff.setDate - 30`) |
| Column compared | `last_active_at` (timestamptz) |
| Auth | same as trade cleanup (session or secret) |

GitHub Actions workflow: `.github/workflows/cleanup-visitors.yml`
- Manual trigger only (`workflow_dispatch`)
- Required secrets: `SITE_URL`, `CLEANUP_SECRET`

---

## SUPABASE & AUTH CONFIG

| What | File | Line |
|------|------|------|
| Supabase browser client | `src/lib/supabase/client.ts` | full file |
| Supabase server client | `src/lib/supabase/server.ts` | full file |
| Auth session middleware | `src/middleware.ts` | full file |
| Profiles table query | `src/components/layout/Header.tsx` | ~27–33 |

### Environment variables
File: `.env.local` (not committed — create manually)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLEANUP_SECRET=
CRON_SECRET=
```

> `SUPABASE_SERVICE_ROLE_KEY` — used by visitor tracking and cleanup routes (server-side only, never expose to client)
> `CLEANUP_SECRET` — shared secret between GitHub Actions and cleanup API routes

---

## NEXT.JS CONFIG

File: `next.config.ts`

| What | Line | Note |
|------|------|------|
| Dev toolbar badge (N badge) | 4 | `devIndicators: false` — intentionally disabled |
| Remote image patterns | 6–8 | Allows all `https://` images |

---

## AI / ML FEATURES

### AI Market Pulse (dashboard center column)
| What | File | Note |
|------|------|------|
| Opening line templates (by NIFTY %) | `src/lib/marketPulse.ts` | lines 46–57 |
| Movers line (top gainer/loser sentence) | `src/lib/marketPulse.ts` | lines 60–72 |
| News line | `src/lib/marketPulse.ts` | line 75 |
| Pulse card UI (colors, layout) | `src/components/dashboard/MarketPulse.tsx` | full file |
| Where pulse appears in dashboard | `src/app/dashboard/page.tsx` | `<MarketPulse />` above `<OpportunityCard />` |

### Strategy Win Rate (Trade Finder tabs)
| What | File | Note |
|------|------|------|
| Win rate calculation logic | `src/app/api/strategy-win-rates/route.ts` | fallback raw query |
| Minimum data points required | `src/app/api/strategy-win-rates/route.ts` | `total >= 10` |
| Win rate subtitle in tab | `src/app/trade-finder/page.tsx` | `winRates[s.key]` IIFE in tab button |
| Win rate state + fetch | `src/app/trade-finder/page.tsx` | `winRates` useState + fetch in useEffect |

### ML Prediction (nightly Python script)
| What | File | Note |
|------|------|------|
| Lookback days (30) | `scripts/predict_trend.py` | `LOOKBACK_DAYS = 30` |
| Min training rows (20) | `scripts/predict_trend.py` | `MIN_TRAINING_ROWS = 20` |
| Strategy weights | `scripts/predict_trend.py` | `STRATEGY_WEIGHT` dict |
| Cron schedule (8 PM IST) | `.github/workflows/ml-predict.yml` | `'30 14 * * 1-5'` |
| ML predictions API | `src/app/api/ml-predictions/route.ts` | returns symbol→prediction map |
| AI badge in Trade Finder rows | `src/app/trade-finder/page.tsx` | `mlPredictions[row.stock_symbol]` |

### ML Accuracy Tracker
| What | File | Note |
|------|------|------|
| Grading logic (Python) | `scripts/predict_trend.py` | `grade_yesterday_predictions()` |
| SQL migration (columns + view) | `supabase/migrations/003_ml_accuracy.sql` | `was_correct`, `actual_direction`, `ml_daily_accuracy` view |
| Accuracy API route | `src/app/api/ml-accuracy/route.ts` | last 14 days + 7-day avg |
| Accuracy page | `src/app/trade-finder/ml-accuracy/page.tsx` | `/trade-finder/ml-accuracy` |
| AI Accuracy button in Trade Finder | `src/app/trade-finder/page.tsx` | `◎ AI Accuracy` button in scan info bar |
| Color thresholds (≥65/55/<55) | `src/app/trade-finder/ml-accuracy/page.tsx` | `AccuracyBar` component |

### Home Page Feature Cards
| What | File | Note |
|------|------|------|
| ML Prediction card (4th card, purple) | `src/app/page.tsx` | color `#A78BFA` |
| AI Prediction in guest popup | `src/components/ui/GuestLoginPopup.tsx` | `highlight: true` row |

---

## QUICK FIND CHEATSHEET

| I want to change… | Go to |
|-------------------|-------|
| App colors | `src/app/globals.css` line 5+ |
| Ticker speed | `src/app/globals.css` line 65 |
| Refresh every X seconds | `src/hooks/useMarketData.ts` line 108 AND `src/app/dashboard/page.tsx` line 20 |
| Which stocks are tracked | `src/lib/stocks.ts` line 5 |
| News sources | `src/lib/news.ts` line 9 |
| Trade signal thresholds | `src/lib/intelligence.ts` line 9+ |
| Nav items (desktop) | `src/components/layout/Header.tsx` line ~102 |
| Nav items (mobile menu) | `src/components/layout/Header.tsx` line ~151 |
| Creator UPI ID | `src/app/creator/page.tsx` line 12 & 144 |
| Creator GitHub link | `src/app/creator/page.tsx` line 73 |
| Login redirect destination | `src/app/(auth)/login/page.tsx` line 38 |
| Panel widths | `src/app/dashboard/page.tsx` line 151 & 223 |
| Alerts limit | `src/store/useStore.ts` line 79 |
| Visitor heartbeat interval | `src/components/VisitorTracker.tsx` (HEARTBEAT_INTERVAL) |
| Trade cleanup retention | `src/app/api/admin/cleanup/route.ts` (setDate - 10) |
| Visitor log retention | `src/app/api/admin/cleanup-visitors/route.ts` (setDate - 30) |
| Admin analytics "Active Now" window | `src/app/api/admin/analytics/route.ts` (5 * 60 * 1000) |
| Market Pulse templates | `src/lib/marketPulse.ts` lines 46–75 |
| Strategy win rate min data points | `src/app/api/strategy-win-rates/route.ts` (`total >= 10`) |
| ML prediction lookback | `scripts/predict_trend.py` (`LOOKBACK_DAYS`) |
| ML cron schedule | `.github/workflows/ml-predict.yml` (cron line) |
