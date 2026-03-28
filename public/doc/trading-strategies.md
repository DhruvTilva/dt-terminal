# DT's Terminal — Trade Finder Strategy Guide

> Complete reference for all 5 scanning strategies. How each filter works, what data it uses, and example outputs.

---

## Overview

| # | Strategy | Time Frame | Data Used | Score |
|---|----------|-----------|-----------|-------|
| 1 | Strict Morning Trend | 9:30 – 10:30 AM | 5-min candles, last 3 days | 92 (fixed) |
| 2 | General Morning Trend | 9:30 – 10:30 AM + 10:30 – 3:30 PM | 5-min candles, last 3 days | 85 (fixed) |
| 3 | Candle Pattern | Latest session | Last 5 candles of latest day | 75 – 80 |
| 4 | Long Trend | 1 month+ | Daily candles, 60 days | 65 – 95 |
| 5 | High Volatility Move | 9:30 – 10:30 AM | 5-min candles, last 3 days | 60 – 95 |

---

## Strategy 1 — Strict Morning Trend

**Category Label:** `Strict Morning Trend`
**Direction:** Bullish or Bearish

### How It Works

- Time window: **9:30 AM → 10:30 AM**
- Checks last **3 consecutive trading days**
- For each day: every single 5-min candle must close **strictly higher** (bullish) or **strictly lower** (bearish) than the previous candle
- All 3 days must show the same direction

### Filter Logic

```
For each day in last 3 days:
  morning candles = 5-min candles from 9:30 to 10:30
  if every candle[i].close > candle[i-1].close → BULLISH day
  if every candle[i].close < candle[i-1].close → BEARISH day
  else → MIXED (disqualified)

Pass condition:
  bullCount = 3 → Bullish signal
  bearCount = 3 → Bearish signal
  anything else → No signal
```

### Score
Fixed at **92** — highest confidence strategy (strictest condition)

### Example
```
RELIANCE — 3/3 days strict bullish
Day 1: 9:15→9:20→9:25→9:30... every candle closed higher ✓
Day 2: Same pattern ✓
Day 3: Same pattern ✓
→ Signal: Strict Morning Trend (Bullish) · Score 92
```

### What It Means for Trader
Stock has shown machine-like consistency in morning direction. Very high probability of same direction next day. Best for early morning momentum trades.

---

## Strategy 2 — General Morning Trend

**Category Label:** `General Morning Trend`
**Direction:** Bullish or Bearish

### How It Works

- Morning window: **9:30 AM → 10:30 AM**
- Afternoon window: **10:30 AM → 3:30 PM**
- Checks last **3 trading days** (all 3 must pass)
- For each day: morning direction must match afternoon direction
- All 3 days must also share the **same overall direction**

### Filter Logic

```
For each day in last 3 days:
  morningOpen    = first candle open  at or after 9:30 AM
  morningClose   = last candle close  at or before 10:30 AM
  afternoonOpen  = first candle open  at or after 10:30 AM
  afternoonClose = last candle close  at or before 3:30 PM

  if morningClose > morningOpen  → morning  = Bullish
  if morningClose < morningOpen  → morning  = Bearish
  if afternoonClose > afternoonOpen → afternoon = Bullish
  if afternoonClose < afternoonOpen → afternoon = Bearish

  if morning != afternoon → day is INVALID → stock FAILS immediately

Pass condition:
  All 3 days valid AND all 3 bullish → Bullish signal (score 85)
  All 3 days valid AND all 3 bearish → Bearish signal (score 85)
  Any mismatch or mixed direction     → NO signal
```

### Score
Fixed score of **85** for all passing stocks (strict condition means high quality).

### Example
```
INFY — all 3 days consistent bullish
Day 1: Morning 9:30→10:30 Bull ✓ · Afternoon 10:30→3:30 Bull ✓ → valid
Day 2: Morning 9:30→10:30 Bull ✓ · Afternoon 10:30→3:30 Bull ✓ → valid
Day 3: Morning 9:30→10:30 Bull ✓ · Afternoon 10:30→3:30 Bull ✓ → valid
→ Signal: General Morning Trend (Bullish) · 3/3 days consistent · Score 85

HDFC — day 2 mismatch
Day 1: Morning Bull ✓ · Afternoon Bull ✓ → valid
Day 2: Morning Bull ✓ · Afternoon Bear ✗ → INVALID → stock FAILS
→ No signal
```

### What It Means for Trader
Stock consistently follows its morning direction for the rest of the day — 3 days in a row. High-confidence follow-through pattern. Enter in direction of morning bias after 10:30 confirmation.

---

## Strategy 3 — Candle Pattern Detection

**Category Label:** `Candle Signals`
**Direction:** Bullish or Bearish

### How It Works

- Looks at the **last 5 candles** of the **most recent trading session** (5-min timeframe)
- Scans from most recent to oldest
- Returns the **first pattern found** (highest priority to latest candle)

### 4 Patterns Detected

---

#### Pattern A: Hammer (Bullish Reversal)

```
Conditions:
  lowerWick ≥ body × 2       (long lower wick)
  upperWick ≤ body × 0.5     (tiny upper wick)
  bodyRatio ≤ 0.4            (small body, top 40% of candle)

Score: 75
```

**Example:**
```
Candle: Open 500, High 502, Low 488, Close 501
  body = |501-500| = 1
  lowerWick = 500-488 = 12  → 12 ≥ 1×2 ✓
  upperWick = 502-501 = 1   → 1 ≤ 0.5 ✓
  bodyRatio = 1/14 = 0.07   → ≤ 0.4 ✓
→ Signal: Hammer · Bullish Reversal · Score 75
```

---

#### Pattern B: Shooting Star (Bearish Reversal)

```
Conditions:
  upperWick ≥ body × 2       (long upper wick)
  lowerWick ≤ body × 0.5     (tiny lower wick)
  bodyRatio ≤ 0.4            (small body, bottom 40% of candle)

Score: 75
```

**Example:**
```
Candle: Open 500, High 514, Low 499, Close 501
  body = 1, upperWick = 13, lowerWick = 1
  → Shooting Star · Bearish Reversal · Score 75
```

---

#### Pattern C: Strong Bullish Candle (Continuation)

```
Conditions:
  close > open                        (green candle)
  (close - open) / open > 0.008      (>0.8% body move)
  upperWick ≤ body × 0.3             (closed near high)

Score: 80
```

**Example:**
```
Candle: Open 1000, Close 1012, High 1013, Low 999
  move = 1.2% > 0.8% ✓
  upperWick = 1013-1012 = 1
  body = 12 → upperWick ≤ 12×0.3=3.6 ✓
→ Signal: Strong Bullish +1.20% · Continuation · Score 80
```

---

#### Pattern D: Strong Bearish Candle (Continuation)

```
Conditions:
  open > close                        (red candle)
  (open - close) / open > 0.008      (>0.8% body drop)
  lowerWick ≤ body × 0.3             (closed near low)

Score: 80
```

---

### What It Means for Trader
Short-term signal based on latest price action. Hammer/Shooting Star = reversal play. Strong candles = continuation play. Use with caution — single candle patterns have lower reliability than multi-day strategies.

---

## Strategy 4 — Long Trend

**Category Label:** `Long Trend`
**Direction:** Bullish or Bearish

### How It Works

- Uses **daily candles** (60-day history)
- Requires **20-day SMA** and **50-day SMA**
- Bullish: price > 20SMA > 50SMA
- Bearish: price < 20SMA < 50SMA
- Must be in trend for **≥20 consecutive trading days** (~1 month)
- **Overextension filter:** excludes stocks >15% away from 20SMA

### Filter Logic

```
currentSma20 = average of last 20 daily closes
sma50        = average of last 50 daily closes

Bullish condition: price > sma20 > sma50
Bearish condition: price < sma20 < sma50

Count consecutive days from today going backwards where condition holds
If trendDays < 20 → No signal
If |distFromSma20| > 15% → No signal (overextended)
```

### Score Formula
```
score = min(95, 65 + floor(trendDays × 0.5))

20 days (~1 month)  → 65 + 10 = 75
40 days (~2 months) → 65 + 20 = 85
60 days (~3 months) → 65 + 30 = 95
```

### Entry Zone Labels
```
dist from 20SMA ≤ 5%  → "Excellent entry zone — price near 20MA"
dist from 20SMA ≤ 10% → "Acceptable entry — slightly extended"
dist from 20SMA > 10% → "Extended — wait for pullback to 20MA"
```

### Example
```
HDFC Bank — Uptrend 35 trading days
  Price: ₹1720
  20SMA: ₹1685  → price 2.1% above → Excellent entry zone
  50SMA: ₹1640  → 20SMA > 50SMA ✓
  trendDays: 35 (1.5+ months)
→ Signal: Long Trend (Bullish) · ~1 month (35 days) · +2.1% from 20MA · Score 82
```

### What It Means for Trader
Stock is in a confirmed macro trend. Best for swing trades or positional entries. Stocks near 20SMA are better entry points. Avoid if >10% extended — wait for pullback.

---

## Strategy 5 — High Volatility Morning Move

**Category Label:** `High Volatility Move`
**Direction:** Bullish or Bearish (based on day's change %)

### How It Works

- Time window: **9:30 AM → 10:30 AM**
- Checks last **3 trading days**
- For each day: calculates `% move = ((high - low) / open) × 100`
- All 3 days must be in **safe zone: 2.2% ≤ move < 4.5%**
- **Volume confirmation:** morning candle volume ≥ 1.5x average (at least 2 of 3 days)
- **Overextension filter:** any day ≥ 4.5% → excluded (reversal risk)

### Filter Logic

```
For each day in last 3 days:
  morning candles = 9:30 to 10:30 (5-min)
  open   = first candle open
  high   = max(all candle highs)
  low    = min(all candle lows)
  pctMove = ((high - low) / open) × 100

  morningVolAvg = avg volume per candle in morning window
  fullDayVolAvg = avg volume per candle for full day
  volRatio = morningVolAvg / fullDayVolAvg

Pass condition:
  ALL 3 days: 2.2% ≤ pctMove < 4.5%
  AT LEAST 2 of 3 days: volRatio ≥ 1.5
```

### Score Formula
```
baseScore = min(88, 60 + floor((avgPct - 2.2) / (4.5 - 2.2) × 28))
finalScore = volConfirmed ? min(95, baseScore + 7) : baseScore

avgPct = 2.2% → score 60 (+ 7 if volume) = 67
avgPct = 3.0% → score 70 (+ 7 if volume) = 77
avgPct = 4.0% → score 82 (+ 7 if volume) = 89
```

### Example
```
ICICI Bank — High Volatility Morning Move
Day 1: Open 1100, High 1133, Low 1107 → (26/1100)×100 = 2.36% ✓
Day 2: Open 1095, High 1130, Low 1102 → (28/1095)×100 = 2.56% ✓
Day 3: Open 1110, High 1150, Low 1115 → (35/1110)×100 = 3.15% ✓
  All in [2.2%, 4.5%) ✓
  Volume: Day 1 1.8x ✓, Day 2 1.2x ✗, Day 3 2.1x ✓ → 2/3 confirmed ✓
  avgPct = 2.69%

→ Signal: Avg 2.7% move (2.4%, 2.6%, 3.2%) · Vol ✓
→ "Watch for breakout after 10:05 AM · Exit before 3:15 PM"
→ Score: ~74
```

### What It Gets Excluded
```
❌ Day move = 1.8% → below 2.2% → too weak
❌ Day move = 5.2% → above 4.5% → overextended, reversal risk
❌ Only 1/3 days qualify → not consistent enough
❌ Volume < 1.5x on 2+ days → low conviction (still passes but no Vol ✓ bonus)
```

### What It Means for Trader
Stock consistently moves 2-4% in the morning hour. High volatility but not overextended. Ideal for intraday scalping and momentum trades. Entry after 10:05 AM breakout confirmation. Exit before 3:15 PM.

---

## Scoring Summary

| Score Range | Meaning |
|-------------|---------|
| 90 – 95 | Very high confidence — strong multi-day pattern |
| 80 – 89 | High confidence — good signal, volume or pattern confirmed |
| 70 – 79 | Moderate confidence — directional bias present |
| 60 – 69 | Lower confidence — signal detected but weaker |

---

## Data Sources

- **Intraday (5-min):** Yahoo Finance `interval=5m&range=10d`
- **Daily:** Yahoo Finance `interval=1d&range=60d`
- **Symbols:** NSE stocks with `.NS` suffix (e.g. `RELIANCE.NS`)

---

## Quick Reference — What Disqualifies a Stock

| Strategy | Disqualified If |
|----------|----------------|
| Strict Morning | Any candle breaks the streak on any of 3 days |
| General Morning | Fewer than 3 of 5 days in same direction |
| Candle Pattern | No hammer / shooting star / strong candle in last 5 |
| Long Trend | Fewer than 20 consecutive trend days OR >15% from 20SMA |
| High Volatility | Any day <2.2% or ≥4.5%, or fewer than 3 qualifying days |

---

## TL;DR — All 5 Filters in Simple Words

| # | Filter | In Simple Words |
|---|--------|----------------|
| 1 | **Strict Morning Trend** | Every single 5-min candle went up (or down) without fail, for 3 days in a row. The most reliable signal. |
| 2 | **General Morning Trend** | The stock mostly went up (or down) from 9:15 to 10:00 — at least 3 out of the last 5 days. A softer version of #1. |
| 3 | **Candle Pattern** | The latest candle looks like a Hammer, Shooting Star, or a very strong green/red bar. Short-term reversal or continuation hint. |
| 4 | **Long Trend** | Stock has been in a clean uptrend or downtrend for 1+ month based on 20-day and 50-day moving averages. Good for swing trades. |
| 5 | **High Volatility Move** | Stock moved 2.2%–4.5% between 9:30–10:30 AM on all 3 last days with good volume. Not too weak, not overextended. Best for intraday scalping. |

