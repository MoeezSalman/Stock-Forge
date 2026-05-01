"""
Stock Prediction REST API
==========================
Serves XGBoost predictions from MongoDB to your React frontend.

Install:
    pip install fastapi uvicorn pymongo joblib pandas numpy

Run:
    uvicorn stock_api:app --reload --port 5000
"""

import os, asyncio, joblib, numpy as np, pandas as pd
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv
import certifi
import httpx

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://Priorify:1234567890@moeezdatabases.nyxyde8.mongodb.net/StockForge")
DB_NAME   = "StockForge"
TICKERS   = ["AAPL", "AMZN", "GOOGL", "MSFT", "NVDA"]
HF_API_URL = "https://router.huggingface.co/hf-inference/models/ProsusAI/finbert"
HF_API_KEY = os.getenv("HF_API_KEY", "")

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
    db   = get_db()
    docs = list(db.model_analytics.find({}, {"_id": 0, "ticker": 1, "model_stats": 1, "trained_at": 1}))
    return docs


# ── GET /api/sentiment/dashboard ──────────────────────────────────────────────
@app.get("/api/sentiment/dashboard")
def get_sentiment_dashboard(ticker: str = "All Tickers"):
    db = get_db()

    stats_doc = db.sentiment_stats.find_one({}, {"_id": 0}, sort=[("generated_at", DESCENDING)])
    if not stats_doc:
        raise HTTPException(404, "No sentiment data. Run sentiment_seeder.py first.")

    timeline = list(db.sentiment_timeline.find({}, {"_id": 0}))
    sources  = list(db.sentiment_sources.find({}, {"_id": 0}))
    keywords = list(db.sentiment_keywords.find({}, {"_id": 0}))

    query = {} if ticker == "All Tickers" else {"ticker": ticker}
    articles = list(
        db.sentiment_articles
          .find(query, {"_id": 0})
          .sort("published_at", DESCENDING)
          .limit(6)
    )

    return {
        "stats":    stats_doc,
        "timeline": timeline,
        "sources":  sources,
        "keywords": keywords,
        "articles": articles,
    }


# ── GET /api/sentiment/articles ───────────────────────────────────────────────
@app.get("/api/sentiment/articles")
def get_sentiment_articles(ticker: str = "All Tickers", limit: int = 20):
    db    = get_db()
    query = {} if ticker == "All Tickers" else {"ticker": ticker}
    docs  = list(
        db.sentiment_articles
          .find(query, {"_id": 0})
          .sort("published_at", DESCENDING)
          .limit(limit)
    )
    return {"ticker": ticker, "count": len(docs), "articles": docs}


# ── POST /api/sentiment/analyze ───────────────────────────────────────────────
@app.post("/api/sentiment/analyze")
async def analyze_sentiment(payload: dict):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(422, "text field is required")

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        for attempt in range(3):
            resp = await client.post(
                HF_API_URL,
                headers=headers,
                json={"inputs": text, "options": {"wait_for_model": True}}
            )
            if resp.status_code == 503:
                await asyncio.sleep(20)
                continue
            if resp.status_code != 200:
                raise HTTPException(502, f"HuggingFace error: {resp.text}")
            results = resp.json()
            if isinstance(results[0], dict):
                pass  # single input returns flat list
            else:
                results = results[0]
            best = max(results, key=lambda x: x["score"])
            return {
                "label": best["label"].lower(),
                "score": round(best["score"], 4),
                "all":   results,
            }
    raise HTTPException(502, "FinBERT model unavailable after 3 attempts")


# ── POST /api/sentiment/batch ──────────────────────────────────────────────────
@app.post("/api/sentiment/batch")
async def analyze_sentiment_batch(payload: dict):
    texts = payload.get("texts", [])
    if not texts or len(texts) > 20:
        raise HTTPException(422, "Provide 1–20 texts")

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=120) as client:
        for attempt in range(3):
            resp = await client.post(
                HF_API_URL,
                headers=headers,
                json={"inputs": texts, "options": {"wait_for_model": True}}
            )
            if resp.status_code == 503:
                await asyncio.sleep(20)
                continue
            if resp.status_code != 200:
                raise HTTPException(502, f"HuggingFace error: {resp.text}")
            result = resp.json()
            if result and isinstance(result[0], dict):
                result = [result]
            return {"results": result}
    raise HTTPException(502, "FinBERT model unavailable after 3 attempts")


# ── POST /api/feedback/sentiment ──────────────────────────────────────────────
@app.post("/api/feedback/sentiment")
def save_sentiment_feedback(payload: dict):
    if not payload.get("text") or not payload.get("predicted_label"):
        raise HTTPException(422, "text and predicted_label are required")
    db = get_db()
    db.sentiment_feedback.insert_one({
        **payload,
        "saved_at": datetime.utcnow().isoformat(),
    })
    return {"status": "saved"}