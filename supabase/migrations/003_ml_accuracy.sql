-- ── ML Prediction Accuracy Tracking ───────────────────────────────────────────
-- Adds grading columns to ml_predictions and a daily accuracy view.
-- Grading happens nightly in predict_trend.py before training:
--   was_correct  = NULL  → not yet graded (future prediction)
--   was_correct  = true  → predicted direction matched actual next-day move
--   was_correct  = false → prediction was wrong

ALTER TABLE ml_predictions
  ADD COLUMN IF NOT EXISTS was_correct      boolean,
  ADD COLUMN IF NOT EXISTS actual_direction text CHECK (actual_direction IN ('bullish', 'bearish'));

-- Index for fast accuracy queries
CREATE INDEX IF NOT EXISTS idx_ml_pred_graded
  ON ml_predictions (prediction_date DESC)
  WHERE was_correct IS NOT NULL;

-- ── Daily accuracy view ────────────────────────────────────────────────────────
-- Aggregates per-day accuracy across all graded predictions.
CREATE OR REPLACE VIEW ml_daily_accuracy AS
SELECT
  prediction_date,
  COUNT(*)                                          AS total_predictions,
  COUNT(*) FILTER (WHERE was_correct = true)        AS correct_predictions,
  ROUND(
    COUNT(*) FILTER (WHERE was_correct = true)::numeric
    / NULLIF(COUNT(*), 0) * 100,
    1
  )                                                 AS accuracy_pct
FROM ml_predictions
WHERE was_correct IS NOT NULL
GROUP BY prediction_date
ORDER BY prediction_date DESC;

-- Public read access (same pattern as other tables)
GRANT SELECT ON ml_daily_accuracy TO anon, authenticated;
