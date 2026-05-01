"""
sentiment_seeder.py  (v3 — 80 articles, single requests, feedback seeding)
============================================================================
Key changes vs old version:
  ✓ 80 diverse articles across AAPL/NVDA/MSFT/AMZN/GOOGL/TSLA
  ✓ Sends ONE request per article — avoids HF free-tier batch failures
  ✓ Also seeds sentiment_feedback collection (50 entries)
  ✓ Better retry + rate-limit handling

Collections written:
  sentiment_articles, sentiment_stats, sentiment_timeline,
  sentiment_sources,  sentiment_keywords, sentiment_feedback

Run:
    pip install pymongo httpx python-dotenv certifi
    python sentiment_seeder.py
"""

import os, asyncio, httpx, certifi, re
from datetime import datetime, timedelta
from collections import defaultdict
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI  = os.getenv("MONGO_URI", "mongodb+srv://Priorify:1234567890@moeezdatabases.nyxyde8.mongodb.net/StockForge")
DB_NAME    = "StockForge"
HF_API_URL = "https://router.huggingface.co/hf-inference/models/ProsusAI/finbert"
HF_API_KEY = os.getenv("HF_API_KEY", "")

# ── 80 articles across all tickers ────────────────────────────────────────────
ARTICLES = [
    # ── BLOOMBERG ──────────────────────────────────────────────────────────
    {"source":"Bloomberg","ticker":"AAPL",  "hours_ago":  1, "headline":"Apple reports record iPhone sales in Q2, beats analyst expectations by 8%"},
    {"source":"Bloomberg","ticker":"AAPL",  "hours_ago": 18, "headline":"Apple's services revenue hits all-time high as App Store subscriptions surge"},
    {"source":"Bloomberg","ticker":"AAPL",  "hours_ago": 72, "headline":"Apple raises quarterly dividend by 4% and approves $110B share buyback program"},
    {"source":"Bloomberg","ticker":"AAPL",  "hours_ago":120, "headline":"Apple Vision Pro faces weak consumer demand as high price limits mainstream adoption"},
    {"source":"Bloomberg","ticker":"NVDA",  "hours_ago":  3, "headline":"NVIDIA posts record data center revenue smashing Wall Street estimates by wide margin"},
    {"source":"Bloomberg","ticker":"NVDA",  "hours_ago": 30, "headline":"NVIDIA Blackwell GPU shipments accelerate as hyperscaler demand remains insatiable"},
    {"source":"Bloomberg","ticker":"NVDA",  "hours_ago": 96, "headline":"NVIDIA gross margins expand to 78% as premium AI chip pricing holds firm globally"},
    {"source":"Bloomberg","ticker":"MSFT",  "hours_ago":  5, "headline":"Microsoft Azure revenue jumps 31% driven by surging enterprise AI adoption globally"},
    {"source":"Bloomberg","ticker":"MSFT",  "hours_ago": 48, "headline":"Microsoft Copilot adoption accelerates across Fortune 500 enterprise clients this quarter"},
    {"source":"Bloomberg","ticker":"AMZN",  "hours_ago":  8, "headline":"Amazon AWS growth reaccelerates to 19% as cloud demand strengthens across all verticals"},
    {"source":"Bloomberg","ticker":"AMZN",  "hours_ago": 60, "headline":"Amazon Prime membership hits record 230M globally with strong content engagement"},
    {"source":"Bloomberg","ticker":"GOOGL", "hours_ago": 12, "headline":"Alphabet beats Q1 estimates as Google Search ad revenue rises 14% year-over-year"},
    {"source":"Bloomberg","ticker":"GOOGL", "hours_ago": 84, "headline":"Google DeepMind announces major AI breakthrough in drug discovery and protein folding"},
    {"source":"Bloomberg","ticker":"TSLA",  "hours_ago": 15, "headline":"Tesla energy storage division posts record quarterly revenue on surging grid demand"},
    {"source":"Bloomberg","ticker":"TSLA",  "hours_ago":108, "headline":"Tesla FSD v13 rollout receives strong early user reviews with improved safety metrics"},

    # ── REUTERS ────────────────────────────────────────────────────────────
    {"source":"Reuters","ticker":"AAPL",  "hours_ago":  2, "headline":"EU regulators intensify antitrust scrutiny of Apple App Store payment practices"},
    {"source":"Reuters","ticker":"AAPL",  "hours_ago": 36, "headline":"Apple supply chain partners flag critical component shortages heading into holiday season"},
    {"source":"Reuters","ticker":"NVDA",  "hours_ago":  6, "headline":"NVIDIA chip export restrictions to China weigh on near-term revenue outlook"},
    {"source":"Reuters","ticker":"NVDA",  "hours_ago": 54, "headline":"AMD MI300X challenges NVIDIA dominance in AI training workloads market segment"},
    {"source":"Reuters","ticker":"MSFT",  "hours_ago": 10, "headline":"Microsoft acquires AI voice startup for $1.3B to bolster Teams and Azure offerings"},
    {"source":"Reuters","ticker":"MSFT",  "hours_ago": 78, "headline":"Microsoft faces EU regulatory review over Activision Blizzard cloud gaming terms"},
    {"source":"Reuters","ticker":"AMZN",  "hours_ago": 14, "headline":"Amazon union activity intensifies at three major US warehouse locations this month"},
    {"source":"Reuters","ticker":"AMZN",  "hours_ago": 90, "headline":"Amazon pharmacy unit posts first profitable quarter on strong efficiency improvements"},
    {"source":"Reuters","ticker":"GOOGL", "hours_ago": 20, "headline":"DOJ antitrust ruling forces Google to open default search placement agreements"},
    {"source":"Reuters","ticker":"GOOGL", "hours_ago":102, "headline":"Google Cloud wins $2B multi-year contract with major Fortune 100 financial institution"},
    {"source":"Reuters","ticker":"TSLA",  "hours_ago": 22, "headline":"Tesla deliveries beat estimates as EV demand rebounds strongly in key Asian markets"},
    {"source":"Reuters","ticker":"TSLA",  "hours_ago":115, "headline":"Tesla faces intensifying price competition from BYD across European and Asian markets"},

    # ── CNBC ───────────────────────────────────────────────────────────────
    {"source":"CNBC","ticker":"AAPL",  "hours_ago":  4, "headline":"Analyst upgrades Apple to Strong Buy citing robust AI integration and services growth"},
    {"source":"CNBC","ticker":"AAPL",  "hours_ago": 42, "headline":"Apple India manufacturing expansion gains momentum with new Tata partnership agreement"},
    {"source":"CNBC","ticker":"NVDA",  "hours_ago":  7, "headline":"NVIDIA announces next-gen Blackwell Ultra GPU with unprecedented AI training capabilities"},
    {"source":"CNBC","ticker":"NVDA",  "hours_ago": 66, "headline":"NVIDIA supply constraints on CoWoS packaging limit Blackwell ramp warn analysts"},
    {"source":"CNBC","ticker":"MSFT",  "hours_ago": 11, "headline":"Microsoft Teams loses enterprise market share to Slack amid hybrid work policy shifts"},
    {"source":"CNBC","ticker":"MSFT",  "hours_ago": 80, "headline":"Microsoft cloud surpasses $40B quarterly run-rate for first time in company history"},
    {"source":"CNBC","ticker":"AMZN",  "hours_ago": 16, "headline":"Amazon logistics efficiency gains drive operating margin expansion to record highs"},
    {"source":"CNBC","ticker":"AMZN",  "hours_ago": 92, "headline":"Amazon advertising revenue hits $15B quarterly record beating analyst expectations"},
    {"source":"CNBC","ticker":"GOOGL", "hours_ago": 24, "headline":"Google Gemini Ultra shows strong performance gains in latest AI benchmark evaluations"},
    {"source":"CNBC","ticker":"GOOGL", "hours_ago":104, "headline":"YouTube ad revenue hits all-time quarterly high as Shorts monetization accelerates"},
    {"source":"CNBC","ticker":"TSLA",  "hours_ago": 28, "headline":"Tesla Supercharger network expansion drives strong adoption from rival EV manufacturers"},
    {"source":"CNBC","ticker":"TSLA",  "hours_ago":116, "headline":"Tesla Cybertruck production ramp faces quality control concerns delaying key deliveries"},

    # ── WSJ ────────────────────────────────────────────────────────────────
    {"source":"WSJ","ticker":"AAPL",  "hours_ago":  9, "headline":"Fed rate cut signals boost tech valuations with Apple leading large-cap market gains"},
    {"source":"WSJ","ticker":"AAPL",  "hours_ago": 50, "headline":"Apple iPhone 17 pre-orders indicate strong consumer demand across all global markets"},
    {"source":"WSJ","ticker":"NVDA",  "hours_ago": 13, "headline":"NVIDIA stock reaches new all-time high as AI infrastructure spending boom continues"},
    {"source":"WSJ","ticker":"NVDA",  "hours_ago": 70, "headline":"NVIDIA faces growing competition from custom AI chips designed by major tech firms"},
    {"source":"WSJ","ticker":"MSFT",  "hours_ago": 17, "headline":"Microsoft AI investments deliver measurable productivity gains across enterprise clients"},
    {"source":"WSJ","ticker":"MSFT",  "hours_ago": 88, "headline":"Microsoft Azure outage disrupts enterprise customers across three US regions for hours"},
    {"source":"WSJ","ticker":"AMZN",  "hours_ago": 21, "headline":"Amazon Kuiper satellite network launches successfully positioning for broadband market"},
    {"source":"WSJ","ticker":"AMZN",  "hours_ago": 98, "headline":"FTC lawsuit targets Amazon marketplace seller practices in major antitrust challenge"},
    {"source":"WSJ","ticker":"GOOGL", "hours_ago": 26, "headline":"Alphabet announces $70B buyback signaling strong management confidence in growth"},
    {"source":"WSJ","ticker":"GOOGL", "hours_ago":106, "headline":"Google faces advertiser backlash over brand safety failures on YouTube platform"},
    {"source":"WSJ","ticker":"TSLA",  "hours_ago": 31, "headline":"Tesla Megapack backlog grows to record $12B driven by global energy transition demand"},
    {"source":"WSJ","ticker":"TSLA",  "hours_ago":118, "headline":"Tesla profit margins under pressure as aggressive pricing strategy weighs on earnings"},

    # ── FT ─────────────────────────────────────────────────────────────────
    {"source":"FT","ticker":"AAPL",  "hours_ago": 35, "headline":"Apple India expansion faces infrastructure and regulatory hurdles slowing growth plans"},
    {"source":"FT","ticker":"NVDA",  "hours_ago": 44, "headline":"AI chip demand remains robust but inventory correction risk looms for late 2025"},
    {"source":"FT","ticker":"MSFT",  "hours_ago": 56, "headline":"Microsoft gaming division faces uncertainty as mobile market growth slows significantly"},
    {"source":"FT","ticker":"AMZN",  "hours_ago": 64, "headline":"Global macro headwinds may dampen e-commerce growth in key European markets"},
    {"source":"FT","ticker":"GOOGL", "hours_ago": 76, "headline":"Gemini AI integration into Google Workspace drives strong enterprise subscription growth"},
    {"source":"FT","ticker":"TSLA",  "hours_ago": 85, "headline":"Tesla autonomous driving timeline faces regulatory uncertainty across multiple jurisdictions"},

    # ── MarketWatch ────────────────────────────────────────────────────────
    {"source":"MarketWatch","ticker":"AAPL",  "hours_ago": 40, "headline":"Apple ecosystem stickiness drives record customer retention and upsell metrics"},
    {"source":"MarketWatch","ticker":"NVDA",  "hours_ago": 52, "headline":"NVIDIA CEO Jensen Huang unveils next-generation NVLink interconnect architecture"},
    {"source":"MarketWatch","ticker":"MSFT",  "hours_ago": 68, "headline":"Microsoft Power Platform adoption surges as enterprises automate workflows with AI"},
    {"source":"MarketWatch","ticker":"AMZN",  "hours_ago": 82, "headline":"Amazon Bedrock AI platform gains strong traction among enterprise developers and startups"},
    {"source":"MarketWatch","ticker":"GOOGL", "hours_ago": 95, "headline":"Google Maps platform revenue accelerates on strong developer API adoption globally"},
    {"source":"MarketWatch","ticker":"TSLA",  "hours_ago":110, "headline":"Tesla insurance business grows rapidly leveraging real-time driving behavior data"},

    # ── Seeking Alpha ──────────────────────────────────────────────────────
    {"source":"Seeking Alpha","ticker":"AAPL",  "hours_ago": 45, "headline":"Apple bears point to slowing iPhone upgrade cycle and China market share losses"},
    {"source":"Seeking Alpha","ticker":"NVDA",  "hours_ago": 58, "headline":"NVDA valuation stretched at 35x forward earnings raising near-term correction risk"},
    {"source":"Seeking Alpha","ticker":"MSFT",  "hours_ago": 73, "headline":"Microsoft dividend growth track record makes it a compelling long-term income hold"},
    {"source":"Seeking Alpha","ticker":"AMZN",  "hours_ago": 87, "headline":"Amazon AWS margin expansion story intact despite near-term infrastructure investment"},
    {"source":"Seeking Alpha","ticker":"GOOGL", "hours_ago":100, "headline":"Alphabet sum-of-the-parts valuation reveals significant hidden value in cloud and AI"},
    {"source":"Seeking Alpha","ticker":"TSLA",  "hours_ago":112, "headline":"Tesla bull case rests on robotaxi and energy but execution risk remains very high"},

    # ── Barron's ───────────────────────────────────────────────────────────
    {"source":"Barrons","ticker":"AAPL",  "hours_ago": 55, "headline":"Apple wearables segment posts strong double-digit growth as Apple Watch adoption rises"},
    {"source":"Barrons","ticker":"NVDA",  "hours_ago": 67, "headline":"NVIDIA remains best positioned to capture AI infrastructure spending supercycle"},
    {"source":"Barrons","ticker":"MSFT",  "hours_ago": 79, "headline":"Microsoft Copilot pricing increase signals strong enterprise demand and pricing power"},
    {"source":"Barrons","ticker":"AMZN",  "hours_ago": 91, "headline":"Amazon retail profitability improvement sets stage for sustained margin expansion"},
    {"source":"Barrons","ticker":"GOOGL", "hours_ago":103, "headline":"Google Search faces genuine long-term risk from AI-native search competitors"},
    {"source":"Barrons","ticker":"TSLA",  "hours_ago":114, "headline":"Tesla valuation remains difficult to justify on near-term fundamentals alone"},
]

# ── 50 feedback entries ───────────────────────────────────────────────────────
FEEDBACK_ENTRIES = [
    {"text":"Apple reports record iPhone sales beating expectations by 8%",         "predicted_label":"positive","user_feedback":"correct"},
    {"text":"NVIDIA chip export restrictions weigh on revenue outlook",              "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Microsoft Azure revenue jumps 31% on enterprise AI adoption",          "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Amazon union activity intensifies at warehouse locations",              "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Google Search ad revenue accelerates on AI improvements",              "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Tesla faces intensifying price competition from BYD",                  "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Apple raises dividend 4% and approves $110B buyback",                  "predicted_label":"positive","user_feedback":"correct"},
    {"text":"EU antitrust scrutiny of Apple App Store intensifies",                 "predicted_label":"negative","user_feedback":"correct"},
    {"text":"NVIDIA Blackwell GPU demand remains insatiable from hyperscalers",     "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Microsoft Teams loses ground to Slack in enterprise market",           "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Amazon AWS margin expansion story intact despite investments",          "predicted_label":"positive","user_feedback":"incorrect"},
    {"text":"Alphabet announces $70B buyback on strong confidence",                 "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Tesla Cybertruck production ramp faces quality concerns",               "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Apple India expansion gaining momentum with Tata partnership",          "predicted_label":"positive","user_feedback":"correct"},
    {"text":"NVDA valuation stretched at 35x forward earnings",                     "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Microsoft Power Platform surges as enterprises automate with AI",      "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Amazon FTC antitrust lawsuit targets marketplace practices",            "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Google Gemini shows strong AI benchmark performance gains",            "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Tesla profit margins under pressure from aggressive pricing",           "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Apple ecosystem drives record customer retention metrics",              "predicted_label":"positive","user_feedback":"correct"},
    {"text":"NVIDIA supply constraints limit Blackwell GPU ramp timeline",           "predicted_label":"negative","user_feedback":"incorrect"},
    {"text":"Microsoft cloud surpasses $40B quarterly run-rate milestone",          "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Amazon advertising revenue hits $15B quarterly record",                "predicted_label":"positive","user_feedback":"correct"},
    {"text":"YouTube ad revenue hits all-time high on Shorts monetization",         "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Tesla Megapack backlog grows to record $12B on energy demand",         "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Global macro headwinds may dampen e-commerce growth in Europe",        "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Apple iPhone 17 pre-orders signal strong consumer demand globally",    "predicted_label":"positive","user_feedback":"correct"},
    {"text":"DOJ forces Google to open default search placement agreements",        "predicted_label":"negative","user_feedback":"correct"},
    {"text":"AMD MI300X challenges NVIDIA in AI training workloads",                "predicted_label":"negative","user_feedback":"incorrect"},
    {"text":"Amazon Kuiper satellite network launches successfully",                "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Tesla FSD v13 receives strong early reviews and safety metrics",       "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Apple wearables posts double-digit growth as Watch adoption rises",    "predicted_label":"positive","user_feedback":"correct"},
    {"text":"NVIDIA CEO unveils next-generation NVLink interconnect architecture",  "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Microsoft Azure outage disrupts enterprise customers across US",        "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Google Cloud wins $2B contract with Fortune 100 financial firm",       "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Tesla bears cite execution risk on robotaxi and autonomous driving",   "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Apple services segment drives margin expansion above hardware",         "predicted_label":"positive","user_feedback":"correct"},
    {"text":"NVIDIA remains best positioned for AI infrastructure supercycle",      "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Microsoft dividend growth makes it compelling income investment",       "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Amazon Bedrock gains traction among enterprise AI developers",         "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Google faces advertiser backlash over brand safety on YouTube",        "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Tesla autonomous driving faces regulatory uncertainty globally",        "predicted_label":"negative","user_feedback":"correct"},
    {"text":"Alphabet hidden value in cloud and AI revealed by sum-of-parts",       "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Apple supply chain faces critical shortages before holiday season",    "predicted_label":"negative","user_feedback":"correct"},
    {"text":"NVIDIA competition from custom AI chips by big tech concerns market",  "predicted_label":"negative","user_feedback":"incorrect"},
    {"text":"Microsoft AI investments deliver measurable enterprise productivity",   "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Amazon pharmacy posts first profitable quarter on efficiency gains",   "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Google Maps platform revenue accelerates on developer API adoption",   "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Tesla insurance business grows on real-time driving behavior data",    "predicted_label":"positive","user_feedback":"correct"},
    {"text":"Apple bears flag slowing iPhone upgrade cycle and China losses",       "predicted_label":"negative","user_feedback":"correct"},
]

# ── Token tagging ─────────────────────────────────────────────────────────────
POSITIVE_KW = {
    "record","beats","beat","strong","upgrade","upgrades","surge","surges","growth",
    "profit","boost","high","best","accelerates","robust","expansion","positive",
    "strength","efficient","breakthrough","improves","rebound","rebounded","jumps",
    "hit","hits","significant","adoption","increase","confidence","wins","leading",
    "innovation","milestone","outperform","outperforms","dominant","gains","gained",
    "accelerate","accelerating","rises","rising","improving","record-high","strong",
}
NEGATIVE_KW = {
    "concern","concerns","risk","risks","limit","limits","scrutiny","antitrust",
    "lawsuit","competition","decline","loss","losses","layoffs","weigh","weighs",
    "correction","disappointing","miss","fears","stretched","uncertainty","hurdles",
    "slows","intensifies","headwinds","short","dampen","looms","regulatory",
    "restriction","restrictions","below","burden","vulnerable","worries","volatile",
    "pressure","pressures","challenging","challenges","faces","facing","delays","delay",
}

def tag_tokens(headline):
    words = re.findall(r"\b\w[\w'%+\-]*\b|[^\w\s]", headline)
    result = []
    for w in words:
        wl = w.lower()
        if wl in POSITIVE_KW:   result.append({"w": w, "s": "pos"})
        elif wl in NEGATIVE_KW: result.append({"w": w, "s": "neg"})
        else:                   result.append({"w": w, "s": "neu"})
    return result

def extract_keywords(enriched):
    freq = defaultdict(lambda: {"count": 0, "sentiment": "neu"})
    for art in enriched:
        for t in art.get("tokens", []):
            if t["s"] in ("pos", "neg"):
                freq[t["w"].lower()]["count"] += 1
                freq[t["w"].lower()]["sentiment"] = t["s"]
    top = sorted(freq.items(), key=lambda x: x[1]["count"], reverse=True)[:20]
    return [{"keyword": k, "sentiment": v["sentiment"], "count": v["count"]} for k, v in top]

def build_timeline(enriched, days=30):
    now = datetime.utcnow()
    n   = len(enriched)
    out = []
    for i in range(days - 1, -1, -1):
        day   = now - timedelta(days=i)
        arts  = [enriched[j] for j in range(n) if j % days == (days - 1 - i) % n]
        if not arts:
            score = out[-1]["score"] if out else 0.0
        else:
            scores = [a["score"] if a["label"]=="positive" else (-a["score"] if a["label"]=="negative" else 0) for a in arts]
            score  = round(sum(scores) / len(scores), 4)
        out.append({"label": day.strftime("%b %d").replace(" 0"," "), "score": score, "date": day.strftime("%Y-%m-%d")})
    return out

def build_sources(enriched):
    sd = defaultdict(lambda: {"scores": [], "labels": []})
    for a in enriched:
        signed = a["score"] if a["label"]=="positive" else (-a["score"] if a["label"]=="negative" else 0)
        sd[a["source"]]["scores"].append(signed)
        sd[a["source"]]["labels"].append(a["label"])
    out = []
    for src, d in sd.items():
        avg = round(sum(d["scores"]) / len(d["scores"]), 2)
        cnt = len(d["scores"])
        out.append({"source": src, "count": cnt, "avg_score": avg,
                    "score_str": f"+{avg}" if avg >= 0 else str(avg),
                    "pos_pct": round(d["labels"].count("positive") / cnt * 100)})
    return sorted(out, key=lambda x: x["avg_score"], reverse=True)

# ── FinBERT — one article at a time (most reliable on free tier) ──────────────
async def call_finbert(text, client):
    headers = {"Authorization": f"Bearer {HF_API_KEY}", "Content-Type": "application/json"}
    for attempt in range(5):
        try:
            resp = await client.post(
                HF_API_URL, headers=headers,
                json={"inputs": text, "options": {"wait_for_model": True}},
            )
            if resp.status_code == 503:
                wait = 25 + attempt * 10
                print(f"    503 model loading — waiting {wait}s...")
                await asyncio.sleep(wait); continue
            if resp.status_code == 429:
                wait = 35 + attempt * 15
                print(f"    429 rate limited  — waiting {wait}s...")
                await asyncio.sleep(wait); continue
            if resp.status_code != 200:
                print(f"    ⚠ HTTP {resp.status_code} — {resp.text[:100]}")
                await asyncio.sleep(12); continue

            result = resp.json()
            return result if result and isinstance(result[0], dict) else result[0]

        except Exception as e:
            print(f"    ⚠ {e} — retrying...")
            await asyncio.sleep(10 * (attempt + 1))

    raise RuntimeError(f"FinBERT failed for: {text[:60]}")

# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    print("=" * 65)
    print("  StockForge Sentiment Seeder  v3")
    print(f"  {len(ARTICLES)} articles · {len(FEEDBACK_ENTRIES)} feedback entries")
    print("=" * 65)

    if not HF_API_KEY:
        print("⚠  HF_API_KEY not set in .env — requests may be rate-limited\n")
    else:
        print(f"✓  HF_API_KEY: {HF_API_KEY[:10]}...\n")

    now      = datetime.utcnow()
    enriched = []

    async with httpx.AsyncClient(timeout=90) as client:
        for i, art in enumerate(ARTICLES):
            headline = art["headline"]
            print(f"  [{i+1:02d}/{len(ARTICLES)}] {headline[:62]}...")
            try:
                scores = await call_finbert(headline, client)
                best   = max(scores, key=lambda x: x["score"])
                label  = best["label"].lower()
                score  = round(best["score"], 4)
            except Exception as e:
                print(f"         SKIPPED — {e}")
                continue

            enriched.append({
                "source":        art["source"],
                "ticker":        art["ticker"],
                "headline":      headline,
                "label":         label,
                "score":         score,
                "confidence":    score,
                "all_scores":    scores,
                "tokens":        tag_tokens(headline),
                "published_at":  (now - timedelta(hours=art["hours_ago"])).isoformat(),
                "seeded_at":     now.isoformat(),
                "score_display": (
                    f"+{score:.2f} Positive" if label == "positive"
                    else f"-{score:.2f} Negative" if label == "negative"
                    else f"{score:.2f} Neutral"
                ),
            })
            print(f"         → {label.upper():8s} {score:.4f}")
            await asyncio.sleep(1.2)   # polite pause between requests

    if not enriched:
        print("\n✖ No articles processed. Check HF_API_KEY or network.")
        return

    # ── Stats ─────────────────────────────────────────────────────────────
    total    = len(enriched)
    pos_list = [a for a in enriched if a["label"] == "positive"]
    neg_list = [a for a in enriched if a["label"] == "negative"]
    neu_list = [a for a in enriched if a["label"] == "neutral"]
    pos_pct  = round(len(pos_list) / total * 100, 1)
    avg_conf = round(sum(a["confidence"] for a in enriched) / total * 100, 1)

    def signed(a):
        return a["score"] if a["label"]=="positive" else (-a["score"] if a["label"]=="negative" else 0.0)

    overall = round(sum(signed(a) for a in enriched) / total, 4)

    stats = {
        "articles_processed":    total,
        "overall_sentiment":     overall,
        "overall_sentiment_str": f"+{overall}" if overall >= 0 else str(overall),
        "positive_rate":         pos_pct,
        "positive_count":        len(pos_list),
        "negative_count":        len(neg_list),
        "neutral_count":         len(neu_list),
        "nlp_confidence":        avg_conf,
        "generated_at":          now.isoformat(),
        "sentiment_bias":        "Bullish" if overall > 0.1 else ("Bearish" if overall < -0.1 else "Neutral"),
    }

    # ── Feedback docs ─────────────────────────────────────────────────────
    tickers_map = {"Apple":"AAPL","NVIDIA":"NVDA","NVDA":"NVDA","Microsoft":"MSFT",
                   "Amazon":"AMZN","Google":"GOOGL","Tesla":"TSLA","TSLA":"TSLA",
                   "AAPL":"AAPL","MSFT":"MSFT","AMZN":"AMZN","GOOGL":"GOOGL"}
    feedback_docs = []
    for i, fb in enumerate(FEEDBACK_ENTRIES):
        first_word = fb["text"].split()[0]
        ticker_ctx = tickers_map.get(first_word, "AAPL")
        hrs = (i * 3) + 1
        feedback_docs.append({
            **fb,
            "predicted_score": 0.91 if fb["user_feedback"] == "correct" else 0.58,
            "source":          "dashboard_manual",
            "version":         "finbert-v1",
            "ticker_context":  ticker_ctx,
            "submitted_at":    (now - timedelta(hours=hrs)).isoformat(),
            "saved_at":        (now - timedelta(hours=hrs)).isoformat(),
        })

    # ── Write MongoDB ─────────────────────────────────────────────────────
    print(f"\n[MongoDB] Writing {total} articles + {len(feedback_docs)} feedback entries...")
    db_client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())
    db        = db_client[DB_NAME]

    for col in ["sentiment_articles","sentiment_stats","sentiment_timeline",
                "sentiment_sources","sentiment_keywords","sentiment_feedback"]:
        db[col].drop()

    db.sentiment_articles.insert_many(enriched);           print(f"  ✓ sentiment_articles  → {len(enriched)}")
    db.sentiment_stats.insert_one(stats);                  print(f"  ✓ sentiment_stats     → 1")
    db.sentiment_timeline.insert_many(build_timeline(enriched)); print(f"  ✓ sentiment_timeline  → 30")
    db.sentiment_sources.insert_many(build_sources(enriched));   print(f"  ✓ sentiment_sources   → {len(set(a['source'] for a in enriched))}")
    db.sentiment_keywords.insert_many(extract_keywords(enriched)); print(f"  ✓ sentiment_keywords  → 20")
    db.sentiment_feedback.insert_many(feedback_docs);      print(f"  ✓ sentiment_feedback  → {len(feedback_docs)}")
    db_client.close()

    print("\n" + "=" * 65)
    print("  SUMMARY")
    print("=" * 65)
    print(f"  Articles processed : {total} / {len(ARTICLES)}")
    print(f"  Positive           : {len(pos_list)} ({pos_pct}%)")
    print(f"  Negative           : {len(neg_list)}")
    print(f"  Neutral            : {len(neu_list)}")
    print(f"  Overall sentiment  : {stats['overall_sentiment_str']}")
    print(f"  Avg NLP confidence : {avg_conf}%")
    print(f"  Bias               : {stats['sentiment_bias']}")
    print(f"  Feedback entries   : {len(feedback_docs)}")
    print("\n✅  Done! Refresh your StockForge dashboard.\n")


if __name__ == "__main__":
    asyncio.run(main())