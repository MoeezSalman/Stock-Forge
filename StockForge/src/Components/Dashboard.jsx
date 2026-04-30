import { useState, useEffect } from "react";
import Navbar from "./Navbar";
// ─── Theme tokens ────────────────────────────────────────────────────────────
const darkTheme = {
  "--bg":        "#0a0a0f",
  "--bg2":       "#0d0d18",
  "--surface":   "#111120",
  "--border":    "#1a1a28",
  "--border2":   "#1e1e2e",
  "--text":      "#e2e2e2",
  "--text2":     "#aaa",
  "--muted":     "#666",
  "--muted2":    "#555",
  "--muted3":    "#444",
  "--accent":    "#6d28d9",
  "--accent2":   "#4f46e5",
  "--green":     "#22c55e",
  "--red":       "#ef4444",
  "--amber":     "#d97706",
  "--blue":      "#3b82f6",
  "--purple":    "#8b5cf6",
  "--mono":      "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  "--logo-grad": "linear-gradient(135deg,#6d28d9,#4f46e5)",
};

const lightTheme = {
  "--bg":        "#f0f5fb",
  "--bg2":       "#ffffff",
  "--surface":   "#f7f9fc",
  "--border":    "#dde4ef",
  "--border2":   "#c8d4e8",
  "--text":      "#0f172a",
  "--text2":     "#334155",
  "--muted":     "#64748b",
  "--muted2":    "#94a3b8",
  "--muted3":    "#b0bcd4",
  "--accent":    "#4f46e5",
  "--accent2":   "#6d28d9",
  "--green":     "#16a34a",
  "--red":       "#dc2626",
  "--amber":     "#b45309",
  "--blue":      "#2563eb",
  "--purple":    "#7c3aed",
  "--mono":      "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  "--logo-grad": "linear-gradient(135deg,#4f46e5,#6d28d9)",
};

// ─── Static ticker data ───────────────────────────────────────────────────────
const tickerData = [
  { symbol: "TSLA",  price: "246.71", change: "-2.14%", neg: true  },
  { symbol: "AMZN",  price: "183.95", change: "+0.67%", neg: false },
  { symbol: "GOOGL", price: "168.48", change: "-0.38%", neg: true  },
  { symbol: "META",  price: "512.80", change: "+2.05%", neg: false },
  { symbol: "MSFT",  price: "415.50", change: "+1.12%", neg: false },
  { symbol: "SPY",   price: "528.14", change: "+0.54%", neg: false },
  { symbol: "QQQ",   price: "445.30", change: "+0.82%", neg: false },
  { symbol: "AMD",   price: "178.90", change: "+1.44%", neg: false },
  { symbol: "NFLX",  price: "628.50", change: "-1.05%", neg: true  },
  { symbol: "CRM",   price: "295.70", change: "+0.00%", neg: false },
];

const newsItems = [
  { source: "Bloomberg",   time: "12 min ago",  headline: "Apple reports record iPhone sales in Q2, beats analyst expectations by 8%",   sentiment: "Positive", score: "0.91",  color: "#22c55e" },
  { source: "Reuters",     time: "38 min ago",  headline: "Fed signals potential rate cuts could boost tech sector valuations",            sentiment: "Positive", score: "0.76",  color: "#22c55e" },
  { source: "CNBC",        time: "1h 12m ago",  headline: "Supply chain concerns in Asia may limit Apple's production capacity",          sentiment: "Negative", score: "-0.68", color: "#ef4444" },
  { source: "WSJ",         time: "2h 05m ago",  headline: "Apple Vision Pro gaining traction in enterprise market, analysts say",         sentiment: "Positive", score: "0.83",  color: "#22c55e" },
  { source: "FT",          time: "3h 41m ago",  headline: "Regulatory scrutiny on Apple's App Store continues in EU markets",            sentiment: "Negative", score: "-0.22", color: "#ef4444" },
  { source: "MarketWatch", time: "4h 20m ago",  headline: "Analyst upgrades AAPL to Strong Buy citing AI integration roadmap",           sentiment: "Positive", score: "0.88",  color: "#22c55e" },
  { source: "TechCrunch",  time: "5h 33m ago",  headline: "Apple unveils new M4 chip architecture improvements for next-gen Mac lineup", sentiment: "Neutral",  score: "-0.15", color: "#a3a3a3" },
];

// ─── Signal metadata ──────────────────────────────────────────────────────────
const SIGNAL_META = {
  "STRONG BUY": { icon: "↑", label: "STRONG BUY", cssVar: "var(--blue)",  hex: "#3b82f6" },
  "BUY":        { icon: "↑", label: "BUY",         cssVar: "var(--green)", hex: "#22c55e" },
  "HOLD":       { icon: "→", label: "HOLD",         cssVar: "var(--amber)", hex: "#d97706" },
  "REDUCE":     { icon: "↓", label: "REDUCE",       cssVar: "var(--red)",   hex: "#ef4444" },
  // legacy fallbacks
  "BULLISH":    { icon: "↑", label: "BULLISH",     cssVar: "var(--green)", hex: "#22c55e" },
  "NEUTRAL":    { icon: "→", label: "NEUTRAL",     cssVar: "var(--amber)", hex: "#d97706" },
  "BEARISH":    { icon: "↓", label: "BEARISH",     cssVar: "var(--red)",   hex: "#ef4444" },
};

function getSignalMeta(signal) {
  return SIGNAL_META[signal] || SIGNAL_META["NEUTRAL"];
}

// ─── Data fetching hooks ──────────────────────────────────────────────────────
function usePrediction(ticker) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/api/predictions/${ticker}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => { setData(json); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }, [ticker]);

  return { data, loading, error };
}

// ─── NEW: live price history hook ────────────────────────────────────────────
function usePriceHistory(ticker) {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);

    fetch(`http://localhost:5000/api/price_history/${ticker}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => { setHistory(json || []); setLoading(false); })
      .catch(()  => { setLoading(false); });
  }, [ticker]);

  return { history, loading };
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({ width = "80px", height = "14px", isDark }) {
  return (
    <span style={{
      display:       "inline-block",
      width, height,
      borderRadius:  "3px",
      background:    isDark ? "#1e1e2e" : "#dde4ef",
      animation:     "shimmer 1.4s ease-in-out infinite",
      verticalAlign: "middle",
    }} />
  );
}

// ─── Live SparkChart (reads from /api/price_history) ─────────────────────────
function SparkChart({ isDark, history, historyLoading }) {
  const width    = 820;
  const height   = 180;
  const paddingX = 40;   // extra left padding for y-labels
  const paddingY = 20;

  // ── guard: show shimmer while history loads ──
  if (historyLoading || history.length === 0) {
    return (
      <div style={{
        height:          180,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        color:           "var(--muted)",
        fontSize:        "11px",
        letterSpacing:   "0.05em",
      }}>
        {historyLoading ? "Loading chart data…" : "No price history available."}
      </div>
    );
  }

  // ── data ──
  const closes   = history.map(h => Number(h.close));
  const forecasts= history.map(h => Number(h.predicted_close)).filter(v => !isNaN(v) && v > 0);

  const allVals  = [...closes, ...forecasts];
  const minY     = Math.min(...allVals) * 0.9985;
  const maxY     = Math.max(...allVals) * 1.0015;

  const scaleX = (i, total) =>
    paddingX + (i / Math.max(total - 1, 1)) * (width - paddingX * 2);
  const scaleY = (v) =>
    height - paddingY - ((v - minY) / (maxY - minY)) * (height - paddingY * 2);

  // Actual path
  const pathD = closes
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i, closes.length).toFixed(1)} ${scaleY(v).toFixed(1)}`)
    .join(" ");
  const lastX  = scaleX(closes.length - 1, closes.length);
  const firstX = scaleX(0, closes.length);
  const areaD  = pathD
    + ` L ${lastX.toFixed(1)} ${(height - paddingY).toFixed(1)}`
    + ` L ${firstX.toFixed(1)} ${(height - paddingY).toFixed(1)} Z`;

  // Forecast path (predicted_close overlaid on actual history rows)
  const fTotal = closes.length + Math.max(forecasts.length - 1, 0);
  const fPathD = forecasts.length > 1
    ? forecasts
        .map((v, i) =>
          `${i === 0 ? "M" : "L"} ${scaleX(closes.length - 1 + i, fTotal).toFixed(1)} ${scaleY(v).toFixed(1)}`
        )
        .join(" ")
    : "";

  // Confidence band (±0.5% of forecast)
  const bandPath = () => {
    if (forecasts.length < 2) return "";
    const upper = forecasts.map(v => v * 1.005);
    const lower = forecasts.map(v => v * 0.995);
    const upStr = upper.map((v, i) =>
      `${i === 0 ? "M" : "L"} ${scaleX(closes.length - 1 + i, fTotal).toFixed(1)} ${scaleY(v).toFixed(1)}`
    ).join(" ");
    const loStr = lower.slice().reverse().map((v, i) => {
      const ri = lower.length - 1 - i;
      return `L ${scaleX(closes.length - 1 + ri, fTotal).toFixed(1)} ${scaleY(v).toFixed(1)}`;
    }).join(" ");
    return upStr + " " + loStr + " Z";
  };

  const dotX = scaleX(closes.length - 1, fTotal || closes.length);
  const dotY = scaleY(closes[closes.length - 1]);

  // Dynamic grid (4 evenly-spaced values)
  const gridVals = [0, 1, 2, 3].map(i => minY + (i / 3) * (maxY - minY));

  const gridColor      = isDark ? "#ffffff08" : "#00000010";
  const labelColor     = isDark ? "#555"      : "#94a3b8";
  const todayLineColor = isDark ? "#555"      : "#94a3b8";
  const todayBoxBg     = isDark ? "#1e1e2e"   : "#e2e8f0";
  const todayBoxBorder = isDark ? "#333"      : "#c8d4e8";
  const todayTextColor = isDark ? "#aaa"      : "#64748b";
  const dotBg          = isDark ? "#1a1a2e"   : "#f0f5fb";

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#d97706" stopOpacity="0.3"  />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {gridVals.map((v, i) => (
        <g key={i}>
          <line
            x1={paddingX} x2={width - paddingX}
            y1={scaleY(v).toFixed(1)} y2={scaleY(v).toFixed(1)}
            stroke={gridColor} strokeWidth="1"
          />
          <text
            x={paddingX - 5} y={(scaleY(v) + 4).toFixed(1)}
            fill={labelColor} fontSize="10" textAnchor="end"
          >
            ${v.toFixed(2)}
          </text>
        </g>
      ))}

      {/* Confidence band */}
      {forecasts.length > 1 && (
        <path d={bandPath()} fill="#d97706" fillOpacity="0.12" />
      )}

      {/* Forecast area + line */}
      {fPathD && (
        <>
          <path d={fPathD + ` L ${scaleX(fTotal - 1, fTotal).toFixed(1)} ${(height - paddingY).toFixed(1)} L ${dotX.toFixed(1)} ${(height - paddingY).toFixed(1)} Z`}
            fill="url(#forecastGrad)" />
          <path d={fPathD} fill="none" stroke="#d97706"
            strokeWidth="2" strokeDasharray="5,3" strokeLinejoin="round" />
        </>
      )}

      {/* Actual area + line */}
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#8b5cf6"
        strokeWidth="2" strokeLinejoin="round" />

      {/* TODAY divider */}
      <line
        x1={dotX.toFixed(1)} x2={dotX.toFixed(1)}
        y1={paddingY} y2={height - paddingY}
        stroke={todayLineColor} strokeWidth="1" strokeDasharray="3,3"
      />
      <rect
        x={(dotX - 22).toFixed(1)} y={paddingY - 16}
        width="44" height="14" rx="3"
        fill={todayBoxBg} stroke={todayBoxBorder} strokeWidth="1"
      />
      <text x={dotX.toFixed(1)} y={paddingY - 5}
        fill={todayTextColor} fontSize="9" textAnchor="middle">TODAY</text>

      {/* Live dot */}
      <circle cx={dotX.toFixed(1)} cy={dotY.toFixed(1)}
        r="5" fill="#f59e0b" stroke={dotBg} strokeWidth="2" />
    </svg>
  );
}

// ─── Volume chart ─────────────────────────────────────────────────────────────
function VolumeChart({ history }) {
  // Use real volume data if available, otherwise random bars
  const bars = history && history.length > 0
    ? history.slice(-32).map((h, i) => ({
        height: Math.min(100, Math.max(10, (Number(h.volume) / 1e7) * 10)),
        color:  i % 3 === 0 ? "#ef4444" : i % 3 === 1 ? "#22c55e" : i % 5 === 0 ? "#d97706" : "#7c3aed",
      }))
    : Array.from({ length: 32 }, (_, i) => ({
        height: 20 + Math.random() * 60,
        color:  i % 3 === 0 ? "#ef4444" : i % 3 === 1 ? "#22c55e" : i % 5 === 0 ? "#d97706" : "#7c3aed",
      }));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "50px", padding: "0 8px" }}>
      {bars.map((bar, i) => (
        <div key={i} style={{
          flex:            1,
          height:          `${bar.height}%`,
          backgroundColor: bar.color,
          opacity:         0.75,
          borderRadius:    "1px 1px 0 0",
          minWidth:        "4px",
        }} />
      ))}
    </div>
  );
}

// ─── Circle score ─────────────────────────────────────────────────────────────
function CircleScore({ score = 75, isDark }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const trackColor = isDark ? "#1e1e2e" : "#e2e8f0";

  return (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke={trackColor} strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke="#22c55e" strokeWidth="6"
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)" />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{score}</span>
        <span style={{ color: "var(--muted)", fontSize: 8 }}>AVG</span>
      </div>
    </div>
  );
}

// ─── Forecast cards ───────────────────────────────────────────────────────────
function ForecastCards({ data, loading, isDark }) {
  const cards = [
    { label: "1-DAY FORECAST",  forecast: data?.forecast_1d,  primary: false, fallback: { signal: "BULLISH",    confidence: 0.74 } },
    { label: "5-DAY FORECAST",  forecast: data?.forecast_5d,  primary: true,  fallback: { signal: "STRONG BUY", confidence: 0.81 } },
    { label: "30-DAY FORECAST", forecast: data?.forecast_30d, primary: false, fallback: { signal: "NEUTRAL",    confidence: 0.58 } },
  ];

  return (
    <div style={{ display: "flex", gap: "0", background: "var(--bg2)", borderTop: "1px solid var(--border)" }}>
      {cards.map((fc, i) => {
        const forecast = fc.forecast || fc.fallback;
        const meta     = getSignalMeta(forecast.signal);
        const conf     = Math.round((forecast.confidence ?? 0) * 100);

        return (
          <div key={fc.label} style={{
            flex:        1,
            padding:     "12px 16px",
            borderRight: i < 2 ? "1px solid var(--border)" : "none",
            borderTop:   `2px solid ${meta.hex}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ color: "var(--muted2)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {fc.label}
              </span>
              {fc.primary && (
                <span style={{
                  color: meta.cssVar, fontSize: "9px", fontWeight: 700,
                  border: `1px solid ${meta.hex}`, borderRadius: "3px", padding: "1px 5px",
                }}>PRIMARY</span>
              )}
            </div>

            {loading ? (
              <div style={{ marginTop: 6 }}><Skeleton width="90px" height="11px" isDark={isDark} /></div>
            ) : (
              <div style={{ color: meta.cssVar, fontSize: "11px", fontWeight: 700, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 16, height: 16, background: meta.hex + "22", borderRadius: "3px",
                  fontSize: "10px",
                }}>{meta.icon}</span>
                {meta.label}
              </div>
            )}

            {loading ? (
              <div style={{ margin: "4px 0" }}><Skeleton width="70px" height="20px" isDark={isDark} /></div>
            ) : (
              <div style={{ color: meta.cssVar, fontSize: "20px", fontWeight: 700, margin: "2px 0" }}>
                {data?.predicted_close ? `$${Number(data.predicted_close).toFixed(2)}` : "—"}
              </div>
            )}

            {loading
              ? <Skeleton width="80px" height="10px" isDark={isDark} />
              : <div style={{ color: "var(--muted2)", fontSize: "9px" }}>Confidence: {conf}%</div>
            }

            <div style={{ height: "2px", background: isDark ? "#1e1e2e" : "#dde4ef", borderRadius: "1px", marginTop: "4px", overflow: "hidden" }}>
              {!loading && <div style={{ width: `${conf}%`, height: "100%", background: meta.hex, borderRadius: "1px", transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />}
            </div>

            {!loading && fc.forecast && (
              <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 4px #22c55e88", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ color: "var(--green)", fontSize: "8px", fontWeight: 600 }}>LIVE · DB</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ data, loading, isDark }) {
  const stats = [
    { label: "OPEN",    val: data ? `$${Number(data.open).toFixed(2)}`          : null, color: "var(--text)"  },
    { label: "HIGH",    val: data ? `$${Number(data.high).toFixed(2)}`          : null, color: "var(--green)" },
    { label: "LOW",     val: data ? `$${Number(data.low).toFixed(2)}`           : null, color: "var(--red)"   },
    { label: "VOL",     val: data ? `${(Number(data.volume) / 1e6).toFixed(1)}M`: null, color: "var(--text)"  },
    { label: "MKT CAP", val: data?.market_cap_label ?? null, color: "var(--text)", live: true },
  ];

  return (
    <div style={{ display: "flex", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
      {stats.map((stat, i) => (
        <div key={stat.label} style={{
          flex: 1, padding: "8px 16px",
          borderRight: i < 4 ? "1px solid var(--border)" : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "var(--muted2)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {stat.label}
            </span>
            {stat.live && !loading && data?.market_cap_label && (
              <span style={{ fontSize: "7px", fontWeight: 700, color: "var(--green)", border: "1px solid var(--green)", borderRadius: "2px", padding: "0 3px", lineHeight: "12px" }}>DB</span>
            )}
          </div>
          {loading
            ? <Skeleton width="52px" height="13px" isDark={isDark} />
            : <div style={{ color: stat.color, fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>{stat.val ?? "—"}</div>
          }
        </div>
      ))}
    </div>
  );
}

// ─── Price header ─────────────────────────────────────────────────────────────
function PriceHeader({ data, loading, ticker, isDark }) {
  const price  = data ? `$${Number(data.price).toFixed(2)}` : null;
  const change = data ? Number(data.change).toFixed(2)      : null;
  const pct    = data?.price
    ? ((data.change / (data.price - data.change)) * 100).toFixed(2)
    : null;
  const isPos  = data ? data.change >= 0 : true;

  const getSig = () => data?.prediction ?? "NEUTRAL";
  const sigMeta = getSignalMeta(getSig());

  return (
    <div style={{ padding: "14px 20px 8px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <span style={{ color: "var(--text)", fontSize: "16px", fontWeight: 700 }}>{ticker}</span>
        <span style={{ color: "var(--muted)", fontSize: "12px" }}>
          {ticker === "AAPL" ? "Apple Inc." :
           ticker === "MSFT" ? "Microsoft Corp." :
           ticker === "AMZN" ? "Amazon.com Inc." :
           ticker === "GOOGL"? "Alphabet Inc." :
           ticker === "NVDA" ? "NVIDIA Corp." : ticker} · NASDAQ
        </span>
        {!loading && data?.prediction && (
          <span style={{
            fontSize: "9px", fontWeight: 700,
            background: sigMeta.hex + "22",
            color:      sigMeta.cssVar,
            border:     `1px solid ${sigMeta.hex}55`,
            borderRadius: "4px", padding: "2px 7px",
          }}>
            {sigMeta.icon} {sigMeta.label}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "4px" }}>
        {loading
          ? <Skeleton width="120px" height="28px" isDark={isDark} />
          : <span style={{ color: "var(--text)", fontSize: "28px", fontWeight: 700 }}>{price ?? "$—"}</span>
        }
        {!loading && change !== null && (
          <>
            <span style={{ color: isPos ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
              {isPos ? "+" : ""}{change}
            </span>
            <span style={{ color: isPos ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
              {isPos ? "+" : ""}{pct}%
            </span>
          </>
        )}
        <span style={{ color: "var(--muted2)", fontSize: "10px" }}>
          {data?.updated_at
            ? new Date(data.updated_at).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })
            : "—"}
        </span>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────


// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [isDark,        setIsDark]        = useState(true);
  const [activeTicker,  setActiveTicker]  = useState("AAPL");
  const [watchlist,     setWatchlist]     = useState([]);
  const [activeTimeBtn, setActiveTimeBtn] = useState("1M");

  const theme = isDark ? darkTheme : lightTheme;

  // Live prediction data
  const { data, loading, error } = usePrediction(activeTicker);

  // ── LIVE price history for chart ──
  const { history, loading: historyLoading } = usePriceHistory(activeTicker);

  // Fetch watchlist
  useEffect(() => {
    fetch("http://localhost:5000/api/predictions")
      .then(res => res.json())
      .then(data => setWatchlist(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const rootStyle = Object.fromEntries(Object.entries(theme));

  const s = {
    root: {
      fontFamily:    "var(--mono)",
      background:    "var(--bg)",
      color:         "var(--text)",
      minHeight:     "100vh",
      fontSize:      "12px",
      display:       "flex",
      flexDirection: "column",
      transition:    "background 0.25s, color 0.25s",
    },
    tickerOuter: {
      background:   "var(--bg2)",
      borderBottom: "1px solid var(--border)",
      overflow:     "hidden",
      flexShrink:   0,
      height:       "32px",
      display:      "flex",
      alignItems:   "center",
    },
    tickerTrack: {
      display:       "flex",
      gap:           "0",
      animation:     "tickerScroll 28s linear infinite",
      whiteSpace:    "nowrap",
    },
    tickerItem: {
      display:     "inline-flex",
      gap:         "6px",
      alignItems:  "center",
      padding:     "0 20px",
      borderRight: "1px solid var(--border)",
    },
    main: { display: "flex", flex: 1, overflow: "hidden" },
    sidebar: {
      width:         "170px",
      flexShrink:    0,
      background:    "var(--bg2)",
      borderRight:   "1px solid var(--border)",
      display:       "flex",
      flexDirection: "column",
      padding:       "12px 0",
      overflowY:     "auto",
    },
    sidebarLabel: {
      color:          "var(--muted2)",
      fontSize:       "9px",
      fontWeight:     700,
      letterSpacing:  "0.08em",
      padding:        "0 12px",
      marginBottom:   "6px",
      textTransform:  "uppercase",
    },
    watchItem: (active) => ({
      display:        "flex",
      justifyContent: "space-between",
      alignItems:     "center",
      padding:        "7px 12px",
      background:     active ? (isDark ? "#1a1a2e" : "#eef2fb") : "transparent",
      cursor:         "pointer",
      borderLeft:     active ? "2px solid var(--accent)" : "2px solid transparent",
    }),
    center: {
      flex:       1,
      display:    "flex",
      flexDirection: "column",
      overflowY:  "auto",
      overflowX:  "hidden",
      background: "var(--bg)",
    },
    chartArea: {
      padding:       "0 8px",
      flex:          1,
      display:       "flex",
      flexDirection: "column",
    },
    timeBtn: (active) => ({
      padding:     "2px 8px",
      borderRadius:"4px",
      fontSize:    "10px",
      cursor:      "pointer",
      fontFamily:  "var(--mono)",
      background:  active ? "var(--accent)" : "transparent",
      color:       active ? "#fff" : "var(--muted2)",
      border:      active ? "none" : "1px solid var(--border2)",
    }),
    rightPanel: {
      width:         "220px",
      flexShrink:    0,
      background:    "var(--bg2)",
      borderLeft:    "1px solid var(--border)",
      display:       "flex",
      flexDirection: "column",
      overflowY:     "auto",
    },
    rpSection: { borderBottom: "1px solid var(--border)", padding: "10px 12px" },
    rpLabel:   { color: "var(--muted2)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 700 },
  };

  const tickerItems = [...tickerData, ...tickerData, ...tickerData];

  return (
    <>
      <style>{`
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-33.333%)} }
        @keyframes shimmer      { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ticker-track:hover { animation-play-state:paused }
      `}</style>

      <div style={{ ...s.root, ...rootStyle }}>

        {/* Top Nav */}
 <Navbar
  isDark={isDark}
  onToggle={() => setIsDark(d => !d)}
  activeLabel="Dashboard"
  exportData={{ ticker: activeTicker, data, history }}
/>

        {/* Ticker Strip */}
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

        {/* Main layout */}
        <div style={s.main}>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <div style={s.sidebar}>
            <div style={s.sidebarLabel}>Watchlist</div>

            {(watchlist || []).map((w) => (
              <div
                key={w.ticker}
                style={s.watchItem(w.ticker === activeTicker)}
                onClick={() => setActiveTicker(w.ticker)}
              >
                <div>
                  <div style={{ color: "var(--text)", fontWeight: 600, fontSize: "12px" }}>{w.ticker}</div>
                  <div style={{ color: "var(--muted2)", fontSize: "9px" }}>{w.prediction}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--text)", fontWeight: 600 }}>${Number(w.price).toFixed(2)}</div>
                  <div style={{ color: w.change >= 0 ? "var(--green)" : "var(--red)", fontSize: "10px" }}>
                    {w.change >= 0 ? "+" : ""}{Number(w.change).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ margin: "14px 0 10px", borderTop: "1px solid var(--border)" }} />

            <div style={s.sidebarLabel}>Market Sentiment</div>
            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { label: "Bullish", pct: 68, color: "var(--green)" },
                { label: "Bearish", pct: 19, color: "var(--red)"   },
                { label: "Neutral", pct: 21, color: "var(--muted)" },
              ].map(s2 => (
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
                // ✅ CORRECT
                { label: "XGBoost Model",  status: "Active",  color: "var(--green)" },
                { label: "RSI-14 / ret_1", status: "Active",  color: "var(--green)" },
                { label: "MongoDB Sync",   status: "Running", color: "var(--amber)" },
              ].map(m => (
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

          {/* ── Center ──────────────────────────────────────────────── */}
          <div style={s.center}>

            <PriceHeader data={data} loading={loading} ticker={activeTicker} isDark={isDark} />

            {error && (
              <div style={{
                background: "#ef444422", border: "1px solid #ef4444",
                borderRadius: 5, margin: "8px 16px", padding: "6px 10px",
                color: "var(--red)", fontSize: "10px",
              }}>
                ⚠ Could not fetch live data ({error}). Showing cached / fallback values.
              </div>
            )}

            {/* Legend + time selector */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 0" }}>
              <div style={{ display: "flex", gap: "14px", fontSize: "10px" }}>
                {[
                  { label: "Actual",         color: "#8b5cf6", dashed: false },
                  { label: "Prediction",     color: "#d97706", dashed: true  },
                  { label: "Conf. band",     color: "#d97706", dashed: false, opacity: 0.3 },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{
                      display:    "inline-block",
                      width:      "18px",
                      height:     "2px",
                      background: l.dashed ? "transparent" : l.color,
                      borderTop:  l.dashed ? `2px dashed ${l.color}` : "none",
                      opacity:    l.opacity || 1,
                      verticalAlign: "middle",
                    }} />
                    <span style={{ color: "var(--muted2)" }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {["1D", "5D", "1M", "3M", "1Y"].map(t => (
                  <button key={t} style={s.timeBtn(t === activeTimeBtn)}
                    onClick={() => setActiveTimeBtn(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 16px 0" }}>
              <span style={{
                background:   isDark ? "#1a1a28" : "#e8edf7",
                border:       "1px solid var(--border2)",
                borderRadius: "4px",
                padding:      "3px 8px",
                fontSize:     "9px",
                color:        "var(--muted)",
              }}>
                XGBoost · predict_proba Forecast
              </span>
            </div>

            {/* ── LIVE Chart (reads from /api/price_history/:ticker) ── */}
            <div style={s.chartArea}>
              <SparkChart
                isDark={isDark}
                history={history}
                historyLoading={historyLoading}
              />
              <div style={{ borderTop: "1px solid var(--border)", padding: "6px 8px 2px" }}>
                <div style={{ color: "var(--muted2)", fontSize: "9px", padding: "0 8px 2px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Volume
                </div>
                <VolumeChart history={history} />
              </div>
            </div>

            <StatsBar    data={data} loading={loading} isDark={isDark} />
            <ForecastCards data={data} loading={loading} isDark={isDark} />

          </div>

          {/* ── Right Panel ──────────────────────────────────────────── */}
          <div style={s.rightPanel}>

            <div style={s.rpSection}>
              <div style={s.rpLabel}>
                {activeTicker} Sentiment Score
                {!loading && data && (
                  <span style={{ marginLeft: 6, color: "var(--green)", fontSize: "8px" }}>● LIVE</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <CircleScore score={75} isDark={isDark} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  {[
                    { label: "Positive", pct: 72, color: "var(--green)" },
                    { label: "Negative", pct: 18, color: "var(--red)"   },
                    { label: "Neutral",  pct: 10, color: "var(--muted)" },
                  ].map(s2 => (
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

            {/* Live prediction summary */}
            {!loading && data && (
              <div style={{ ...s.rpSection, background: isDark ? "#0f1020" : "#f0f5fb" }}>
                <div style={s.rpLabel}>Live Prediction · {activeTicker}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(() => {
                    const sig = data.prediction ?? "NEUTRAL";
                    const meta = getSignalMeta(sig);
                    return (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--muted)", fontSize: "10px" }}>Next-bar</span>
                        <span style={{ color: meta.cssVar, fontWeight: 700, fontSize: "10px" }}>
                          {meta.icon} {meta.label}
                        </span>
                      </div>
                    );
                  })()}

                  {[
                    { key: "forecast_1d",  short: "1D" },
                    { key: "forecast_5d",  short: "5D" },
                    { key: "forecast_30d", short: "30D" },
                  ].map(({ key, short }) => {
                    const fc = data[key];
                    if (!fc) return null;
                    const meta = getSignalMeta(fc.signal);
                    const conf = Math.round(fc.confidence * 100);
                    return (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--muted)", fontSize: "10px" }}>{short} Forecast</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ color: "var(--muted3)", fontSize: "9px" }}>{conf}%</span>
                          <span style={{
                            color: meta.cssVar, fontWeight: 700, fontSize: "9px",
                            background: meta.hex + "18", border: `1px solid ${meta.hex}44`,
                            borderRadius: 3, padding: "1px 5px",
                          }}>
                            {meta.icon} {meta.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--muted)", fontSize: "10px" }}>Market Cap</span>
                    <span style={{ color: "var(--text)", fontWeight: 700, fontSize: "10px" }}>
                      {data.market_cap_label ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* News feed */}
            <div style={{ ...s.rpSection, flex: 1, overflowY: "auto" }}>
              <div style={s.rpLabel}>Live News Feed · NLP Analyzed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {newsItems.map((n, i) => (
                  <div key={i} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ color: "var(--muted2)", fontSize: "9px", fontWeight: 700 }}>{n.source}</span>
                      <span style={{ color: "var(--muted3)", fontSize: "9px" }}>{n.time}</span>
                    </div>
                    <div style={{ color: "var(--text2)", fontSize: "10px", lineHeight: "1.4", marginBottom: "4px" }}>
                      {n.headline}
                    </div>
                    <span style={{
                      display: "inline-block", fontSize: "9px", fontWeight: 600,
                      background: n.color + "22", color: n.color,
                      border: `1px solid ${n.color}55`, borderRadius: "3px", padding: "1px 6px",
                    }}>
                      ● {n.sentiment} · {n.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model performance */}
            <div style={s.rpSection}>
              <div style={s.rpLabel}>Model Performance</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {[
                  { label: "RMSE",     val: "2.14"  },
                  { label: "MAE",      val: "1.87"  },
                  { label: "Accuracy", val: "83.2%", highlight: true },
                  { label: "F1 Score", val: "0.814", highlight: true },
                ].map(m => (
                  <div key={m.label} style={{
                    background:   isDark ? "#111120" : "#f0f5fb",
                    border:       "1px solid var(--border2)",
                    borderRadius: "5px",
                    padding:      "7px 10px",
                  }}>
                    <div style={{ color: "var(--muted2)", fontSize: "9px" }}>{m.label}</div>
                    <div style={{ color: m.highlight ? "var(--accent)" : "var(--text)", fontWeight: 700, fontSize: "13px", marginTop: "2px" }}>
                      {m.val}
                    </div>
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