const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const PORT = 5000;

// ✅ DIRECT CONNECTION STRING (NO .env)
const MONGO_URI =
  "mongodb+srv://Priorify:1234567890@moeezdatabases.nyxyde8.mongodb.net/?retryWrites=true&w=majority";

const DB_NAME = "StockForge";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

let db;

async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();

    db = client.db(DB_NAME);

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

/* ─────────────── API ─────────────── */

app.get("/api/predictions/:ticker", async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();

    const doc = await db.collection("predictions").findOne({ ticker });

    if (!doc) {
      return res.status(404).json({ error: "Ticker not found" });
    }

    res.json({
      ticker: doc.ticker,
      price: doc.price ?? 0,
      change: doc.change ?? 0,

      open: doc.open ?? 0,
      high: doc.high ?? 0,
      low: doc.low ?? 0,
      volume: doc.volume ?? 0,

      predicted_close: doc.predicted_close ?? null,
      market_cap_label: doc.market_cap_label ?? "—",

      prediction: doc.prediction ?? "NEUTRAL",
      confidence: doc.confidence ?? 0,

      forecast_1d: doc.forecast_1d ?? null,
      forecast_5d: doc.forecast_5d ?? null,
      forecast_30d: doc.forecast_30d ?? null,

      updated_at: doc.updated_at ?? new Date(),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/predictions", async (req, res) => {
  try {
    const docs = await db.collection("predictions").find().toArray();

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/price_history/:ticker", async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();

    const docs = await db
      .collection("price_history")
      .find({ ticker })
      .sort({ date: 1 })
      .toArray();

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ─────────────── PORTFOLIO ─────────────── */
// Builds portfolio positions from the predictions collection.
// Each ticker doc already has price, change, prediction, confidence,
// market_cap, forecast_* — we just reshape it for the dashboard.

const SHARES_HELD = {
  AAPL:  150,
  AMZN:   80,
  GOOGL: 100,
  MSFT:  120,
  NVDA:   60,
};

app.get("/api/portfolio", async (req, res) => {
  try {
    const docs = await db.collection("predictions").find().toArray();

    if (!docs.length) {
      return res.json({ positions: [], totalValue: null, todayPnL: null });
    }

    const positions = docs.map((doc) => {
      const ticker  = doc.ticker;
      const price   = doc.price   ?? 0;
      const change  = doc.change  ?? 0;
      const shares  = SHARES_HELD[ticker] ?? 0;
      const value   = price * shares;
      const dayPnL  = change * shares;

      // Map prediction/signal field — pipeline stores either "prediction" or "signal"
      const rawSignal = doc.prediction ?? doc.signal ?? "NEUTRAL";

      // Normalise to the badge labels the frontend expects
      const signalMap = {
        UP:           "BUY",
        DOWN:         "REDUCE",
        HOLD:         "HOLD",
        "STRONG BUY": "STRONG BUY",
        BULLISH:      "BUY",
        BEARISH:      "REDUCE",
        NEUTRAL:      "HOLD",
      };
      const signal = signalMap[rawSignal] ?? "HOLD";

      const conf1d = doc.forecast_1d?.confidence ?? doc.confidence ?? 0;

      return {
        symbol:   ticker,
        price:    `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        chg:      `${change >= 0 ? "+" : ""}$${Math.abs(change).toFixed(2)}`,
        up:       change >= 0,
        shares:   shares.toLocaleString(),
        value:    `$${Math.round(value).toLocaleString("en-US")}`,
        signal,
        target:   `$${(price * 1.05).toFixed(2)}`,   // +5% simple target
        conf:     `${(conf1d * 100).toFixed(0)}%`,
        allocPct: 0,   // filled below once total is known
        rawValue: value,
        rawDayPnL: dayPnL,
      };
    });

    const totalValue = positions.reduce((s, p) => s + p.rawValue, 0);
    const todayPnL   = positions.reduce((s, p) => s + p.rawDayPnL, 0);

    // Compute allocation percentages
    positions.forEach((p) => {
      p.allocPct = totalValue > 0
        ? Math.round((p.rawValue / totalValue) * 100)
        : 0;
      delete p.rawValue;
      delete p.rawDayPnL;
    });

    res.json({ positions, totalValue, todayPnL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── RISK METRICS ─────────────── */
// Reads from the risk_metrics collection stored by stock_pipeline.py.
// Returns sharpe_ratio and volatility (already computed by the pipeline).
// max_drawdown, beta, alpha, win_rate are derived here from price_history
// if not already present in the DB doc.

app.get("/api/risk_metrics", async (req, res) => {
  try {
    // Return cached DB result if fresh (less than 1 hour old)
    const riskDoc = await db.collection("risk_metrics").findOne({ id: "portfolio" });
    if (riskDoc && riskDoc.computed_at) {
      const ageMs = Date.now() - new Date(riskDoc.computed_at).getTime();
      if (ageMs < 60 * 60 * 1000) {
        return res.json({
          sharpe_ratio: riskDoc.sharpe_ratio ?? null,
          volatility:   riskDoc.volatility   ?? null,
          max_drawdown: riskDoc.max_drawdown  ?? null,
          beta:         riskDoc.beta          ?? null,
          alpha:        riskDoc.alpha         ?? null,
          win_rate:     riskDoc.win_rate      ?? null,
        });
      }
    }

    // Compute from price_history
    const tickers = ["AAPL", "AMZN", "GOOGL", "MSFT", "NVDA"];
    const TRADING  = 252;

    const seriesMap = {};
    for (const t of tickers) {
      const docs = await db
        .collection("price_history")
        .find({ ticker: t }, { projection: { _id: 0, date: 1, close: 1 } })
        .sort({ date: 1 })
        .toArray();
      seriesMap[t] = docs.map((d) => d.close);
    }

    const minLen = Math.min(...Object.values(seriesMap).map((a) => a.length));
    if (minLen < 2) {
      return res.json({ sharpe_ratio: null, volatility: null, max_drawdown: null, beta: null, alpha: null, win_rate: null });
    }

    // Equal-weight portfolio daily returns
    const portReturns = [];
    for (let i = 1; i < minLen; i++) {
      let r = 0;
      for (const t of tickers) {
        const arr = seriesMap[t];
        r += (arr[i] - arr[i - 1]) / arr[i - 1];
      }
      portReturns.push(r / tickers.length);
    }

    // Use AAPL as market proxy for beta/alpha (largest cap, most correlated to broad market)
    const aaplPrices = seriesMap["AAPL"];
    const benchReturns = [];
    for (let i = 1; i < minLen; i++) {
      benchReturns.push((aaplPrices[i] - aaplPrices[i - 1]) / aaplPrices[i - 1]);
    }

    const r2  = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
    const portMean  = r2(portReturns);
    const benchMean = r2(benchReturns);

    // Beta = Cov(port, bench) / Var(bench)
    let cov = 0, varBench = 0;
    for (let i = 0; i < portReturns.length; i++) {
      cov      += (portReturns[i] - portMean)  * (benchReturns[i] - benchMean);
      varBench += (benchReturns[i] - benchMean) ** 2;
    }
    const beta = varBench > 0 ? cov / varBench : 1;

    // Alpha = annualised (port return - beta * bench return)
    const alpha = (portMean - beta * benchMean) * TRADING * 100;

    // Sharpe & volatility
    const variance  = portReturns.reduce((s, v) => s + (v - portMean) ** 2, 0) / portReturns.length;
    const std       = Math.sqrt(variance);
    const sharpe    = std > 0 ? (portMean / std) * Math.sqrt(TRADING) : 0;
    const annualVol = std * Math.sqrt(TRADING) * 100;

    // Max drawdown
    let peak = 1, cum = 1, maxDD = 0;
    for (const r of portReturns) {
      cum *= (1 + r);
      if (cum > peak) peak = cum;
      const dd = (peak - cum) / peak * 100;
      if (dd > maxDD) maxDD = dd;
    }

    // Win rate
    const winRate = (portReturns.filter((r) => r > 0).length / portReturns.length) * 100;

    const result = {
      sharpe_ratio: Math.round(sharpe    * 100) / 100,
      volatility:   Math.round(annualVol * 10)  / 10,
      max_drawdown: Math.round(maxDD     * 10)  / 10,
      beta:         Math.round(beta      * 100) / 100,
      alpha:        Math.round(alpha     * 100) / 100,
      win_rate:     Math.round(winRate   * 10)  / 10,
    };

    // Save to DB so next request is instant
    await db.collection("risk_metrics").updateOne(
      { id: "portfolio" },
      { $set: { id: "portfolio", ...result, computed_at: new Date() } },
      { upsert: true }
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────── START ─────────────── */

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});