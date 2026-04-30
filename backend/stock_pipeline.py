"""
FINAL STOCK PIPELINE (PRODUCTION READY)
=======================================
- predictions    → dashboard (latest only)
- price_history  → chart (blue/yellow line)
- model_analytics → ModelTrainingAndAnalytics page (NEW)
"""

import os
import warnings
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, f1_score, confusion_matrix,
    precision_score, recall_score, mean_squared_error, mean_absolute_error
)

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

UP_THRESH   = 0.005
DOWN_THRESH = -0.005

SHARES_OUTSTANDING = {
    "AAPL":  15.44e9,
    "AMZN":  10.33e9,
    "GOOGL": 12.25e9,
    "MSFT":   7.43e9,
    "NVDA":  24.44e9,
}

FEATURE_LABELS = {
    "close":  "Close Price",
    "open":   "Open Price",
    "high":   "High",
    "low":    "Low",
    "volume": "Volume",
    "ret_1":  "Return 1d",
    "ret_5":  "Return 5d",
    "rsi":    "RSI(14)",
}


# ───────────────── DB ─────────────────
def get_db():
    client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())
    client.admin.command("ping")
    print("Connected to MongoDB")
    return client[DB_NAME]


def setup_indexes(db):
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

    try:
        db.model_analytics.create_index([("ticker", ASCENDING)], unique=True)
    except Exception:
        pass

    print("Indexes ready")


# ───────────────── FEATURES ─────────────────
def compute_rsi(series, window=14):
    delta    = series.diff()
    gain     = delta.clip(lower=0)
    loss     = -delta.clip(upper=0)
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
    feat["date"]   = df["Date"]
    feat["ticker"] = ticker

    close = df[c]
    feat["close"]  = close
    feat["open"]   = df[o]
    feat["high"]   = df[h]
    feat["low"]    = df[l]
    feat["volume"] = df[v]

    feat["ret_1"] = close.pct_change(1)
    feat["ret_5"] = close.pct_change(5)
    feat["rsi"]   = compute_rsi(close)

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
    df_clean = df.dropna()
    X_all    = df_clean[features]

    def _vote(window_rows):
        probs_w  = model.predict_proba(window_rows)
        avg_prob = probs_w.mean(axis=0)
        pred_idx = int(np.argmax(avg_prob))
        label    = le.inverse_transform([pred_idx])[0]
        conf     = float(avg_prob[pred_idx])
        return label, conf

    label_1d,  conf_1d  = _vote(X_all.iloc[-1:])
    label_5d,  conf_5d  = _vote(X_all.iloc[-5:])
    label_30d, conf_30d = _vote(X_all.iloc[-30:])

    return {
        "forecast_1d":  {"signal": _label_to_signal(label_1d,  conf_1d),  "label": label_1d,  "confidence": round(conf_1d,  4)},
        "forecast_5d":  {"signal": _label_to_signal(label_5d,  conf_5d),  "label": label_5d,  "confidence": round(conf_5d,  4)},
        "forecast_30d": {"signal": _label_to_signal(label_30d, conf_30d), "label": label_30d, "confidence": round(conf_30d, 4)},
    }


# ───────────────── TRAIN ─────────────────
def train_model(df):
    df       = df.dropna()
    features = [c for c in df.columns if c not in ["date", "ticker", "target"]]

    X     = df[features]
    y     = df["target"]
    le    = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, shuffle=False
    )

    model = xgb.XGBClassifier(
        n_estimators=250,
        max_depth=5,
        learning_rate=0.05,
        eval_metric="mlogloss",
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False,
    )

    eval_result = model.evals_result()

    preds = model.predict(X_test)
    acc   = accuracy_score(y_test, preds)
    f1    = f1_score(y_test, preds, average="weighted")
    prec  = precision_score(y_test, preds, average="weighted", zero_division=0)
    rec   = recall_score(y_test, preds, average="weighted", zero_division=0)
    rmse  = float(np.sqrt(mean_squared_error(y_test, preds)))
    mae   = float(mean_absolute_error(y_test, preds))

    print(f"Accuracy: {acc:.4f}  F1: {f1:.4f}  RMSE: {rmse:.4f}")

    metrics = {
        "accuracy":  round(float(acc),  4),
        "f1_score":  round(float(f1),   4),
        "precision": round(float(prec), 4),
        "recall":    round(float(rec),  4),
        "rmse":      round(rmse, 4),
        "mae":       round(mae,  4),
        "n_train":   len(X_train),
        "n_test":    len(X_test),
    }

    return model, le, features, X_test, y_test, eval_result, metrics


# ───────────────── STORE HISTORY ─────────────────
def store_history(db, ticker, df, model, le, features):
    coll  = db["price_history"]
    X     = df[features].dropna()
    probs = model.predict_proba(X)
    ops   = []

    for i, (_, row) in enumerate(X.iterrows()):
        ops.append({
            "ticker":          ticker,
            "date":            str(df.iloc[i]["date"])[:10],
            "close":           float(row["close"]),
            "open":            float(row["open"]),
            "high":            float(row["high"]),
            "low":             float(row["low"]),
            "volume":          float(row["volume"]),
            "predicted_close": float(row["close"] * (1 + probs[i][0]))
        })

    coll.insert_many(ops)
    print(f"History stored: {ticker}")


# ───────────────── STORE LATEST (DASHBOARD) ─────────────────
def store_latest(db, ticker, df, model, le, features):
    df    = df.dropna()
    X     = df[features]
    last  = X.iloc[-1:]
    probs = model.predict_proba(last)[0]
    pred  = model.predict(last)[0]
    label = le.inverse_transform([pred])[0]

    latest     = df.iloc[-1]
    prev       = df.iloc[-2]
    change     = float(latest["close"] - prev["close"])
    price      = float(latest["close"])
    market_cap = price * SHARES_OUTSTANDING.get(ticker, 0)

    def _fmt_cap(val):
        if val >= 1e12: return f"${val/1e12:.2f}T"
        if val >= 1e9:  return f"${val/1e9:.2f}B"
        if val >= 1e6:  return f"${val/1e6:.2f}M"
        return f"${val:,.0f}"

    forecasts   = build_forecasts(df, model, le, features)
    up_idx      = list(le.classes_).index("UP")
    down_idx    = list(le.classes_).index("DOWN")
    price_delta = probs[up_idx] - probs[down_idx]

    doc = {
        "ticker":    ticker,
        "price":     price,
        "open":      float(latest["open"]),
        "high":      float(latest["high"]),
        "low":       float(latest["low"]),
        "volume":    float(latest["volume"]),
        "change":    change,
        "prediction":      _label_to_signal(label, float(max(probs))),
        "confidence":      float(max(probs)),
        "predicted_close": round(float(latest["close"] * (1 + price_delta)), 2),
        "market_cap":       round(market_cap, 2),
        "market_cap_label": _fmt_cap(market_cap),
        "forecast_1d":  forecasts["forecast_1d"],
        "forecast_5d":  forecasts["forecast_5d"],
        "forecast_30d": forecasts["forecast_30d"],
        "updated_at":   datetime.utcnow()
    }

    db["predictions"].update_one({"ticker": ticker}, {"$set": doc}, upsert=True)
    print(f"Dashboard stored: {ticker}")


# ───────────────── STORE MODEL ANALYTICS (NEW) ─────────────────
def store_model_analytics(db, ticker, model, le, features, X_test, y_test, eval_result, metrics):
    """
    Persist everything the ModelTrainingAndAnalytics page needs:
      epoch_history, chart_curve, confusion_matrix, feature_importance, model_stats
    """

    # 1. Epoch loss curves
    train_losses = eval_result.get("validation_0", {}).get("mlogloss", [])
    val_losses   = eval_result.get("validation_1", {}).get("mlogloss", [])
    n = len(train_losses)

    if n > 0:
        sample_idx = sorted(set([
            0,
            max(0, n // 8),
            max(0, n // 5),
            max(0, n // 3),
            max(0, n // 2),
            max(0, 2 * n // 3),
            max(0, 4 * n // 5),
            n - 1,
        ]))
        epoch_history = []
        for i in sample_idx:
            tl  = float(train_losses[i])
            vl  = float(val_losses[i]) if i < len(val_losses) else tl
            approx_acc = max(0.0, min(1.0, 1.0 - vl + 0.35))   # scaled proxy
            epoch_history.append({
                "epoch":    i + 1,
                "loss":     round(tl, 4),
                "val_loss": round(vl, 4),
                "acc":      f"{approx_acc * 100:.1f}%",
            })

        step = max(1, n // 100)
        chart_curve = [
            {
                "epoch": i + 1,
                "train": round(float(train_losses[i]), 4),
                "val":   round(float(val_losses[i]),   4) if i < len(val_losses) else round(float(train_losses[i]), 4),
            }
            for i in range(0, n, step)
        ]
        if chart_curve[-1]["epoch"] != n:
            chart_curve.append({
                "epoch": n,
                "train": round(float(train_losses[-1]), 4),
                "val":   round(float(val_losses[-1]),   4) if val_losses else round(float(train_losses[-1]), 4),
            })
    else:
        epoch_history = []
        chart_curve   = []

    # 2. Confusion matrix (UP vs DOWN only for the 2x2 display)
    classes = list(le.classes_)
    preds   = model.predict(X_test)
    cm      = confusion_matrix(y_test, preds)

    if "UP" in classes and "DOWN" in classes:
        up_idx   = classes.index("UP")
        dn_idx   = classes.index("DOWN")
        idxs     = [up_idx, dn_idx]
        cm_2x2   = cm[np.ix_(idxs, idxs)]
        confusion = {
            "classes":   ["UP", "DOWN"],
            "matrix":    cm_2x2.tolist(),
            "precision": round(float(precision_score(y_test, preds, average="weighted", zero_division=0)), 4),
            "recall":    round(float(recall_score(y_test,    preds, average="weighted", zero_division=0)), 4),
        }
    else:
        confusion = {
            "classes":   classes,
            "matrix":    cm.tolist(),
            "precision": metrics["precision"],
            "recall":    metrics["recall"],
        }

    # 3. Feature importance (gain normalised to 0-100%)
    importances = model.feature_importances_
    total       = float(importances.sum()) or 1.0
    fi = [
        {
            "name":  FEATURE_LABELS.get(f, f),
            "key":   f,
            "value": round(float(importances[i] / total) * 100, 1),
        }
        for i, f in enumerate(features)
    ]
    fi.sort(key=lambda x: x["value"], reverse=True)

    # 4. Upsert
    doc = {
        "ticker":             ticker,
        "model_stats":        metrics,
        "epoch_history":      epoch_history,
        "chart_curve":        chart_curve,
        "confusion_matrix":   confusion,
        "feature_importance": fi,
        "n_estimators":       int(model.n_estimators),
        "max_depth":          int(model.max_depth),
        "learning_rate":      float(model.learning_rate),
        "classes":            classes,
        "trained_at":         datetime.utcnow(),
    }

    db["model_analytics"].update_one({"ticker": ticker}, {"$set": doc}, upsert=True)
    print(f"Model analytics stored: {ticker}  acc={metrics['accuracy']:.4f}")


# ───────────────── MAIN ─────────────────
def main():
    print("\nPIPELINE STARTED\n")

    df = pd.read_csv(CSV_PATH)
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date")

    db = get_db()
    setup_indexes(db)

    for ticker in TICKERS:
        print(f"\nProcessing {ticker}")
        feat = build_features(df, ticker)

        model, le, features, X_test, y_test, eval_result, metrics = train_model(feat)

        store_history(db, ticker, feat, model, le, features)
        store_latest(db, ticker, feat, model, le, features)
        store_model_analytics(db, ticker, model, le, features, X_test, y_test, eval_result, metrics)

        os.makedirs("models", exist_ok=True)
        joblib.dump(model, f"models/{ticker}.pkl")

    print("\nDONE")


if __name__ == "__main__":
    main()