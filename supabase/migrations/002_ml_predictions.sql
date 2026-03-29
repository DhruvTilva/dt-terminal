CREATE TABLE IF NOT EXISTS ml_predictions (
  id                 uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_date    date          NOT NULL,
  stock_symbol       text          NOT NULL,
  predicted_direction text         NOT NULL CHECK (predicted_direction IN ('bullish', 'bearish')),
  confidence         numeric(5,2)  NOT NULL,   -- e.g. 74.30 means 74.3%
  model_accuracy     numeric(5,2),             -- cross-val accuracy of the model that day
  created_at         timestamptz   DEFAULT now(),

  UNIQUE (prediction_date, stock_symbol)
);

CREATE INDEX IF NOT EXISTS idx_ml_pred_date        ON ml_predictions (prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ml_pred_date_symbol ON ml_predictions (prediction_date, stock_symbol);

-- Public read access (same pattern as trade_finder_results)
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read ml_predictions"
  ON ml_predictions FOR SELECT USING (true);
