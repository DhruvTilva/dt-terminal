# DT's Terminal — Interview Preparation Guide

> Simple, clear answers to explain this project in any interview.

---

## 1. Project Overview

**What is it?**
DT's Terminal is a real-time Indian stock market intelligence platform — like a mini Bloomberg terminal for retail traders. It shows live NIFTY/BSE prices, smart news, and auto-detected trade signals in one clean dashboard.

**Why was it built?**
Most retail traders switch between 4–5 different apps (trading app, news sites, screener, etc.) to make a decision. This project brings everything into one place — live prices, relevant news, and trade signals — all updating automatically.

**What problem does it solve?**
- Saves time by combining data sources in one view
- Highlights important signals automatically (no manual scanning)
- Works without login — anyone can use the dashboard instantly

---

## 2. Key Features

- **Live stock data** — NIFTY 50 stocks + indices (NIFTY, SENSEX, BANK NIFTY) refresh every 60 seconds
- **Smart news feed** — Pulls from Moneycontrol, Economic Times, LiveMint, NDTV Profit. Scores news by importance and freshness
- **Trade signals** — Auto-detects breakouts, volume spikes, gap ups/downs, news-triggered moves
- **Trade Finder** — 5 filter strategies to find stocks matching specific patterns
- **ML Trend Prediction (AI)** — Nightly machine learning model predicts next-day direction (bullish/bearish) for each signal stock. Shown as an AI badge in Trade Finder
- **ML Accuracy Tracker** — Automatically grades yesterday's AI predictions against actual market results. Shows 7-day rolling accuracy with a dedicated page
- **Watchlist & Bookmarks** — Saved per user, synced to database
- **Admin Panel** — Manage users, see visitor analytics, block/unblock accounts
- **Guest Mode** — Dashboard fully works without any login

---

## 3. How Trade Finder Works

The Trade Finder has 5 filters. Each one looks for a different type of opportunity:

### Strict Morning Trend
- Looks at the **first hour of trading** (9:30–10:30 AM)
- Requires **all candles in that window to move in one direction** for **3 days in a row**
- Most reliable signal — very strict conditions
- **Best for**: Traders who want high-confidence, low-risk signals

### General Morning Trend
- Also checks morning (9:30–10:30 AM) vs afternoon (10:30–3:30 PM)
- Morning and afternoon direction must **match on all 3 of the last 3 days**
- Less strict than Strict Morning, but still consistent
- **Best for**: Traders okay with slightly softer signals

### Candle Signal
- Looks for specific candlestick patterns (like bullish engulfing, hammer, etc.)
- Pattern-based signal — good for short-term traders
- **Best for**: Technical traders who follow candlestick analysis

### Long Trend
- Checks if a stock has been trending in one direction for multiple days
- Not just morning — looks at overall multi-day movement
- **Best for**: Swing traders who hold for 2–5 days

### High Volatility
- Finds stocks that are moving significantly more than usual (based on % change)
- Good for momentum plays
- **Best for**: Aggressive traders who want big moves, not just consistent ones

---

## 4. AI / ML Features

### Feature: ML Trend Prediction (Nightly)

**What it does:**
Every night after market close, a Python script trains a Logistic Regression model on the last 30 days of trade signal data and predicts whether each stock in today's scan will move up (bullish) or down (bearish) the next day.

**Where it shows:**
In Trade Finder, as an `AI` column after the Score badge — e.g. `↑ 74%` (bullish, 74% confidence) or `↓ 68%` (bearish).

**How it works (step by step):**
1. GitHub Actions triggers the Python script every weeknight at 8 PM IST (after market close)
2. Script fetches last 30 days of data from `trade_finder_results` table
3. Features used: `score`, `change_percent`, `direction` (encoded), `strategy_type` (weighted)
4. Label = did the stock go up the next day? (1 = yes, 0 = no)
5. Trains `LogisticRegression` using `StandardScaler` + `cross_val_score` for accuracy
6. Predicts today's signals and saves to `ml_predictions` table (upsert, so no duplicates)
7. Next.js API route `/api/ml-predictions` returns predictions as a symbol→prediction map
8. Trade Finder fetches this silently on page load — if table not ready, shows no badges (no errors)

**Why Logistic Regression (not a deep neural network)?**
- We have limited data (30 days × ~400 signals = ~12,000 rows max)
- Logistic Regression works well on small, structured data
- Interpretable — you can explain *why* it predicts what it does
- Fast to train and deploy in GitHub Actions (no GPU needed)
- Deep learning requires massive datasets — overkill here

**Key design decisions:**
- `LOOKBACK_DAYS = 30` — enough signal history, not so much that old patterns hurt
- `MIN_TRAINING_ROWS = 20` — if not enough data yet, script skips gracefully (green CI status)
- Deduplication — a stock may appear in multiple strategies; take highest-score row only
- Silent fail — if `ml_predictions` table doesn't exist yet, UI shows no badges, no crash

---

### Feature: ML Accuracy Tracker (Auto-grading)

**What it does:**
Every night, before training the new model, the script checks yesterday's predictions against what actually happened (today's real scan data). It grades each prediction as correct or wrong and stores the result.

**How grading works:**
- Yesterday predicted: RELIANCE → bullish
- Today's scan shows: RELIANCE change_percent = +1.2% → actual direction = bullish
- Result: `was_correct = true`

**Where it shows:**
- A `◎ AI Accuracy` button in the Trade Finder info bar → opens `/trade-finder/ml-accuracy` page
- That page shows: 7-day rolling accuracy stat card + per-day table with color bars
- Color coding: ≥65% green (strong), 55–64% amber (moderate), <55% red (weak)

**DB columns added to `ml_predictions`:**
- `was_correct` (boolean, nullable — null = not yet graded)
- `actual_direction` (text — what actually happened)

**View for aggregation:**
`ml_daily_accuracy` view in Supabase aggregates rows per day: total predicted, correct count, accuracy %.

**Why is this useful?**
- Without accuracy tracking, the AI badge is just a decoration — users have no way to trust it
- With grading, users see "this model was right 68% of the time last week" — that's a real signal
- Nightly auto-grading means accuracy always stays up to date, zero manual work

---

## 5. How Data is Calculated

### Score
- Every trade signal gets a score based on how strong the signal is
- Higher score = stronger signal
- Strict Morning Trend = **90 (highest)**, General Morning = **85**
- Scores help sort and prioritize which opportunities matter most

### Change %
- Simple formula: `((current price - previous close) / previous close) × 100`
- Shown with green (positive) or red (negative) color
- Pulled directly from Yahoo Finance API

### Direction (Bull/Bear)
- Based on whether Change % is positive (Bullish) or negative (Bearish)
- News is also tagged Bullish/Bearish based on keyword matching (e.g., "surge", "profit" = bullish; "fall", "loss" = bearish)

---

## 6. Architecture (Simple Explanation)

### Frontend (UI)
- Built with **Next.js + TypeScript**
- 3-column layout: Watchlist (left) | News + Stocks (center) | Details (right)
- All state managed with **Zustand** (a simple global store)
- Refreshes data every **60 seconds** automatically

### Backend (API Logic)
- Next.js API routes handle all data fetching
- Stocks: fetched from **Yahoo Finance** (server-side, so no CORS issues)
- News: fetched from **6 RSS feeds**, scored and sorted
- Trade signals: calculated by logic in `lib/intelligence.ts` and `lib/trade-strategies.ts`

### Database (Storage)
- **Supabase** (PostgreSQL) stores users, watchlist, bookmarks, visitor logs
- Row-level security ensures users can only see their own data

### How Data Flows
```
User opens dashboard
  → useMarketData hook fires
  → Calls /api/stocks (Yahoo Finance) + /api/news (RSS feeds) in parallel
  → Processes trade signals on server
  → Updates global Zustand store
  → UI re-renders with fresh data
  → Repeats every 60 seconds
```

---

## 7. Authentication System

- **Signup**: User enters name + email + password → Supabase sends confirmation email
- **Email verification**: User clicks link → goes to `/auth/success` page
- **Login**: Email + password → Supabase session created → redirected to dashboard
- **Forgot Password**: Enter email → get reset link → click → set new password
- **Google OAuth**: One-click login with Google account
- **Guest Mode**: Skip login entirely — dashboard works without account
- **Session handling**: Supabase manages JWT tokens, auto-refreshed via Next.js middleware
- **Blocked users**: If admin blocks a user, they get signed out immediately on next login

---

## 8. Admin Panel

**Why it's needed:**
As the creator, I need to see who's using the app, manage user accounts, and keep the database clean.

**What admin can do:**

- **View all users** — name, email, role, when they joined
- **Make someone admin** — toggle admin status with one click
- **Block a user** — prevents them from logging in
- **Visitor Analytics** — see Total Visitors, Today's visitors, Active Now (last 5 min)
- **Database cleanup** — delete old trade data and visitor logs via GitHub Actions

Only users with `is_admin = true` in the database can access the admin panel. Everyone else gets redirected.

---

## 9. Visitor Tracking Logic

**How it works:**
- When anyone opens the app, a silent component (`VisitorTracker`) runs in the background
- It creates a unique session ID and saves it to **localStorage** (browser storage)
- This session ID is sent to the database to record the visit

**Why session-based (not IP-based)?**
- IP tracking is unreliable (shared networks, VPNs)
- Session ID is unique per browser — more accurate for unique visitors

**How duplicates are avoided:**
- The dashboard auto-refreshes every 60 seconds
- Without protection, every refresh would count as a new visit
- Solution: a **5-minute debounce** — if the user already tracked within 5 minutes, skip the API call
- So a user who stays on the page for an hour counts as just ~12 heartbeats, not 60 fake "visits"

---

## 10. Performance & Optimization

- **60-second refresh** — balances freshness vs API rate limits (Yahoo Finance unofficial API can throttle)
- **Server-side fetching** — all stock/news data fetched on server, never from browser directly (avoids CORS)
- **Parallel data fetching** — stocks + news fetched at the same time using `Promise.allSettled`
- **No unnecessary DB calls** — visitor tracking has a 5-min debounce to reduce write volume
- **Cleanup jobs** — old trade data (10 days) and visitor logs (30 days) deleted manually via GitHub Actions to keep DB size under 500 MB free limit
- **New item detection** — after each refresh, only truly new news items get the "NEW" badge (compared against previous IDs)

---

## 11. Challenges Faced

- **Real-time data without WebSockets** — solved by polling every 60s with a countdown timer so users know when next refresh happens
- **Duplicate visitor counting** — 60s auto-refresh would flood the DB; solved with localStorage debounce (5-min minimum between writes)
- **Layout not scrolling properly** — 3-column fixed-height layout required a strict height chain (`html → body → page → panels`) to prevent overflow
- **Database storage growth** — `trade_finder_results` grew 2.7 MB/day; solved by building a manual cleanup job to keep only last 10 days
- **GitHub Actions calling admin API** — browser session not available in CI; solved with a shared secret (`x-cleanup-secret` header) as an alternative auth method
- **Yahoo Finance unofficial API** — can break anytime; fetched server-side so if it fails, only the server sees the error (gracefully handled)

---

## 12. Future Improvements

- **AI stock explanation** — "Why is RELIANCE up today?" answered by AI using latest news
- **Price alerts** — notify users when a stock hits a target price
- **Better analytics dashboard** — charts for visitor growth, most-viewed stocks, etc.
- **Mobile app** — current app is responsive but a dedicated mobile app would improve UX
- **More trade strategies** — RSI-based, moving average crossover, etc.
- **Official stock data API** — switch from Yahoo Finance to Zerodha/Upstox for more reliability

---

## 13. Common Interview Q&A

**Q: Why did you build this project?**
A: I wanted a single place to track Indian stocks, news, and signals without jumping between apps. Most free tools are either too basic or too complex. I built something in the middle — clean, fast, and actually useful for retail traders.

---

**Q: How does your Trade Finder filter system work?**
A: Each filter looks for a different pattern. For example, Strict Morning Trend checks if the first hour of trading moved in one direction for 3 consecutive days — that's a strong signal. Other filters are less strict or look at different timeframes. Traders can pick the filter that matches their style.

---

**Q: How do you ensure data accuracy?**
A: Stock data comes from Yahoo Finance which pulls from NSE/BSE. News is fetched from trusted Indian financial news RSS feeds. For signals, I use thresholds (e.g., volume must be 2× average) to avoid false positives. All data is refreshed every 60 seconds.

---

**Q: How is your app different from NSE/BSE screeners?**
A: Most screeners show numbers but don't explain what's happening. My app combines news + price data + signals in one view. If a stock is moving AND there's news about it, you see both at once. Also it works without login — no sign-up friction.

---

**Q: How do you handle scaling?**
A: The current free stack (Vercel + Supabase) handles well up to ~1,000 users. I've built cleanup jobs to keep DB size under control. If traffic grows, the plan is: upgrade to Supabase Pro ($25/mo) to stop DB pausing, and Vercel Pro ($20/mo) if bandwidth hits 80 GB. Total max cost: $45/month for most scenarios.

---

**Q: How do you track visitors without invading privacy?**
A: I use a random session ID stored in the user's browser (localStorage). No name, no IP, no personal data is stored — just an anonymous UUID tied to a browser session. Users can clear it anytime by clearing browser storage.

---

**Q: How does your ML prediction feature work?**
A: Every night after market close, a Python script runs via GitHub Actions. It fetches the last 30 days of trade signal data from the database, engineers 4 features (score, change %, direction, strategy type), trains a Logistic Regression model, and predicts whether each of today's signal stocks will move up or down the next day. Predictions are saved to the database and shown as an AI badge (e.g. `↑ 74%`) in the Trade Finder.

---

**Q: Why Logistic Regression and not a neural network?**
A: Three reasons — data size, speed, and interpretability. I have at most ~12,000 rows (30 days × ~400 signals). Deep learning needs massive datasets to generalize; Logistic Regression works well on small, structured tabular data. It also trains in seconds inside GitHub Actions (no GPU), and you can explain why it predicts what it does. Neural networks would be overkill and likely overfit here.

---

**Q: How do you validate your AI predictions?**
A: I built an auto-grading system. Every night, before training the new model, the script checks yesterday's predictions against today's actual scan data. For each predicted stock, it compares the predicted direction (bullish/bearish) against whether the actual change % was positive or negative. The result is stored as `was_correct = true/false` in the database. A PostgreSQL view aggregates this into a per-day accuracy table that's shown on the `/trade-finder/ml-accuracy` page with a 7-day rolling accuracy stat.

---

**Q: What accuracy does your ML model achieve?**
A: The cross-validation accuracy on the training set is printed in the GitHub Actions log each night. For market prediction, anything above 55% is meaningful (random would be 50%). The accuracy tracker page shows color-coded thresholds: ≥65% = strong (green), 55–64% = moderate (amber), <55% = weak (red). The honest answer is: the model is a supplementary signal, not a guarantee — users see the accuracy history and can judge trust themselves.

---

**Q: What tech stack did you use and why?**
A: Next.js for the full-stack framework (frontend + API routes in one project), TypeScript for type safety, Supabase for auth + database (easy to set up, free tier), Zustand for state management (simpler than Redux), and Tailwind CSS for styling. This stack is fast to build with, easy to deploy on Vercel, and scales well for a solo project.

---

**Q: How do you handle authentication security?**
A: Supabase handles all auth (JWT tokens, email verification, OAuth). On my side: blocked users get kicked out on next login, admin routes verify `is_admin` from database on every request, and the service role key (which bypasses security rules) is only used server-side and never exposed to the browser.

---

*Last updated: March 2026*
