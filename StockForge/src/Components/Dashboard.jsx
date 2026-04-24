import { useState, useEffect, useRef } from "react";

const darkTheme = {
  "--bg": "#0a0a0f",
  "--bg2": "#0d0d18",
  "--surface": "#111120",
  "--border": "#1a1a28",
  "--border2": "#1e1e2e",
  "--text": "#e2e2e2",
  "--text2": "#aaa",
  "--muted": "#666",
  "--muted2": "#555",
  "--muted3": "#444",
  "--accent": "#6d28d9",
  "--accent2": "#4f46e5",
  "--green": "#22c55e",
  "--red": "#ef4444",
  "--amber": "#d97706",
  "--blue": "#3b82f6",
  "--purple": "#8b5cf6",
  "--mono": "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  "--logo-grad": "linear-gradient(135deg,#6d28d9,#4f46e5)",
};

const lightTheme = {
  "--bg": "#f0f5fb",
  "--bg2": "#ffffff",
  "--surface": "#f7f9fc",
  "--border": "#dde4ef",
  "--border2": "#c8d4e8",
  "--text": "#0f172a",
  "--text2": "#334155",
  "--muted": "#64748b",
  "--muted2": "#94a3b8",
  "--muted3": "#b0bcd4",
  "--accent": "#4f46e5",
  "--accent2": "#6d28d9",
  "--green": "#16a34a",
  "--red": "#dc2626",
  "--amber": "#b45309",
  "--blue": "#2563eb",
  "--purple": "#7c3aed",
  "--mono": "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  "--logo-grad": "linear-gradient(135deg,#4f46e5,#6d28d9)",
};

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

const chartPoints = [
  186.5, 186.8, 187.0, 186.7, 186.9, 187.2, 187.5, 187.8, 188.0, 188.3,
  188.1, 188.5, 188.9, 189.0, 189.2, 189.1, 189.4, 189.3, 189.6, 189.8,
  189.7, 190.1, 190.3, 190.5, 190.4, 190.6, 190.7, 190.5, 190.8, 190.88,
];

const forecastPoints = [190.88, 191.2, 191.8, 192.1, 192.4, 192.8, 193.0];

function SparkChart({ isDark }) {
  const width = 820;
  const height = 180;
  const paddingX = 20;
  const paddingY = 20;
  const minY = 185;
  const maxY = 193;
  const lineColor = "#8b5cf6";
  const forecastColor = "#d97706";
  const gridColor = isDark ? "#ffffff08" : "#00000010";
  const labelColor = isDark ? "#555" : "#94a3b8";
  const dotBg = isDark ? "#1a1a2e" : "#f0f5fb";
  const todayLineColor = isDark ? "#666" : "#94a3b8";
  const todayBoxBg = isDark ? "#1e1e2e" : "#e2e8f0";
  const todayBoxBorder = isDark ? "#333" : "#c8d4e8";
  const todayTextColor = isDark ? "#aaa" : "#64748b";

  const scaleX = (i, total) => paddingX + (i / (total - 1)) * (width - paddingX * 2);
  const scaleY = (v) => height - paddingY - ((v - minY) / (maxY - minY)) * (height - paddingY * 2);

  const allPoints = [...chartPoints];
  const pathD = allPoints.map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i, allPoints.length)} ${scaleY(v)}`).join(" ");
  const areaD = pathD + ` L ${scaleX(allPoints.length - 1, allPoints.length)} ${height - paddingY} L ${scaleX(0, allPoints.length)} ${height - paddingY} Z`;

  const forecastStartX = scaleX(chartPoints.length - 1, chartPoints.length);
  const fPathD = forecastPoints.map((v, i) => {
    const xi = chartPoints.length - 1 + i;
    const total = chartPoints.length + forecastPoints.length - 1;
    return `${i === 0 ? "M" : "L"} ${scaleX(xi, total)} ${scaleY(v)}`;
  }).join(" ");

  const fAreaD = fPathD + ` L ${scaleX(chartPoints.length - 1 + forecastPoints.length - 1, chartPoints.length + forecastPoints.length - 1)} ${height - paddingY} L ${forecastStartX} ${height - paddingY} Z`;

  const upperBand = forecastPoints.map((v) => v + 0.8);
  const lowerBand = forecastPoints.map((v) => v - 0.8);

  const bandPath = () => {
    const total = chartPoints.length + forecastPoints.length - 1;
    const upper = upperBand.map((v, i) => {
      const xi = chartPoints.length - 1 + i;
      return `${i === 0 ? "M" : "L"} ${scaleX(xi, total)} ${scaleY(v)}`;
    }).join(" ");
    const lower = lowerBand.map((v, i) => {
      const ri = lowerBand.length - 1 - i;
      return `L ${scaleX(chartPoints.length - 1 + ri, total)} ${scaleY(lowerBand[ri])}`;
    }).join(" ");
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
      {[186, 188, 190, 192].map((v) => (
        <g key={v}>
          <line x1={paddingX} x2={width - paddingX} y1={scaleY(v)} y2={scaleY(v)} stroke={gridColor} strokeWidth="1" />
          <text x={paddingX - 5} y={scaleY(v) + 4} fill={labelColor} fontSize="10" textAnchor="end">${v}</text>
        </g>
      ))}
      <path d={bandPath()} fill="#d97706" fillOpacity="0.12" />
      <path d={fAreaD} fill="url(#forecastGrad)" />
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
      <path d={fPathD} fill="none" stroke={forecastColor} strokeWidth="2" strokeDasharray="5,3" strokeLinejoin="round" />
      <line x1={dotX} x2={dotX} y1={paddingY} y2={height - paddingY} stroke={todayLineColor} strokeWidth="1" strokeDasharray="3,3" />
      <rect x={dotX - 22} y={paddingY - 16} width="44" height="14" rx="3" fill={todayBoxBg} stroke={todayBoxBorder} strokeWidth="1" />
      <text x={dotX} y={paddingY - 5} fill={todayTextColor} fontSize="9" textAnchor="middle">TODAY</text>
      <circle cx={dotX} cy={dotY} r="5" fill="#f59e0b" stroke={dotBg} strokeWidth="2" />
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
        <div key={i} style={{ flex: 1, height: `${bar.height}%`, backgroundColor: bar.color, opacity: 0.75, borderRadius: "1px 1px 0 0", minWidth: "4px" }} />
      ))}
    </div>
  );
}

function CircleScore({ score = 75, isDark }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const trackColor = isDark ? "#1e1e2e" : "#e2e8f0";
  return (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke={trackColor} strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke="#22c55e" strokeWidth="6"
          strokeDasharray={`${circ}`} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 36 36)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{score}</span>
        <span style={{ color: "var(--muted)", fontSize: 8 }}>AVG</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const theme = isDark ? darkTheme : lightTheme;
  const navTabs = ["Dashboard", "Predictions", "Sentiment", "Model", "Portfolio"];

  const rootStyle = Object.fromEntries(Object.entries(theme));

  const s = {
    root: {
      fontFamily: "var(--mono)",
      background: "var(--bg)",
      color: "var(--text)",
      minHeight: "100vh",
      fontSize: "12px",
      display: "flex",
      flexDirection: "column",
      transition: "background 0.25s, color 0.25s",
    },
    topBar: {
      background: "var(--bg2)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      height: "44px",
      gap: "16px",
      flexShrink: 0,
    },
    logo: { display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px", color: "var(--text)", whiteSpace: "nowrap" },
    logoIcon: { width: 22, height: 22, background: "var(--logo-grad)", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 900, color: "#fff" },
    navTabs: { display: "flex", gap: "2px", flex: 1, justifyContent: "center" },
    navTab: (active) => ({
      padding: "4px 14px", borderRadius: "5px", cursor: "pointer", fontSize: "12px",
      fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--muted)",
      background: active ? (isDark ? "#1e1e30" : "#e8edf7") : "transparent",
      border: "none", outline: "none", fontFamily: "var(--mono)",
    }),
    toggleBtn: {
      padding: "4px 12px", borderRadius: "5px", fontSize: "11px", fontWeight: 600,
      cursor: "pointer", border: "1px solid var(--border2)", background: isDark ? "#1e1e30" : "#e8edf7",
      color: "var(--text)", fontFamily: "var(--mono)", display: "flex", alignItems: "center", gap: "5px",
      whiteSpace: "nowrap", transition: "all 0.2s",
    },
    btnMarket: {
      background: isDark ? "#1a2a1a" : "#dcfce7",
      border: `1px solid ${isDark ? "#22c55e55" : "#16a34a44"}`,
      borderRadius: "5px", color: "var(--green)", padding: "4px 10px",
      fontSize: "10px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--mono)",
    },
    btnRun: {
      background: "var(--logo-grad)", border: "none", borderRadius: "5px",
      color: "#fff", padding: "5px 14px", fontSize: "11px", fontWeight: 700,
      cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--mono)",
    },
    tickerOuter: {
      background: "var(--bg2)",
      borderBottom: "1px solid var(--border)",
      overflow: "hidden",
      flexShrink: 0,
      height: "32px",
      display: "flex",
      alignItems: "center",
    },
    tickerTrack: {
      display: "flex",
      gap: "0",
      animation: "tickerScroll 28s linear infinite",
      whiteSpace: "nowrap",
    },
    tickerItem: {
      display: "inline-flex", gap: "6px", alignItems: "center",
      padding: "0 20px", borderRight: `1px solid var(--border)`,
    },
    main: { display: "flex", flex: 1, overflow: "hidden" },
    sidebar: {
      width: "170px", flexShrink: 0, background: "var(--bg2)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", padding: "12px 0", overflowY: "auto",
    },
    sidebarLabel: { color: "var(--muted2)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "0 12px", marginBottom: "6px", textTransform: "uppercase" },
    watchItem: (active) => ({
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 12px", background: active ? (isDark ? "#1a1a2e" : "#eef2fb") : "transparent",
      cursor: "pointer", borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
    }),
    center: { flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden", background: "var(--bg)" },
    stockHeader: { padding: "14px 20px 8px", borderBottom: "1px solid var(--border)" },
    chartArea: { padding: "0 8px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" },
    timeBtn: (active) => ({
      padding: "2px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer", fontFamily: "var(--mono)",
      background: active ? "var(--accent)" : "transparent",
      color: active ? "#fff" : "var(--muted2)",
      border: active ? "none" : "1px solid var(--border2)",
    }),
    volumeSection: { borderTop: "1px solid var(--border)", padding: "6px 8px 2px" },
    statsRow: { display: "flex", borderTop: "1px solid var(--border)", background: "var(--bg2)" },
    statItem: { flex: 1, padding: "8px 16px", borderRight: "1px solid var(--border)" },
    forecastRow: { display: "flex", gap: "0", background: "var(--bg2)", borderTop: "1px solid var(--border)" },
    forecastCard: (borderColor) => ({
      flex: 1, padding: "12px 16px", borderRight: "1px solid var(--border)", borderTop: `2px solid ${borderColor}`,
    }),
    rightPanel: {
      width: "220px", flexShrink: 0, background: "var(--bg2)",
      borderLeft: "1px solid var(--border)", display: "flex",
      flexDirection: "column", overflowY: "auto",
    },
    rpSection: { borderBottom: "1px solid var(--border)", padding: "10px 12px" },
    rpLabel: { color: "var(--muted2)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 700 },
  };

  const tickerItems = [...tickerData, ...tickerData, ...tickerData];

  return (
    <>
      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
      <div style={{ ...s.root, ...rootStyle }}>

        {/* Top Nav */}
        <div style={s.topBar}>
          <div style={s.logo}>
            <div style={s.logoIcon}>SF</div>
            <span>Stock <span style={{ color: "var(--accent)" }}>Forge</span></span>
          </div>
          <div style={s.navTabs}>
            {navTabs.map((t) => (
              <button key={t} style={s.navTab(t === activeTab)} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>
          <button style={s.btnMarket}>▶ MARKET OPEN</button>
          <button style={s.toggleBtn} onClick={() => setIsDark(!isDark)}>
            {isDark ? "☀ Light" : "☽ Dark"}
          </button>
          <button style={s.btnRun}>Run Analysis</button>
        </div>

        {/* Animated Ticker Strip */}
        <div style={s.tickerOuter}>
          <div className="ticker-track" style={s.tickerTrack}>
            {tickerItems.map((t, i) => (
              <div key={i} style={s.tickerItem}>
                <span style={{ color: "var(--text2)", fontWeight: 600 }}>{t.symbol}</span>
                <span style={{ color: "var(--text)" }}>${t.price}</span>
                <span style={{ color: t.neg ? "var(--red)" : "var(--green)", fontWeight: 600 }}>{t.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={s.main}>

          {/* Sidebar */}
          <div style={s.sidebar}>
            <div style={s.sidebarLabel}>Watchlist</div>
            {watchlist.map((w) => (
              <div key={w.symbol} style={s.watchItem(w.active)}>
                <div>
                  <div style={{ color: "var(--text)", fontWeight: 600, fontSize: "12px" }}>{w.symbol}</div>
                  <div style={{ color: "var(--muted2)", fontSize: "9px" }}>{w.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--text)", fontWeight: 600 }}>{w.price}</div>
                  <div style={{ color: w.neg ? "var(--red)" : "var(--green)", fontSize: "10px" }}>{w.change}</div>
                </div>
              </div>
            ))}

            <div style={{ margin: "14px 0 10px", borderTop: "1px solid var(--border)" }} />

            <div style={s.sidebarLabel}>Market Sentiment Index</div>
            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { label: "Bullish", pct: 68, color: "var(--green)" },
                { label: "Bearish", pct: 19, color: "var(--red)" },
                { label: "Neutral", pct: 21, color: "var(--muted)" },
              ].map((s2) => (
                <div key={s2.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ color: "var(--muted)", fontSize: "10px" }}>{s2.label}</span>
                    <span style={{ color: s2.color, fontSize: "10px", fontWeight: 600 }}>{s2.pct}%</span>
                  </div>
                  <div style={{ background: isDark ? "#1a1a28" : "#dde4ef", borderRadius: "2px", height: "4px" }}>
                    <div style={{ width: `${s2.pct}%`, height: "100%", background: s2.color, borderRadius: "2px" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ margin: "14px 0 10px", borderTop: "1px solid var(--border)" }} />

            <div style={s.sidebarLabel}>Model Status</div>
            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: "5px" }}>
              {[
                { label: "LSTM Model", status: "Active", color: "var(--green)" },
                { label: "NLP Sentiment", status: "Active", color: "var(--green)" },
                { label: "Feature Fusion", status: "Running", color: "var(--amber)" },
              ].map((m) => (
                <div key={m.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)", fontSize: "10px" }}>{m.label}</span>
                  <span style={{ color: m.color, fontSize: "10px" }}>● {m.status}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: "10px" }}>Last Retrain</span>
                <span style={{ color: "var(--muted2)", fontSize: "10px" }}>2h 14m ago</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: "10px" }}>Data Source</span>
                <span style={{ color: "var(--muted2)", fontSize: "10px" }}>Kaggle + Live</span>
              </div>
            </div>
          </div>

          {/* Center */}
          <div style={s.center}>
            <div style={s.stockHeader}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{ color: "var(--text)", fontSize: "16px", fontWeight: 700 }}>AAPL</span>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>Apple Inc. · NASDAQ</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
                <span style={{ color: "var(--text)", fontSize: "28px", fontWeight: 700 }}>$189.42</span>
                <span style={{ color: "var(--green)", fontWeight: 600 }}>+3.42</span>
                <span style={{ color: "var(--green)", fontWeight: 600 }}>+1.84%</span>
                <span style={{ color: "var(--muted2)", fontSize: "10px" }}>15 Apr 2024, 16:00 EST</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 0" }}>
              <div style={{ display: "flex", gap: "14px", fontSize: "10px", color: "var(--muted)" }}>
                {[
                  { label: "Actual", color: "#8b5cf6", dashed: false },
                  { label: "Prediction", color: "#d97706", dashed: true },
                  { label: "Confidence band", color: "#d97706", dashed: false, opacity: 0.3 },
                ].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ display: "inline-block", width: "18px", height: "2px", background: l.dashed ? "transparent" : l.color, borderTop: l.dashed ? `2px dashed ${l.color}` : "none", opacity: l.opacity || 1, verticalAlign: "middle" }} />
                    <span style={{ color: "var(--muted2)" }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {["1D", "5D", "1M", "3M", "1Y"].map((t) => (
                  <button key={t} style={s.timeBtn(t === "1M")}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 16px 0" }}>
              <span style={{ background: isDark ? "#1a1a28" : "#e8edf7", border: "1px solid var(--border2)", borderRadius: "4px", padding: "3px 8px", fontSize: "9px", color: "var(--muted)" }}>
                LSTM + Sentiment Forecast
              </span>
            </div>

            <div style={s.chartArea}>
              <SparkChart isDark={isDark} />
              <div style={s.volumeSection}>
                <div style={{ color: "var(--muted2)", fontSize: "9px", padding: "0 8px 2px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Volume</div>
                <VolumeChart />
              </div>
            </div>

            <div style={s.statsRow}>
              {[
                { label: "OPEN", val: "$187.15", color: "var(--text)" },
                { label: "HIGH", val: "$190.88", color: "var(--green)" },
                { label: "LOW", val: "$186.60", color: "var(--red)" },
                { label: "VOL (M)", val: "58.4M", color: "var(--text)" },
                { label: "MKT CAP", val: "$2.91T", color: "var(--text)" },
              ].map((stat, i) => (
                <div key={stat.label} style={{ ...s.statItem, borderRight: i < 4 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ color: "var(--muted2)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
                  <div style={{ color: stat.color, fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>{stat.val}</div>
                </div>
              ))}
            </div>

            <div style={s.forecastRow}>
              {[
                { label: "1-DAY FORECAST", direction: "↑ BULLISH", price: "$192.10", conf: 74, color: "var(--green)", primary: false },
                { label: "5-DAY FORECAST", direction: "↑ STRONG BUY", price: "$197.85", conf: 81, color: "var(--blue)", primary: true },
                { label: "30-DAY FORECAST", direction: "→ NEUTRAL", price: "$194.20", conf: 58, color: "var(--amber)", primary: false },
              ].map((fc, i) => (
                <div key={fc.label} style={{ ...s.forecastCard(fc.color), borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--muted2)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{fc.label}</span>
                    {fc.primary && <span style={{ color: "var(--blue)", fontSize: "9px", fontWeight: 700, border: "1px solid var(--blue)", borderRadius: "3px", padding: "1px 5px" }}>PRIMARY</span>}
                  </div>
                  <div style={{ color: fc.color, fontSize: "11px", fontWeight: 700, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>{fc.direction}</div>
                  <div style={{ color: fc.color, fontSize: "20px", fontWeight: 700, margin: "2px 0" }}>{fc.price}</div>
                  <div style={{ color: "var(--muted2)", fontSize: "9px" }}>Confidence: {fc.conf}%</div>
                  <div style={{ height: "2px", background: isDark ? "#1e1e2e" : "#dde4ef", borderRadius: "1px", marginTop: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${fc.conf}%`, height: "100%", background: fc.color, borderRadius: "1px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div style={s.rightPanel}>
            <div style={s.rpSection}>
              <div style={s.rpLabel}>AAPL Sentiment Score</div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <CircleScore score={75} isDark={isDark} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  {[
                    { label: "Positive", pct: 72, color: "var(--green)" },
                    { label: "Negative", pct: 18, color: "var(--red)" },
                    { label: "Neutral", pct: 10, color: "var(--muted)" },
                  ].map((s2) => (
                    <div key={s2.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ color: "var(--muted)", fontSize: "10px" }}>{s2.label}</span>
                        <span style={{ color: s2.color, fontSize: "10px" }}>{s2.pct}%</span>
                      </div>
                      <div style={{ background: isDark ? "#1a1a28" : "#dde4ef", borderRadius: "1px", height: "3px" }}>
                        <div style={{ width: `${s2.pct}%`, height: "100%", background: s2.color, borderRadius: "1px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...s.rpSection, flex: 1, overflowY: "auto" }}>
              <div style={s.rpLabel}>Live News Feed · NLP Analyzed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {newsItems.map((n, i) => (
                  <div key={i} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ color: "var(--muted2)", fontSize: "9px", fontWeight: 700 }}>{n.source}</span>
                      <span style={{ color: "var(--muted3)", fontSize: "9px" }}>{n.time}</span>
                    </div>
                    <div style={{ color: "var(--text2)", fontSize: "10px", lineHeight: "1.4", marginBottom: "4px" }}>{n.headline}</div>
                    <span style={{ display: "inline-block", fontSize: "9px", fontWeight: 600, background: n.color + "22", color: n.color, border: `1px solid ${n.color}55`, borderRadius: "3px", padding: "1px 6px" }}>
                      ● {n.sentiment} · {n.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.rpSection}>
              <div style={s.rpLabel}>Model Performance</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {[
                  { label: "RMSE", val: "2.14" },
                  { label: "MAE", val: "1.87" },
                  { label: "Accuracy", val: "83.2%", highlight: true },
                  { label: "F1 Score", val: "0.814", highlight: true },
                ].map((m) => (
                  <div key={m.label} style={{ background: isDark ? "#111120" : "#f0f5fb", border: "1px solid var(--border2)", borderRadius: "5px", padding: "7px 10px" }}>
                    <div style={{ color: "var(--muted2)", fontSize: "9px" }}>{m.label}</div>
                    <div style={{ color: m.highlight ? "var(--accent)" : "var(--text)", fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}