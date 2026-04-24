import { useState } from "react";

// ── Theme tokens — mirrors StockForge dashboard exactly ───────────────────────
const darkTheme = {
  "--bg":           "#0a0a0f",
  "--bg2":          "#0d0d18",
  "--surface":      "#111120",
  "--surface2":     "#1a1a28",
  "--border":       "#1a1a28",
  "--border2":      "#1e1e2e",
  "--text":         "#e2e2e2",
  "--text2":        "#aaa",
  "--muted":        "#666",
  "--muted2":       "#555",
  "--accent":       "#6d28d9",
  "--accent2":      "#4f46e5",
  "--warn":         "#d97706",
  "--danger":       "#ef4444",
  "--green":        "#22c55e",
  "--purple":       "#8b5cf6",
  "--mono":         "'JetBrains Mono','Fira Code','Courier New',monospace",
  "--display":      "'JetBrains Mono','Fira Code','Courier New',monospace",
  "--sentGrad":     "#8b5cf6",
  "--sentLine":     "#8b5cf6",
  "--gridLine":     "rgba(139,92,246,0.07)",
  "--zeroLine":     "rgba(139,92,246,0.2)",
  "--donutText":    "#e2e2e2",
  "--sourceBg":     "rgba(255,255,255,0.04)",
  "--logoGrad":     "linear-gradient(135deg,#6d28d9,#4f46e5)",
};

const lightTheme = {
  "--bg":           "#f0f5fb",
  "--bg2":          "#ffffff",
  "--surface":      "#f7f9fc",
  "--surface2":     "#e8edf7",
  "--border":       "#dde4ef",
  "--border2":      "#c8d4e8",
  "--text":         "#0f172a",
  "--text2":        "#334155",
  "--muted":        "#64748b",
  "--muted2":       "#94a3b8",
  "--accent":       "#4f46e5",
  "--accent2":      "#6d28d9",
  "--warn":         "#b45309",
  "--danger":       "#dc2626",
  "--green":        "#16a34a",
  "--purple":       "#7c3aed",
  "--mono":         "'JetBrains Mono','Fira Code','Courier New',monospace",
  "--display":      "'JetBrains Mono','Fira Code','Courier New',monospace",
  "--sentGrad":     "#4f46e5",
  "--sentLine":     "#4f46e5",
  "--gridLine":     "rgba(79,70,229,0.07)",
  "--zeroLine":     "rgba(79,70,229,0.18)",
  "--donutText":    "#0f172a",
  "--sourceBg":     "rgba(0,0,0,0.04)",
  "--logoGrad":     "linear-gradient(135deg,#4f46e5,#6d28d9)",
};

const navItems = ["Dashboard","Predictions","Sentiment","Model","Portfolio"];

export default function SentimentAnalysisEngine() {
  const [isDark, setIsDark]   = useState(true);
  const [activeNav, setActiveNav] = useState("Sentiment");
  const [activeFilter, setActiveFilter] = useState("All Tickers");

  const t = isDark ? darkTheme : lightTheme;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .sent-root {
      font-family: var(--mono);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      font-size: 12px;
      transition: background 0.25s, color 0.25s;
    }

    /* NAV */
    .sent-nav {
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      display: grid;
      grid-template-columns: 200px 1fr auto;
      align-items: center;
      padding: 0 16px;
      height: 44px;
      position: sticky; top: 0; z-index: 100;
    }
    .sent-logo { display:flex; align-items:center; gap:8px; font-weight:700; font-size:13px; color:var(--text); }
    .sent-logo-icon {
      width:22px; height:22px; border-radius:5px;
      display:flex; align-items:center; justify-content:center;
      font-size:10px; font-weight:900; color:#fff;
    }
    .sent-navlinks { display:flex; gap:2px; justify-content:center; }
    .sent-navlinks button {
      font-family:var(--mono); font-size:12px; padding:4px 14px; border-radius:5px;
      cursor:pointer; border:none; outline:none; transition:all .15s;
    }
    .sent-navlinks button.active { font-weight:600; color:var(--text); }
    .sent-navlinks button:not(.active) { font-weight:400; color:var(--muted); background:transparent; }
    .sent-nav-right { display:flex; align-items:center; gap:12px; }
    .sent-nav-info { font-size:10px; color:var(--muted); }
    .sent-nav-info span { color:var(--text); }

    .sent-toggle {
      font-family:var(--mono); font-size:11px; font-weight:600;
      padding:4px 12px; border-radius:5px; cursor:pointer;
      border:1px solid var(--border2);
      display:flex; align-items:center; gap:5px;
      transition:all .2s;
    }

    /* HEADER */
    .sent-page-header {
      padding: 16px 20px;
      display: flex; align-items: flex-end; justify-content: space-between;
      border-bottom: 1px solid var(--border);
    }
    .sent-page-title { font-size:18px; font-weight:700; color:var(--text); letter-spacing:-0.01em; }
    .sent-page-sub { font-size:10px; color:var(--muted); margin-top:4px; text-transform:uppercase; letter-spacing:0.06em; }
    .sent-filter-row { display:flex; gap:6px; }
    .sent-filter-btn {
      font-family:var(--mono); font-size:10px; font-weight:600; padding:4px 12px;
      border-radius:5px; cursor:pointer;
      border:1px solid var(--border2);
      color:var(--muted); background:transparent; transition:all .15s;
    }
    .sent-filter-btn.active {
      color:var(--purple);
      border-color: rgba(139,92,246,0.4);
    }

    /* CONTENT */
    .sent-content { padding: 18px 20px; display:flex; flex-direction:column; gap:16px; }

    /* STAT CARDS */
    .sent-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    .sent-stat {
      background:var(--surface); border:1px solid var(--border);
      border-radius:8px; padding:14px 16px;
    }
    .sent-stat-label {
      font-size:9px; color:var(--muted2); text-transform:uppercase;
      letter-spacing:0.07em; margin-bottom:6px;
    }
    .sent-stat-val { font-size:28px; font-weight:700; line-height:1; }
    .sent-stat-foot { font-size:10px; color:var(--muted); margin-top:5px; }

    /* PANELS */
    .sent-panel {
      background:var(--surface); border:1px solid var(--border);
      border-radius:8px; overflow:hidden;
    }
    .sent-panel-head {
      padding:10px 16px; border-bottom:1px solid var(--border);
      display:flex; align-items:center; justify-content:space-between;
    }
    .sent-panel-title { font-size:12px; font-weight:700; color:var(--text); }
    .sent-panel-sub { font-size:9px; color:var(--muted2); text-transform:uppercase; letter-spacing:0.07em; }
    .sent-panel-body { padding:16px; }

    /* PIPELINE */
    .sent-pipeline {
      display:flex; align-items:center; gap:0; padding:16px;
      overflow-x:auto;
    }
    .pipe-step { display:flex; flex-direction:column; align-items:center; gap:6px; min-width:90px; }
    .pipe-box {
      width:84px; padding:10px 6px; text-align:center; border-radius:7px;
      border:1px solid; font-size:10px; font-weight:700; line-height:1.3;
    }
    .pipe-detail { font-size:9px; color:var(--muted); text-align:center; line-height:1.4; }
    .pipe-arrow { font-size:16px; color:var(--muted2); margin:0 2px; margin-bottom:18px; }

    /* GRID LAYOUTS */
    .sent-two-col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .sent-three-col { display:grid; grid-template-columns:2fr 1fr; gap:14px; }

    /* DONUT */
    .sent-donut-row { display:flex; align-items:center; gap:16px; padding:14px; }
    .sent-donut-legend { flex:1; display:flex; flex-direction:column; gap:8px; }
    .sent-legend-row { display:flex; align-items:center; gap:8px; font-size:11px; }
    .sent-legend-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .sent-legend-label { flex:1; color:var(--muted); }
    .sent-legend-count { font-weight:700; }

    /* SOURCES */
    .sent-source-row {
      display:flex; align-items:center; gap:10px; padding:9px 0;
      border-bottom:1px solid var(--border); font-size:11px;
    }
    .sent-source-row:last-child { border-bottom:none; }
    .sent-source-name { width:90px; font-weight:600; color:var(--text2); }
    .sent-source-track { flex:1; height:5px; background:var(--sourceBg); border-radius:3px; overflow:hidden; }
    .sent-source-bar { height:100%; border-radius:3px; }
    .sent-source-count { color:var(--muted); width:36px; text-align:right; font-size:10px; }
    .sent-source-score { width:46px; text-align:right; font-weight:700; font-size:10px; }

    /* KW CLOUD */
    .kw-cloud { display:flex; flex-wrap:wrap; gap:6px; padding:12px 16px; }
    .kw-tag {
      padding:4px 10px; border-radius:20px; font-size:10px; font-weight:600;
      cursor:pointer; transition:all .15s; border:1px solid;
    }
    .kw-tag:hover { transform:translateY(-1px); }
    .kw-pos { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.3); color:var(--green); }
    .kw-neg { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3); color:var(--danger); }
    .kw-neu { background:rgba(102,102,102,0.1); border-color:rgba(102,102,102,0.2); color:var(--muted); }

    /* ARTICLE CARDS */
    .art-card { padding:13px 16px; border-bottom:1px solid var(--border); }
    .art-card:last-child { border-bottom:none; }
    .art-header { display:flex; justify-content:space-between; margin-bottom:6px; }
    .art-source { font-size:10px; color:var(--muted); }
    .art-score {
      font-size:10px; font-weight:700; padding:2px 7px;
      border-radius:3px;
    }
    .pos-score { background:rgba(34,197,94,0.12); color:var(--green); }
    .neg-score { background:rgba(239,68,68,0.12); color:var(--danger); }
    .neu-score { background:rgba(102,102,102,0.1); color:var(--muted); }
    .art-headline { font-size:11px; font-weight:600; margin-bottom:7px; line-height:1.5; color:var(--text2); }
    .art-tokens { display:flex; flex-wrap:wrap; gap:3px; }
    .token { font-size:9px; padding:2px 5px; border-radius:3px; }
    .tok-pos { background:rgba(34,197,94,0.13); color:var(--green); }
    .tok-neg { background:rgba(239,68,68,0.1); color:var(--danger); }
    .tok-neu { background:rgba(102,102,102,0.08); color:var(--muted); }
  `;

  const sentGrad  = t["--sentGrad"];
  const sentLine  = t["--sentLine"];
  const gridLine  = t["--gridLine"];
  const zeroLine  = t["--zeroLine"];
  const donutText = t["--donutText"];

  const rootVars = Object.fromEntries(
    Object.entries(t).filter(([k]) => !["--sentGrad","--sentLine","--gridLine","--zeroLine","--donutText","--logoGrad"].includes(k))
  );

  const navActive = (n) => ({
    background: n === activeNav ? (isDark ? "#1e1e30" : "#e8edf7") : "transparent",
  });

  const filterActive = (f) => f === activeFilter ? "sent-filter-btn active" : "sent-filter-btn";

  return (
    <>
      <style>{css}</style>
      <div className="sent-root" style={rootVars}>

        {/* ── NAV ─────────────────────────────────────────────────────────── */}
        <nav className="sent-nav">
          <div className="sent-logo">
            <div className="sent-logo-icon" style={{ background: t["--logoGrad"] }}>AS</div>
            <span>Alpha<span style={{ color:"var(--accent)" }}>Signal</span></span>
          </div>
          <div className="sent-navlinks">
            {navItems.map(n => (
              <button
                key={n}
                className={n === activeNav ? "active" : ""}
                style={navActive(n)}
                onClick={() => setActiveNav(n)}
              >{n}</button>
            ))}
          </div>
          <div className="sent-nav-right">
            <span className="sent-nav-info">
              Analyzed today: <span>1,284 articles</span>
            </span>
            <button
              className="sent-toggle"
              style={{ background: isDark ? "#1e1e30" : "#e8edf7", color:"var(--text)" }}
              onClick={() => setIsDark(v => !v)}
            >
              {isDark ? "☀ Light" : "☽ Dark"}
            </button>
          </div>
        </nav>

        {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
        <div className="sent-page-header">
          <div>
            <div className="sent-page-title">Sentiment Analysis Engine</div>
            <div className="sent-page-sub">FinBERT NLP · Real-time news processing · Kaggle financial corpus</div>
          </div>
          <div className="sent-filter-row">
            {["All Tickers","AAPL","NVDA","TSLA","Market"].map(f => (
              <button key={f} className={filterActive(f)} onClick={() => setActiveFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ─────────────────────────────────────────────────────── */}
        <div className="sent-content">

          {/* STAT CARDS */}
          <div className="sent-stats">
            {[
              { label:"Articles Processed", val:"1,284",  foot:"Today · ↑ +312 vs yesterday",     color:"var(--text)" },
              { label:"Overall Sentiment",  val:"+0.64",  foot:"Bullish bias · 7-day avg: +0.51",  color:"var(--green)" },
              { label:"Positive Rate",      val:"68.4%",  foot:"823 pos / 244 neg / 217 neu",      color:"var(--purple)" },
              { label:"NLP Confidence",     val:"91.2%",  foot:"Avg model confidence score",        color:"var(--accent)" },
            ].map(s => (
              <div className="sent-stat" key={s.label}>
                <div className="sent-stat-label">{s.label}</div>
                <div className="sent-stat-val" style={{ color: s.color }}>{s.val}</div>
                <div className="sent-stat-foot">{s.foot}</div>
              </div>
            ))}
          </div>

          {/* NLP PIPELINE */}
          <div className="sent-panel">
            <div className="sent-panel-head">
              <div className="sent-panel-title">NLP Processing Pipeline</div>
              <div className="sent-panel-sub">From raw news to sentiment signal</div>
            </div>
            <div className="sent-pipeline">
              {[
                { label:"News\nIngestion",    detail:"RSS / API\nScraping",       col:"muted"   },
                { label:"Text\nCleaning",     detail:"Stop words\nNormalize",     col:"accent"  },
                { label:"Tokenize\n& Encode", detail:"BERT\nWordPiece",           col:"accent"  },
                { label:"FinBERT\nInference", detail:"768-dim\nembedding",        col:"purple"  },
                { label:"Sentiment\nScore",   detail:"POS / NEG\n/ NEUTRAL",      col:"accent2" },
                { label:"Entity\nLinking",    detail:"Ticker\nmapping",           col:"warn"    },
                { label:"Aggregate\nSignal",  detail:"Time-decay\nweighting",     col:"warn"    },
                { label:"LSTM\nFusion",       detail:"Feature\ninput",            col:"green"   },
              ].map((step, i, arr) => {
                const colorMap = {
                  muted:   { fg:"var(--muted)",   bg:"rgba(102,102,102,0.08)",   border:"rgba(102,102,102,0.22)" },
                  accent:  { fg:"var(--accent)",  bg:"rgba(109,40,217,0.08)",    border:"rgba(109,40,217,0.3)"  },
                  accent2: { fg:"var(--purple)",  bg:"rgba(139,92,246,0.08)",    border:"rgba(139,92,246,0.3)"  },
                  purple:  { fg:"var(--purple)",  bg:"rgba(139,92,246,0.1)",     border:"rgba(139,92,246,0.35)" },
                  warn:    { fg:"var(--warn)",    bg:"rgba(217,119,6,0.08)",     border:"rgba(217,119,6,0.3)"   },
                  green:   { fg:"var(--green)",   bg:"rgba(34,197,94,0.08)",     border:"rgba(34,197,94,0.3)"   },
                };
                const c = colorMap[step.col];
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center" }}>
                    <div className="pipe-step">
                      <div className="pipe-box" style={{ background:c.bg, borderColor:c.border, color:c.fg }}>
                        {step.label.split("\n").map((l,j) => <div key={j}>{l}</div>)}
                      </div>
                      <div className="pipe-detail">{step.detail}</div>
                    </div>
                    {i < arr.length - 1 && <div className="pipe-arrow">→</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIMELINE + DISTRIBUTION */}
          <div className="sent-three-col">
            <div className="sent-panel">
              <div className="sent-panel-head">
                <div className="sent-panel-title">Sentiment Timeline</div>
                <div className="sent-panel-sub">30-day rolling average</div>
              </div>
              <div className="sent-panel-body">
                <svg width="100%" height="190" viewBox="0 0 600 190" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor={sentGrad} stopOpacity="0.32" />
                      <stop offset="70%" stopColor={sentGrad} stopOpacity="0.03" />
                    </linearGradient>
                  </defs>
                  {[45,95,145].map(y => (
                    <line key={y} x1="30" x2="600" y1={y} y2={y} stroke={gridLine} strokeWidth="1" />
                  ))}
                  <line x1="30" x2="600" y1="95" y2="95" stroke={zeroLine} strokeWidth="1" />
                  <text x="4" y="44"  fontFamily="monospace" fontSize="9" fill={`${sentLine}99`}>+1.0</text>
                  <text x="8" y="94"  fontFamily="monospace" fontSize="9" fill="var(--muted)">0</text>
                  <text x="4" y="175" fontFamily="monospace" fontSize="9" fill="rgba(239,68,68,0.6)">−1.0</text>
                  <path
                    d="M30,90 C60,85 90,80 120,87 C150,94 180,89 210,81 C240,73 270,67 300,63 C330,59 360,65 390,55 C420,48 450,42 480,37 C510,33 540,40 570,35 L570,95 L30,95 Z"
                    fill="url(#sGrad)"
                  />
                  <path
                    d="M30,90 C60,85 90,80 120,87 C150,94 180,89 210,81 C240,73 270,67 300,63 C330,59 360,65 390,55 C420,48 450,42 480,37 C510,33 540,40 570,35"
                    stroke={sentLine} strokeWidth="2" fill="none" strokeLinejoin="round"
                  />
                  {/* dip patches */}
                  <path d="M120,87 C130,96 138,106 145,103 C152,100 158,92 165,85" stroke="var(--danger)" strokeWidth="1.5" fill="none" opacity="0.55" />
                  <path d="M240,73 C248,82 254,92 260,89 C266,86 272,77 280,67" stroke="var(--danger)" strokeWidth="1.5" fill="none" opacity="0.55" />
                  {/* Today marker */}
                  <line x1="570" x2="570" y1="8" y2="170" stroke="rgba(217,119,6,0.28)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="570" cy="35" r="4" fill={sentLine} stroke="var(--bg)" strokeWidth="2" />
                  <rect x="548" y="9" width="38" height="14" rx="3" fill="var(--surface2)" stroke="var(--border2)" strokeWidth="1" />
                  <text x="567" y="20" fontFamily="monospace" fontSize="8" fill="var(--warn)" textAnchor="middle">TODAY</text>
                  {/* X labels */}
                  {[["30","Mar 15"],["220","Apr 1"],["410","Apr 10"],["545","Apr 24"]].map(([x,lbl],i) => (
                    <text key={i} x={x} y="185" fontFamily="monospace" fontSize="9"
                      fill={i===3 ? "rgba(217,119,6,0.65)" : "var(--muted)"}>
                      {lbl}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* DISTRIBUTION */}
            <div className="sent-panel">
              <div className="sent-panel-head">
                <div className="sent-panel-title">Sentiment Distribution</div>
              </div>
              <div className="sent-donut-row">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="30" fill="none" stroke="var(--green)"   strokeWidth="12" strokeDasharray="188" strokeDashoffset="59"  transform="rotate(-90 44 44)" />
                  <circle cx="44" cy="44" r="30" fill="none" stroke="var(--danger)"  strokeWidth="12" strokeDasharray="188" strokeDashoffset="-129" transform="rotate(-90 44 44)" opacity="0.85" />
                  <circle cx="44" cy="44" r="30" fill="none" stroke="var(--muted)"   strokeWidth="12" strokeDasharray="188" strokeDashoffset="-175" transform="rotate(-90 44 44)" opacity="0.65" />
                  <text x="44" y="48" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="700" fill={donutText}>68%</text>
                </svg>
                <div className="sent-donut-legend">
                  {[
                    { label:"Positive", count:"823", color:"var(--green)"  },
                    { label:"Negative", count:"244", color:"var(--danger)" },
                    { label:"Neutral",  count:"217", color:"var(--muted)"  },
                  ].map(row => (
                    <div key={row.label} className="sent-legend-row">
                      <div className="sent-legend-dot" style={{ background: row.color }} />
                      <span className="sent-legend-label">{row.label}</span>
                      <span className="sent-legend-count" style={{ color: row.color }}>{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SOURCE SENTIMENT + NLP TOKEN ANALYSIS */}
          <div className="sent-two-col">

            {/* SOURCES */}
            <div className="sent-panel">
              <div className="sent-panel-head">
                <div className="sent-panel-title">Sentiment by Source</div>
                <div className="sent-panel-sub">Avg score (−1 to +1)</div>
              </div>
              <div className="sent-panel-body">
                {[
                  { name:"Bloomberg", pct:82, count:312, score:"+0.72", color:"var(--green)"   },
                  { name:"Reuters",   pct:74, count:287, score:"+0.65", color:"var(--purple)"  },
                  { name:"CNBC",      pct:56, count:198, score:"+0.48", color:"var(--accent)"  },
                  { name:"WSJ",       pct:62, count:175, score:"+0.54", color:"var(--green)"   },
                  { name:"FT",        pct:38, count:142, score:"+0.32", color:"var(--warn)"    },
                  { name:"Twitter/X", pct:28, count:170, score:"−0.18", color:"var(--danger)"  },
                ].map(s => (
                  <div className="sent-source-row" key={s.name}>
                    <span className="sent-source-name">{s.name}</span>
                    <div className="sent-source-track">
                      <div className="sent-source-bar" style={{ width:`${s.pct}%`, background: s.color }} />
                    </div>
                    <span className="sent-source-count">{s.count}</span>
                    <span className="sent-source-score" style={{ color: s.color }}>{s.score}</span>
                  </div>
                ))}
              </div>

              {/* KW CLOUD */}
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:10 }}>
                <div style={{ fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 16px 8px" }}>Top Keywords</div>
                <div className="kw-cloud">
                  {[
                    { kw:"record earnings", cls:"kw-pos" }, { kw:"AI integration",   cls:"kw-pos" },
                    { kw:"beat estimates",  cls:"kw-pos" }, { kw:"supply chain",      cls:"kw-neg" },
                    { kw:"strong demand",   cls:"kw-pos" }, { kw:"regulatory risk",   cls:"kw-neg" },
                    { kw:"analyst upgrade", cls:"kw-pos" }, { kw:"market outlook",    cls:"kw-neu" },
                    { kw:"inflation concern",cls:"kw-neg"},  { kw:"revenue growth",   cls:"kw-pos" },
                    { kw:"rate decision",   cls:"kw-neu" }, { kw:"M4 chip",           cls:"kw-pos" },
                  ].map(k => (
                    <span key={k.kw} className={`kw-tag ${k.cls}`}>{k.kw}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* NLP TOKEN ANALYSIS */}
            <div className="sent-panel">
              <div className="sent-panel-head">
                <div className="sent-panel-title">NLP Token Analysis</div>
                <div className="sent-panel-sub">Highlighted sentiment tokens</div>
              </div>
              <div>
                {[
                  {
                    source:"Bloomberg · 12 min ago", scoreClass:"pos-score", score:"+0.91 Positive",
                    headline:"Apple reports record iPhone sales in Q2, beats analyst expectations by 8%",
                    tokens:[
                      {w:"Apple",s:"neu"},{w:"reports",s:"pos"},{w:"record",s:"pos"},{w:"iPhone",s:"neu"},
                      {w:"sales",s:"pos"},{w:"beats",s:"pos"},{w:"analyst",s:"pos"},{w:"expectations",s:"pos"},{w:"+8%",s:"neu"},
                    ],
                  },
                  {
                    source:"CNBC · 1h 12m ago", scoreClass:"neg-score", score:"−0.68 Negative",
                    headline:"Supply chain concerns in Asia may limit Apple's production capacity this quarter",
                    tokens:[
                      {w:"Supply chain",s:"neg"},{w:"concerns",s:"neg"},{w:"Asia",s:"neu"},
                      {w:"limit",s:"neg"},{w:"production",s:"neu"},{w:"capacity",s:"neg"},{w:"quarter",s:"neu"},
                    ],
                  },
                  {
                    source:"MarketWatch · 4h ago", scoreClass:"pos-score", score:"+0.88 Positive",
                    headline:"Analyst upgrades AAPL to Strong Buy citing robust AI integration roadmap",
                    tokens:[
                      {w:"Analyst",s:"neu"},{w:"upgrades",s:"pos"},{w:"AAPL",s:"neu"},
                      {w:"Strong Buy",s:"pos"},{w:"robust",s:"pos"},{w:"AI integration",s:"pos"},{w:"roadmap",s:"pos"},
                    ],
                  },
                  {
                    source:"FT · 5h 30m ago", scoreClass:"neu-score", score:"+0.12 Neutral",
                    headline:"EU continues regulatory scrutiny of Apple App Store market practices",
                    tokens:[
                      {w:"EU",s:"neu"},{w:"regulatory",s:"neg"},{w:"scrutiny",s:"neg"},
                      {w:"App Store",s:"neu"},{w:"market",s:"neu"},{w:"practices",s:"neg"},
                    ],
                  },
                ].map((art, i) => (
                  <div className="art-card" key={i}>
                    <div className="art-header">
                      <span className="art-source">{art.source}</span>
                      <span className={`art-score ${art.scoreClass}`}>{art.score}</span>
                    </div>
                    <div className="art-headline">{art.headline}</div>
                    <div className="art-tokens">
                      {art.tokens.map((tk, j) => (
                        <span key={j} className={`token tok-${tk.s}`}>{tk.w}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* end two-col */}
        </div>{/* end content */}
      </div>
    </>
  );
}