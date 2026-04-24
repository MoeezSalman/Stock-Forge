import { useState } from "react";

const darkTheme = {
  "--bg": "#07040d",
  "--surface": "#100820",
  "--surface2": "#160c2a",
  "--border": "rgba(167,139,250,0.13)",
  "--border2": "rgba(167,139,250,0.28)",
  "--text": "#ede9fe",
  "--muted": "#6b5a8f",
  "--accent": "#8b5cf6",
  "--accent2": "#a78bfa",
  "--warn": "#f59e0b",
  "--danger": "#ef4444",
  "--green": "#10b981",
  "--purple": "#8b5cf6",
  "--mono": "'Fira Code', monospace",
  "--display": "'Bricolage Grotesque', sans-serif",
  "--sentGradColor": "#a78bfa",
  "--sentLineColor": "#a78bfa",
  "--sourceBarBg": "rgba(255,255,255,0.05)",
  "--gridLine": "rgba(167,139,250,0.06)",
  "--zeroLine": "rgba(167,139,250,0.2)",
  "--donutText": "#e2eeff",
};

const lightTheme = {
  "--bg": "#f0f5fb",
  "--surface": "#ffffff",
  "--surface2": "#e4edf7",
  "--border": "rgba(30,64,175,0.12)",
  "--border2": "rgba(30,64,175,0.25)",
  "--text": "#0f172a",
  "--muted": "#60748b",
  "--accent": "#1d4ed8",
  "--accent2": "#0891b2",
  "--warn": "#d97706",
  "--danger": "#dc2626",
  "--green": "#059669",
  "--purple": "#1d4ed8",
  "--mono": "'JetBrains Mono', monospace",
  "--display": "'DM Sans', sans-serif",
  "--sentGradColor": "#0891b2",
  "--sentLineColor": "#0891b2",
  "--sourceBarBg": "rgba(0,0,0,0.05)",
  "--gridLine": "rgba(8,145,178,0.06)",
  "--zeroLine": "rgba(8,145,178,0.2)",
  "--donutText": "#0f172a",
};

export default function SentimentAnalysisEngineScreen() {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=Bricolage+Grotesque:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .dashboard-root {
      background: var(--bg); font-family: var(--display); color: var(--text);
      transition: background 0.3s, color 0.3s;
    }
    nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; height: 60px; border-bottom: 1px solid var(--border);
      background: var(--bg);
    }
    .logo { display:flex;align-items:center;gap:10px;font-size:18px;font-weight:800; }
    .logo-icon { width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px; }
    .nav-links { display:flex;gap:4px;list-style:none; }
    .nav-links a { padding:6px 14px;font-size:13px;font-weight:600;color:var(--muted);text-decoration:none;border-radius:6px; }
    .nav-links a.active { color:var(--text);background:var(--surface2); }
    .nav-right { display:flex;align-items:center;gap:12px; }

    .toggle-btn {
      padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid var(--border2); background: var(--surface2);
      color: var(--text); font-family: var(--display); transition: all 0.2s;
      display: flex; align-items: center; gap: 6px;
    }
    .toggle-btn:hover { opacity: 0.8; }

    .page-header {
      padding: 28px 32px 20px;
      display: flex; align-items: flex-end; justify-content: space-between;
      border-bottom: 1px solid var(--border);
    }
    .page-title { font-size: 28px; font-weight: 800; }
    .page-sub { font-size: 14px; color: var(--muted); margin-top: 4px; }
    .filter-row { display: flex; gap: 8px; }
    .filter-btn {
      padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; border: 1px solid var(--border); background: none; color: var(--muted); font-family: var(--display);
    }
    .filter-btn.active { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.3); color: var(--accent); }

    .content { padding: 24px 32px; display: flex; flex-direction: column; gap: 24px; }

    .top-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
    .stat-label { font-size: 10px; font-family: var(--mono); color: var(--muted); text-transform: uppercase; margin-bottom: 8px; }
    .stat-big { font-size: 32px; font-weight: 800; font-family: var(--mono); line-height: 1; }
    .stat-foot { font-size: 12px; color: var(--muted); margin-top: 6px; }

    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    .panel-head { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .panel-title { font-size: 14px; font-weight: 700; }
    .panel-sub { font-size: 11px; color: var(--muted); font-family: var(--mono); }
    .panel-body { padding: 20px; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .three-col { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }

    .pipeline { display: flex; align-items: center; gap: 0; padding: 20px; overflow-x: auto; }
    .pipe-step { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 100px; }
    .pipe-box {
      width: 90px; padding: 12px 8px; text-align: center; border-radius: 10px;
      border: 1px solid; font-size: 11px; font-weight: 700; line-height: 1.3;
    }
    .pipe-detail { font-size: 9px; font-family: var(--mono); color: var(--muted); text-align: center; line-height: 1.4; }
    .pipe-arrow { font-size: 20px; color: var(--muted); margin: 0 4px; margin-bottom: 20px; }

    .kw-cloud { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; }
    .kw-tag {
      padding: 5px 12px; border-radius: 20px; font-size: 12px;
      cursor: pointer; transition: all 0.15s; border: 1px solid;
    }
    .kw-tag:hover { transform: translateY(-1px); }
    .kw-pos { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: var(--green); }
    .kw-neg { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: var(--danger); }
    .kw-neu { background: rgba(90,114,153,0.1); border-color: rgba(90,114,153,0.2); color: var(--muted); }

    .article-card { padding: 16px 20px; border-bottom: 1px solid var(--border); }
    .article-card:last-child { border-bottom: none; }
    .art-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .art-source { font-size: 11px; font-family: var(--mono); color: var(--muted); }
    .art-score { font-size: 11px; font-family: var(--mono); font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .pos-score { background: rgba(16,185,129,0.12); color: var(--green); }
    .neg-score { background: rgba(239,68,68,0.12); color: var(--danger); }
    .neu-score { background: rgba(90,114,153,0.12); color: var(--muted); }
    .art-headline { font-size: 13px; font-weight: 600; margin-bottom: 8px; line-height: 1.5; }
    .art-tokens { display: flex; flex-wrap: wrap; gap: 4px; }
    .token { font-size: 10px; font-family: var(--mono); padding: 2px 6px; border-radius: 3px; }
    .tok-pos { background: rgba(16,185,129,0.15); color: var(--green); }
    .tok-neg { background: rgba(239,68,68,0.12); color: var(--danger); }
    .tok-neu { background: rgba(90,114,153,0.08); color: var(--muted); }

    .donut-row { display: flex; align-items: center; gap: 20px; padding: 16px; }
    .donut-legend { flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .legend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-label { flex: 1; color: var(--muted); }
    .legend-count { font-family: var(--mono); font-weight: 700; }

    .source-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
    .source-row:last-child { border-bottom: none; }
    .source-name { width: 100px; font-weight: 600; }
    .source-bar-track { flex: 1; height: 6px; background: var(--sourceBarBg); border-radius: 3px; overflow: hidden; }
    .source-bar { height: 100%; border-radius: 3px; }
    .source-count { font-family: var(--mono); font-size: 11px; color: var(--muted); width: 40px; text-align: right; }
    .source-score { font-family: var(--mono); font-size: 11px; width: 48px; text-align: right; }
  `;

  const cssVars = Object.entries(theme)
    .filter(([k]) => !k.startsWith("--sent") && !k.startsWith("--grid") && !k.startsWith("--zero") && !k.startsWith("--donut") && !k.startsWith("--source"))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  const rootStyle = {
    "--bg": theme["--bg"],
    "--surface": theme["--surface"],
    "--surface2": theme["--surface2"],
    "--border": theme["--border"],
    "--border2": theme["--border2"],
    "--text": theme["--text"],
    "--muted": theme["--muted"],
    "--accent": theme["--accent"],
    "--accent2": theme["--accent2"],
    "--warn": theme["--warn"],
    "--danger": theme["--danger"],
    "--green": theme["--green"],
    "--purple": theme["--purple"],
    "--mono": theme["--mono"],
    "--display": theme["--display"],
    "--sourceBarBg": theme["--sourceBarBg"],
  };

  const sentGradColor = theme["--sentGradColor"];
  const sentLineColor = theme["--sentLineColor"];
  const gridLine = theme["--gridLine"];
  const zeroLine = theme["--zeroLine"];
  const donutText = theme["--donutText"];

  const logoGradient = isDark
    ? "linear-gradient(135deg, #8b5cf6, #a78bfa)"
    : "linear-gradient(135deg, #1d4ed8, #0891b2)";

  return (
    <>
      <style>{css}</style>
      <div className="dashboard-root" style={rootStyle}>
        <nav>
          <div className="logo">
            <div className="logo-icon" style={{ background: logoGradient }}>📈</div>
            <span>AlphaSignal<span style={{ color: "var(--accent)" }}>AI</span></span>
          </div>
          <ul className="nav-links">
            <li><a href="#">Dashboard</a></li>
            <li><a href="#">Predictions</a></li>
            <li><a href="#" className="active">Sentiment</a></li>
            <li><a href="#">Model</a></li>
            <li><a href="#">Portfolio</a></li>
          </ul>
          <div className="nav-right">
            <span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--muted)" }}>
              Analyzed today: <span style={{ color: "var(--text)" }}>1,284 articles</span>
            </span>
            <button className="toggle-btn" onClick={() => setIsDark(!isDark)}>
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </nav>

        <div className="page-header">
          <div>
            <div className="page-title">Sentiment Analysis Engine</div>
            <div className="page-sub">FinBERT NLP · Real-time news processing · Kaggle financial corpus</div>
          </div>
          <div className="filter-row">
            <button className="filter-btn active">All Tickers</button>
            <button className="filter-btn">AAPL</button>
            <button className="filter-btn">NVDA</button>
            <button className="filter-btn">TSLA</button>
            <button className="filter-btn">Market</button>
          </div>
        </div>

        <div className="content">
          {/* TOP STATS */}
          <div className="top-stats">
            <div className="stat-card">
              <div className="stat-label">Articles Processed</div>
              <div className="stat-big" style={{ color: "var(--text)" }}>1,284</div>
              <div className="stat-foot">Today · ↑ +312 vs yesterday</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Overall Sentiment</div>
              <div className="stat-big" style={{ color: "var(--green)" }}>+0.64</div>
              <div className="stat-foot">Bullish bias · 7-day avg: +0.51</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Positive Rate</div>
              <div className="stat-big" style={{ color: "var(--accent2)" }}>68.4%</div>
              <div className="stat-foot">823 pos / 244 neg / 217 neu</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">NLP Confidence</div>
              <div className="stat-big" style={{ color: "var(--accent)" }}>91.2%</div>
              <div className="stat-foot">Avg model confidence score</div>
            </div>
          </div>

          {/* NLP PIPELINE */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">NLP Processing Pipeline</div>
              <div className="panel-sub">From raw news to sentiment signal</div>
            </div>
            <div className="pipeline">
              <div className="pipe-step">
                <div className="pipe-box" style={{ background: "rgba(90,114,153,0.1)", borderColor: "rgba(90,114,153,0.3)", color: "var(--muted)" }}>News<br />Ingestion</div>
                <div className="pipe-detail">RSS / API<br />Scraping</div>
              </div>
              <div className="pipe-arrow">→</div>
              <div className="pipe-step">
                <div className="pipe-box" style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)", color: "var(--accent)" }}>Text<br />Cleaning</div>
                <div className="pipe-detail">Stop words<br />Normalize</div>
              </div>
              <div className="pipe-arrow">→</div>
              <div className="pipe-step">
                <div className="pipe-box" style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)", color: "var(--accent)" }}>Tokenize<br />& Encode</div>
                <div className="pipe-detail">BERT<br />WordPiece</div>
              </div>
              <div className="pipe-arrow">→</div>
              <div className="pipe-step">
                <div className="pipe-box" style={{ background: "rgba(168,85,247,0.1)", borderColor: "rgba(168,85,247,0.35)", color: "var(--purple)" }}>FinBERT<br />Inference</div>
                <div className="pipe-detail">768-dim<br />embedding</div>
              </div>
              <div className="pipe-arrow">→</div>
              <div className="pipe-step">
                <div className="pipe-box" style={{ background: "rgba(167,139,250,0.08)", borderColor: "rgba(167,139,250,0.3)", color: "var(--accent2)" }}>Sentiment<br />Score</div>
                <div className="pipe-detail">POS / NEG<br />/ NEUTRAL</div>
              </div>
              <div className="pipe-arrow">→</div>
              <div className="pipe-step">
                <div className="pipe-box" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", color: "var(--warn)" }}>Entity<br />Linking</div>
                <div className="pipe-detail">Ticker<br />mapping</div>
              </div>
              <div className="pipe-arrow">→</div>
              <div className="pipe-step">
                <div className="pipe-box" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)", color: "var(--warn)" }}>Aggregate<br />Signal</div>
                <div className="pipe-detail">Time-decay<br />weighting</div>
              </div>
              <div className="pipe-arrow">→</div>
              <div className="pipe-step">
                <div className="pipe-box" style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)", color: "var(--green)" }}>LSTM<br />Fusion</div>
                <div className="pipe-detail">Feature<br />input</div>
              </div>
            </div>
          </div>

          {/* SENTIMENT TIMELINE + DISTRIBUTION */}
          <div className="three-col">
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">Sentiment Timeline</div>
                <div className="panel-sub">30-day rolling average</div>
              </div>
              <div className="panel-body">
                <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sentGradColor} stopOpacity="0.3" />
                      <stop offset="60%" stopColor={sentGradColor} stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="50" x2="600" y2="50" stroke={gridLine} strokeWidth="1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke={gridLine} strokeWidth="1" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke={gridLine} strokeWidth="1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke={zeroLine} strokeWidth="1" />
                  <text x="4" y="48" fontFamily="'Space Mono'" fontSize="9" fill="rgba(16,185,129,0.7)">+1.0</text>
                  <text x="4" y="98" fontFamily="'Space Mono'" fontSize="9" fill="rgba(90,114,153,0.7)">0</text>
                  <text x="4" y="198" fontFamily="'Space Mono'" fontSize="9" fill="rgba(239,68,68,0.7)">−1.0</text>
                  <path d="M0,95 C20,90 40,85 60,92 C80,99 100,94 120,86 C140,78 160,72 180,68 C200,64 220,70 240,66 C260,62 280,55 300,50 C320,45 340,56 360,60 C380,54 400,48 420,44 C440,40 460,46 480,42 C500,38 520,44 540,48 C560,44 580,40 600,36 L600,100 L0,100 Z" fill="url(#sentGrad)" />
                  <path d="M0,95 C20,90 40,85 60,92 C80,99 100,94 120,86 C140,78 160,72 180,68 C200,64 220,70 240,66 C260,62 280,55 300,50 C320,45 340,56 360,60 C380,54 400,48 420,44 C440,40 460,46 480,42 C500,38 520,44 540,48 C560,44 580,40 600,36" stroke={sentLineColor} strokeWidth="2" fill="none" />
                  <path d="M60,92 C70,100 75,110 80,108 C85,106 90,100 100,94" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.6" />
                  <path d="M220,70 C230,78 235,88 240,86 C245,84 250,74 260,66" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.6" />
                  <line x1="580" y1="0" x2="580" y2="180" stroke="rgba(245,158,11,0.25)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="580" cy="40" r="4" fill={sentLineColor} stroke="var(--bg)" strokeWidth="2" />
                  <text x="0" y="195" fontFamily="'Space Mono'" fontSize="9" fill="rgba(90,114,153,0.6)">Mar 15</text>
                  <text x="190" y="195" fontFamily="'Space Mono'" fontSize="9" fill="rgba(90,114,153,0.6)">Apr 1</text>
                  <text x="390" y="195" fontFamily="'Space Mono'" fontSize="9" fill="rgba(90,114,153,0.6)">Apr 10</text>
                  <text x="550" y="195" fontFamily="'Space Mono'" fontSize="9" fill="rgba(245,158,11,0.6)">Today</text>
                </svg>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Sentiment Distribution</div>
                </div>
                <div className="donut-row">
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="32" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="201" strokeDashoffset="64" transform="rotate(-90 45 45)" />
                    <circle cx="45" cy="45" r="32" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="201" strokeDashoffset="-137" transform="rotate(-90 45 45)" opacity="0.85" />
                    <circle cx="45" cy="45" r="32" fill="none" stroke="#5a7299" strokeWidth="12" strokeDasharray="201" strokeDashoffset="-186" transform="rotate(-90 45 45)" opacity="0.7" />
                    <text x="45" y="49" textAnchor="middle" fontFamily="'Space Mono'" fontSize="13" fontWeight="700" fill={donutText}>68%</text>
                  </svg>
                  <div className="donut-legend">
                    <div className="legend-row">
                      <div className="legend-dot" style={{ background: "var(--green)" }}></div>
                      <span className="legend-label">Positive</span>
                      <span className="legend-count" style={{ color: "var(--green)" }}>823</span>
                    </div>
                    <div className="legend-row">
                      <div className="legend-dot" style={{ background: "var(--danger)" }}></div>
                      <span className="legend-label">Negative</span>
                      <span className="legend-count" style={{ color: "var(--danger)" }}>244</span>
                    </div>
                    <div className="legend-row">
                      <div className="legend-dot" style={{ background: "var(--muted)" }}></div>
                      <span className="legend-label">Neutral</span>
                      <span className="legend-count" style={{ color: "var(--muted)" }}>217</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SOURCE SENTIMENT + ANALYZED ARTICLES */}
          <div className="two-col">
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">Sentiment by Source</div>
                <div className="panel-sub">Avg score (−1 to +1)</div>
              </div>
              <div className="panel-body">
                <div className="source-row">
                  <span className="source-name">Bloomberg</span>
                  <div className="source-bar-track"><div className="source-bar" style={{ width: "82%", background: "var(--green)" }}></div></div>
                  <span className="source-count" style={{ color: "var(--muted)" }}>312</span>
                  <span className="source-score" style={{ color: "var(--green)" }}>+0.72</span>
                </div>
                <div className="source-row">
                  <span className="source-name">Reuters</span>
                  <div className="source-bar-track"><div className="source-bar" style={{ width: "74%", background: "var(--accent2)" }}></div></div>
                  <span className="source-count" style={{ color: "var(--muted)" }}>287</span>
                  <span className="source-score" style={{ color: "var(--accent2)" }}>+0.65</span>
                </div>
                <div className="source-row">
                  <span className="source-name">CNBC</span>
                  <div className="source-bar-track"><div className="source-bar" style={{ width: "56%", background: "var(--accent)" }}></div></div>
                  <span className="source-count" style={{ color: "var(--muted)" }}>198</span>
                  <span className="source-score" style={{ color: "var(--accent)" }}>+0.48</span>
                </div>
                <div className="source-row">
                  <span className="source-name">WSJ</span>
                  <div className="source-bar-track"><div className="source-bar" style={{ width: "62%", background: "var(--green)" }}></div></div>
                  <span className="source-count" style={{ color: "var(--muted)" }}>175</span>
                  <span className="source-score" style={{ color: "var(--green)" }}>+0.54</span>
                </div>
                <div className="source-row">
                  <span className="source-name">FT</span>
                  <div className="source-bar-track"><div className="source-bar" style={{ width: "38%", background: "var(--warn)" }}></div></div>
                  <span className="source-count" style={{ color: "var(--muted)" }}>142</span>
                  <span className="source-score" style={{ color: "var(--warn)" }}>+0.32</span>
                </div>
                <div className="source-row">
                  <span className="source-name">Twitter/X</span>
                  <div className="source-bar-track"><div className="source-bar" style={{ width: "28%", background: "var(--danger)" }}></div></div>
                  <span className="source-count" style={{ color: "var(--muted)" }}>170</span>
                  <span className="source-score" style={{ color: "var(--danger)" }}>−0.18</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px 8px" }}>
                <div style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Top Keywords</div>
                <div className="kw-cloud">
                  <span className="kw-tag kw-pos">record earnings</span>
                  <span className="kw-tag kw-pos">AI integration</span>
                  <span className="kw-tag kw-pos">beat estimates</span>
                  <span className="kw-tag kw-neg">supply chain</span>
                  <span className="kw-tag kw-pos">strong demand</span>
                  <span className="kw-tag kw-neg">regulatory risk</span>
                  <span className="kw-tag kw-pos">analyst upgrade</span>
                  <span className="kw-tag kw-neu">market outlook</span>
                  <span className="kw-tag kw-neg">inflation concern</span>
                  <span className="kw-tag kw-pos">revenue growth</span>
                  <span className="kw-tag kw-neu">rate decision</span>
                  <span className="kw-tag kw-pos">M4 chip</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">NLP Token Analysis</div>
                <div className="panel-sub">Highlighted sentiment tokens</div>
              </div>
              <div>
                <div className="article-card">
                  <div className="art-header">
                    <span className="art-source">Bloomberg · 12 min ago</span>
                    <span className="art-score pos-score">+0.91 Positive</span>
                  </div>
                  <div className="art-headline">Apple reports record iPhone sales in Q2, beats analyst expectations by 8%</div>
                  <div className="art-tokens">
                    <span className="token tok-neu">Apple</span>
                    <span className="token tok-pos">reports</span>
                    <span className="token tok-pos">record</span>
                    <span className="token tok-neu">iPhone</span>
                    <span className="token tok-pos">sales</span>
                    <span className="token tok-pos">beats</span>
                    <span className="token tok-pos">analyst</span>
                    <span className="token tok-pos">expectations</span>
                    <span className="token tok-neu">+8%</span>
                  </div>
                </div>
                <div className="article-card">
                  <div className="art-header">
                    <span className="art-source">CNBC · 1h 12m ago</span>
                    <span className="art-score neg-score">−0.68 Negative</span>
                  </div>
                  <div className="art-headline">Supply chain concerns in Asia may limit Apple's production capacity this quarter</div>
                  <div className="art-tokens">
                    <span className="token tok-neg">Supply chain</span>
                    <span className="token tok-neg">concerns</span>
                    <span className="token tok-neu">Asia</span>
                    <span className="token tok-neg">limit</span>
                    <span className="token tok-neu">production</span>
                    <span className="token tok-neg">capacity</span>
                    <span className="token tok-neu">quarter</span>
                  </div>
                </div>
                <div className="article-card">
                  <div className="art-header">
                    <span className="art-source">MarketWatch · 4h ago</span>
                    <span className="art-score pos-score">+0.88 Positive</span>
                  </div>
                  <div className="art-headline">Analyst upgrades AAPL to Strong Buy citing robust AI integration roadmap</div>
                  <div className="art-tokens">
                    <span className="token tok-neu">Analyst</span>
                    <span className="token tok-pos">upgrades</span>
                    <span className="token tok-neu">AAPL</span>
                    <span className="token tok-pos">Strong Buy</span>
                    <span className="token tok-pos">robust</span>
                    <span className="token tok-pos">AI integration</span>
                    <span className="token tok-pos">roadmap</span>
                  </div>
                </div>
                <div className="article-card">
                  <div className="art-header">
                    <span className="art-source">FT · 5h 30m ago</span>
                    <span className="art-score neu-score">+0.12 Neutral</span>
                  </div>
                  <div className="art-headline">EU continues regulatory scrutiny of Apple App Store market practices</div>
                  <div className="art-tokens">
                    <span className="token tok-neu">EU</span>
                    <span className="token tok-neg">regulatory</span>
                    <span className="token tok-neg">scrutiny</span>
                    <span className="token tok-neu">App Store</span>
                    <span className="token tok-neu">market</span>
                    <span className="token tok-neg">practices</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}