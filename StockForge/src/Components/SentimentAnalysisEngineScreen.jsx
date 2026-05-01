import { useState, useRef, useEffect } from "react";
import Navbar from "./Navbar";

// ── Theme tokens ───────────────────────────────────────────────────────────────
const darkTheme = {
  "--bg":        "#0a0a0f", "--bg2":      "#0d0d18", "--surface":   "#111120",
  "--surface2":  "#1a1a28", "--border":   "#1a1a28", "--border2":   "#1e1e2e",
  "--text":      "#e2e2e2", "--text2":    "#aaa",    "--muted":     "#666",
  "--muted2":    "#555",    "--accent":   "#6d28d9", "--accent2":   "#4f46e5",
  "--warn":      "#d97706", "--danger":   "#ef4444", "--green":     "#22c55e",
  "--purple":    "#8b5cf6", "--mono":     "'JetBrains Mono','Fira Code','Courier New',monospace",
  "--sentGrad":  "#8b5cf6", "--sentLine": "#8b5cf6",
  "--gridLine":  "rgba(139,92,246,0.07)", "--zeroLine": "rgba(139,92,246,0.2)",
  "--donutText": "#e2e2e2", "--sourceBg": "rgba(255,255,255,0.04)",
};
const lightTheme = {
  "--bg":        "#f0f5fb", "--bg2":      "#ffffff", "--surface":   "#f7f9fc",
  "--surface2":  "#e8edf7", "--border":   "#dde4ef", "--border2":   "#c8d4e8",
  "--text":      "#0f172a", "--text2":    "#334155", "--muted":     "#64748b",
  "--muted2":    "#94a3b8", "--accent":   "#4f46e5", "--accent2":   "#6d28d9",
  "--warn":      "#b45309", "--danger":   "#dc2626", "--green":     "#16a34a",
  "--purple":    "#7c3aed", "--mono":     "'JetBrains Mono','Fira Code','Courier New',monospace",
  "--sentGrad":  "#4f46e5", "--sentLine": "#4f46e5",
  "--gridLine":  "rgba(79,70,229,0.07)", "--zeroLine": "rgba(79,70,229,0.18)",
  "--donutText": "#0f172a", "--sourceBg": "rgba(0,0,0,0.04)",
};

const API = "http://localhost:5001";

// ── Helpers ───────────────────────────────────────────────────────────────────
function sentimentColor(label) {
  const l = (label || "").toLowerCase();
  if (l === "positive") return "var(--green)";
  if (l === "negative") return "var(--danger)";
  return "var(--muted)";
}
function sentimentBg(label) {
  const l = (label || "").toLowerCase();
  if (l === "positive") return "rgba(34,197,94,0.12)";
  if (l === "negative") return "rgba(239,68,68,0.12)";
  return "rgba(102,102,102,0.1)";
}
function sentimentIcon(label) {
  const l = (label || "").toLowerCase();
  if (l === "positive") return "↑";
  if (l === "negative") return "↓";
  return "→";
}
function scoreClass(label) {
  const l = (label || "").toLowerCase();
  if (l === "positive") return "pos-score";
  if (l === "negative") return "neg-score";
  return "neu-score";
}
function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff/60)}m ago`;
  if (diff < 86400)return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
}

// ── Confidence bar ─────────────────────────────────────────────────────────────
function ConfBar({ label, score }) {
  const color = sentimentColor(label);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:10 }}>
      <span style={{ width:60, color:"var(--muted2)", textTransform:"capitalize" }}>{label}</span>
      <div style={{ flex:1, height:4, background:"var(--surface2)", borderRadius:2, overflow:"hidden" }}>
        <div style={{
          width:`${Math.round(score*100)}%`, height:"100%",
          background:color, borderRadius:2,
          transition:"width 0.7s cubic-bezier(.4,0,.2,1)"
        }}/>
      </div>
      <span style={{ color, fontWeight:700, width:40, textAlign:"right" }}>
        {(score*100).toFixed(1)}%
      </span>
    </div>
  );
}

// ── Live Analyzer ─────────────────────────────────────────────────────────────
function LiveAnalyzer() {
  const [text,     setText]     = useState("");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [fbSaved,  setFbSaved]  = useState(false);
  const [fbSaving, setFbSaving] = useState(false);

  const SAMPLES = [
    "Apple reports record iPhone sales in Q2, beats analyst expectations by 8%",
    "Supply chain concerns in Asia may limit production capacity this quarter",
    "Fed signals potential rate cuts could boost tech sector valuations significantly",
    "Regulatory scrutiny continues to mount for major tech firms in EU markets",
    "NVIDIA announces next-gen Blackwell GPU with unprecedented AI training performance",
  ];

  async function analyze() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true); setError(null); setResult(null); setFeedback(null); setFbSaved(false);
    try {
      const res  = await fetch(`${API}/api/sentiment/analyze`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||`HTTP ${res.status}`); }
      const data = await res.json();
      const r = { ...data, text: trimmed, timestamp: new Date() };
      setResult(r);
      setHistory(prev => [r, ...prev].slice(0, 10));
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  }

  async function saveFeedback(correct) {
    if (!result || fbSaving) return;
    setFeedback(correct ? "correct" : "incorrect");
    setFbSaving(true);
    try {
      await fetch(`${API}/api/feedback/sentiment`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          text: result.text, predicted_label: result.label,
          predicted_score: result.score, all_scores: result.all,
          user_feedback: correct ? "correct" : "incorrect",
          submitted_at:  new Date().toISOString(),
          source: "dashboard_manual", ticker_context: "AAPL", version: "finbert-v1",
        }),
      });
    } catch(_) {}
    setFbSaved(true); setFbSaving(false);
  }

  const color = result ? sentimentColor(result.label) : "var(--muted)";
  const bg    = result ? sentimentBg(result.label)    : "transparent";
  const icon  = result ? sentimentIcon(result.label)  : "●";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Input */}
      <div style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:8, overflow:"hidden" }}>
        <div style={{ padding:"10px 14px 0", display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Enter headline or financial text
          </span>
          <span style={{ fontSize:9, color:"var(--muted2)" }}>{text.length} / 512</span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0,512))}
          onKeyDown={e => { if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)) analyze(); }}
          placeholder="e.g. Apple beats Q2 earnings estimates with record iPhone revenue…"
          rows={3}
          style={{ width:"100%", background:"transparent", border:"none", outline:"none",
            padding:"8px 14px 12px", color:"var(--text)", fontFamily:"var(--mono)",
            fontSize:11, resize:"none", lineHeight:1.6 }}
        />
        <div style={{ borderTop:"1px solid var(--border)", padding:"8px 14px",
          display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:9, color:"var(--muted2)" }}>Try:</span>
          {SAMPLES.map((h,i) => (
            <button key={i} onClick={() => setText(h)} style={{
              fontFamily:"var(--mono)", fontSize:9, padding:"2px 8px", borderRadius:12,
              border:"1px solid var(--border2)", background:"transparent", color:"var(--muted)",
              cursor:"pointer", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
            }}>{h.slice(0,38)}{h.length>38?"…":""}</button>
          ))}
        </div>
        <div style={{ borderTop:"1px solid var(--border)", padding:"10px 14px", display:"flex", gap:8 }}>
          <button onClick={analyze} disabled={loading||!text.trim()} style={{
            fontFamily:"var(--mono)", fontSize:11, fontWeight:700, padding:"7px 20px",
            borderRadius:6, border:"none",
            background: loading||!text.trim() ? "var(--surface2)" : "var(--accent)",
            color:      loading||!text.trim() ? "var(--muted)" : "#fff",
            cursor:     loading||!text.trim() ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", gap:6,
          }}>
            {loading ? <><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span>Analyzing…</> : "▶ Run FinBERT"}
          </button>
          <button onClick={() => { setText(""); setResult(null); setError(null); setFeedback(null); setFbSaved(false); }}
            style={{ fontFamily:"var(--mono)", fontSize:10, padding:"7px 14px", borderRadius:6,
              border:"1px solid var(--border2)", background:"transparent", color:"var(--muted)", cursor:"pointer" }}>
            Clear
          </button>
          <span style={{ fontSize:9, color:"var(--muted2)", alignSelf:"center" }}>Ctrl+Enter to submit</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
          borderRadius:6, padding:"8px 12px", color:"var(--danger)", fontSize:10,
          display:"flex", gap:8, alignItems:"center" }}>
          <span>⚠</span><span>{error}</span>
          <span style={{ color:"var(--muted2)", marginLeft:"auto" }}>Is the backend running at localhost:5000?</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ background:"var(--surface)",
          border:`1px solid ${result.label==="positive"?"rgba(34,197,94,0.3)":result.label==="negative"?"rgba(239,68,68,0.3)":"var(--border2)"}`,
          borderRadius:8, overflow:"hidden", animation:"fadeUp 0.3s ease" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)",
            display:"flex", alignItems:"center", gap:12, background:bg }}>
            <div style={{ width:40, height:40, borderRadius:8,
              background:`${color}22`, border:`1px solid ${color}55`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, color, fontWeight:700 }}>{icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ color, fontSize:16, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em" }}>
                {result.label}
              </div>
              <div style={{ color:"var(--muted2)", fontSize:9, marginTop:2 }}>
                FinBERT · {result.timestamp?.toLocaleTimeString()}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color, fontSize:28, fontWeight:700, lineHeight:1 }}>
                {(result.score*100).toFixed(1)}%
              </div>
              <div style={{ color:"var(--muted2)", fontSize:9 }}>confidence</div>
            </div>
          </div>
          <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border)" }}>
            <div style={{ fontSize:9, color:"var(--muted2)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.07em" }}>Analyzed text</div>
            <div style={{ fontSize:11, color:"var(--text2)", lineHeight:1.6 }}>"{result.text}"</div>
          </div>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:7 }}>
            <div style={{ fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>Score breakdown</div>
            {(result.all||[]).map(item => <ConfBar key={item.label} label={item.label} score={item.score}/>)}
          </div>
          <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Was this correct?</span>
            {!fbSaved ? (
              <>
                <button onClick={() => saveFeedback(true)} disabled={fbSaving||!!feedback} style={{
                  fontFamily:"var(--mono)", fontSize:10, fontWeight:600, padding:"3px 12px",
                  borderRadius:5, cursor: fbSaving||feedback?"not-allowed":"pointer",
                  border:     feedback==="correct"?"1px solid var(--green)":"1px solid var(--border2)",
                  background: feedback==="correct"?"rgba(34,197,94,0.15)":"transparent",
                  color:      feedback==="correct"?"var(--green)":"var(--muted)",
                }}>✓ Yes</button>
                <button onClick={() => saveFeedback(false)} disabled={fbSaving||!!feedback} style={{
                  fontFamily:"var(--mono)", fontSize:10, fontWeight:600, padding:"3px 12px",
                  borderRadius:5, cursor: fbSaving||feedback?"not-allowed":"pointer",
                  border:     feedback==="incorrect"?"1px solid var(--danger)":"1px solid var(--border2)",
                  background: feedback==="incorrect"?"rgba(239,68,68,0.12)":"transparent",
                  color:      feedback==="incorrect"?"var(--danger)":"var(--muted)",
                }}>✗ No</button>
                {fbSaving && <span style={{ fontSize:9, color:"var(--muted2)" }}>Saving…</span>}
              </>
            ) : (
              <span style={{ fontSize:10, color:"var(--green)", fontWeight:600 }}>✓ Feedback saved to DB</span>
            )}
            <span style={{ marginLeft:"auto", fontSize:9, color:"var(--muted2)" }}>
              Stored in <code style={{ color:"var(--purple)" }}>sentiment_feedback</code>
            </span>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
          <div style={{ padding:"8px 14px", borderBottom:"1px solid var(--border)",
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>
              Session History ({history.length})
            </span>
            <button onClick={() => setHistory([])} style={{
              fontFamily:"var(--mono)", fontSize:9, padding:"2px 8px", borderRadius:4,
              border:"1px solid var(--border2)", background:"transparent", color:"var(--muted)", cursor:"pointer"
            }}>Clear</button>
          </div>
          {history.map((h,i) => (
            <div key={i} onClick={() => setText(h.text)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"7px 14px",
              borderBottom: i<history.length-1?"1px solid var(--border)":"none", cursor:"pointer"
            }}>
              <span style={{ fontSize:10, fontWeight:700, color:sentimentColor(h.label),
                background:sentimentBg(h.label), padding:"2px 7px", borderRadius:3,
                minWidth:60, textAlign:"center", textTransform:"capitalize" }}>
                {sentimentIcon(h.label)} {h.label}
              </span>
              <span style={{ flex:1, fontSize:10, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.text}</span>
              <span style={{ fontSize:9, color:"var(--muted2)", flexShrink:0 }}>{(h.score*100).toFixed(0)}%</span>
              <span style={{ fontSize:9, color:"var(--muted2)", flexShrink:0 }}>{h.timestamp?.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Batch Analyzer ────────────────────────────────────────────────────────────
function BatchAnalyzer() {
  const [texts,   setTexts]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function runBatch() {
    const lines = texts.split("\n").map(l=>l.trim()).filter(Boolean).slice(0,20);
    if (!lines.length) return;
    setLoading(true); setError(null); setResults([]);
    try {
      const res  = await fetch(`${API}/api/sentiment/batch`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ texts: lines }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = (data.results||[]).map((arr,i) => {
        const best = arr.reduce((a,b) => a.score>b.score?a:b, arr[0]);
        return { text:lines[i], label:best.label.toLowerCase(), score:best.score, all:arr };
      });
      setResults(parsed);
    } catch(e) { setError(e.message); }
    finally    { setLoading(false); }
  }

  const pos = results.filter(r=>r.label==="positive").length;
  const neg = results.filter(r=>r.label==="negative").length;
  const neu = results.filter(r=>r.label==="neutral").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <textarea value={texts} onChange={e=>setTexts(e.target.value)}
        placeholder={"Paste up to 20 headlines, one per line:\n\nApple beats Q2 estimates by 8%\nSupply chain risk looms…"}
        rows={6} style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border2)",
          borderRadius:7, outline:"none", padding:"10px 14px", color:"var(--text)",
          fontFamily:"var(--mono)", fontSize:10, resize:"vertical", lineHeight:1.7 }}/>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button onClick={runBatch} disabled={loading||!texts.trim()} style={{
          fontFamily:"var(--mono)", fontSize:11, fontWeight:700, padding:"6px 18px",
          borderRadius:6, border:"none",
          background: loading||!texts.trim()?"var(--surface2)":"var(--accent)",
          color:      loading||!texts.trim()?"var(--muted)":"#fff",
          cursor:     loading||!texts.trim()?"not-allowed":"pointer",
        }}>{loading?"⟳ Running batch…":"▶ Batch Analyze"}</button>
        <span style={{ fontSize:9, color:"var(--muted2)" }}>
          {texts.split("\n").filter(l=>l.trim()).length} headlines · max 20
        </span>
      </div>
      {error && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
        borderRadius:6, padding:"7px 12px", color:"var(--danger)", fontSize:10 }}>⚠ {error}</div>}
      {results.length>0 && (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
          <div style={{ padding:"8px 14px", borderBottom:"1px solid var(--border)", display:"flex", gap:16, alignItems:"center" }}>
            <span style={{ fontSize:9, color:"var(--muted2)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Results:</span>
            {[["Positive",pos,"var(--green)"],["Negative",neg,"var(--danger)"],["Neutral",neu,"var(--muted)"]].map(([l,c,col])=>(
              <span key={l} style={{ fontSize:10, color:col, fontWeight:700 }}>{c} {l}</span>
            ))}
          </div>
          {results.map((r,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 14px",
              borderBottom: i<results.length-1?"1px solid var(--border)":"none" }}>
              <span style={{ fontSize:10, fontWeight:700, color:sentimentColor(r.label), minWidth:65, textTransform:"capitalize" }}>
                {sentimentIcon(r.label)} {r.label}
              </span>
              <span style={{ flex:1, fontSize:10, color:"var(--text2)" }}>{r.text}</span>
              <span style={{ fontSize:9, color:"var(--muted2)" }}>{(r.score*100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sentiment Timeline SVG (live data) ────────────────────────────────────────
function TimelineChart({ timeline }) {
  if (!timeline || timeline.length === 0) return (
    <div style={{ height:190, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:11 }}>
      No timeline data
    </div>
  );

  const W = 600, H = 170, PAD = { l:36, r:10, t:10, b:20 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  // scores range from -1 to +1, map to y
  const toY = v => PAD.t + chartH * (1 - (v + 1) / 2);
  const toX = i => PAD.l + (i / (timeline.length - 1)) * chartW;

  const pts = timeline.map((d, i) => [toX(i), toY(d.score)]);
  const line = pts.map((p, i) => `${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = line + ` L${pts[pts.length-1][0]},${toY(-1)} L${PAD.l},${toY(-1)} Z`;

  // show ~5 labels evenly
  const labelIdxs = [0, Math.floor(timeline.length*0.25), Math.floor(timeline.length*0.5),
                     Math.floor(timeline.length*0.75), timeline.length-1];

  return (
    <svg width="100%" height={H+PAD.b} viewBox={`0 0 ${W} ${H+PAD.b}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="var(--sentGrad)" stopOpacity="0.32"/>
          <stop offset="70%" stopColor="var(--sentGrad)" stopOpacity="0.03"/>
        </linearGradient>
      </defs>
      {/* grid lines */}
      {[1, 0, -1].map(v => (
        <line key={v} x1={PAD.l} x2={W-PAD.r} y1={toY(v)} y2={toY(v)}
          stroke={v===0?"var(--zeroLine)":"var(--gridLine)"} strokeWidth="1"/>
      ))}
      {/* y labels */}
      {[[1,"+1.0"],[0,"0"],[-1,"−1.0"]].map(([v,lbl])=>(
        <text key={v} x={PAD.l-4} y={toY(v)+4} textAnchor="end"
          fontFamily="monospace" fontSize="9" fill="var(--muted)">{lbl}</text>
      ))}
      {/* area fill */}
      <path d={area} fill="url(#tlGrad)"/>
      {/* line */}
      <path d={line} stroke="var(--sentLine)" strokeWidth="2" fill="none" strokeLinejoin="round"/>
      {/* today dot */}
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="4"
        fill="var(--sentLine)" stroke="var(--bg)" strokeWidth="2"/>
      {/* x labels */}
      {labelIdxs.map(i => (
        <text key={i} x={toX(i)} y={H+PAD.b-2} textAnchor="middle"
          fontFamily="monospace" fontSize="9" fill="var(--muted)">
          {timeline[i]?.label || ""}
        </text>
      ))}
    </svg>
  );
}

// ── Donut chart (live data) ───────────────────────────────────────────────────
function DonutChart({ stats }) {
  const total = (stats?.positive_count||0) + (stats?.negative_count||0) + (stats?.neutral_count||0);
  if (!total) return null;
  const posR = (stats.positive_count / total) * 188;
  const negR = (stats.negative_count / total) * 188;
  const neuR = (stats.neutral_count  / total) * 188;
  const posPct = Math.round(stats.positive_count / total * 100);

  return (
    <div className="sent-donut-row">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="30" fill="none" stroke="var(--green)"
          strokeWidth="12" strokeDasharray="188"
          strokeDashoffset={188 - posR} transform="rotate(-90 44 44)"/>
        <circle cx="44" cy="44" r="30" fill="none" stroke="var(--danger)"
          strokeWidth="12" strokeDasharray="188"
          strokeDashoffset={-(posR)} transform="rotate(-90 44 44)" opacity="0.85"/>
        <circle cx="44" cy="44" r="30" fill="none" stroke="var(--muted)"
          strokeWidth="12" strokeDasharray="188"
          strokeDashoffset={-(posR + negR)} transform="rotate(-90 44 44)" opacity="0.65"/>
        <text x="44" y="48" textAnchor="middle" fontFamily="monospace"
          fontSize="13" fontWeight="700" fill="var(--donutText)">{posPct}%</text>
      </svg>
      <div className="sent-donut-legend">
        {[
          { label:"Positive", count: stats.positive_count, color:"var(--green)"  },
          { label:"Negative", count: stats.negative_count, color:"var(--danger)" },
          { label:"Neutral",  count: stats.neutral_count,  color:"var(--muted)"  },
        ].map(row => (
          <div key={row.label} className="sent-legend-row">
            <div className="sent-legend-dot" style={{ background:row.color }}/>
            <span className="sent-legend-label">{row.label}</span>
            <span className="sent-legend-count" style={{ color:row.color }}>{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SentimentAnalysisEngine() {
  const [isDark,       setIsDark]       = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Tickers");
  const [activeTab,    setActiveTab]    = useState("live");

  // Live DB state
  const [dashData,  setDashData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const t = isDark ? darkTheme : lightTheme;

  // ── Fetch dashboard data from MongoDB via API ──────────────────────────────
  useEffect(() => {
    async function fetchDash() {
      setLoading(true); setError(null);
      try {
        const ticker = activeFilter === "All Tickers" ? "All Tickers" : activeFilter;
        const res  = await fetch(`${API}/api/sentiment/dashboard?ticker=${encodeURIComponent(ticker)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setDashData(data);
      } catch(e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDash();
  }, [activeFilter]);

  const stats    = dashData?.stats    || {};
  const timeline = dashData?.timeline || [];
  const sources  = dashData?.sources  || [];
  const keywords = dashData?.keywords || [];
  const articles = dashData?.articles || [];

  // ── Source bar max for scaling ─────────────────────────────────────────────
  const maxSourceCount = sources.length ? Math.max(...sources.map(s => s.count)) : 1;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    @keyframes spin    { to { transform:rotate(360deg); } }
    @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .sent-root { font-family:var(--mono); background:var(--bg); color:var(--text); min-height:100vh; font-size:12px; transition:background 0.25s, color 0.25s; }
    .sent-page-header { padding:16px 20px; display:flex; align-items:flex-end; justify-content:space-between; border-bottom:1px solid var(--border); }
    .sent-page-title  { font-size:18px; font-weight:700; color:var(--text); letter-spacing:-0.01em; }
    .sent-page-sub    { font-size:10px; color:var(--muted); margin-top:4px; text-transform:uppercase; letter-spacing:0.06em; }
    .sent-filter-row  { display:flex; gap:6px; }
    .sent-filter-btn  { font-family:var(--mono); font-size:10px; font-weight:600; padding:4px 12px; border-radius:5px; cursor:pointer; border:1px solid var(--border2); color:var(--muted); background:transparent; transition:all .15s; }
    .sent-filter-btn.active { color:var(--purple); border-color:rgba(139,92,246,0.4); }
    .sent-content     { padding:18px 20px; display:flex; flex-direction:column; gap:16px; }
    .sent-stats       { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    .sent-stat        { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px 16px; }
    .sent-stat-label  { font-size:9px; color:var(--muted2); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:6px; }
    .sent-stat-val    { font-size:28px; font-weight:700; line-height:1; }
    .sent-stat-foot   { font-size:10px; color:var(--muted); margin-top:5px; }
    .sent-panel       { background:var(--surface); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
    .sent-panel-head  { padding:10px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
    .sent-panel-title { font-size:12px; font-weight:700; color:var(--text); }
    .sent-panel-sub   { font-size:9px; color:var(--muted2); text-transform:uppercase; letter-spacing:0.07em; }
    .sent-panel-body  { padding:16px; }
    .sent-pipeline    { display:flex; align-items:center; gap:0; padding:16px; overflow-x:auto; }
    .pipe-step        { display:flex; flex-direction:column; align-items:center; gap:6px; min-width:90px; }
    .pipe-box         { width:84px; padding:10px 6px; text-align:center; border-radius:7px; border:1px solid; font-size:10px; font-weight:700; line-height:1.3; }
    .pipe-detail      { font-size:9px; color:var(--muted); text-align:center; line-height:1.4; }
    .pipe-arrow       { font-size:16px; color:var(--muted2); margin:0 2px; margin-bottom:18px; }
    .sent-two-col     { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .sent-three-col   { display:grid; grid-template-columns:2fr 1fr; gap:14px; }
    .sent-donut-row   { display:flex; align-items:center; gap:16px; padding:14px; }
    .sent-donut-legend{ flex:1; display:flex; flex-direction:column; gap:8px; }
    .sent-legend-row  { display:flex; align-items:center; gap:8px; font-size:11px; }
    .sent-legend-dot  { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .sent-legend-label{ flex:1; color:var(--muted); }
    .sent-legend-count{ font-weight:700; }
    .sent-source-row  { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid var(--border); font-size:11px; }
    .sent-source-row:last-child { border-bottom:none; }
    .sent-source-name { width:90px; font-weight:600; color:var(--text2); }
    .sent-source-track{ flex:1; height:5px; background:var(--sourceBg); border-radius:3px; overflow:hidden; }
    .sent-source-bar  { height:100%; border-radius:3px; }
    .sent-source-count{ color:var(--muted); width:36px; text-align:right; font-size:10px; }
    .sent-source-score{ width:46px; text-align:right; font-weight:700; font-size:10px; }
    .kw-cloud         { display:flex; flex-wrap:wrap; gap:6px; padding:12px 16px; }
    .kw-tag           { padding:4px 10px; border-radius:20px; font-size:10px; font-weight:600; cursor:pointer; transition:all .15s; border:1px solid; }
    .kw-tag:hover     { transform:translateY(-1px); }
    .kw-pos { background:rgba(34,197,94,0.1);   border-color:rgba(34,197,94,0.3);   color:var(--green);  }
    .kw-neg { background:rgba(239,68,68,0.1);   border-color:rgba(239,68,68,0.3);   color:var(--danger); }
    .kw-neu { background:rgba(102,102,102,0.1); border-color:rgba(102,102,102,0.2); color:var(--muted);  }
    .art-card    { padding:13px 16px; border-bottom:1px solid var(--border); }
    .art-card:last-child { border-bottom:none; }
    .art-header  { display:flex; justify-content:space-between; margin-bottom:6px; }
    .art-source  { font-size:10px; color:var(--muted); }
    .art-score   { font-size:10px; font-weight:700; padding:2px 7px; border-radius:3px; }
    .pos-score   { background:rgba(34,197,94,0.12);   color:var(--green);  }
    .neg-score   { background:rgba(239,68,68,0.12);   color:var(--danger); }
    .neu-score   { background:rgba(102,102,102,0.1);  color:var(--muted);  }
    .art-headline{ font-size:11px; font-weight:600; margin-bottom:7px; line-height:1.5; color:var(--text2); }
    .art-tokens  { display:flex; flex-wrap:wrap; gap:3px; }
    .token       { font-size:9px; padding:2px 5px; border-radius:3px; }
    .tok-pos     { background:rgba(34,197,94,0.13);  color:var(--green);  }
    .tok-neg     { background:rgba(239,68,68,0.1);   color:var(--danger); }
    .tok-neu     { background:rgba(102,102,102,0.08);color:var(--muted);  }
    .tab-btn     { font-family:var(--mono); font-size:10px; font-weight:600; padding:5px 14px; border-radius:5px; cursor:pointer; border:1px solid var(--border2); transition:all .15s; }
    .tab-btn.active          { background:var(--accent); color:#fff; border-color:var(--accent); }
    .tab-btn:not(.active)    { background:transparent; color:var(--muted); }
    .skeleton { background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:4px; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="sent-root" style={t}>

        <Navbar isDark={isDark} onToggle={() => setIsDark(v=>!v)} activeLabel="Sentiment"/>

        {/* Header */}
        <div className="sent-page-header">
          <div>
            <div className="sent-page-title">Sentiment Analysis Engine</div>
            <div className="sent-page-sub">FinBERT NLP · news processing · MongoDB data</div>
          </div>
          <div className="sent-filter-row">
            {["All Tickers","AAPL","NVDA","TSLA","Market"].map(f => (
              <button key={f} className={`sent-filter-btn${activeFilter===f?" active":""}`}
                onClick={() => setActiveFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="sent-content">

          {/* API error banner */}
          {error && (
            <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
              borderRadius:8, padding:"12px 16px", color:"var(--danger)", fontSize:11,
              display:"flex", gap:10, alignItems:"center" }}>
              <span>⚠</span>
              <span>Could not load dashboard data: {error}</span>
              <span style={{ marginLeft:"auto", color:"var(--muted2)" }}>
                Run <code>sentiment_seeder.py</code> first, then ensure the backend is running.
              </span>
            </div>
          )}

          {/* ── STAT CARDS ── */}
          <div className="sent-stats">
            {loading ? (
              Array(4).fill(0).map((_,i) => (
                <div key={i} className="sent-stat">
                  <div className="skeleton" style={{ height:10, width:"60%", marginBottom:10 }}/>
                  <div className="skeleton" style={{ height:28, width:"50%", marginBottom:8 }}/>
                  <div className="skeleton" style={{ height:9,  width:"80%" }}/>
                </div>
              ))
            ) : [
              {
                label: "Articles Processed",
                val:   stats.articles_processed?.toLocaleString() || "—",
                foot:  `Seeded · ${stats.generated_at ? new Date(stats.generated_at).toLocaleDateString() : ""}`,
                color: "var(--text)",
              },
              {
                label: "Overall Sentiment",
                val:   stats.overall_sentiment_str || "—",
                foot:  `${stats.sentiment_bias||""} bias`,
                color: stats.overall_sentiment >= 0 ? "var(--green)" : "var(--danger)",
              },
              {
                label: "Positive Rate",
                val:   stats.positive_rate != null ? `${stats.positive_rate}%` : "—",
                foot:  `${stats.positive_count||0} pos / ${stats.negative_count||0} neg / ${stats.neutral_count||0} neu`,
                color: "var(--purple)",
              },
              {
                label: "NLP Confidence",
                val:   stats.nlp_confidence != null ? `${stats.nlp_confidence}%` : "—",
                foot:  "Avg FinBERT model confidence",
                color: "var(--accent)",
              },
            ].map(s => (
              <div className="sent-stat" key={s.label}>
                <div className="sent-stat-label">{s.label}</div>
                <div className="sent-stat-val" style={{ color:s.color }}>{s.val}</div>
                <div className="sent-stat-foot">{s.foot}</div>
              </div>
            ))}
          </div>

          {/* ── LIVE FINBERT ANALYZER ── */}
        

          {/* ── NLP PIPELINE ── */}
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
                const cm = {
                  muted:   { fg:"var(--muted)",   bg:"rgba(102,102,102,0.08)", border:"rgba(102,102,102,0.22)" },
                  accent:  { fg:"var(--accent)",  bg:"rgba(109,40,217,0.08)",  border:"rgba(109,40,217,0.3)"  },
                  accent2: { fg:"var(--purple)",  bg:"rgba(139,92,246,0.08)",  border:"rgba(139,92,246,0.3)"  },
                  purple:  { fg:"var(--purple)",  bg:"rgba(139,92,246,0.1)",   border:"rgba(139,92,246,0.35)" },
                  warn:    { fg:"var(--warn)",    bg:"rgba(217,119,6,0.08)",   border:"rgba(217,119,6,0.3)"   },
                  green:   { fg:"var(--green)",   bg:"rgba(34,197,94,0.08)",   border:"rgba(34,197,94,0.3)"   },
                };
                const c = cm[step.col];
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center" }}>
                    <div className="pipe-step">
                      <div className="pipe-box" style={{ background:c.bg, borderColor:c.border, color:c.fg }}>
                        {step.label.split("\n").map((l,j) => <div key={j}>{l}</div>)}
                      </div>
                      <div className="pipe-detail">{step.detail}</div>
                    </div>
                    {i < arr.length-1 && <div className="pipe-arrow">→</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── TIMELINE + DISTRIBUTION ── */}
          <div className="sent-three-col">
            <div className="sent-panel">
              <div className="sent-panel-head">
                <div className="sent-panel-title">Sentiment Timeline</div>
                <div className="sent-panel-sub">30-day rolling average</div>
              </div>
              <div className="sent-panel-body">
                {loading
                  ? <div className="skeleton" style={{ height:190 }}/>
                  : <TimelineChart timeline={timeline}/>
                }
              </div>
            </div>
            <div className="sent-panel">
              <div className="sent-panel-head">
                <div className="sent-panel-title">Sentiment Distribution</div>
              </div>
              {loading
                ? <div className="skeleton" style={{ height:120, margin:16 }}/>
                : <DonutChart stats={stats}/>
              }
            </div>
          </div>

          {/* ── SOURCE SENTIMENT + NLP TOKEN ANALYSIS ── */}
          <div className="sent-two-col">

            {/* Sources */}
            <div className="sent-panel">
              <div className="sent-panel-head">
                <div className="sent-panel-title">Sentiment by Source</div>
                <div className="sent-panel-sub">Avg score (−1 to +1)</div>
              </div>
              <div className="sent-panel-body">
                {loading ? (
                  Array(5).fill(0).map((_,i) => (
                    <div key={i} className="skeleton" style={{ height:16, marginBottom:10 }}/>
                  ))
                ) : sources.length === 0 ? (
                  <div style={{ color:"var(--muted)", fontSize:11 }}>No source data — run sentiment_seeder.py</div>
                ) : (
                  sources.map(s => {
                    const isPos = s.avg_score >= 0;
                    const barColor = s.avg_score > 0.3 ? "var(--green)"
                                   : s.avg_score < 0   ? "var(--danger)"
                                   : "var(--warn)";
                    const barPct = Math.round((s.count / maxSourceCount) * 100);
                    return (
                      <div className="sent-source-row" key={s.source}>
                        <span className="sent-source-name">{s.source}</span>
                        <div className="sent-source-track">
                          <div className="sent-source-bar" style={{ width:`${barPct}%`, background:barColor }}/>
                        </div>
                        <span className="sent-source-count">{s.count}</span>
                        <span className="sent-source-score" style={{ color:barColor }}>
                          {s.score_str}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Keywords */}
              <div style={{ borderTop:"1px solid var(--border)" }}>
                <div style={{ fontSize:9, color:"var(--muted2)", textTransform:"uppercase",
                  letterSpacing:"0.08em", padding:"10px 16px 6px" }}>Top Keywords</div>
                {loading ? (
                  <div className="skeleton" style={{ height:40, margin:"0 16px 12px" }}/>
                ) : (
                  <div className="kw-cloud">
                    {keywords.map(k => (
                      <span key={k.keyword}
                        className={`kw-tag ${k.sentiment==="pos"?"kw-pos":k.sentiment==="neg"?"kw-neg":"kw-neu"}`}>
                        {k.keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* NLP Token Analysis */}
            <div className="sent-panel">
              <div className="sent-panel-head">
                <div className="sent-panel-title">NLP Token Analysis</div>
                <div className="sent-panel-sub">Highlighted sentiment tokens · {activeFilter}</div>
              </div>
              {loading ? (
                Array(3).fill(0).map((_,i) => (
                  <div key={i} style={{ padding:"13px 16px", borderBottom:"1px solid var(--border)" }}>
                    <div className="skeleton" style={{ height:10, width:"40%", marginBottom:8 }}/>
                    <div className="skeleton" style={{ height:12, marginBottom:8 }}/>
                    <div style={{ display:"flex", gap:4 }}>
                      {Array(6).fill(0).map((_,j) => (
                        <div key={j} className="skeleton" style={{ height:16, width:50 }}/>
                      ))}
                    </div>
                  </div>
                ))
              ) : articles.length === 0 ? (
                <div style={{ padding:"24px 16px", color:"var(--muted)", fontSize:11 }}>
                  No articles found. Run <code>sentiment_seeder.py</code> first.
                </div>
              ) : (
                articles.map((art, i) => (
                  <div className="art-card" key={i}>
                    <div className="art-header">
                      <span className="art-source">
                        {art.source} · {timeAgo(art.published_at)}
                      </span>
                      <span className={`art-score ${scoreClass(art.label)}`}>
                        {art.score_display || `${art.label} ${(art.score*100).toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="art-headline">{art.headline}</div>
                    <div className="art-tokens">
                      {(art.tokens||[]).map((tk, j) => (
                        <span key={j} className={`token tok-${tk.s}`}>{tk.w}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}