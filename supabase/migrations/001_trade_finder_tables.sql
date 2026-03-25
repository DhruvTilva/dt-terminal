-- ──────────────────────────────────────────────────────────────────────────────
-- Trade Finder Tables
-- Run this in Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────────

-- Scan session tracker (one row per market day)
CREATE TABLE IF NOT EXISTS scan_sessions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_date       date        NOT NULL,
  status          text        NOT NULL DEFAULT 'running'  -- running | completed | partial | failed
                              CHECK (status IN ('running','completed','partial','failed')),
  total_stocks    integer     DEFAULT 0,
  processed_stocks integer    DEFAULT 0,
  signals_found   integer     DEFAULT 0,
  error_count     integer     DEFAULT 0,
  started_at      timestamptz DEFAULT now(),
  completed_at    timestamptz,
  meta            jsonb       DEFAULT '{}'::jsonb        -- extra info (universe size, duration, etc.)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_sessions_date ON scan_sessions(scan_date);


-- Trade signals per day (main results table)
CREATE TABLE IF NOT EXISTS trade_finder_results (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_date       date        NOT NULL,
  session_id      uuid        REFERENCES scan_sessions(id) ON DELETE CASCADE,
  stock_symbol    text        NOT NULL,
  stock_name      text        NOT NULL,
  exchange        text        NOT NULL DEFAULT 'NSE',
  strategy_type   text        NOT NULL
                              CHECK (strategy_type IN (
                                'strict_morning','general_morning',
                                'candle_pattern','long_trend','high_volatility'
                              )),
  direction       text        NOT NULL CHECK (direction IN ('bullish','bearish')),
  score           integer     NOT NULL CHECK (score BETWEEN 0 AND 100),
  match_info      text,
  reason          text        NOT NULL,
  price           numeric(12,2),
  change_percent  numeric(7,2),
  rank            integer,
  created_at      timestamptz DEFAULT now()
);

-- Fast lookup by date + strategy
CREATE INDEX IF NOT EXISTS idx_tfr_date           ON trade_finder_results(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_tfr_date_strategy  ON trade_finder_results(scan_date, strategy_type);
CREATE INDEX IF NOT EXISTS idx_tfr_date_score     ON trade_finder_results(scan_date, score DESC);
CREATE INDEX IF NOT EXISTS idx_tfr_symbol         ON trade_finder_results(stock_symbol);

-- Prevent duplicate signals per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_tfr_unique_signal
  ON trade_finder_results(scan_date, stock_symbol, strategy_type);


-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE scan_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_finder_results  ENABLE ROW LEVEL SECURITY;

-- Public read (no auth required — precomputed data is public)
CREATE POLICY "public read scan_sessions"
  ON scan_sessions FOR SELECT USING (true);

CREATE POLICY "public read trade_finder_results"
  ON trade_finder_results FOR SELECT USING (true);

-- Service role can do everything (inserts from cron job use service key)
CREATE POLICY "service write scan_sessions"
  ON scan_sessions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service write trade_finder_results"
  ON trade_finder_results FOR ALL USING (auth.role() = 'service_role');
