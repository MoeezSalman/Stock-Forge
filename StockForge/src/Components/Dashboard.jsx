/* eslint-disable react-hooks/purity */
import { useState, useEffect, useRef } from "react";

const tickerData = [
  { symbol: "TSLA", price: "246.71", change: "-2.14%", neg: true },
  { symbol: "AMZN", price: "183.95", change: "+0.67%", neg: false },
  { symbol: "GOOGL", price: "168.48", change: "-0.38%", neg: true },
  { symbol: "META", price: "512.80", change: "+2.05%", neg: false },
  { symbol: "MSFT", price: "415.50", change: "+1.12%", neg: false },
  { symbol: "SPY", price: "528.14", change: "+0.54%", neg: false },
  { symbol: "QQQ", price: "445.30", change: "+0.82%", neg: false },
  { symbol: "AMD", price: "178.90", change: "+1.44%", neg: false },
  { symbol: "NFLX", price: "628.50", change: "-1.05%", neg: true },
  { symbol: "CRM", price: "295.70", change: "+0.00%", neg: false },
];

const watchlist = [
  { symbol: "AAPL", name: "Apple Inc.", price: "189.42", change: "+1.84%", neg: false, active: true },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: "875.20", change: "+3.21%", neg: false },
  { symbol: "TSLA", name: "Tesla Inc.", price: "246.71", change: "-2.14%", neg: true },
  { symbol: "AMZN", name: "Amazon.com", price: "183.95", change: "+0.67%", neg: false },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: "168.48", change: "-0.38%", neg: true },
  { symbol: "META", name: "Meta Platforms", price: "512.80", change: "+2.05%", neg: false },
  { symbol: "MSFT", name: "Microsoft Corp.", price: "415.50", change: "+1.12%", neg: false },
];

const newsItems = [
  { source: "Bloomberg", time: "12 min ago", headline: "Apple reports record iPhone sales in Q2, beats analyst expectations by 8%", sentiment: "Positive", score: "0.91", color: "#22c55e" },
  { source: "Reuters", time: "38 min ago", headline: "Fed signals potential rate cuts could boost tech sector valuations", sentiment: "Positive", score: "0.76", color: "#22c55e" },
  { source: "CNBC", time: "1h 12m ago", headline: "Supply chain concerns in Asia may limit Apple's production capacity", sentiment: "Negative", score: "-0.68", color: "#ef4444" },
  { source: "WSJ", time: "2h 05m ago", headline: "Apple Vision Pro gaining traction in enterprise market, analysts say", sentiment: "Positive", score: "0.83", color: "#22c55e" },
  { source: "FT", time: "3h 41m ago", headline: "Regulatory scrutiny on Apple's App Store continues in EU markets", sentiment: "Negative", score: "-0.22", color: "#ef4444" },
  { source: "MarketWatch", time: "4h 20m ago", headline: "Analyst upgrades AAPL to Strong Buy citing AI integration roadmap", sentiment: "Positive", score: "0.88", color: "#22c55e" },
  { source: "TechCrunch", time: "5h 33m ago", headline: "Apple unveils new M4 chip architecture improvements for next-gen Mac lineup", sentiment: "Neutral", score: "-0.15", color: "#a3a3a3" },
];

// Chart data points (relative y values, will be scaled)
const chartPoints = [
  186.5, 186.8, 187.0, 186.7, 186.9, 187.2, 187.5, 187.8, 188.0, 188.3,
  188.1, 188.5, 188.9, 189.0, 189.2, 189.1, 189.4, 189.3, 189.6, 189.8,
  189.7, 190.1, 190.3, 190.5, 190.4, 190.6, 190.7, 190.5, 190.8, 190.88,
];

const forecastPoints = [190.88, 191.2, 191.8, 192.1, 192.4, 192.8, 193.0];

function SparkChart() {
  const width = 820;
  const height = 180;
  const paddingX = 20;
  const paddingY = 20;
  const minY = 185;
  const maxY = 193;

  const scaleX = (i, total) =>
    paddingX + (i / (total - 1)) * (width - paddingX * 2);
  const scaleY = (v) =>
    height - paddingY - ((v - minY) / (maxY - minY)) * (height - paddingY * 2);

  const allPoints = [...chartPoints];
  const pathD = allPoints
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i, allPoints.length)} ${scaleY(v)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${scaleX(allPoints.length - 1, allPoints.length)} ${height - paddingY} L ${scaleX(0, allPoints.length)} ${height - paddingY} Z`;

  const forecastStartX = scaleX(chartPoints.length - 1, chartPoints.length);
  const forecastEndX = scaleX(chartPoints.length - 1 + forecastPoints.length - 1, chartPoints.length + forecastPoints.length - 1);

  const fPathD = forecastPoints
    .map((v, i) => {
      const xi = chartPoints.length - 1 + i;
      const total = chartPoints.length + forecastPoints.length - 1;
      return `${i === 0 ? "M" : "L"} ${scaleX(xi, total)} ${scaleY(v)}`;
    })
    .join(" ");

  const fAreaD =
    fPathD +
    ` L ${scaleX(chartPoints.length - 1 + forecastPoints.length - 1, chartPoints.length + forecastPoints.length - 1)} ${height - paddingY} L ${forecastStartX} ${height - paddingY} Z`;

  // Confidence band (upper/lower)
  const upperBand = forecastPoints.map((v) => v + 0.8);
  const lowerBand = forecastPoints.map((v) => v - 0.8);

  const bandPath = () => {
    const total = chartPoints.length + forecastPoints.length - 1;
    const upper = upperBand
      .map((v, i) => {
        const xi = chartPoints.length - 1 + i;
        return `${i === 0 ? "M" : "L"} ${scaleX(xi, total)} ${scaleY(v)}`;
      })
      .join(" ");
    const lower = lowerBand
      .map((v, i) => {
        const xi = chartPoints.length - 1 + i;
        const ri = lowerBand.length - 1 - i;
        return `L ${scaleX(chartPoints.length - 1 + ri, total)} ${scaleY(lowerBand[ri])}`;
      })
      .join(" ");
    return upper + " " + lower + " Z";
  };

  const dotX = scaleX(chartPoints.length - 1, chartPoints.length + forecastPoints.length - 1);
  const dotY = scaleY(chartPoints[chartPoints.length - 1]);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[186, 188, 190, 192].map((v) => (
        <g key={v}>
          <line
            x1={paddingX}
            x2={width - paddingX}
            y1={scaleY(v)}
            y2={scaleY(v)}
            stroke="#ffffff08"
            strokeWidth="1"
          />
          <text x={paddingX - 5} y={scaleY(v) + 4} fill="#555" fontSize="10" textAnchor="end">
            ${v}
          </text>
        </g>
      ))}

      {/* Confidence band */}
      <path d={bandPath()} fill="#d97706" fillOpacity="0.12" />

      {/* Forecast area */}
      <path d={fAreaD} fill="url(#forecastGrad)" />

      {/* Actual area */}
      <path d={areaD} fill="url(#areaGrad)" />

      {/* Actual line */}
      <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />

      {/* Forecast line (dashed) */}
      <path d={fPathD} fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="5,3" strokeLinejoin="round" />

      {/* Today vertical line */}
      <line
        x1={dotX}
        x2={dotX}
        y1={paddingY}
        y2={height - paddingY}
        stroke="#666"
        strokeWidth="1"
        strokeDasharray="3,3"
      />

      {/* TODAY label */}
      <rect x={dotX - 22} y={paddingY - 16} width="44" height="14" rx="3" fill="#1e1e2e" stroke="#333" strokeWidth="1" />
      <text x={dotX} y={paddingY - 5} fill="#aaa" fontSize="9" textAnchor="middle">TODAY</text>

      {/* Dot at current price */}
      <circle cx={dotX} cy={dotY} r="5" fill="#f59e0b" stroke="#1a1a2e" strokeWidth="2" />
    </svg>
  );
}

function VolumeChart() {
  const bars = Array.from({ length: 32 }, (_, i) => ({
    height: 20 + Math.random() * 60,
    color: i % 3 === 0 ? "#ef4444" : i % 3 === 1 ? "#22c55e" : i % 5 === 0 ? "#d97706" : "#7c3aed",
  }));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "50px", padding: "0 8px" }}>
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${bar.height}%`,
            backgroundColor: bar.color,
            opacity: 0.75,
            borderRadius: "1px 1px 0 0",
            minWidth: "4px",
          }}
        />
      ))}
    </div>
  );
}

function CircleScore({ score = 75 }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1e1e2e" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="6"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{score}</span>
        <span style={{ color: "#666", fontSize: 8 }}>AVG</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navTabs = ["Dashboard", "Predictions", "Sentiment", "Model", "Portfolio"];

  const styles = {
    root: {
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      background: "#0a0a0f",
      color: "#e2e2e2",
      minHeight: "100vh",
      fontSize: "12px",
      display: "flex",
      flexDirection: "column",
    },
    // Top nav bar
    topBar: {
      background: "#0d0d18",
      borderBottom: "1px solid #1e1e2e",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      height: "44px",
      gap: "16px",
      flexShrink: 0,
    },
    logo: {
      display: "flex", alignItems: "center", gap: "6px",
      fontWeight: 700, fontSize: "13px", color: "#fff", whiteSpace: "nowrap",
    },
    logoIcon: {
      width: 22, height: 22, background: "linear-gradient(135deg,#6d28d9,#4f46e5)",
      borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "10px", fontWeight: 900, color: "#fff",
    },
    navTabs: { display: "flex", gap: "2px", flex: 1, justifyContent: "center" },
    navTab: (active) => ({
      padding: "4px 14px",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: active ? 600 : 400,
      color: active ? "#fff" : "#888",
      background: active ? "#1e1e30" : "transparent",
      border: "none",
      outline: "none",
    }),
    btnMarket: {
      background: "#1a2a1a",
      border: "1px solid #22c55e55",
      borderRadius: "5px",
      color: "#22c55e",
      padding: "4px 10px",
      fontSize: "10px",
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    btnRun: {
      background: "linear-gradient(90deg,#6d28d9,#4f46e5)",
      border: "none",
      borderRadius: "5px",
      color: "#fff",
      padding: "5px 14px",
      fontSize: "11px",
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    // Ticker strip
    ticker: {
      background: "#0d0d18",
      borderBottom: "1px solid #1a1a28",
      display: "flex",
      gap: "0",
      padding: "5px 16px",
      overflowX: "auto",
      flexShrink: 0,
    },
    tickerItem: {
      display: "flex", gap: "6px", alignItems: "center",
      padding: "0 14px", borderRight: "1px solid #1e1e2e",
    },
    // Main layout
    main: {
      display: "flex",
      flex: 1,
      overflow: "hidden",
    },
    // Sidebar
    sidebar: {
      width: "170px",
      flexShrink: 0,
      background: "#0d0d18",
      borderRight: "1px solid #1a1a28",
      display: "flex",
      flexDirection: "column",
      padding: "12px 0",
      overflowY: "auto",
    },
    sidebarLabel: {
      color: "#555",
      fontSize: "9px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      padding: "0 12px",
      marginBottom: "6px",
      textTransform: "uppercase",
    },
    watchItem: (active) => ({
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 12px",
      background: active ? "#1a1a2e" : "transparent",
      cursor: "pointer",
      borderLeft: active ? "2px solid #6d28d9" : "2px solid transparent",
    }),
    // Center content
    center: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      overflowX: "hidden",
      background: "#0a0a0f",
    },
    stockHeader: {
      padding: "14px 20px 8px",
      borderBottom: "1px solid #1a1a28",
    },
   chartArea: {
    padding: "0 8px",
    flex: 1,          // ✅ bring this back
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
    timeButtons: {
      display: "flex", gap: "4px", justifyContent: "flex-end",
      padding: "8px 16px 0",
    },
    timeBtn: (active) => ({
      padding: "2px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer",
      background: active ? "#6d28d9" : "transparent",
      color: active ? "#fff" : "#555",
      border: active ? "none" : "1px solid #1e1e2e",
    }),
    legendRow: {
      display: "flex", gap: "14px", padding: "6px 16px",
      fontSize: "10px", color: "#666",
    },
    legendDot: (color, dashed) => ({
      display: "inline-block", width: dashed ? "18px" : "18px", height: "2px",
      background: color, marginRight: "4px", verticalAlign: "middle",
      borderTop: dashed ? `2px dashed ${color}` : `2px solid ${color}`,
      opacity: 0.9,
    }),
    volumeSection: {
      borderTop: "1px solid #1a1a28",
      padding: "6px 8px 2px",
    },
    volLabel: { color: "#555", fontSize: "9px", padding: "0 8px 2px", textTransform: "uppercase", letterSpacing: "0.07em" },
    statsRow: {
      display: "flex",
      borderTop: "1px solid #1a1a28",
      background: "#0d0d18",
    },
    statItem: {
      flex: 1, padding: "8px 16px",
      borderRight: "1px solid #1a1a28",
    },
    statLabel: { color: "#555", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em" },
    statVal: (color) => ({ color: color || "#fff", fontSize: "13px", fontWeight: 700, marginTop: "2px" }),
    forecastRow: {
      display: "flex", gap: "0",
      background: "#0d0d18",
      borderTop: "1px solid #1a1a28",
    },
    forecastCard: (borderColor) => ({
      flex: 1,
      padding: "12px 16px",
      borderRight: "1px solid #1a1a28",
      borderTop: `2px solid ${borderColor}`,
    }),
    fcLabel: { color: "#555", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.07em" },
    fcPrimary: { color: "#666", fontSize: "9px" },
    fcDirection: (color) => ({ color, fontSize: "11px", fontWeight: 700, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }),
    fcPrice: (color) => ({ color, fontSize: "20px", fontWeight: 700, margin: "2px 0" }),
    fcConf: { color: "#555", fontSize: "9px" },
    progressBar: (color, pct) => ({
      height: "2px", background: "#1e1e2e", borderRadius: "1px", marginTop: "4px",
      position: "relative", overflow: "hidden",
    }),
    progressFill: (color, pct) => ({
      width: `${pct}%`, height: "100%", background: color, borderRadius: "1px",
    }),
    // Right panel
    rightPanel: {
      width: "220px",
      flexShrink: 0,
      background: "#0d0d18",
      borderLeft: "1px solid #1a1a28",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    },
    rpSection: {
      borderBottom: "1px solid #1a1a28",
      padding: "10px 12px",
    },
    rpLabel: {
      color: "#555", fontSize: "9px", textTransform: "uppercase",
      letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 700,
    },
  };

  return (
    <div style={styles.root}>
      {/* Top Navigation */}
      <div style={styles.topBar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>SF</div>
          <span>Stock <span style={{ color: "#6d28d9" }}>Forge</span></span>
        </div>
        <div style={styles.navTabs}>
          {navTabs.map((t) => (
            <button key={t} style={styles.navTab(t === activeTab)} onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <button style={styles.btnMarket}>▶ MARKET OPEN</button>
        <button style={styles.btnRun}>Run Analysis</button>
      </div>

      {/* Ticker Strip */}
      <div style={styles.ticker}>
        {tickerData.map((t) => (
          <div key={t.symbol} style={styles.tickerItem}>
            <span style={{ color: "#aaa", fontWeight: 600 }}>{t.symbol}</span>
            <span style={{ color: "#ddd" }}>${t.price}</span>
            <span style={{ color: t.neg ? "#ef4444" : "#22c55e", fontWeight: 600 }}>{t.change}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarLabel}>Watchlist</div>
          {watchlist.map((w) => (
            <div key={w.symbol} style={styles.watchItem(w.active)}>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "12px" }}>{w.symbol}</div>
                <div style={{ color: "#555", fontSize: "9px" }}>{w.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#fff", fontWeight: 600 }}>{w.price}</div>
                <div style={{ color: w.neg ? "#ef4444" : "#22c55e", fontSize: "10px" }}>{w.change}</div>
              </div>
            </div>
          ))}

          {/* Divider */}
          <div style={{ margin: "14px 0 10px", borderTop: "1px solid #1a1a28" }} />

          {/* Market Sentiment Index */}
          <div style={styles.sidebarLabel}>Market Sentiment Index</div>
          <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { label: "Bullish", pct: 68, color: "#22c55e" },
              { label: "Bearish", pct: 19, color: "#ef4444" },
              { label: "Neutral", pct: 21, color: "#888" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ color: "#888", fontSize: "10px" }}>{s.label}</span>
                  <span style={{ color: s.color, fontSize: "10px", fontWeight: 600 }}>{s.pct}%</span>
                </div>
                <div style={{ background: "#1a1a28", borderRadius: "2px", height: "4px" }}>
                  <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: "2px" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ margin: "14px 0 10px", borderTop: "1px solid #1a1a28" }} />

          {/* Model Status */}
          <div style={styles.sidebarLabel}>Model Status</div>
          <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: "5px" }}>
            {[
              { label: "LSTM Model", status: "Active", color: "#22c55e" },
              { label: "NLP Sentiment", status: "Active", color: "#22c55e" },
              { label: "Feature Fusion", status: "Running", color: "#f59e0b" },
            ].map((m) => (
              <div key={m.label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666", fontSize: "10px" }}>{m.label}</span>
                <span style={{ color: m.color, fontSize: "10px" }}>● {m.status}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666", fontSize: "10px" }}>Last Retrain</span>
              <span style={{ color: "#888", fontSize: "10px" }}>2h 14m ago</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666", fontSize: "10px" }}>Data Source</span>
              <span style={{ color: "#888", fontSize: "10px" }}>Kaggle + Live</span>
            </div>
          </div>
        </div>

        {/* Center */}
        <div style={styles.center}>
          {/* Stock Header */}
          <div style={styles.stockHeader}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{ color: "#fff", fontSize: "16px", fontWeight: 700 }}>AAPL</span>
              <span style={{ color: "#666", fontSize: "12px" }}>Apple Inc. · NASDAQ</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
              <span style={{ color: "#fff", fontSize: "28px", fontWeight: 700 }}>$189.42</span>
              <span style={{ color: "#22c55e", fontWeight: 600 }}>+3.42</span>
              <span style={{ color: "#22c55e", fontWeight: 600 }}>+1.84%</span>
              <span style={{ color: "#555", fontSize: "10px" }}>15 Apr 2024, 16:00 EST</span>
            </div>
          </div>

          {/* Time buttons + legend */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 0" }}>
            <div style={styles.legendRow}>
              {[
                { label: "Actual", color: "#8b5cf6", dashed: false },
                { label: "Prediction", color: "#d97706", dashed: true },
                { label: "Confidence band", color: "#d97706", dashed: false, opacity: 0.3 },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{
                    display: "inline-block", width: "18px", height: "2px",
                    background: l.dashed ? "transparent" : l.color,
                    borderTop: l.dashed ? `2px dashed ${l.color}` : "none",
                    opacity: l.opacity || 1,
                    verticalAlign: "middle",
                  }} />
                  <span style={{ color: "#555" }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {["1D", "5D", "1M", "3M", "1Y"].map((t) => (
                <button key={t} style={styles.timeBtn(t === "1M")}>{t}</button>
              ))}
            </div>
          </div>

          {/* LSTM + Sentiment Forecast badge */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 16px 0" }}>
            <span style={{
              background: "#1a1a28", border: "1px solid #2a2a3e",
              borderRadius: "4px", padding: "3px 8px", fontSize: "9px", color: "#888",
            }}>
              LSTM + Sentiment Forecast
            </span>
          </div>

          {/* Chart */}
          <div style={styles.chartArea}>
            <SparkChart />

          {/* Volume */}
          <div style={styles.volumeSection}>
            <div style={styles.volLabel}>Volume</div>
            <VolumeChart />
          </div>
          </div>

          {/* Stats Row */}
          <div style={styles.statsRow}>
            {[
              { label: "OPEN", val: "$187.15", color: "#fff" },
              { label: "HIGH", val: "$190.88", color: "#22c55e" },
              { label: "LOW", val: "$186.60", color: "#ef4444" },
              { label: "VOL (M)", val: "58.4M", color: "#fff" },
              { label: "MKT CAP", val: "$2.91T", color: "#fff" },
            ].map((s, i) => (
              <div key={s.label} style={{ ...styles.statItem, borderRight: i < 4 ? "1px solid #1a1a28" : "none" }}>
                <div style={styles.statLabel}>{s.label}</div>
                <div style={styles.statVal(s.color)}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Forecast Cards */}
          <div style={styles.forecastRow}>
            <div style={{ ...styles.forecastCard("#22c55e"), borderRight: "1px solid #1a1a28" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={styles.fcLabel}>1-DAY FORECAST</span>
              </div>
              <div style={styles.fcDirection("#22c55e")}>↑ BULLISH</div>
              <div style={styles.fcPrice("#22c55e")}>$192.10</div>
              <div style={styles.fcConf}>Confidence: 74%</div>
              <div style={styles.progressBar("#22c55e", 74)}>
                <div style={styles.progressFill("#22c55e", 74)} />
              </div>
            </div>
            <div style={{ ...styles.forecastCard("#3b82f6"), borderRight: "1px solid #1a1a28", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={styles.fcLabel}>5-DAY FORECAST</span>
                <span style={{ ...styles.fcPrimary, color: "#3b82f6", fontSize: "9px", fontWeight: 700, border: "1px solid #3b82f6", borderRadius: "3px", padding: "1px 5px" }}>PRIMARY</span>
              </div>
              <div style={styles.fcDirection("#3b82f6")}>↑ STRONG BUY</div>
              <div style={styles.fcPrice("#3b82f6")}>$197.85</div>
              <div style={styles.fcConf}>Confidence: 81%</div>
              <div style={styles.progressBar("#3b82f6", 81)}>
                <div style={styles.progressFill("#3b82f6", 81)} />
              </div>
            </div>
            <div style={{ ...styles.forecastCard("#d97706") }}>
              <div style={styles.fcLabel}>30-DAY FORECAST</div>
              <div style={styles.fcDirection("#d97706")}>→ NEUTRAL</div>
              <div style={styles.fcPrice("#d97706")}>$194.20</div>
              <div style={styles.fcConf}>Confidence: 58%</div>
              <div style={styles.progressBar("#d97706", 58)}>
                <div style={styles.progressFill("#d97706", 58)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={styles.rightPanel}>
          {/* Sentiment Score */}
          <div style={styles.rpSection}>
            <div style={styles.rpLabel}>AAPL Sentiment Score</div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <CircleScore score={75} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                {[
                  { label: "Positive", pct: 72, color: "#22c55e" },
                  { label: "Negative", pct: 18, color: "#ef4444" },
                  { label: "Neutral", pct: 10, color: "#888" },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <span style={{ color: "#888", fontSize: "10px" }}>{s.label}</span>
                      <span style={{ color: s.color, fontSize: "10px" }}>{s.pct}%</span>
                    </div>
                    <div style={{ background: "#1a1a28", borderRadius: "1px", height: "3px" }}>
                      <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: "1px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live News Feed */}
          <div style={{ ...styles.rpSection, flex: 1, overflowY: "auto" }}>
            <div style={styles.rpLabel}>Live News Feed · NLP Analyzed</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {newsItems.map((n, i) => (
                <div key={i} style={{ borderBottom: "1px solid #1a1a2a", paddingBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ color: "#555", fontSize: "9px", fontWeight: 700 }}>{n.source}</span>
                    <span style={{ color: "#444", fontSize: "9px" }}>{n.time}</span>
                  </div>
                  <div style={{ color: "#ccc", fontSize: "10px", lineHeight: "1.4", marginBottom: "4px" }}>{n.headline}</div>
                  <span style={{
                    display: "inline-block", fontSize: "9px", fontWeight: 600,
                    background: n.color + "22",
                    color: n.color,
                    border: `1px solid ${n.color}55`,
                    borderRadius: "3px",
                    padding: "1px 6px",
                  }}>
                    ● {n.sentiment} · {n.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Model Performance */}
          <div style={styles.rpSection}>
            <div style={styles.rpLabel}>Model Performance</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[
                { label: "RMSE", val: "2.14" },
                { label: "MAE", val: "1.87" },
                { label: "Accuracy", val: "83.2%", highlight: true },
                { label: "F1 Score", val: "0.814", highlight: true },
              ].map((m) => (
                <div key={m.label} style={{
                  background: "#111120", border: "1px solid #1e1e30",
                  borderRadius: "5px", padding: "7px 10px",
                }}>
                  <div style={{ color: "#555", fontSize: "9px" }}>{m.label}</div>
                  <div style={{ color: m.highlight ? "#6d28d9" : "#fff", fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}