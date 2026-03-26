# DT's Terminal — Scaling Guide

> What you're on now, when to move, and exactly where to go.
> Covers free alternatives + paid upgrades with migration effort rated.

---

## CURRENT FREE STACK (What you're using now)

| Service | What it does | Free Limit |
|---------|-------------|------------|
| **Vercel** (Hobby) | Hosts the Next.js app | 100GB bandwidth/month, 100 deployments/day |
| **Supabase** (Free) | Auth + Watchlist + Bookmarks DB | 500MB DB, 50,000 MAU, pauses after 7 days inactivity |
| **Yahoo Finance API** | Stock price data | Unofficial, no account needed, rate limited |
| **RSS Feeds** | News from MC, ET, Mint, NDTV | Free, no limit |

---

## WHEN TO START WORRYING

| Signal | Action |
|--------|--------|
| > 1,000 monthly active users | Check Supabase MAU dashboard |
| > 80GB bandwidth/month on Vercel | Upgrade Vercel plan |
| Supabase pausing frequently | Switch to always-on DB |
| Yahoo Finance rate limiting (429 errors) | Add caching layer or switch data source |
| > 500MB DB storage | Upgrade Supabase or migrate DB |

---

## HOSTING (Vercel Alternative)

### Currently: Vercel Hobby (Free)
- Limit: 100GB bandwidth, no custom domains on free (1 `.vercel.app` domain)
- Pauses? No — Vercel never pauses deployments

### Free Alternatives

| Option | Pros | Cons | Migration Effort |
|--------|------|------|-----------------|
| **Railway** | Generous free tier, no sleep, easy deploy | 500MB RAM limit on free | ⭐ Easy — push to GitHub, connect |
| **Render** | Free static + web service | Free tier sleeps after 15 min inactivity | ⭐⭐ Medium |
| **Netlify** (Free) | Great for static, good CDN | Next.js SSR support is limited | ⭐⭐⭐ Hard (needs config changes) |
| **Cloudflare Pages** | Unlimited bandwidth free, fast CDN | Next.js edge runtime only (some API routes need changes) | ⭐⭐⭐ Hard |

### Paid Upgrades (Recommended)

| Option | Price | Why Upgrade |
|--------|-------|-------------|
| **Vercel Pro** | $20/month | 1TB bandwidth, faster builds, team features — easiest, zero migration |
| **Railway Starter** | $5/month | No sleep, more RAM, custom domain |
| **Render Starter** | $7/month | No sleep, always-on |

> **My Recommendation**: Stay on Vercel Hobby until you hit 80GB bandwidth. Then upgrade to **Vercel Pro ($20/month)** — zero migration, same platform, just a plan upgrade.

---

## DATABASE & AUTH (Supabase Alternative)

### Currently: Supabase Free
- Limit: 500MB DB, 50,000 MAU
- **Problem**: Pauses after 7 days with no activity — need to wake it manually

### Free Alternatives

| Option | Pros | Cons | Migration Effort |
|--------|------|------|-----------------|
| **PlanetScale** (Free) | MySQL, no pause, 5GB storage | No built-in auth (need separate) | ⭐⭐ Medium |
| **Turso** (Free) | SQLite-based, 500 DBs, 9GB storage | No built-in auth, less familiar | ⭐⭐⭐ Hard |
| **Neon** (Free) | Postgres like Supabase, no pause | Auth needs separate service | ⭐⭐ Medium |
| **Firebase** (Spark) | Auth + DB together, Google-backed | Totally different SDK, big rewrite | ⭐⭐⭐⭐ Very Hard |

### Paid Upgrades (Recommended)

| Option | Price | Why Upgrade |
|--------|-------|-------------|
| **Supabase Pro** | $25/month | Never pauses, 8GB DB, 100K MAU, daily backups — **easiest, same code** |
| **Supabase Team** | $599/month | Unlimited scale, SOC 2, SSO |
| **PlanetScale Scaler** | $29/month | If you switch to MySQL |
| **Neon Launch** | $19/month | More compute, no pause |

> **My Recommendation**: When Supabase pausing becomes annoying → upgrade to **Supabase Pro ($25/month)**. Zero code changes. Same SDK, same schema, just no more sleeping.

---

## STOCK DATA (Yahoo Finance Alternative)

### Currently: Yahoo Finance (Unofficial)
- Free, no API key, fetched server-side
- Risk: Can break anytime (unofficial API), rate limits on heavy traffic

### Free Alternatives

| Option | Pros | Cons | Migration Effort |
|--------|------|------|-----------------|
| **NSE India Unofficial API** | Direct NSE data | Unofficial, can break | ⭐⭐ Medium |
| **Alpha Vantage** (Free) | Official API, 25 req/day free | Only 25 requests/day — not enough | ⭐⭐ Medium |
| **Finnhub** (Free) | 60 req/min, real stocks | US-focused, Indian stocks limited | ⭐⭐⭐ Hard |
| **Groww/Zerodha Kite API** | Indian market focused | Requires broker account | ⭐⭐⭐ Hard |

### Paid Upgrades (Recommended)

| Option | Price | What you get |
|--------|-------|-------------|
| **Alpha Vantage Premium** | $50/month | 75 req/min, reliable, Indian stocks |
| **Finnhub Starter** | $0–$25/month | 300 req/min, Indian market data |
| **Zerodha Kite Connect** | ₹2,000/month | Real-time Indian market data, official NSE/BSE |
| **Upstox API** | ₹0–₹999/month | Indian broker API, real-time data |

> **My Recommendation**: Yahoo Finance is fine until it breaks or you hit rate limits. When you scale, switch to **Zerodha Kite Connect or Upstox API** — they're built for Indian markets and are officially supported.

---

## NEWS DATA (RSS Alternative)

### Currently: 6 Free RSS Feeds
- Moneycontrol, Economic Times, LiveMint, NDTV Profit
- Free, no limits, no API key needed

### Free Alternatives

| Option | Pros | Cons |
|--------|------|------|
| Keep current RSS feeds | Always free | Some feeds go down occasionally |
| **Google News RSS** | Wide coverage | Less financial focus |
| Add more feeds (BSE India, NSE press) | Free | Manual parsing needed |

### Paid Upgrades (Only if RSS breaks)

| Option | Price | What you get |
|--------|-------|-------------|
| **NewsAPI.org** | $449/month (commercial) | Structured news API, 100+ Indian sources |
| **Refinitiv/Reuters** | Enterprise pricing | Professional financial news |

> **My Recommendation**: RSS feeds are solid. Add 2–3 more free RSS feeds before paying for news. Only upgrade if you need structured/real-time news beyond RSS.

---

## CACHING LAYER (When Yahoo Finance Rate Limits)

### Currently: No caching layer (Next.js `revalidate` only)
- News cached for 60s via Next.js fetch cache
- Stocks fetched fresh on each request

### Add Caching (Free)

| Option | How to use | Effort |
|--------|-----------|--------|
| **Upstash Redis** (Free) | Cache Yahoo Finance responses for 30–60s | ⭐⭐ Medium — add Redis client, wrap fetch calls |
| **Vercel KV** (Free tier) | Built into Vercel, Redis-compatible | ⭐ Easy — same as Upstash, native Vercel integration |
| **In-memory cache** (Map) | Simple JS Map in API route | ⭐ Easy — no external service, resets on cold start |

> **My Recommendation**: If Yahoo Finance starts rate limiting, add **Vercel KV** (free 30MB, Redis-compatible) — it's 1 hour of work and no new accounts needed.

---

## COMPLETE SCALE ROADMAP

```
0 – 500 users
└─ Stay on current free stack
   ✓ Vercel Hobby
   ✓ Supabase Free (just wake it when it pauses)
   ✓ Yahoo Finance
   ✓ Free RSS feeds

500 – 2,000 users
└─ Upgrade only what's hurting
   → Supabase Pro ($25/mo) — stops the pausing problem
   → Keep Vercel Hobby (bandwidth probably fine)
   → Add Vercel KV caching if Yahoo Finance slows

2,000 – 10,000 users
└─ Two changes needed
   → Vercel Pro ($20/mo) — bandwidth + speed
   → Supabase Pro ($25/mo) if not already
   → Consider switching to Zerodha/Upstox API for stocks
   Total: ~$45/month

10,000+ users
└─ Full upgrade
   → Vercel Pro or move to Railway/Render
   → Supabase Pro → Supabase Team if MAU > 100K
   → Official stock data API (Zerodha Kite Connect ₹2,000/mo)
   → CDN for static assets
   Total: ~$100–200/month
```

---

## MIGRATION DIFFICULTY RATINGS

| Migration | Difficulty | Code Changes Needed |
|-----------|-----------|---------------------|
| Vercel Hobby → Vercel Pro | ⭐ Trivial | None — just upgrade plan |
| Supabase Free → Supabase Pro | ⭐ Trivial | None — just upgrade plan |
| Yahoo Finance → Alpha Vantage | ⭐⭐ Easy | Change URLs + add API key in `src/lib/stocks.ts` |
| Yahoo Finance → Zerodha Kite | ⭐⭐⭐ Medium | Rewrite `src/lib/stocks.ts` with new SDK |
| Supabase → Firebase | ⭐⭐⭐⭐ Hard | Rewrite all auth + DB queries |
| Vercel → Cloudflare Pages | ⭐⭐⭐ Medium | Edge runtime changes for API routes |
| Add Upstash Redis caching | ⭐⭐ Easy | Wrap fetch calls in `src/lib/stocks.ts` |

---

## BOTTOM LINE

**For 95% of growth scenarios**, you only need 2 paid upgrades ever:

1. **Supabase Pro — $25/month** → When Supabase pausing is annoying or you hit 50K MAU
2. **Vercel Pro — $20/month** → When you hit 80–100GB bandwidth

Everything else (news, stock data, auth) keeps working free well into thousands of users.
**Total maximum cost for most scale scenarios: $45/month.**
