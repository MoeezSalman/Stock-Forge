import { useState } from "react";

const tickers = [
  { symbol: "AAPL", price: "$189.42", chg: "+1.84%", shares: 120, value: "$22,730", signal: "BUY", target: "$197.85", conf: "81%", up: true },
  { symbol: "NVDA", price: "$875.28", chg: "+3.21%", shares: 25, value: "$21,880", signal: "STRONG BUY", target: "$910.50", conf: "87%", up: true },
  { symbol: "META", price: "$512.80", chg: "+2.05%", shares: 31, value: "$15,948", signal: "BUY", target: "$534.20", conf: "76%", up: true },
  { symbol: "MSFT", price: "$415.50", chg: "+1.12%", shares: 40, value: "$16,620", signal: "HOLD", target: "$419.40", conf: "62%", up: true },
  { symbol: "AMZN", price: "$183.95", chg: "+0.67%", shares: 80, value: "$14,716", signal: "BUY", target: "$192.40", conf: "73%", up: true },
  { symbol: "GOOGL", price: "$168.40", chg: "-0.38%", shares: 60, value: "$10,104", signal: "HOLD", target: "$170.50", conf: "58%", up: false },
  { symbol: "TSLA",  price: "$245.71", chg: "-2.14%", shares: 50, value: "$12,336", signal: "REDUCE", target: "$234.00", conf: "70%", up: false },
];

const alloc = [
  { symbol: "NVDA", color: "#7b61ff", pct: 28 },
  { symbol: "AAPL", color: "#00c48c", pct: 22 },
  { symbol: "META", color: "#4a90d9", pct: 18 },
  { symbol: "MSFT", color: "#f5a623", pct: 14 },
  { symbol: "AMZN", color: "#00b4d8", pct: 10 },
  { symbol: "GOOGL", color: "#ff4d6a", pct: 8 },
];

const pipeRow1 = [
  { label: "Kaggle Dataset", sub: "38K+ rows · 2000–2024\n~4,200 rows" },
  { label: "News Corpus", sub: "Kaggle Financial\nNews Dataset" },
  { label: "Live API Feed", sub: "Alpha Vantage API\nReal-time pricing" },
  { label: "RSS News", sub: "Bloomberg / Reuters\nFinancial news" },
];
const pipeRow2 = [
  { label: "Preprocessing", sub: "Normalization · Scale\nNaN Imputation" },
  { label: "Feature Eng.", sub: "RSI, MACD, BB\nlag features" },
  { label: "NLP Analysis", sub: "VADER\nSentiment score" },
  { label: "Feature Fusion", sub: "OHLCV + NLP\nDataset + 63 d" },
];
const pipeRow3 = [
  { label: "LSTM Model", sub: "Window: 60\nReg Test: 40" },
  { label: "Inference", sub: "3-layer inference\nAPI SINGLE" },
  { label: "Prediction", sub: "3 Price targets +\nConfidence %" },
  { label: "Dashboard", sub: "Buy/Sell signals\nPortfolio alerts" },
];

const kaggleSources = [
  { icon: "📈", title: "Stock Market Data", sub: "OHLCV Prices\n500K+ rows\n50 tickers, 20yr" },
  { icon: "📰", title: "Financial News NLP", sub: "8,394 Headlines\nSentiment: Annotated\nFINBERT ambition" },
  { icon: "📊", title: "Technical Indicators", sub: "RSI, MACD, BB\n60 indicators\nPre-computed" },
  { icon: "📡", title: "Live Feed", sub: "Alpha Vantage API\n20 Tickers, 60D\nPre-computed" },
];

const riskMetrics = [
  { label: "SHARPE RATIO", value: "1.84", color: "#1a2332" },
  { label: "MAX DRAWDOWN", value: "-8.2%", color: "#ff4d6a" },
  { label: "BETA", value: "1.12", color: "#1a2332" },
  { label: "ALPHA", value: "+4.1%", color: "#00c48c" },
  { label: "VOLATILITY", value: "18.4%", color: "#f5a623" },
  { label: "WIN RATE", value: "67.3%", color: "#00c48c" },
];

function SignalBadge({ signal }) {
  const map = {
    "BUY":        { bg: "#e6fff5", color: "#009e72", border: "#9fe5cc" },
    "STRONG BUY": { bg: "#e6fff5", color: "#009e72", border: "#9fe5cc" },
    "HOLD":       { bg: "#fff8e6", color: "#c47c00", border: "#fcd88a" },
    "REDUCE":     { bg: "#fff0f2", color: "#d63050", border: "#ffb3be" },
  };
  const s = map[signal] || map["HOLD"];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.4, whiteSpace: "nowrap"
    }}>{signal === "STRONG BUY" ? "● STRONG BUY" : signal === "BUY" ? "● BUY" : signal === "REDUCE" ? "● REDUCE" : "– HOLD"}</span>
  );
}

function PipeBox({ label, sub, rowColor }) {
  const colors = {
    1: { bg: "#f7f9fc", border: "#dde4ee", text: "#1a2332" },
    2: { bg: "#edf5ff", border: "#bcd4f0", text: "#1a4a7a" },
    3: { bg: "#f2eeff", border: "#d1c4fc", text: "#4a2da8" },
  };
  const c = colors[rowColor];
  return (
    <div style={{
      flex: 1, background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 8, padding: "10px 13px", minWidth: 0,
    }}>
      <div style={{ fontWeight: 700, fontSize: 11, color: c.text, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 9.5, color: "#8a94a6", whiteSpace: "pre-line", lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

const navItems = ["Dashboard", "Predictions", "Sentiment", "Model", "Portfolio"];

export default function StockForgeDashboard() {
  const [activeNav, setActiveNav] = useState("Portfolio");
  const [darkMode, setDarkMode] = useState(false);

  const d = darkMode;
  const bg = d ? "#0d1520" : "#f2f4f7";
  const card = d ? "#182030" : "#ffffff";
  const border = d ? "#253040" : "#e4e9f0";
  const text = d ? "#e0e8f5" : "#1a2332";
  const muted = d ? "#5a7090" : "#8a94a6";
  const rowAlt = d ? "#141e2c" : "#f8fafd";
  const metricBg = d ? "#1e2d3e" : "#f7f9fc";
  const navBg = d ? "#101b28" : "#ffffff";
  const pipe1bg = d ? "#1a2535" : "#f7f9fc";
  const pipe1border = d ? "#2a3a4c" : "#dde4ee";

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: bg, minHeight: "100vh", color: text, transition: "background .2s" }}>

      {/* NAV */}
      <nav style={{
        background: navBg, borderBottom: `1px solid ${border}`,
        display: "grid", gridTemplateColumns: "200px 1fr auto",
        alignItems: "center", padding: "0 20px", height: 50,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: d ? "0 1px 12px rgba(0,0,0,0.4)" : "0 1px 6px rgba(0,0,0,0.06)"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg,#4a90d9,#7b61ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, color: "#fff", fontSize: 11
          }}>AS</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: text }}>
            AlphaSignal<span style={{ color: "#4a90d9", fontWeight: 400, fontSize: 14 }}>AI</span>
          </span>
        </div>

        {/* Center nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
          {navItems.map(n => (
            <span key={n} onClick={() => setActiveNav(n)} style={{
              color: activeNav === n ? text : muted,
              fontWeight: activeNav === n ? 700 : 400,
              fontSize: 12, cursor: "pointer", padding: "4px 13px",
              borderRadius: 6, userSelect: "none",
              borderBottom: activeNav === n ? "2px solid #4a90d9" : "2px solid transparent",
              transition: "all .15s",
            }}>{n}</span>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setDarkMode(d => !d)} style={{
            background: d ? "#253040" : "#f0f2f5", border: `1px solid ${border}`,
            borderRadius: 7, padding: "4px 11px", fontSize: 11, fontWeight: 600,
            color: text, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ fontSize: 13 }}>{d ? "☀️" : "🌙"}</span>
            {d ? "Light" : "Dark"}
          </button>
          <button style={{
            background: "#f0f2f5", border: `1px solid ${border}`,
            borderRadius: 7, padding: "4px 12px", fontSize: 11, fontWeight: 600,
            color: "#4a5568", cursor: "pointer"
          }}>Export CSV</button>
          <button style={{
            background: "linear-gradient(135deg,#4a90d9,#7b61ff)",
            border: "none", color: "#fff", borderRadius: 7,
            padding: "5px 14px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 2px 8px rgba(74,144,217,0.35)"
          }}>Generate Report</button>
        </div>
      </nav>

      <div style={{ padding: "22px 24px 48px", maxWidth: 1160, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: text }}>Portfolio &amp; Predictions</h1>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: muted }}>
              AI-driven signal overview · Kaggle dataset pipeline ·
              <span style={{ fontWeight: 600 }}> 7 active positions</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: muted, marginBottom: 2 }}>
              Portfolio Value &nbsp;&nbsp;&nbsp;&nbsp; Today's P&amp;L
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: text }}>$142,840</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#00c48c" }}>+$2,314</span>
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: text }}>Data Pipeline — Kaggle to Prediction</span>
            <span style={{ fontSize: 10, color: muted }}>End-to-end Flow</span>
          </div>
          {/* Row 1 */}
          <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 8 }}>
            {pipeRow1.map((p, i) => (
              <div key={p.label} style={{ display: "flex", flex: 1, alignItems: "center", gap: 5, minWidth: 0 }}>
                <div style={{
                  flex: 1, background: d ? "#1a2535" : "#f7f9fc",
                  border: `1px solid ${d ? "#2a3a4c" : "#dde4ee"}`,
                  borderRadius: 8, padding: "9px 12px", minWidth: 0
                }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: text, marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 9.5, color: muted, whiteSpace: "pre-line", lineHeight: 1.5 }}>{p.sub}</div>
                </div>
                {i < pipeRow1.length - 1 && <span style={{ color: muted, fontSize: 13, flexShrink: 0 }}>+</span>}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", color: muted, fontSize: 12, marginBottom: 6 }}>↕ ↕ ↕ ↕</div>
          {/* Row 2 */}
          <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 8 }}>
            {pipeRow2.map((p, i) => (
              <div key={p.label} style={{ display: "flex", flex: 1, alignItems: "center", gap: 5, minWidth: 0 }}>
                <div style={{
                  flex: 1, background: d ? "#172035" : "#edf5ff",
                  border: `1px solid ${d ? "#1e3a5c" : "#bcd4f0"}`,
                  borderRadius: 8, padding: "9px 12px", minWidth: 0
                }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: d ? "#7ab4e8" : "#1a4a7a", marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 9.5, color: muted, whiteSpace: "pre-line", lineHeight: 1.5 }}>{p.sub}</div>
                </div>
                {i < pipeRow2.length - 1 && <span style={{ color: muted, fontSize: 13, flexShrink: 0 }}>—</span>}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", color: muted, fontSize: 12, marginBottom: 6 }}>↕</div>
          {/* Row 3 */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {pipeRow3.map((p, i) => (
              <div key={p.label} style={{ display: "flex", flex: 1, alignItems: "center", gap: 5, minWidth: 0 }}>
                <div style={{
                  flex: 1, background: d ? "#1e1635" : "#f2eeff",
                  border: `1px solid ${d ? "#3a2a5c" : "#d1c4fc"}`,
                  borderRadius: 8, padding: "9px 12px", minWidth: 0
                }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: d ? "#b09aff" : "#4a2da8", marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 9.5, color: muted, whiteSpace: "pre-line", lineHeight: 1.5 }}>{p.sub}</div>
                </div>
                {i < pipeRow3.length - 1 && <span style={{ color: muted, fontSize: 13, flexShrink: 0 }}>—</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Main two-col */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>

          {/* LEFT */}
          <div>
            {/* Active Positions */}
            <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px 9px" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: text }}>Active Positions + AI Signals</span>
                <span style={{ fontSize: 10, color: muted }}>Sorted by signal confidence</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: d ? "#1a2535" : "#f7f9fc" }}>
                    {["SYMBOL","PRICE","CHG","SHARES","VALUE","AI SIGNAL","TARGET","CONF"].map(h => (
                      <th key={h} style={{
                        padding: "7px 12px", textAlign: "left", color: muted,
                        fontWeight: 600, fontSize: 9.5, letterSpacing: 0.7,
                        borderBottom: `1px solid ${border}`
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickers.map((tk, i) => (
                    <tr key={tk.symbol} style={{ borderBottom: `1px solid ${border}`, background: i % 2 === 0 ? card : rowAlt }}>
                      <td style={{ padding: "9px 12px", fontWeight: 800, fontSize: 12, color: text }}>{tk.symbol}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: text }}>{tk.price}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: tk.up ? "#00c48c" : "#ff4d6a" }}>{tk.chg}</td>
                      <td style={{ padding: "9px 12px", color: muted }}>{tk.shares}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: text }}>{tk.value}</td>
                      <td style={{ padding: "9px 12px" }}><SignalBadge signal={tk.signal} /></td>
                      <td style={{ padding: "9px 12px", color: "#00c48c", fontWeight: 700 }}>{tk.target}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: tk.signal === "REDUCE" ? "#ff4d6a" : tk.signal === "HOLD" ? "#f5a623" : "#00c48c" }}>{tk.conf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Portfolio Allocation */}
            <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: "15px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: text }}>Portfolio Allocation</span>
                <span style={{ fontSize: 10, color: muted }}>By AI signal weight</span>
              </div>
              <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 14, marginBottom: 12 }}>
                {alloc.map(a => (
                  <div key={a.symbol} style={{ width: `${a.pct}%`, background: a.color }} title={`${a.symbol} ${a.pct}%`} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px" }}>
                {alloc.map(a => (
                  <div key={a.symbol} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: a.color, display: "inline-block" }} />
                    <span style={{ fontWeight: 600, color: text }}>{a.symbol}</span>
                    <span style={{ color: muted }}>{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Metrics */}
            <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: "15px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: text }}>Risk Metrics</span>
                <span style={{ fontSize: 10, color: muted }}>30-day rolling</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {riskMetrics.map(m => (
                  <div key={m.label} style={{
                    background: metricBg, borderRadius: 8, padding: "10px 12px",
                    border: `1px solid ${border}`
                  }}>
                    <div style={{ fontSize: 9, color: muted, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: d && m.color === "#1a2332" ? "#e0e8f5" : m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kaggle Sources */}
            <div style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: "15px 16px" }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: text }}>Kaggle Dataset Sources</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {kaggleSources.map(k => (
                  <div key={k.title} style={{
                    background: metricBg, borderRadius: 8, padding: "11px 12px",
                    border: `1px solid ${border}`
                  }}>
                    <div style={{ fontSize: 16, marginBottom: 6 }}>{k.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 3, color: text }}>{k.title}</div>
                    <div style={{ fontSize: 9.5, color: muted, whiteSpace: "pre-line", lineHeight: 1.55, marginBottom: 7 }}>{k.sub}</div>
                    <span style={{
                      fontSize: 9, color: "#4a90d9",
                      background: d ? "#1a2a40" : "#eef4fc",
                      borderRadius: 4, padding: "2px 6px", fontWeight: 600
                    }}>kaggle.com</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}