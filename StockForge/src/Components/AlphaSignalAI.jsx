import { useState, useEffect } from "react";
import Navbar from "./Navbar";

// ── Theme tokens ──────────────────────────────────────────────────────────────
const DARK = {
  bg: "#0a0a0f", bg2: "#0d0d18", surface: "#111120",
  border: "#1a1a28", border2: "#1e1e2e",
  text: "#e2e2e2", text2: "#aaa",
  muted: "#666", muted2: "#555", muted3: "#444",
  accent: "#6d28d9", accent2: "#4f46e5",
  green: "#22c55e", red: "#ef4444", amber: "#d97706",
  blue: "#3b82f6", purple: "#8b5cf6",
  mono: "'JetBrains Mono','Fira Code','Courier New',monospace",
  logoGrad: "linear-gradient(135deg,#6d28d9,#4f46e5)",
};
const LIGHT = {
  bg: "#f0f5fb", bg2: "#ffffff", surface: "#f7f9fc",
  border: "#dde4ef", border2: "#c8d4e8",
  text: "#0f172a", text2: "#334155",
  muted: "#64748b", muted2: "#94a3b8", muted3: "#b0bcd4",
  accent: "#4f46e5", accent2: "#6d28d9",
  green: "#16a34a", red: "#dc2626", amber: "#b45309",
  blue: "#2563eb", purple: "#7c3aed",
  mono: "'JetBrains Mono','Fira Code','Courier New',monospace",
  logoGrad: "linear-gradient(135deg,#4f46e5,#6d28d9)",
};

// ── Visual-only colour palette for allocation bar ─────────────────────────────
const ALLOC_COLORS = {
  AAPL: "#22c55e", NVDA: "#8b5cf6", META: "#3b82f6",
  MSFT: "#d97706", AMZN: "#06b6d4", GOOGL: "#ef4444",
  TSLA: "#f59e0b", DEFAULT: "#94a3b8",
};

// ── Static pipeline labels (UI chrome only, no business data) ─────────────────
const PIPE_ROW1 = [
  { label: "Kaggle Dataset",    sub: "3,774 rows · 2010–2024\n5 tickers: AAPL, AMZN\nGOOGL, MSFT, NVDA" },
  { label: "OHLCV Columns", sub: "Open · High · Low\nClose · Volume\n25 raw columns" },
  { label: "MongoDB Atlas", sub: "StockForge DB\npredictions collection\nprice_history collection" },
  { label: "FastAPI Server",sub: "Uvicorn · Port 5000\n/api/portfolio\n/api/risk_metrics" },
];
const PIPE_ROW2 = [
  { label: "Preprocessing",    sub: "pct_change · dropna\nDate sort & parse\nper-ticker isolation" },
  { label: "Feature Eng.",     sub: "ret_1 · ret_5 returns\nRSI-14 (EWM method)\n8 input features" },
  { label: "Label Creation",   sub: "UP >+0.5% threshold\nDOWN <-0.5% threshold\nHOLD (between)" },
  { label: "Train/Test Split", sub: "80% train · 20% test\nno shuffle (time-series)\nsklearn split" },
];
const PIPE_ROW3 = [
  { label: "XGBoost Model",   sub: "n_estimators: 250\nmax_depth: 5 · lr: 0.05\nmlogloss eval metric" },
  { label: "Inference",       sub: "predict_proba()\nwindow: last 1/5/30 rows\nmajority vote avg" },
  { label: "Forecast Signal", sub: "STRONG BUY ≥70% conf\nBULLISH · NEUTRAL\nBEARISH (DOWN label)" },
  { label: "Dashboard",       sub: "MongoDB upsert\nmarket cap label\n1d · 5d · 30d forecasts" },
];
const KAGGLE_SOURCES = [
  { icon: "📈", title: "OHLCV Price Data",    sub: "5 Tickers · 3,774 rows\n2010–2024 daily\nCSV flat file" },
  { icon: "⚙️", title: "XGBoost Classifier", sub: "scikit-learn + xgboost\nn_estimators=250\nmax_depth=5, lr=0.05" },
  { icon: "📊", title: "Technical Features",  sub: "RSI-14 · ret_1 · ret_5\nOHLCV raw features\n8 features total" },
  { icon: "🗄️", title: "MongoDB Atlas",       sub: "StockForge database\npredictions (upsert)\nprice_history (chart)" },
];
// ── Risk metric display config — values come from /api/risk_metrics ───────────
const RISK_CONFIG = [
  {
    key: "sharpe_ratio", label: "SHARPE RATIO",
    fmt: (v) => v != null ? v.toFixed(2) : "—",
    color: (v, t) => v >= 1 ? t.green : v >= 0 ? t.amber : t.red,
  },
  {
    key: "max_drawdown", label: "MAX DRAWDOWN",
    fmt: (v) => v != null ? `${v.toFixed(1)}%` : "—",
    color: (_v, t) => t.red,
  },
  {
    key: "beta", label: "BETA",
    fmt: (v) => v != null ? v.toFixed(2) : "—",
    color: (_v, t) => t.text,
  },
  {
    key: "alpha", label: "ALPHA",
    fmt: (v) => v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "—",
    color: (v, t) => v >= 0 ? t.green : t.red,
  },
  {
    key: "volatility", label: "VOLATILITY",
    fmt: (v) => v != null ? `${v.toFixed(1)}%` : "—",
    color: (_v, t) => t.amber,
  },
  {
    key: "win_rate", label: "WIN RATE",
    fmt: (v) => v != null ? `${v.toFixed(1)}%` : "—",
    color: (v, t) => v >= 55 ? t.green : v >= 45 ? t.amber : t.red,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function SignalBadge({ signal, t }) {
  const map = {
    "BUY":        { bg: t.green + "22", color: t.green, border: t.green + "55" },
    "STRONG BUY": { bg: t.blue  + "22", color: t.blue,  border: t.blue  + "55" },
    "HOLD":       { bg: t.amber + "22", color: t.amber, border: t.amber + "55" },
    "REDUCE":     { bg: t.red   + "22", color: t.red,   border: t.red   + "55" },
  };
  const s = map[signal] || map["HOLD"];
  const label =
    signal === "STRONG BUY" ? "↑ STRONG BUY"
    : signal === "BUY"      ? "↑ BUY"
    : signal === "REDUCE"   ? "↓ REDUCE"
    : "→ HOLD";
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700,
      letterSpacing: 0.4, whiteSpace: "nowrap", fontFamily: t.mono,
    }}>{label}</span>
  );
}

function PipeBox({ label, sub, row, t, d }) {
  const styles = {
    1: { bg: d ? t.surface : "#f7f9fc", border: d ? t.border2 : "#dde4ee", text: t.text, sub: t.muted },
    2: { bg: d ? "#0f1a2e" : "#edf5ff", border: d ? "#1a2d48" : "#bcd4f0", text: d ? t.blue : "#1a4a7a", sub: t.muted },
    3: { bg: d ? "#120e22" : "#f2eeff", border: d ? "#22184a" : "#d1c4fc", text: d ? t.purple : "#4a2da8", sub: t.muted },
  };
  const c = styles[row];
  return (
    <div style={{ flex: 1, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: "9px 12px", minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 11, color: c.text, marginBottom: 2, fontFamily: t.mono }}>{label}</div>
      <div style={{ fontSize: 9.5, color: c.sub, whiteSpace: "pre-line", lineHeight: 1.5, fontFamily: t.mono }}>{sub}</div>
    </div>
  );
}

function SkeletonRow({ t }) {
  return (
    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
      {[90, 70, 55, 40, 70, 85, 70, 40].map((w, i) => (
        <td key={i} style={{ padding: "9px 12px" }}>
          <div style={{ width: w, height: 11, borderRadius: 3, background: t.border2, animation: "sfPulse 1.4s ease-in-out infinite" }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonMetric({ t }) {
  return (
    <div style={{ background: t.surface, borderRadius: 6, padding: "9px 10px", border: `1px solid ${t.border2}` }}>
      <div style={{ width: 60, height: 8,  borderRadius: 3, background: t.border2, marginBottom: 6, animation: "sfPulse 1.4s ease-in-out infinite" }} />
      <div style={{ width: 48, height: 18, borderRadius: 3, background: t.border2, animation: "sfPulse 1.4s ease-in-out infinite" }} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt$  = (n) => n != null ? `$${Math.abs(Math.round(n)).toLocaleString("en-US")}` : "—";
const fmtPL = (n) => n != null ? `${n >= 0 ? "+" : "-"}${fmt$(n)}` : "—";

// ── Main component ────────────────────────────────────────────────────────────
export default function StockForgeDashboard() {
  const [darkMode, setDarkMode] = useState(true);

  // Portfolio (from /api/portfolio)
  const [positions,   setPositions]   = useState([]);
  const [totalValue,  setTotalValue]  = useState(null);
  const [todayPnL,    setTodayPnL]    = useState(null);
  const [portLoading, setPortLoading] = useState(true);
  const [portError,   setPortError]   = useState(null);

  // Risk metrics (from /api/risk_metrics)
  const [riskData,    setRiskData]    = useState(null);
  const [riskLoading, setRiskLoading] = useState(true);
  const [riskError,   setRiskError]   = useState(null);

  // Fetch portfolio
// Fetch portfolio — same endpoint as dashboard chart
useEffect(() => {
    let dead = false;
    (async () => {
      setPortLoading(true); setPortError(null);
      try {
        const TICKERS = ["AAPL", "AMZN", "GOOGL", "MSFT", "NVDA"];
        const SHARES  = { AAPL: 150, AMZN: 80, GOOGL: 100, MSFT: 120, NVDA: 60 };

        const results = await Promise.all(
          TICKERS.map(t =>
            fetch(`http://localhost:5000/api/predictions/${t}`)
              .then(r => r.ok ? r.json() : null)
          )
        );

        if (dead) return;

        let totalValue = 0;
        let todayPnL   = 0;
        const positions = [];

        for (const doc of results) {
          if (!doc) continue;
          const ticker = doc.ticker;
          const price  = Number(doc.price);
          const change = Number(doc.change);
          const shares = SHARES[ticker] ?? 0;
          const value  = price * shares;
          const pnl    = change * shares;
          totalValue  += value;
          todayPnL    += pnl;

          positions.push({
            symbol:          ticker,
            price:           `$${price.toFixed(2)}`,
            chg:             `${change >= 0 ? "+" : ""}$${change.toFixed(2)}`,
            up:              change >= 0,
            shares:          shares,
            value:           `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            signal:          doc.prediction ?? "HOLD",
            predicted_close: doc.predicted_close ? Number(doc.predicted_close) : null,
            target:          doc.predicted_close ? `$${Number(doc.predicted_close).toFixed(2)}` : "—",
            conf:            `${Math.round((doc.confidence ?? 0) * 100)}%`,
            allocPct:        0,
          });
        }

        // fill allocPct
        positions.forEach(p => {
          const raw = parseFloat(p.value.replace(/[$,]/g, ""));
          p.allocPct = totalValue ? Math.round((raw / totalValue) * 1000) / 10 : 0;
        });

        setPositions(positions);
        setTotalValue(Math.round(totalValue));
        setTodayPnL(Math.round(todayPnL));

      } catch (e) { if (!dead) setPortError(e.message); }
      finally     { if (!dead) setPortLoading(false); }
    })();
    return () => { dead = true; };
  }, []);

  // Fetch risk metrics
  useEffect(() => {
    let dead = false;
    (async () => {
      setRiskLoading(true); setRiskError(null);
      try {
        const r = await fetch("http://localhost:5000/api/risk_metrics");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (dead) return;
        setRiskData(d);
      } catch (e) { if (!dead) setRiskError(e.message); }
      finally     { if (!dead) setRiskLoading(false); }
    })();
    return () => { dead = true; };
  }, []);

  const d = darkMode;
  const t = d ? DARK : LIGHT;

  // Allocation bar — derived from live positions sorted by value desc
  const alloc = [...positions]
    .sort((a, b) => b.allocPct - a.allocPct)
    .map((p) => ({ symbol: p.symbol, pct: p.allocPct, color: ALLOC_COLORS[p.symbol] ?? ALLOC_COLORS.DEFAULT }));

  const rowBg = (i) => i % 2 === 0 ? t.surface : (d ? "#0e0e1c" : "#f8fafd");

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: ${t.bg}; }
        ::-webkit-scrollbar-thumb { background: ${t.border2}; border-radius: 3px; }
        @keyframes sfPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>

      <div style={{ fontFamily: t.mono, background: t.bg, minHeight: "100vh", color: t.text, transition: "background .2s,color .2s", fontSize: 12 }}>

        <Navbar isDark={d} onToggle={() => setDarkMode(v => !v)} activeLabel="Predictions" />

        <div style={{ padding: "20px 24px 48px", maxWidth: 1160, margin: "0 auto" }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: t.text, letterSpacing: "-0.01em" }}>
                Portfolio &amp; Predictions
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 10, color: t.muted }}>
                AI-driven signal overview · Kaggle dataset pipeline ·
                <span style={{ fontWeight: 600, color: t.text2 }}>
                  {portLoading ? " loading…" : ` ${positions.length} active positions`}
                </span>
              </p>
            </div>

            {/* Portfolio Value & P&L — both computed server-side from live data */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: t.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Portfolio Value &nbsp;&nbsp;&nbsp; Today's P&amp;L
              </div>
              <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
                {portLoading ? (
                  <>
                    <div style={{ width: 100, height: 28, borderRadius: 4, background: t.border2, animation: "sfPulse 1.4s ease-in-out infinite" }} />
                    <div style={{ width: 72,  height: 22, borderRadius: 4, background: t.border2, animation: "sfPulse 1.4s ease-in-out infinite" }} />
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 24, fontWeight: 700, color: t.text }}>{fmt$(totalValue)}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: todayPnL >= 0 ? t.green : t.red }}>{fmtPL(todayPnL)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Pipeline (static labels — describes the architecture) ──────── */}
          <div style={{ background: t.bg2, borderRadius: 8, border: `1px solid ${t.border}`, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: t.text }}>Data Pipeline — Kaggle to Prediction</span>
              <span style={{ fontSize: 9, color: t.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>End-to-end Flow</span>
            </div>
            {[PIPE_ROW1, PIPE_ROW2, PIPE_ROW3].map((row, ri) => (
              <div key={ri}>
                <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
                  {row.map((p, i) => (
                    <div key={p.label} style={{ display: "flex", flex: 1, alignItems: "center", gap: 5, minWidth: 0 }}>
                      <PipeBox label={p.label} sub={p.sub} row={ri + 1} t={t} d={d} />
                      {i < row.length - 1 && <span style={{ color: t.muted, fontSize: 12, flexShrink: 0 }}>{ri === 0 ? "+" : "—"}</span>}
                    </div>
                  ))}
                </div>
                {ri < 2 && <div style={{ textAlign: "center", color: t.muted, fontSize: 11, marginBottom: 4 }}>{ri === 0 ? "↕ ↕ ↕ ↕" : "↕"}</div>}
              </div>
            ))}
          </div>

          {/* ── Two-column layout ─────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

            {/* LEFT — Positions table */}
            <div style={{ background: t.bg2, borderRadius: 8, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px 8px" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: t.text }}>Active Positions + AI Signals</span>
                <span style={{ fontSize: 9, color: portError ? t.red : t.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {portLoading ? "Fetching from DB…" : portError ? `⚠ ${portError}` : "Live · predictions collection"}
                </span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: t.surface }}>
                    {["SYMBOL","PRICE","CHG","SHARES","VALUE","AI SIGNAL","TARGET","CONF"].map(h => (
                      <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: t.muted2, fontWeight: 600, fontSize: 9, letterSpacing: 0.7, fontFamily: t.mono, borderBottom: `1px solid ${t.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portLoading
                    ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} t={t} />)
                    : positions.length === 0
                    ? <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: t.muted }}>{portError ?? "No positions found — run the pipeline first."}</td></tr>
                    : positions.map((tk, i) => (
                      <tr key={tk.symbol} style={{ borderBottom: `1px solid ${t.border}`, background: rowBg(i) }}>
                        <td style={{ padding: "9px 12px", fontWeight: 700, fontSize: 12, color: t.text,              fontFamily: t.mono }}>{tk.symbol}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 600, color: t.text,                            fontFamily: t.mono }}>{tk.price}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 700, color: tk.up ? t.green : t.red,           fontFamily: t.mono }}>{tk.chg}</td>
                        <td style={{ padding: "9px 12px", color: t.muted,                                            fontFamily: t.mono }}>{tk.shares}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 600, color: t.text,                            fontFamily: t.mono }}>{tk.value}</td>
                        <td style={{ padding: "9px 12px" }}><SignalBadge signal={tk.signal ?? tk.prediction} t={t} /></td>
                        <td style={{ padding: "9px 12px", color: t.green, fontWeight: 700, fontFamily: t.mono }}>
                         {tk.predicted_close ? `$${tk.predicted_close.toFixed(2)}` : tk.target}
                        </td>
                        <td style={{ padding: "9px 12px", fontWeight: 700, fontFamily: t.mono,
                          color: (tk.signal ?? tk.prediction) === "REDUCE" ? t.red 
                          : (tk.signal ?? tk.prediction) === "HOLD"   ? t.amber 
                          : t.green,
                        }}>{tk.conf}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* RIGHT column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Portfolio Allocation — derived from live positions */}
              <div style={{ background: t.bg2, borderRadius: 8, border: `1px solid ${t.border}`, padding: "13px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: t.text }}>Portfolio Allocation</span>
                  <span style={{ fontSize: 9, color: t.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>By market value</span>
                </div>
                {portLoading ? (
                  <div style={{ height: 12, borderRadius: 4, background: t.border2, marginBottom: 10, animation: "sfPulse 1.4s ease-in-out infinite" }} />
                ) : (
                  <>
                    <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", height: 12, marginBottom: 10 }}>
                      {alloc.map(a => (
                        <div key={a.symbol} style={{ width: `${a.pct}%`, background: a.color, transition: "width .4s" }} title={`${a.symbol} ${a.pct}%`} />
                      ))}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                      {alloc.map(a => (
                        <div key={a.symbol} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontFamily: t.mono }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: a.color, display: "inline-block", flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: t.text }}>{a.symbol}</span>
                          <span style={{ color: t.muted }}>{a.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Risk Metrics — from /api/risk_metrics */}
              <div style={{ background: t.bg2, borderRadius: 8, border: `1px solid ${t.border}`, padding: "13px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: t.text }}>Risk Metrics</span>
                  <span style={{ fontSize: 9, color: riskError ? t.red : t.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {riskLoading ? "Loading…" : riskError ? `⚠ ${riskError}` : "Computed from price_history"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {riskLoading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonMetric key={i} t={t} />)
                    : RISK_CONFIG.map((cfg) => {
                        const val = riskData?.[cfg.key] ?? null;
                        return (
                          <div key={cfg.key} style={{ background: t.surface, borderRadius: 6, padding: "9px 10px", border: `1px solid ${t.border2}` }}>
                            <div style={{ fontSize: 8, color: t.muted2, marginBottom: 3, fontWeight: 600, letterSpacing: 0.5, fontFamily: t.mono, textTransform: "uppercase" }}>{cfg.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: t.mono, color: riskData ? cfg.color(val, t) : t.muted }}>
                              {cfg.fmt(val)}
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              </div>

              {/* Kaggle Sources (static pipeline description labels) */}
              <div style={{ background: t.bg2, borderRadius: 8, border: `1px solid ${t.border}`, padding: "13px 14px" }}>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: t.text }}>Kaggle Dataset Sources</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {KAGGLE_SOURCES.map(k => (
                    <div key={k.title} style={{ background: t.surface, borderRadius: 6, padding: "10px", border: `1px solid ${t.border2}` }}>
                      <div style={{ fontSize: 14, marginBottom: 5 }}>{k.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 3, color: t.text, fontFamily: t.mono }}>{k.title}</div>
                      <div style={{ fontSize: 9, color: t.muted, whiteSpace: "pre-line", lineHeight: 1.55, marginBottom: 6, fontFamily: t.mono }}>{k.sub}</div>
                      <span style={{ fontSize: 8, color: t.accent2, fontWeight: 700, fontFamily: t.mono, background: d ? t.accent + "22" : "#eef4fc", borderRadius: 3, padding: "2px 6px", border: `1px solid ${t.accent2}44` }}>kaggle.com</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}