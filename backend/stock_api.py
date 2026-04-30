"""
Stock Prediction REST API
==========================
Serves XGBoost predictions from MongoDB to your React frontend.

Install:
    pip install fastapi uvicorn pymongo joblib pandas numpy

Run:
    uvicorn stock_api:app --reload --port 5000
"""

import os, joblib, numpy as np, pandas as pd
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv
import certifi

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://Priorify:1234567890@moeezdatabases.nyxyde8.mongodb.net/StockForge")
DB_NAME   = "StockForge"
TICKERS   = ["AAPL", "AMZN", "GOOGL", "MSFT", "NVDA"]

app = FastAPI(title="Stock Prediction API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

def get_db():
    client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())
    return client[DB_NAME]


# ── GET /api/predictions/{ticker} ─────────────────────────────────────────────
@app.get("/api/predictions/{ticker}")
def get_predictions(ticker: str, limit: int = Query(60, le=500)):
    """Return the last N daily predictions for a ticker."""
    if ticker.upper() not in TICKERS:
        raise HTTPException(404, f"Ticker {ticker} not found")
    db   = get_db()
    docs = list(
        db.predictions
          .find({"ticker": ticker.upper()}, {"_id": 0})
          .sort("date", DESCENDING)
          .limit(limit)
    )
    return {"ticker": ticker.upper(), "count": len(docs), "data": docs[::-1]}


# ── GET /api/predictions/{ticker}/latest ──────────────────────────────────────
@app.get("/api/predictions/{ticker}/latest")
def get_latest_prediction(ticker: str):
    """Latest prediction + confidence for the dashboard card."""
    db  = get_db()
    doc = db.predictions.find_one(
        {"ticker": ticker.upper()},
        sort=[("date", DESCENDING)],
        projection={"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "No predictions found")
    return doc


# ── GET /api/metrics/{ticker} ─────────────────────────────────────────────────
@app.get("/api/metrics/{ticker}")
def get_metrics(ticker: str):
    """Model accuracy, F1, classification report."""
    db  = get_db()
    doc = db.model_metrics.find_one(
        {"ticker": ticker.upper()},
        sort=[("trained_at", DESCENDING)],
        projection={"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "No metrics found")
    return doc


# ── GET /api/shap/{ticker} ────────────────────────────────────────────────────
@app.get("/api/shap/{ticker}")
def get_shap(ticker: str):
    """SHAP top feature importance — powers the feature importance chart."""
    db  = get_db()
    doc = db.shap_importance.find_one(
        {"ticker": ticker.upper()},
        projection={"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "SHAP data not found")
    return doc


# ── GET /api/portfolio/signals ────────────────────────────────────────────────
@app.get("/api/portfolio/signals")
def get_portfolio_signals():
    """Latest multi-ticker portfolio signal (BULLISH / BEARISH + per-ticker)."""
    db  = get_db()
    doc = db.portfolio_signals.find_one(
        {}, sort=[("generated_at", DESCENDING)],
        projection={"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "No portfolio signals")
    return doc


# ── GET /api/features/{ticker} ────────────────────────────────────────────────
@app.get("/api/features/{ticker}")
def get_features(ticker: str, limit: int = 30):
    """Return engineered features for debugging / model tab."""
    db   = get_db()
    docs = list(
        db.features
          .find({"ticker": ticker.upper()}, {"_id": 0})
          .sort("date", DESCENDING)
          .limit(limit)
    )
    return {"ticker": ticker.upper(), "count": len(docs), "data": docs[::-1]}


# ── POST /api/predict/live ────────────────────────────────────────────────────
@app.post("/api/predict/live")
def predict_live(payload: dict):
    """
    Run live prediction from a saved model pkl.
    Body: { "ticker": "AAPL", "features": { ... } }
    """
    ticker = payload.get("ticker", "").upper()
    if ticker not in TICKERS:
        raise HTTPException(400, "Invalid ticker")

    model_path = f"models/{ticker}_xgboost.pkl"
    if not os.path.exists(model_path):
        raise HTTPException(503, "Model not trained yet — run pipeline first")

    bundle       = joblib.load(model_path)
    model        = bundle["model"]
    le           = bundle["le"]
    feature_cols = bundle["feature_cols"]

    try:
        x_values = [float(payload["features"][col]) for col in feature_cols]
    except KeyError as e:
        raise HTTPException(422, f"Missing feature: {e}")

    X     = np.array(x_values).reshape(1, -1)
    pred  = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    label = le.inverse_transform([pred])[0]
    conf  = float(proba.max())

    return {
        "ticker":        ticker,
        "prediction":    label,
        "confidence":    round(conf, 4),
        "probabilities": dict(zip(le.classes_.tolist(), proba.tolist())),
        "predicted_at":  datetime.utcnow().isoformat(),
    }


# ── GET /api/training/history/{ticker} ────────────────────────────────────────
@app.get("/api/training/history/{ticker}")
def get_training_history(ticker: str):
    """All retraining runs — powers the training-history chart."""
    db   = get_db()
    docs = list(
        db.training_history
          .find({"ticker": ticker.upper()}, {"_id": 0})
          .sort("epoch", 1)
    )
    return {"ticker": ticker.upper(), "history": docs}


# ── GET /health ───────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    try:
        db = get_db()
        db.command("ping")
        return {"status": "ok", "mongo": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

# ── GET /api/model_analytics/{ticker} ────────────────────────────────────────
@app.get("/api/model_analytics/{ticker}")
def get_model_analytics(ticker: str):
    """
    Returns all data for the ModelTrainingAndAnalytics page:
      - model_stats       (accuracy, f1, rmse, mae, precision, recall)
      - epoch_history     (table rows)
      - chart_curve       (full loss curve for chart)
      - confusion_matrix  (2x2 UP vs DOWN)
      - feature_importance (name + value%)
    """
    db  = get_db()
    doc = db.model_analytics.find_one(
        {"ticker": ticker.upper()},
        projection={"_id": 0}
    )
    if not doc:
        raise HTTPException(404, f"No model analytics for {ticker}. Run the pipeline first.")
    return doc


# ── GET /api/model_analytics ──────────────────────────────────────────────────
@app.get("/api/model_analytics")
def list_model_analytics():
    """Return model_stats summary for all tickers (for ticker selector)."""
    db   = get_db()
    docs = list(db.model_analytics.find({}, {"_id": 0, "ticker": 1, "model_stats": 1, "trained_at": 1}))
    return docs