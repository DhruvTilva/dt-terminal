#!/usr/bin/env python3
"""
DT's Terminal — Nightly ML Trend Prediction
"""

import os
import sys
from datetime import date, timedelta

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from supabase import create_client

# ── Config ────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
    sys.exit(1)

LOOKBACK_DAYS = 30
MIN_TRAINING_ROWS = 20

STRATEGY_WEIGHT = {
    "strict_morning":  5,
    "general_morning": 4,
    "candle_pattern":  3,
    "long_trend":      2,
    "high_volatility": 1,
}

# ── Supabase client ───────────────────────────────────────────────────────────

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Data loading ──────────────────────────────────────────────────────────────

def fetch_historical_data() -> pd.DataFrame:
    """Fetch last LOOKBACK_DAYS of trade_finder_results."""
    cutoff = (date.today() - timedelta(days=LOOKBACK_DAYS)).isoformat()

    # Supabase returns max 1000 rows by default — paginate if needed
    all_rows = []
    offset = 0
    page_size = 1000

    while True:
        res = (
            supabase.table("trade_finder_results")
            .select("stock_symbol, scan_date, score, change_percent, direction, strategy_type")
            .gte("scan_date", cutoff)
            .order("scan_date")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = res.data or []
        all_rows.extend(rows)
        if len(rows) < page_size:
            break
        offset += page_size

    print(f"Fetched {len(all_rows)} rows from Supabase")
    return pd.DataFrame(all_rows)


# ── Feature engineering ───────────────────────────────────────────────────────

def build_dataset(df: pd.DataFrame):
    """
    Returns:
      train_df — rows with known next-day label
      today_df — today's signals (no label yet, used for prediction)
    """
    df = df.copy()
    df["scan_date"] = pd.to_datetime(df["scan_date"])
    df["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0)
    df["change_percent"] = pd.to_numeric(df["change_percent"], errors="coerce").fillna(0)

    # Encode direction: bullish=1, bearish=0
    df["direction_enc"] = (df["direction"] == "bullish").astype(int)

    # Encode strategy type as ordinal weight
    df["strategy_enc"] = df["strategy_type"].map(STRATEGY_WEIGHT).fillna(0)

    # Sort for shift operation
    df = df.sort_values(["stock_symbol", "scan_date"]).reset_index(drop=True)

    # Label = was next-day change_percent > 0 for same symbol?
    df["next_change"] = df.groupby("stock_symbol")["change_percent"].shift(-1)
    df["label"] = (df["next_change"] > 0).astype(float)

    # Rows that have a label = training data
    train_df = df[df["next_change"].notna()].copy()

    # Rows without a label = today's signals (most recent scan_date per symbol)
    today_df = df[df["next_change"].isna()].copy()

    # For today's rows, keep only the highest-score row per symbol
    # (a symbol may appear in multiple strategies)
    today_df = (
        today_df.sort_values("score", ascending=False)
        .drop_duplicates(subset=["stock_symbol"], keep="first")
        .reset_index(drop=True)
    )

    return train_df, today_df


# ── Model training & prediction ───────────────────────────────────────────────

FEATURES = ["score", "change_percent", "direction_enc", "strategy_enc"]


def train_and_predict(train_df: pd.DataFrame, today_df: pd.DataFrame):
    """Train LogisticRegression and predict today's signals."""

    if len(train_df) < MIN_TRAINING_ROWS:
        print(f"Not enough training data ({len(train_df)} rows, need {MIN_TRAINING_ROWS}). Skipping.")
        return [], None

    X_train = train_df[FEATURES].values
    y_train = train_df["label"].values

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    model = LogisticRegression(random_state=42, max_iter=1000, C=1.0)
    model.fit(X_train_scaled, y_train)

    # Cross-validation accuracy
    n_splits = min(5, max(2, len(X_train) // 10))
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=n_splits)
    accuracy = round(float(cv_scores.mean()) * 100, 1)
    print(f"Model accuracy: {accuracy}% (cv={n_splits}, n_train={len(X_train)})")

    if today_df.empty:
        print("No today's signals to predict.")
        return [], accuracy

    X_pred = today_df[FEATURES].values
    X_pred_scaled = scaler.transform(X_pred)

    predictions = model.predict(X_pred_scaled)
    probs = model.predict_proba(X_pred_scaled)

    results = []
    for idx, (_, row) in enumerate(today_df.iterrows()):
        pred_class = int(predictions[idx])
        confidence = round(float(probs[idx][pred_class]) * 100, 1)
        direction = "bullish" if pred_class == 1 else "bearish"
        results.append({
            "stock_symbol": row["stock_symbol"],
            "predicted_direction": direction,
            "confidence": confidence,
            "model_accuracy": accuracy,
        })

    return results, accuracy


# ── Save predictions ──────────────────────────────────────────────────────────

def save_predictions(predictions: list, pred_date: str):
    """Upsert predictions into ml_predictions table."""
    if not predictions:
        print("No predictions to save.")
        return

    rows = [
        {
            "prediction_date": pred_date,
            "stock_symbol": p["stock_symbol"],
            "predicted_direction": p["predicted_direction"],
            "confidence": p["confidence"],
            "model_accuracy": p["model_accuracy"],
        }
        for p in predictions
    ]

    # Upsert in batches of 500
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        supabase.table("ml_predictions").upsert(
            batch, on_conflict="prediction_date,stock_symbol"
        ).execute()

    print(f"Saved {len(rows)} predictions for {pred_date}")

    # Sample output
    for p in predictions[:5]:
        arrow = "↑" if p["predicted_direction"] == "bullish" else "↓"
        print(f"  {arrow} {p['stock_symbol']:<15} {p['predicted_direction']:<8} {p['confidence']}%")
    if len(predictions) > 5:
        print(f"  ... and {len(predictions) - 5} more")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    today = date.today().isoformat()
    print(f"=== DT's Terminal ML Prediction — {today} ===")

    print("Fetching historical data...")
    df = fetch_historical_data()

    if df.empty:
        print("No data found in trade_finder_results. Exiting.")
        sys.exit(0)

    print(f"Date range: {df['scan_date'].min()} → {df['scan_date'].max()}")

    train_df, today_df = build_dataset(df)
    print(f"Training rows: {len(train_df)} | Today's unique symbols: {len(today_df)}")

    predictions, accuracy = train_and_predict(train_df, today_df)

    if predictions is None:
        sys.exit(0)

    save_predictions(predictions, today)
    print("Done!")


if __name__ == "__main__":
    main()
