import { useState } from "react";

// ── Dark theme tokens (mirrors StockForge dashboard exactly) ──────────────────
const DARK = {
  bg:        "#0a0a0f",
  bg2:       "#0d0d18",
  surface:   "#111120",
  border:    "#1a1a28",
  border2:   "#1e1e2e",
  text:      "#e2e2e2",
  text2:     "#aaa",
  muted:     "#666",
  muted2:    "#555",
  muted3:    "#444",
  accent:    "#6d28d9",
  accent2:   "#4f46e5",
  green:     "#22c55e",
  red:       "#ef4444",
  amber:     "#d97706",
  blue:      "#3b82f6",
  purple:    "#8b5cf6",
  mono:      "'JetBrains Mono','Fira Code','Courier New',monospace",
  logoGrad:  "linear-gradient(135deg,#6d28d9,#4f46e5)",
};

// ── Light theme tokens ────────────────────────────────────────────────────────
const LIGHT = {
  bg:        "#f0f5fb",
  bg2:       "#ffffff",
  surface:   "#f7f9fc",
  border:    "#dde4ef",
  border2:   "#c8d4e8",
  text:      "#0f172a",
  text2:     "#334155",
  muted:     "#64748b",
  muted2:    "#94a3b8",
  muted3:    "#b0bcd4",
  accent:    "#4f46e5",
  accent2:   "#6d28d9",
  green:     "#16a34a",
  red:       "#dc2626",
  amber:     "#b45309",
  blue:      "#2563eb",
  purple:    "#7c3aed",
  mono:      "'JetBrains Mono','Fira Code','Courier New',monospace",
  logoGrad:  "linear-gradient(135deg,#4f46e5,#6d28d9)",
};

// ── Data ─────────────────────────────────────────────────────────────────────
const tickers = [
  { symbol:"AAPL", price:"$189.42", chg:"+1.84%", shares:120, value:"$22,730", signal:"BUY",        target:"$197.85", conf:"81%", up:true  },
  { symbol:"NVDA", price:"$875.28", chg:"+3.21%", shares:25,  value:"$21,880", signal:"STRONG BUY", target:"$910.50", conf:"87%", up:true  },
  { symbol:"META", price:"$512.80", chg:"+2.05%", shares:31,  value:"$15,948", signal:"BUY",        target:"$534.20", conf:"76%", up:true  },
  { symbol:"MSFT", price:"$415.50", chg:"+1.12%", shares:40,  value:"$16,620", signal:"HOLD",       target:"$419.40", conf:"62%", up:true  },
  { symbol:"AMZN", price:"$183.95", chg:"+0.67%", shares:80,  value:"$14,716", signal:"BUY",        target:"$192.40", conf:"73%", up:true  },
  { symbol:"GOOGL",price:"$168.40", chg:"-0.38%", shares:60,  value:"$10,104", signal:"HOLD",       target:"$170.50", conf:"58%", up:false },
  { symbol:"TSLA", price:"$245.71", chg:"-2.14%", shares:50,  value:"$12,336", signal:"REDUCE",     target:"$234.00", conf:"70%", up:false },
];

const alloc = [
  { symbol:"NVDA",  color:"#8b5cf6", pct:28 },
  { symbol:"AAPL",  color:"#22c55e", pct:22 },
  { symbol:"META",  color:"#3b82f6", pct:18 },
  { symbol:"MSFT",  color:"#d97706", pct:14 },
  { symbol:"AMZN",  color:"#06b6d4", pct:10 },
  { symbol:"GOOGL", color:"#ef4444", pct:8  },
];

const pipeRow1 = [
  { label:"Kaggle Dataset", sub:"38K+ rows · 2000–2024\n~4,200 rows" },
  { label:"News Corpus",    sub:"Kaggle Financial\nNews Dataset" },
  { label:"Live API Feed",  sub:"Alpha Vantage API\nReal-time pricing" },
  { label:"RSS News",       sub:"Bloomberg / Reuters\nFinancial news" },
];
const pipeRow2 = [
  { label:"Preprocessing",  sub:"Normalization · Scale\nNaN Imputation" },
  { label:"Feature Eng.",   sub:"RSI, MACD, BB\nlag features" },
  { label:"NLP Analysis",   sub:"VADER\nSentiment score" },
  { label:"Feature Fusion", sub:"OHLCV + NLP\nDataset + 63 d" },
];
const pipeRow3 = [
  { label:"LSTM Model", sub:"Window: 60\nReg Test: 40" },
  { label:"Inference",  sub:"3-layer inference\nAPI SINGLE" },
  { label:"Prediction", sub:"3 Price targets +\nConfidence %" },
  { label:"Dashboard",  sub:"Buy/Sell signals\nPortfolio alerts" },
];

const kaggleSources = [
  { icon:"📈", title:"Stock Market Data",     sub:"OHLCV Prices\n500K+ rows\n50 tickers, 20yr" },
  { icon:"📰", title:"Financial News NLP",    sub:"8,394 Headlines\nSentiment: Annotated\nFINBERT ambition" },
  { icon:"📊", title:"Technical Indicators",  sub:"RSI, MACD, BB\n60 indicators\nPre-computed" },
  { icon:"📡", title:"Live Feed",             sub:"Alpha Vantage API\n20 Tickers, 60D\nPre-computed" },
];

const riskMetrics = [
  { label:"SHARPE RATIO", value:"1.84",   isPos: true  },
  { label:"MAX DRAWDOWN", value:"-8.2%",  isNeg: true  },
  { label:"BETA",         value:"1.12",   isNeutral: true },
  { label:"ALPHA",        value:"+4.1%",  isPos: true  },
  { label:"VOLATILITY",   value:"18.4%",  isAmber: true },
  { label:"WIN RATE",     value:"67.3%",  isPos: true  },
];

const navItems = ["Dashboard","Predictions","Sentiment","Model","Portfolio"];

// ── Signal badge ──────────────────────────────────────────────────────────────
function SignalBadge({ signal, t }) {
  const map = {
    "BUY":        { bg: t.green+"22", color: t.green, border: t.green+"55" },
    "STRONG BUY": { bg: t.green+"22", color: t.green, border: t.green+"55" },
    "HOLD":       { bg: t.amber+"22", color: t.amber, border: t.amber+"55" },
    "REDUCE":     { bg: t.red  +"22", color: t.red,   border: t.red  +"55" },
  };
  const s = map[signal] || map["HOLD"];
  const label = signal === "STRONG BUY" ? "● STRONG BUY"
              : signal === "BUY"        ? "● BUY"
              : signal === "REDUCE"     ? "● REDUCE"
              : "– HOLD";
  return (
    <span style={{
      background: s.bg, color: s.color, border:`1px solid ${s.border}`,
      borderRadius:4, padding:"2px 8px", fontSize:10, fontWeight:700,
      letterSpacing:0.4, whiteSpace:"nowrap", fontFamily: t.mono,
    }}>{label}</span>
  );
}

// ── Pipeline box ──────────────────────────────────────────────────────────────
function PipeBox({ label, sub, row, t, d }) {
  const styles = {
    1: { bg: d ? t.surface  : "#f7f9fc", border: d ? t.border2 : "#dde4ee", text: t.text,   sub: t.muted },
    2: { bg: d ? "#0f1a2e"  : "#edf5ff", border: d ? "#1a2d48" : "#bcd4f0", text: d ? t.blue  :"#1a4a7a", sub: t.muted },
    3: { bg: d ? "#120e22"  : "#f2eeff", border: d ? "#22184a" : "#d1c4fc", text: d ? t.purple:"#4a2da8", sub: t.muted },
  };
  const c = styles[row];
  return (
    <div style={{ flex:1, background:c.bg, border:`1px solid ${c.border}`, borderRadius:6, padding:"9px 12px", minWidth:0 }}>
      <div style={{ fontWeight:700, fontSize:11, color:c.text, marginBottom:2, fontFamily:t.mono }}>{label}</div>
      <div style={{ fontSize:9.5, color:c.sub, whiteSpace:"pre-line", lineHeight:1.5, fontFamily:t.mono }}>{sub}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StockForgeDashboard() {
  const [activeNav, setActiveNav] = useState("Portfolio");
  const [darkMode, setDarkMode]   = useState(true);   // dark by default like StockForge

  const d  = darkMode;
  const t  = d ? DARK : LIGHT;

  // metric value colors
  const metricColor = (m) => {
    if (m.isNeg)     return t.red;
    if (m.isAmber)   return t.amber;
    if (m.isPos)     return t.green;
    if (m.isNeutral) return t.text;
    return t.text;
  };

  const row = (i) => i % 2 === 0
    ? t.surface
    : (d ? "#0e0e1c" : "#f8fafd");

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: ${t.bg}; }
        ::-webkit-scrollbar-thumb { background: ${t.border2}; border-radius: 3px; }
      `}</style>

      <div style={{ fontFamily: t.mono, background: t.bg, minHeight:"100vh", color: t.text, transition:"background .2s, color .2s", fontSize:12 }}>

        {/* ── NAV ─────────────────────────────────────────────────────────── */}
        <nav style={{
          background: t.bg2, borderBottom:`1px solid ${t.border}`,
          display:"grid", gridTemplateColumns:"200px 1fr auto",
          alignItems:"center", padding:"0 16px", height:44,
          position:"sticky", top:0, zIndex:100,
        }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:22, height:22, borderRadius:5,
              background: t.logoGrad,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:900, color:"#fff", fontSize:10,
            }}>AS</div>
            <span style={{ fontWeight:700, fontSize:13, color:t.text }}>
              Alpha<span style={{ color:t.accent }}>Signal</span>
            </span>
          </div>

          {/* Center nav */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:2 }}>
            {navItems.map(n => (
              <button key={n} onClick={() => setActiveNav(n)} style={{
                fontFamily: t.mono, color: activeNav===n ? t.text : t.muted,
                fontWeight: activeNav===n ? 600 : 400,
                fontSize:12, cursor:"pointer", padding:"4px 14px",
                borderRadius:5, background: activeNav===n ? (d?"#1e1e30":"#e8edf7") : "transparent",
                border:"none", outline:"none", transition:"all .15s",
              }}>{n}</button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={() => setDarkMode(v => !v)} style={{
              fontFamily:t.mono, background: d ? "#1e1e30" : "#e8edf7",
              border:`1px solid ${t.border2}`, borderRadius:5,
              padding:"4px 12px", fontSize:11, fontWeight:600,
              color:t.text, cursor:"pointer", display:"flex", alignItems:"center", gap:5,
            }}>
              {d ? "☀ Light" : "☽ Dark"}
            </button>
            <button style={{
              fontFamily:t.mono, background: d ? "#1a1a28" : "#e8edf7",
              border:`1px solid ${t.border2}`, borderRadius:5,
              padding:"4px 12px", fontSize:11, fontWeight:600,
              color:d ? t.muted : t.text2, cursor:"pointer",
            }}>Export CSV</button>
            <button style={{
              fontFamily:t.mono, background: t.logoGrad,
              border:"none", color:"#fff", borderRadius:5,
              padding:"5px 14px", fontSize:11, fontWeight:700,
              cursor:"pointer",
            }}>Generate Report</button>
          </div>
        </nav>

        {/* ── CONTENT ─────────────────────────────────────────────────────── */}
        <div style={{ padding:"20px 24px 48px", maxWidth:1160, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18 }}>
            <div>
              <h1 style={{ fontSize:20, fontWeight:700, margin:0, color:t.text, letterSpacing:"-0.01em" }}>
                Portfolio &amp; Predictions
              </h1>
              <p style={{ margin:"3px 0 0", fontSize:10, color:t.muted }}>
                AI-driven signal overview · Kaggle dataset pipeline ·
                <span style={{ fontWeight:600, color:t.text2 }}> 7 active positions</span>
              </p>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:t.muted, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                Portfolio Value &nbsp;&nbsp;&nbsp; Today's P&amp;L
              </div>
              <div style={{ display:"flex", gap:20, alignItems:"baseline" }}>
                <span style={{ fontSize:24, fontWeight:700, color:t.text }}>$142,840</span>
                <span style={{ fontSize:20, fontWeight:700, color:t.green }}>+$2,314</span>
              </div>
            </div>
          </div>

          {/* ── Pipeline ──────────────────────────────────────────────────── */}
          <div style={{ background:t.bg2, borderRadius:8, border:`1px solid ${t.border}`, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontWeight:700, fontSize:12, color:t.text }}>Data Pipeline — Kaggle to Prediction</span>
              <span style={{ fontSize:9, color:t.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>End-to-end Flow</span>
            </div>

            {/* Row 1 */}
            <div style={{ display:"flex", gap:5, alignItems:"center", marginBottom:6 }}>
              {pipeRow1.map((p,i) => (
                <div key={p.label} style={{ display:"flex", flex:1, alignItems:"center", gap:5, minWidth:0 }}>
                  <PipeBox label={p.label} sub={p.sub} row={1} t={t} d={d} />
                  {i < pipeRow1.length-1 && <span style={{ color:t.muted, fontSize:12, flexShrink:0 }}>+</span>}
                </div>
              ))}
            </div>

            <div style={{ textAlign:"center", color:t.muted, fontSize:11, marginBottom:4 }}>↕ ↕ ↕ ↕</div>

            {/* Row 2 */}
            <div style={{ display:"flex", gap:5, alignItems:"center", marginBottom:6 }}>
              {pipeRow2.map((p,i) => (
                <div key={p.label} style={{ display:"flex", flex:1, alignItems:"center", gap:5, minWidth:0 }}>
                  <PipeBox label={p.label} sub={p.sub} row={2} t={t} d={d} />
                  {i < pipeRow2.length-1 && <span style={{ color:t.muted, fontSize:12, flexShrink:0 }}>—</span>}
                </div>
              ))}
            </div>

            <div style={{ textAlign:"center", color:t.muted, fontSize:11, marginBottom:4 }}>↕</div>

            {/* Row 3 */}
            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
              {pipeRow3.map((p,i) => (
                <div key={p.label} style={{ display:"flex", flex:1, alignItems:"center", gap:5, minWidth:0 }}>
                  <PipeBox label={p.label} sub={p.sub} row={3} t={t} d={d} />
                  {i < pipeRow3.length-1 && <span style={{ color:t.muted, fontSize:12, flexShrink:0 }}>—</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ── Two-column layout ─────────────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16 }}>

            {/* LEFT — Positions table */}
            <div style={{ background:t.bg2, borderRadius:8, border:`1px solid ${t.border}`, overflow:"hidden" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px 8px" }}>
                <span style={{ fontWeight:700, fontSize:12, color:t.text }}>Active Positions + AI Signals</span>
                <span style={{ fontSize:9, color:t.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>Sorted by signal confidence</span>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ background: t.surface }}>
                    {["SYMBOL","PRICE","CHG","SHARES","VALUE","AI SIGNAL","TARGET","CONF"].map(h => (
                      <th key={h} style={{
                        padding:"7px 12px", textAlign:"left",
                        color:t.muted2, fontWeight:600, fontSize:9, letterSpacing:0.7,
                        fontFamily:t.mono, borderBottom:`1px solid ${t.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickers.map((tk,i) => (
                    <tr key={tk.symbol} style={{ borderBottom:`1px solid ${t.border}`, background:row(i) }}>
                      <td style={{ padding:"9px 12px", fontWeight:700, fontSize:12, color:t.text, fontFamily:t.mono }}>{tk.symbol}</td>
                      <td style={{ padding:"9px 12px", fontWeight:600, color:t.text, fontFamily:t.mono }}>{tk.price}</td>
                      <td style={{ padding:"9px 12px", fontWeight:700, color:tk.up?t.green:t.red, fontFamily:t.mono }}>{tk.chg}</td>
                      <td style={{ padding:"9px 12px", color:t.muted, fontFamily:t.mono }}>{tk.shares}</td>
                      <td style={{ padding:"9px 12px", fontWeight:600, color:t.text, fontFamily:t.mono }}>{tk.value}</td>
                      <td style={{ padding:"9px 12px" }}><SignalBadge signal={tk.signal} t={t} /></td>
                      <td style={{ padding:"9px 12px", color:t.green, fontWeight:700, fontFamily:t.mono }}>{tk.target}</td>
                      <td style={{ padding:"9px 12px", fontWeight:700, fontFamily:t.mono,
                        color: tk.signal==="REDUCE" ? t.red : tk.signal==="HOLD" ? t.amber : t.green,
                      }}>{tk.conf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RIGHT column */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Portfolio Allocation */}
              <div style={{ background:t.bg2, borderRadius:8, border:`1px solid ${t.border}`, padding:"13px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:t.text }}>Portfolio Allocation</span>
                  <span style={{ fontSize:9, color:t.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>By AI signal weight</span>
                </div>
                {/* Bar */}
                <div style={{ display:"flex", borderRadius:4, overflow:"hidden", height:12, marginBottom:10 }}>
                  {alloc.map(a => (
                    <div key={a.symbol} style={{ width:`${a.pct}%`, background:a.color }} title={`${a.symbol} ${a.pct}%`} />
                  ))}
                </div>
                {/* Legend */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 10px" }}>
                  {alloc.map(a => (
                    <div key={a.symbol} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, fontFamily:t.mono }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:a.color, display:"inline-block", flexShrink:0 }} />
                      <span style={{ fontWeight:600, color:t.text }}>{a.symbol}</span>
                      <span style={{ color:t.muted }}>{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Metrics */}
              <div style={{ background:t.bg2, borderRadius:8, border:`1px solid ${t.border}`, padding:"13px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:t.text }}>Risk Metrics</span>
                  <span style={{ fontSize:9, color:t.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>30-day rolling</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {riskMetrics.map(m => (
                    <div key={m.label} style={{
                      background: t.surface, borderRadius:6, padding:"9px 10px",
                      border:`1px solid ${t.border2}`,
                    }}>
                      <div style={{ fontSize:8, color:t.muted2, marginBottom:3, fontWeight:600, letterSpacing:0.5, fontFamily:t.mono, textTransform:"uppercase" }}>{m.label}</div>
                      <div style={{ fontSize:18, fontWeight:700, color:metricColor(m), fontFamily:t.mono }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kaggle Sources */}
              <div style={{ background:t.bg2, borderRadius:8, border:`1px solid ${t.border}`, padding:"13px 14px" }}>
                <div style={{ marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:t.text }}>Kaggle Dataset Sources</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {kaggleSources.map(k => (
                    <div key={k.title} style={{
                      background:t.surface, borderRadius:6, padding:"10px 10px",
                      border:`1px solid ${t.border2}`,
                    }}>
                      <div style={{ fontSize:14, marginBottom:5 }}>{k.icon}</div>
                      <div style={{ fontWeight:700, fontSize:10, marginBottom:3, color:t.text, fontFamily:t.mono }}>{k.title}</div>
                      <div style={{ fontSize:9, color:t.muted, whiteSpace:"pre-line", lineHeight:1.55, marginBottom:6, fontFamily:t.mono }}>{k.sub}</div>
                      <span style={{
                        fontSize:8, color:t.accent2,
                        background: d ? t.accent+"22" : "#eef4fc",
                        borderRadius:3, padding:"2px 6px", fontWeight:700, fontFamily:t.mono,
                        border:`1px solid ${t.accent2}44`,
                      }}>kaggle.com</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* end RIGHT */}
          </div>{/* end two-col */}
        </div>{/* end content */}
      </div>
    </>
  );
}