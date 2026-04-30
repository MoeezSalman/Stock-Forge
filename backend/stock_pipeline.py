"""
FINAL STOCK PIPELINE (PRODUCTION READY)
=======================================
- predictions → dashboard (latest only)
- price_history → chart (blue/yellow line)
- Added: bullish/strong_buy/neutral forecast signals + market_cap
"""

import os
import warnings
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

import xgboost as xgb
import joblib
import certifi
from pymongo import MongoClient, ASCENDING

warnings.filterwarnings("ignore")
load_dotenv()

# ───────────────── CONFIG ─────────────────
CSV_PATH = "data.csv"

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://Priorify:1234567890@moeezdatabases.nyxyde8.mongodb.net/StockForge"
)

DB_NAME = "StockForge"
TICKERS = ["AAPL", "AMZN", "GOOGL", "MSFT", "NVDA"]

UP_THRESH = 0.005
DOWN_THRESH = -0.005

# Approximate shares outstanding (in billions) for market cap calculation
SHARES_OUTSTANDING = {
    "AAPL":  15.44e9,
    "AMZN":  10.33e9,
    "GOOGL": 12.25e9,
    "MSFT":   7.43e9,
    "NVDA":  24.44e9,
}


# ───────────────── DB ─────────────────
def get_db():
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsCAFile=certifi.where()
    )
    client.admin.command("ping")
    print("✅ Connected to MongoDB")
    return client[DB_NAME]


def setup_indexes(db):
    # Drop any existing ticker+date index regardless of name
    ph = db["price_history"]
    for name, idx in list(ph.index_information().items()):
        key_fields = [k[0] for k in idx.get("key", [])]
        if "ticker" in key_fields and "date" in key_fields:
            try:
                ph.drop_index(name)
            except Exception:
                pass

    ph.create_index([("ticker", ASCENDING), ("date", ASCENDING)])

    try:
        db.predictions.create_index([("ticker", ASCENDING)], unique=True)
    except Exception:
        pass

    print("✅ Indexes ready")
    db.predictions.create_index([("ticker", ASCENDING)], unique=True)
    db.price_history.create_index([("ticker", ASCENDING), ("date", ASCENDING)])
    print("✅ Indexes ready")


# ───────────────── FEATURES ─────────────────
def compute_rsi(series, window=14):
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(com=window - 1).mean()
    avg_loss = loss.ewm(com=window - 1).mean()

    rs = avg_gain / (avg_loss + 1e-9)
    return 100 - (100 / (1 + rs))


def build_features(df, ticker):
    c = f"Close_{ticker}"
    o = f"Open_{ticker}"
    h = f"High_{ticker}"
    l = f"Low_{ticker}"
    v = f"Volume_{ticker}"

    feat = pd.DataFrame()

    feat["date"] = df["Date"]
    feat["ticker"] = ticker

    close = df[c]

    feat["close"] = close
    feat["open"] = df[o]
    feat["high"] = df[h]
    feat["low"] = df[l]
    feat["volume"] = df[v]

    feat["ret_1"] = close.pct_change(1)
    feat["ret_5"] = close.pct_change(5)

    feat["rsi"] = compute_rsi(close)

    next_ret = close.pct_change().shift(-1)

    feat["target"] = np.where(
        next_ret > UP_THRESH, "UP",
        np.where(next_ret < DOWN_THRESH, "DOWN", "HOLD")
    )

    return feat


def _label_to_signal(label: str, confidence: float) -> str:
    if label == "UP":
        return "STRONG BUY" if confidence >= 0.70 else "BUY"
    if label == "DOWN":
        return "REDUCE"
    return "HOLD"


def build_forecasts(df, model, le, features) -> dict:
    """
    Derive 1-day, 5-day and 30-day forecast signals from model probabilities.

    Strategy:
      • 1-day  → prediction on the very last row
      • 5-day  → majority vote over the last 5 rows
      • 30-day → majority vote over the last 30 rows
    """
    df_clean = df.dropna()
    X_all = df_clean[features]

    def _vote(window_rows):
        probs_w  = model.predict_proba(window_rows)          # (n, 3)
        avg_prob = probs_w.mean(axis=0)                       # average across window
        pred_idx = int(np.argmax(avg_prob))
        label    = le.inverse_transform([pred_idx])[0]
        conf     = float(avg_prob[pred_idx])
        return label, conf

    last_1  = X_all.iloc[-1:]
    last_5  = X_all.iloc[-5:]
    last_30 = X_all.iloc[-30:]

    label_1d,  conf_1d  = _vote(last_1)
    label_5d,  conf_5d  = _vote(last_5)
    label_30d, conf_30d = _vote(last_30)

    return {
        "forecast_1d": {
            "signal":     _label_to_signal(label_1d, conf_1d),
            "label":      label_1d,
            "confidence": round(conf_1d, 4),
        },
        "forecast_5d": {
            "signal":     _label_to_signal(label_5d, conf_5d),
            "label":      label_5d,
            "confidence": round(conf_5d, 4),
        },
        "forecast_30d": {
            "signal":     _label_to_signal(label_30d, conf_30d),
            "label":      label_30d,
            "confidence": round(conf_30d, 4),
        },
    }


# ───────────────── TRAIN ─────────────────
def train_model(df):
    df = df.dropna()

    features = [c for c in df.columns if c not in ["date", "ticker", "target"]]

    X = df[features]
    y = df["target"]

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, shuffle=False
    )

    model = xgb.XGBClassifier(
        n_estimators=250,
        max_depth=5,
        learning_rate=0.05,
        eval_metric="mlogloss"
    )

    model.fit(X_train, y_train)

    preds = model.predict(X_test)

    acc = accuracy_score(y_test, preds)
    f1  = f1_score(y_test, preds, average="weighted")

    print(f"📊 Accuracy: {acc:.4f} | F1: {f1:.4f}")

    return model, le, features


# ───────────────── STORE HISTORY (CHART DATA) ─────────────────
def store_history(db, ticker, df, model, le, features):
    coll = db["price_history"]

    X = df[features].dropna()

    preds = model.predict(X)
    probs = model.predict_proba(X)

    ops = []

    for i, (_, row) in enumerate(X.iterrows()):
        ops.append({
            "ticker":          ticker,
            "date":            str(df.iloc[i]["date"])[:10],
            "close":           float(row["close"]),
            "predicted_close": float(row["close"] * (1 + probs[i][0]))
        })

    coll.insert_many(ops)
    print(f"📈 History stored: {ticker}")


# ───────────────── STORE DASHBOARD (LATEST ONLY) ─────────────────
def store_latest(db, ticker, df, model, le, features):
    df = df.dropna()
    X  = df[features]

    last  = X.iloc[-1:]
    probs = model.predict_proba(last)[0]
    pred  = model.predict(last)[0]
    label = le.inverse_transform([pred])[0]

    latest = df.iloc[-1]
    prev   = df.iloc[-2]

    change     = float(latest["close"] - prev["close"])
    price      = float(latest["close"])
    shares     = SHARES_OUTSTANDING.get(ticker, 0)
    market_cap = price * shares          # raw value in USD

    # Format market cap → human-readable string (e.g. "$2.91T")
    def _fmt_cap(val):
        if val >= 1e12:
            return f"${val / 1e12:.2f}T"
        if val >= 1e9:
            return f"${val / 1e9:.2f}B"
        if val >= 1e6:
            return f"${val / 1e6:.2f}M"
        return f"${val:,.0f}"

    # Build per-horizon forecast signals
    forecasts = build_forecasts(df, model, le, features)
    up_idx   = list(le.classes_).index("UP")
    down_idx = list(le.classes_).index("DOWN")
    price_delta = probs[up_idx] - probs[down_idx]

    doc = {
        "ticker":    ticker,
        "price":     price,
        "open":      float(latest["open"]),
        "high":      float(latest["high"]),
        "low":       float(latest["low"]),
        "volume":    float(latest["volume"]),
        "change":    change,

        # Core next-bar prediction
        "prediction":      _label_to_signal(label, float(max(probs))),
        "confidence":      float(max(probs)),
        "predicted_close": round(float(latest["close"] * (1 + price_delta)), 2),

        # ── NEW FIELDS ──────────────────────────────────────────
        # Market capitalisation
        "market_cap":        round(market_cap, 2),
        "market_cap_label":  _fmt_cap(market_cap),

        # Forecast signals  (signal values: BULLISH | STRONG BUY | NEUTRAL | BEARISH)
        "forecast_1d":  forecasts["forecast_1d"],
        "forecast_5d":  forecasts["forecast_5d"],
        "forecast_30d": forecasts["forecast_30d"],
        # ────────────────────────────────────────────────────────

        "updated_at": datetime.utcnow()
    }

    db["predictions"].update_one(
        {"ticker": ticker},
        {"$set": doc},
        upsert=True
    )

    print(f"💾 Dashboard stored: {ticker}")
    print(f"   Market Cap : {_fmt_cap(market_cap)}")
    print(f"   1d  signal : {forecasts['forecast_1d']['signal']} ({forecasts['forecast_1d']['confidence']:.0%})")
    print(f"   5d  signal : {forecasts['forecast_5d']['signal']} ({forecasts['forecast_5d']['confidence']:.0%})")
    print(f"   30d signal : {forecasts['forecast_30d']['signal']} ({forecasts['forecast_30d']['confidence']:.0%})")


# ───────────────── MAIN ─────────────────
def main():
    print("\n🚀 FINAL PIPELINE STARTED\n")

    df = pd.read_csv(CSV_PATH)
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date")

    db = get_db()
    setup_indexes(db)

    for ticker in TICKERS:
        print(f"\n📊 Processing {ticker}")

        feat = build_features(df, ticker)

        model, le, features = train_model(feat)

        store_history(db, ticker, feat, model, le, features)

        store_latest(db, ticker, feat, model, le, features)

        os.makedirs("models", exist_ok=True)
        joblib.dump(model, f"models/{ticker}.pkl")

    print("\n🎉 DONE - FULL DATA STORED")


if __name__ == "__main__":
    main()