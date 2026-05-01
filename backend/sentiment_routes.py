"""
sentiment_routes.py
====================
Add these routes to your stock_api.py (or include as a router).

Option A — paste the routes directly into stock_api.py
Option B — mount as APIRouter:

    from sentiment_routes import router as sentiment_router
    app.include_router(sentiment_router)
"""

# ─────────────────────────────────────────────────────────────────────────────
# If adding to stock_api.py, paste everything BELOW this line into your file.
# ─────────────────────────────────────────────────────────────────────────────

import os, httpx, certifi
from fastapi import APIRouter, HTTPException
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()          # use app.XXX instead if pasting into stock_api.py

MONGO_URI  = os.getenv("MONGO_URI", "mongodb+srv://Priorify:1234567890@moeezdatabases.nyxyde8.mongodb.net/StockForge")
DB_NAME    = "StockForge"
HF_API_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert"
HF_API_KEY = os.getenv("HF_API_KEY", "")

def get_db():
    client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())
    return client[DB_NAME]


# ── GET /api/sentiment/dashboard ──────────────────────────────────────────────
@router.get("/api/sentiment/dashboard")
def get_sentiment_dashboard(ticker: str = "All Tickers"):
    """
    Returns everything the Sentiment Analysis page needs in one call:
      - stats        → stat cards
      - timeline     → 30-day chart
      - distribution → donut chart
      - sources      → source bar chart + keyword cloud
      - articles     → NLP token analysis panel (top 6)
    """
    db = get_db()

    # ── Stats ──────────────────────────────────────────────────────────────────
    stats_doc = db.sentiment_stats.find_one({}, {"_id": 0}, sort=[("generated_at", DESCENDING)])
    if not stats_doc:
        raise HTTPException(404, "No sentiment data. Run sentiment_seeder.py first.")

    # ── Timeline ───────────────────────────────────────────────────────────────
    timeline = list(db.sentiment_timeline.find({}, {"_id": 0}))

    # ── Sources ────────────────────────────────────────────────────────────────
    sources = list(db.sentiment_sources.find({}, {"_id": 0}))

    # ── Keywords ───────────────────────────────────────────────────────────────
    keywords = list(db.sentiment_keywords.find({}, {"_id": 0}))

    # ── Articles (filter by ticker if requested) ────────────────────────────
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
@router.get("/api/sentiment/articles")
def get_sentiment_articles(ticker: str = "All Tickers", limit: int = 20):
    """Return paginated articles for a ticker."""
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
# (already in stock_api.py — keep as-is, reproduced here for completeness)
@router.post("/api/sentiment/analyze")
async def analyze_sentiment(payload: dict):
    """
    Live single-text FinBERT analysis.
    Body: { "text": "Apple reports record earnings..." }
    """
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(422, "text field is required")

    headers = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json"
}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(HF_API_URL, headers=headers, json={"inputs": text})

    if resp.status_code == 503:
        await asyncio.sleep(5)
        resp = await client.post(HF_API_URL, headers=headers, json={"inputs": texts})

    if resp.status_code != 200:
        raise RuntimeError(f"HuggingFace error {resp.status_code}: {resp.text}")

    results = resp.json()[0]
    best    = max(results, key=lambda x: x["score"])
    return {
        "label": best["label"].lower(),
        "score": round(best["score"], 4),
        "all":   results,
    }


# ── POST /api/sentiment/batch ─────────────────────────────────────────────────
@router.post("/api/sentiment/batch")
async def analyze_sentiment_batch(payload: dict):
    """
    Live batch FinBERT analysis.
    Body: { "texts": ["headline 1", "headline 2", ...] }
    """
    texts = payload.get("texts", [])
    if not texts or len(texts) > 20:
        raise HTTPException(422, "Provide 1–20 texts")

    headers = {"Authorization": f"Bearer {HF_API_KEY}"} if HF_API_KEY else {}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(HF_API_URL, headers=headers, json={"inputs": texts})

    if resp.status_code != 200:
        raise HTTPException(502, f"HuggingFace error: {resp.text}")

    return {"results": resp.json()}


# ── POST /api/feedback/sentiment ──────────────────────────────────────────────
@router.post("/api/feedback/sentiment")
def save_sentiment_feedback(payload: dict):
    """
    Save user feedback on a FinBERT prediction to MongoDB.
    Body matches the hardcoded payload in LiveAnalyzer.
    """
    if not payload.get("text") or not payload.get("predicted_label"):
        raise HTTPException(422, "text and predicted_label are required")

    db = get_db()
    db.sentiment_feedback.insert_one({
        **payload,
        "saved_at": __import__("datetime").datetime.utcnow().isoformat(),
    })
    return {"status": "saved"}