import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import Navbar from "./Navbar";

/* ══════════════════════════════════════════
   STYLES  (unchanged from original)
══════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

[data-theme="dark"] {
  --bg:            #090615;
  --app-grad:      radial-gradient(90% 55% at 20% -10%, rgba(126,93,255,0.20) 0%, rgba(126,93,255,0) 55%), radial-gradient(70% 45% at 100% -10%, rgba(255,176,77,0.08) 0%, rgba(255,176,77,0) 52%), linear-gradient(180deg,#070412 0%,#090615 100%);
  --panel:         #0f0a1f;
  --panel-hi:      linear-gradient(145deg,#0b1922 0%,#0d0f1f 100%);
  --panel-hi-bdr:  #20435f;
  --line-panel:    #2a1f46;
  --text:          #ece7ff;
  --text-sub:      #7f769e;
  --text-muted:    #5c547a;
  --text-dim:      #6f6691;
  --nav-active-bg: rgba(126,93,255,0.18);
  --nav-active-bdr:rgba(126,93,255,0.25);
  --nav-active-txt:#f3eeff;
  --tab-active-bg: rgba(126,93,255,0.16);
  --tab-active-bdr:#3a2a67;
  --tab-active-txt:#e8e2ff;
  --tab-bdr:       #2a1f46;
  --epoch-bg:      rgba(255,176,77,0.12);
  --epoch-bdr:     rgba(255,176,77,0.28);
  --epoch-txt:     #ffb04d;
  --stats-bg:      #0f0a1f;
  --stats-bdr:     #2a1f46;
  --stats-val:     #cdbdff;
  --stats-sub:     #7b739a;
  --val-green:     #4be6b3;
  --val-yellow:    #ffb04d;
  --sub-green:     #4be6b3;
  --sub-blue:      #9b86ff;
  --chart-grid:    rgba(43,31,74,0.6);
  --chart-axis:    #2b1f4a;
  --chart-tick:    #5a5278;
  --chart-foot:    #a18dcc;
  --tooltip-bg:    #1a1035;
  --tooltip-bdr:   #3a2a67;
  --train-color:   #8b6bff;
  --val-color:     #ffad49;
  --arch-bg:       #161031;
  --arch-bdr:      #3a2b63;
  --arch-txt:      #8b7cb8;
  --arch-input-bg: #171233; --arch-input-txt:#ddd6ff;
  --arch-drop-bg:  #231329; --arch-drop-bdr:#5a2f53; --arch-drop-txt:#f07b6f;
  --arch-fus-bg:   #261a1f; --arch-fus-bdr:#4f3a2f;  --arch-fus-txt:#ffb04d;
  --arch-out-bg:   #0f1f2d; --arch-out-bdr:#1d5168;  --arch-out-txt:#4be6b3;
  --arch-tag-bg:   #1b1537; --arch-tag-bdr:#3d2e66;  --arch-tag-txt:#8a7abb;
  --arch-conn:     #6f6691;
  --fi-bg:         #19142f;
  --fi-bar1:       #a78bfa; --fi-bar2:#f9c97b;
  --cm-bg:         #120c24; --cm-hdr-bg:#171033; --cm-corner:#100b20;
  --cm-bdr:        #211739; --cm-tbl-bdr:#22193b; --cm-txt:#7c739d;
  --cm-green-bg:   rgba(60,226,167,0.16); --cm-red-bg:rgba(255,106,106,0.15);
  --cm-green-txt:  #4be6b3; --cm-red-txt:#ff8f8f;
  --cm-metric-bg:  #16102f; --cm-metric-green:#4be6b3; --cm-metric-purple:#9b86ff;
  --eh-bdr:        #1f1636; --eh-txt:#7b729c; --eh-th:#665d86;
  --eh-latest-bg:  rgba(54,226,168,0.08); --eh-latest-txt:#4be6b3;
  --eh-latest-bdr: rgba(54,226,168,0.28);
  --eh-num-color:  #9b86ff;
  --logo-grad:     linear-gradient(135deg,#7e5dff,#a87dff);
  --header-bdr:    #1d1432;
  --toggle-bg:     #1a1035;
  --toggle-bdr:    #3a2a67;
  --toggle-inactive:#7f769e;
  --toggle-active-bg:#7e5dff;
  --toggle-active-txt:#fff;
  --nav-bg:        #0a0718;
  --nav-btn-active-bg: #1e1e30;
  --nav-btn-active-txt: #ece7ff;
  --nav-btn-txt:   #7f769e;
  --ticker-btn-bg: #1a1035;
  --ticker-btn-bdr:#3a2a67;
  --ticker-btn-active-bg: linear-gradient(135deg,#7e5dff,#a87dff);
  --ticker-btn-active-txt: #fff;
  --ticker-btn-txt: #9b86ff;
}

[data-theme="light"] {
  --bg:            #f0f5fb;
  --app-grad:      none;
  --panel:         #ffffff;
  --panel-hi:      linear-gradient(145deg,#e8f4ff 0%,#eef2ff 100%);
  --panel-hi-bdr:  #93c5fd;
  --line-panel:    #dde4ef;
  --text:          #0f172a;
  --text-sub:      #334155;
  --text-muted:    #64748b;
  --text-dim:      #64748b;
  --nav-active-bg: #0f172a;
  --nav-active-bdr:#0f172a;
  --nav-active-txt:#ffffff;
  --tab-active-bg: #0f172a;
  --tab-active-bdr:#0f172a;
  --tab-active-txt:#ffffff;
  --tab-bdr:       #dde4ef;
  --epoch-bg:      rgba(245,158,11,0.10);
  --epoch-bdr:     rgba(245,158,11,0.30);
  --epoch-txt:     #b45309;
  --stats-bg:      #ffffff;
  --stats-bdr:     #dde4ef;
  --stats-val:     #1e40af;
  --stats-sub:     #64748b;
  --val-green:     #16a34a;
  --val-yellow:    #b45309;
  --sub-green:     #16a34a;
  --sub-blue:      #2563eb;
  --chart-grid:    rgba(203,213,225,0.8);
  --chart-axis:    #c8d4e8;
  --chart-tick:    #94a3b8;
  --chart-foot:    #64748b;
  --tooltip-bg:    #ffffff;
  --tooltip-bdr:   #dde4ef;
  --train-color:   #4f46e5;
  --val-color:     #f59e0b;
  --arch-bg:       #f7f9fc;
  --arch-bdr:      #c7d2fe;
  --arch-txt:      #4338ca;
  --arch-input-bg: #eef2ff; --arch-input-txt:#1e40af;
  --arch-drop-bg:  #fff1f2; --arch-drop-bdr:#fca5a5; --arch-drop-txt:#dc2626;
  --arch-fus-bg:   #fffbeb; --arch-fus-bdr:#fcd34d;  --arch-fus-txt:#b45309;
  --arch-out-bg:   #ecfdf5; --arch-out-bdr:#6ee7b7;  --arch-out-txt:#065f46;
  --arch-tag-bg:   #eef2ff; --arch-tag-bdr:#c7d2fe;  --arch-tag-txt:#4338ca;
  --arch-conn:     #94a3b8;
  --fi-bg:         #e8edf7;
  --fi-bar1:       #4f46e5; --fi-bar2:#f59e0b;
  --cm-bg:         #f7f9fc; --cm-hdr-bg:#eef2ff; --cm-corner:#f0f5fb;
  --cm-bdr:        #dde4ef; --cm-tbl-bdr:#dde4ef; --cm-txt:#475569;
  --cm-green-bg:   rgba(16,185,129,0.12); --cm-red-bg:rgba(239,68,68,0.10);
  --cm-green-txt:  #059669; --cm-red-txt:#dc2626;
  --cm-metric-bg:  #f0f5fb; --cm-metric-green:#059669; --cm-metric-purple:#4f46e5;
  --eh-bdr:        #dde4ef; --eh-txt:#475569; --eh-th:#94a3b8;
  --eh-latest-bg:  rgba(16,185,129,0.08); --eh-latest-txt:#059669;
  --eh-latest-bdr: rgba(16,185,129,0.28);
  --eh-num-color:  #4f46e5;
  --logo-grad:     linear-gradient(135deg,#4f46e5,#6d28d9);
  --header-bdr:    #dde4ef;
  --toggle-bg:     #e8edf7;
  --toggle-bdr:    #c8d4e8;
  --toggle-inactive:#64748b;
  --toggle-active-bg:#0f172a;
  --toggle-active-txt:#ffffff;
  --nav-bg:        #ffffff;
  --nav-btn-active-bg: #e8edf7;
  --nav-btn-active-txt: #0f172a;
  --nav-btn-txt:   #64748b;
  --ticker-btn-bg: #eef2ff;
  --ticker-btn-bdr:#c7d2fe;
  --ticker-btn-active-bg: linear-gradient(135deg,#4f46e5,#6d28d9);
  --ticker-btn-active-txt: #fff;
  --ticker-btn-txt: #4f46e5;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { width: 100%; height: 100%; overflow-x: hidden; }

body {
  font-family: 'Manrope', sans-serif;
  background: var(--bg);
  color: var(--text);
  transition: background 0.25s, color 0.25s;
}

.mt-app {
  min-height: 100vh;
  width: 100%;
  font-family: 'Manrope', sans-serif;
  color: var(--text);
  background: var(--bg);
  display: flex;
  flex-direction: column;
  transition: background 0.25s;
}
[data-theme="dark"] .mt-app { background: var(--app-grad); }

/* ── Ticker Selector ── */
.ticker-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.ticker-selector-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-right: 4px;
  font-family: 'Manrope', sans-serif;
}
.ticker-btn {
  font-family: 'Manrope', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 13px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid var(--ticker-btn-bdr);
  background: var(--ticker-btn-bg);
  color: var(--ticker-btn-txt);
  transition: all 0.18s;
  letter-spacing: 0.03em;
}
.ticker-btn.active {
  background: var(--ticker-btn-active-bg);
  color: var(--ticker-btn-active-txt);
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(126,93,255,0.3);
}
.ticker-btn:hover:not(.active) {
  border-color: var(--text-sub);
  color: var(--text);
}

/* ── Loading / Error overlay ── */
.mt-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  font-size: 13px;
  color: var(--text-muted);
  font-family: 'Manrope', sans-serif;
}
.mt-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.4);
  border-radius: 8px;
  padding: 14px 18px;
  color: #ef4444;
  font-size: 12px;
  margin: 16px 24px;
}

/* ── Content ── */
.mt-content { flex: 1; overflow-y: auto; }

.hero-block {
  padding: 14px 24px 0;
  display: flex; justify-content: space-between; align-items: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}
.hero-title { font-size: 24px; line-height: 1.08; letter-spacing: -0.02em; font-weight: 800; color: var(--text); }
.hero-desc  { margin: 4px 0 0; font-size: 12px; color: var(--text-sub); }
.hero-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

.tabs-row { display: flex; align-items: center; gap: 6px; }
.tab-btn {
  background: transparent; color: var(--text-sub);
  border: 1px solid var(--tab-bdr);
  font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 7px; cursor: pointer;
  font-family: 'Manrope', sans-serif; transition: color 0.18s, border-color 0.18s, background 0.18s;
}
.tab-btn.active { background: var(--tab-active-bg); color: var(--tab-active-txt); border-color: var(--tab-active-bdr); }
.tab-btn:hover:not(.active) { color: var(--text); border-color: var(--text-sub); }

.top-zone-row { padding: 10px 24px 0; }
.stats-cards-row { display: flex; gap: 12px; width: 100%; margin-bottom: 12px; }
.stats-card {
  background: var(--stats-bg); border: 1px solid var(--stats-bdr); border-radius: 10px;
  padding: 11px 14px 10px; min-height: 86px;
  display: flex; flex-direction: column; justify-content: center;
  flex: 1 1 0; min-width: 0; transition: background 0.25s, border-color 0.25s;
}
.stats-card.highlight { background: var(--panel-hi); border-color: var(--panel-hi-bdr); }
.stats-label { color: var(--text-muted); font-size: 8px; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; }
.stats-value { font-size: 28px; line-height: 1; font-weight: 800; color: var(--stats-val); margin-bottom: 4px; letter-spacing: -0.02em; }
.stats-value.green  { color: var(--val-green);  }
.stats-value.yellow { color: var(--val-yellow); }
.stats-sub { color: var(--stats-sub); font-size: 10px; font-weight: 600; }
.stats-sub.green { color: var(--sub-green); }
.stats-sub.blue  { color: var(--sub-blue);  }

.main-content { padding: 0 24px 24px; }
.main-grid-top    { display: grid; grid-template-columns: 1.8fr 1fr; gap: 12px; margin-bottom: 12px; }
.main-grid-bottom { display: grid; grid-template-columns: 1.1fr 1fr 1.05fr; gap: 12px; }

.panel { background: var(--panel); border: 1px solid var(--line-panel); border-radius: 10px; padding: 14px 16px 10px; transition: background 0.25s, border-color 0.25s; }

.training-loss-chart { min-height: 340px; }
.chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }
.chart-title { display: block; color: var(--text); font-size: 16px; font-weight: 700; line-height: 1.15; }
.chart-sub   { display: block; margin-top: 3px; color: var(--text-dim); font-size: 10px; font-weight: 600; }
.chart-legend-inline { display: flex; align-items: center; gap: 12px; font-size: 10px; font-weight: 700; margin-top: 2px; }
.legend-train { color: var(--train-color); }
.legend-val   { color: var(--val-color); }
.chart-footer-now { margin-top: 2px; color: var(--chart-foot); font-size: 10px; font-weight: 700; text-align: center; }
.chart-tooltip { background: var(--tooltip-bg); border: 1px solid var(--tooltip-bdr); border-radius: 7px; padding: 8px 12px; font-size: 11px; font-weight: 600; font-family: 'Manrope', sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.10); }
.tt-epoch { color: var(--text); margin-bottom: 4px; font-weight: 700; }

.model-arch-card { padding: 10px 12px; }
.arch-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.arch-title { display: block; color: var(--text); font-size: 16px; font-weight: 700; line-height: 1.15; }
.arch-sub   { display: block; color: var(--text-dim); font-size: 10px; font-weight: 600; margin-top: 3px; }
.arch-meta  { color: var(--text-dim); font-size: 9.5px; font-weight: 700; }
.arch-diagram { display: flex; flex-direction: column; gap: 2px; }
.arch-connector { text-align: center; color: var(--arch-conn); font-size: 10px; line-height: 1; }
.arch-block { min-height: 26px; border-radius: 6px; border: 1px solid var(--arch-bdr); background: var(--arch-bg); color: var(--arch-txt); padding: 5px 9px; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: space-between; gap: 8px; transition: background 0.25s, border-color 0.25s; }
.arch-block.input   { background: var(--arch-input-bg); color: var(--arch-input-txt); }
.arch-block.dropout { background: var(--arch-drop-bg);  color: var(--arch-drop-txt); border-color: var(--arch-drop-bdr); }
.arch-block.fusion  { background: var(--arch-fus-bg);   color: var(--arch-fus-txt);  border-color: var(--arch-fus-bdr); }
.arch-block.output  { background: var(--arch-out-bg);   color: var(--arch-out-txt);  border-color: var(--arch-out-bdr); }
.arch-right-group { display: flex; align-items: center; gap: 6px; }
.arch-arrow { font-size: 10px; color: var(--arch-conn); line-height: 1; }
.arch-note  { color: var(--text-dim); font-size: 9px; font-weight: 700; margin-left: auto; }
.arch-tag   { border: 1px solid var(--arch-tag-bdr); background: var(--arch-tag-bg); border-radius: 5px; padding: 2px 5px; color: var(--arch-tag-txt); font-size: 9px; font-weight: 700; }

.fi-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.fi-title  { color: var(--text); font-size: 16px; font-weight: 700; }
.fi-sub    { color: var(--text-dim); font-size: 9.5px; font-weight: 700; }
.fi-bars   { display: flex; flex-direction: column; gap: 7px; }
.fi-row    { display: grid; grid-template-columns: 72px 1fr 32px; align-items: center; column-gap: 7px; }
.fi-label  { color: var(--text-dim); font-size: 9.5px; font-weight: 600; }
.fi-bar-bg { height: 6px; background: var(--fi-bg); border-radius: 999px; }
.fi-bar    { height: 6px; border-radius: 999px; transition: width 0.4s ease; }
.fi-value  { font-size: 9.5px; font-weight: 700; text-align: right; }

.cm-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
.cm-title  { color: var(--text); font-size: 16px; font-weight: 700; }
.cm-sub    { color: var(--text-dim); font-size: 9.5px; font-weight: 700; }
.cm-axis-label { color: var(--text-dim); font-size: 9px; font-weight: 700; text-align: center; margin-bottom: 3px; }
.cm-table { border: 1px solid var(--cm-tbl-bdr); border-radius: 6px; overflow: hidden; margin-bottom: 4px; }
.cm-row   { display: grid; grid-template-columns: 1fr 1fr 1fr; }
.cm-cell { padding: 8px 0; text-align: center; color: var(--cm-txt); font-size: 9.5px; font-weight: 700; border-right: 1px solid var(--cm-bdr); border-bottom: 1px solid var(--cm-bdr); background: var(--cm-bg); display: flex; align-items: center; justify-content: center; transition: background 0.25s; }
.cm-row .cm-cell:last-child { border-right: none; }
.cm-row:last-child .cm-cell { border-bottom: none; }
.cm-header-cell { background: var(--cm-hdr-bg); }
.cm-side-header { background: var(--cm-hdr-bg); font-size: 9px; }
.cm-corner      { background: var(--cm-corner); }
.cm-green { background: var(--cm-green-bg); color: var(--cm-green-txt); font-size: 18px; font-weight: 700; }
.cm-red   { background: var(--cm-red-bg);   color: var(--cm-red-txt);   font-size: 18px; font-weight: 700; }
.cm-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; border-radius: 6px; overflow: hidden; margin-top: 6px; }
.cm-metric  { background: var(--cm-metric-bg); color: var(--text-dim); font-size: 8.5px; font-weight: 700; text-align: center; padding: 6px 2px; transition: background 0.25s; }
.cm-metric-green  { color: var(--cm-metric-green);  display: block; margin-bottom: 2px; }
.cm-metric-purple { color: var(--cm-metric-purple); display: block; margin-bottom: 2px; }

.eh-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
.eh-title  { color: var(--text); font-size: 16px; font-weight: 700; }
.eh-sub    { color: var(--text-dim); font-size: 9.5px; font-weight: 700; }
.eh-table { width: 100%; border-collapse: collapse; }
.eh-table th, .eh-table td { text-align: left; padding: 3.5px 4px; border-bottom: 1px solid var(--eh-bdr); color: var(--eh-txt); font-size: 9.5px; font-weight: 700; }
.eh-table th { color: var(--eh-th); font-size: 8.5px; letter-spacing: 0.08em; }
.eh-table td:nth-child(2), .eh-table td:nth-child(3) { color: var(--eh-num-color); }
.eh-table td:last-child { color: var(--text); }
.eh-table tr.latest { background: var(--eh-latest-bg); }
.eh-table tr.latest td { color: var(--eh-latest-txt); }
.eh-latest { margin-left: 3px; color: var(--eh-latest-txt); font-size: 7.5px; letter-spacing: 0.08em; border: 1px solid var(--eh-latest-bdr); border-radius: 3px; padding: 1px 3px; vertical-align: middle; }

/* Skeleton pulse */
@keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
.sk-line { border-radius: 4px; animation: skPulse 1.4s ease-in-out infinite; }

@media (max-width: 1200px) {
  .main-grid-top    { grid-template-columns: 1fr; }
  .main-grid-bottom { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .hero-block { flex-direction: column; align-items: flex-start; gap: 8px; }
}
`;

/* ── Constants ── */
const TICKERS        = ["AAPL", "AMZN", "GOOGL", "MSFT", "NVDA"];
const API_BASE       = "http://localhost:5000";

/* ── Style injection (same pattern as original) ── */
function useInjectStyles(css) {
  useEffect(() => {
    const ID = 'mt-injected-styles';
    if (document.getElementById(ID)) return;
    const tag = document.createElement('style');
    tag.id = ID;
    tag.textContent = css;
    document.head.appendChild(tag);
    return () => { const el = document.getElementById(ID); if (el) el.remove(); };
  }, []);
}

/* ── Skeleton helpers ── */
function SkLine({ w = 80, h = 14, bg = '#2a1f46' }) {
  return <div className="sk-line" style={{ width: w, height: h, background: bg }} />;
}

/* ── Sub-components ── */
function LossTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tt-epoch">Estimator {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value.toFixed(4)}</p>
      ))}
    </div>
  );
}

function StatsCards({ data, loading, isDark }) {
  const sk   = isDark ? '#2a1f46' : '#dde4ef';
  const stats = data?.model_stats;

  const cards = [
    {
      label: 'VAL ACCURACY',
      value: stats ? `${(stats.accuracy * 100).toFixed(1)}%` : null,
      valueClass: 'green',
      sub: stats ? `F1: ${stats.f1_score.toFixed(3)}` : null,
      subClass: 'green',
      highlight: true,
    },
    {
      label: 'TRAIN SAMPLES',
      value: stats ? String(stats.n_train) : null,
      valueClass: '',
      sub: `Test: ${stats ? stats.n_test : '…'}`,
      subClass: 'blue',
    },
    {
      label: 'VAL LOSS',
      value: data?.chart_curve?.length > 0
        ? data.chart_curve[data.chart_curve.length - 1].val.toFixed(4)
        : null,
      valueClass: '',
      sub: '▼ Final epoch',
      subClass: '',
    },
    {
      label: 'RMSE',
      value: stats ? stats.rmse.toFixed(4) : null,
      valueClass: '',
      sub: `MAE: ${stats ? stats.mae.toFixed(4) : '…'}`,
      subClass: '',
    },
    {
      label: 'F1 SCORE',
      value: stats ? stats.f1_score.toFixed(3) : null,
      valueClass: 'yellow',
      sub: `Precision: ${stats ? (stats.precision * 100).toFixed(1) + '%' : '…'}`,
      subClass: 'green',
    },
    {
      label: 'EPOCH',
      value: data?.n_estimators ? `${data.n_estimators}` : null,
      valueClass: '',
      sub: `Depth: ${data?.max_depth ?? '…'}  LR: ${data?.learning_rate ?? '…'}`,
      subClass: '',
    },
  ];

  return (
    <div className="stats-cards-row">
      {cards.map((c) => (
        <div key={c.label} className={`stats-card${c.highlight ? ' highlight' : ''}`}>
          <div className="stats-label">{c.label}</div>
          {loading
            ? <SkLine w={90} h={28} bg={sk} />
            : <div className={`stats-value${c.valueClass ? ` ${c.valueClass}` : ''}`}>{c.value ?? '—'}</div>
          }
          {loading
            ? <SkLine w={60} h={11} bg={sk} />
            : <div className={`stats-sub${c.subClass ? ` ${c.subClass}` : ''}`}>{c.sub ?? ''}</div>
          }
        </div>
      ))}
    </div>
  );
}

function TrainingLossChart({ data, loading, theme, isDark }) {
  const sk  = isDark ? '#2a1f46' : '#dde4ef';
  const tc  = theme === 'dark' ? '#8b6bff' : '#4f46e5';
  const vc  = theme === 'dark' ? '#ffad49' : '#f59e0b';
  const gridColor = theme === 'dark' ? 'rgba(43,31,74,0.6)' : 'rgba(203,213,225,0.8)';
  const tickColor = theme === 'dark' ? '#5a5278' : '#94a3b8';
  const axisColor = theme === 'dark' ? '#2b1f4a' : '#cbd5e1';

  const chartData = data?.chart_curve ?? [];
  const lastEpoch = chartData.length > 0 ? chartData[chartData.length - 1].epoch : '—';

  return (
    <div className="panel training-loss-chart">
      <div className="chart-header">
        <div>
          <span className="chart-title">Training &amp; Validation Loss</span>
          <span className="chart-sub">
            Cross-entropy · XGBoost · LR={data?.learning_rate ?? '0.05'}
          </span>
        </div>
        <div className="chart-legend-inline">
          <span className="legend-train">— Train</span>
          <span className="legend-val">— Val</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 0' }}>
          {[1,2,3,4].map(i => <SkLine key={i} w="100%" h={40} bg={sk} />)}
        </div>
      ) : chartData.length === 0 ? (
        <div className="mt-loading">No chart data — run the pipeline first.</div>
      ) : (
        <ResponsiveContainer width="100%" height={265}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={tc} stopOpacity={theme === 'dark' ? 0.25 : 0.12} />
                <stop offset="95%" stopColor={tc} stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={vc} stopOpacity={theme === 'dark' ? 0.18 : 0.10} />
                <stop offset="95%" stopColor={vc} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="epoch" tick={{ fill: tickColor, fontSize: 10, fontFamily: 'Manrope' }} tickLine={false} axisLine={{ stroke: axisColor }} />
            <YAxis tick={{ fill: tickColor, fontSize: 10, fontFamily: 'Manrope' }} tickLine={false} axisLine={false} tickFormatter={(v) => v.toFixed(2)} />
            <Tooltip content={<LossTooltip />} />
            <Area type="monotone" dataKey="train" name="Train" stroke={tc} strokeWidth={2} fill="url(#trainGrad)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="val"   name="Val"   stroke={vc} strokeWidth={2} strokeDasharray="5 3" fill="url(#valGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <p className="chart-footer-now">▲ Now — Estimator {lastEpoch}</p>
    </div>
  );
}

/* Model Architecture stays static (describes algo, not data) */
function ModelArchitecture({ data }) {
  const estimators = data?.n_estimators ?? 250;
  const depth      = data?.max_depth    ?? 5;
  const lr         = data?.learning_rate ?? 0.05;

  const layers = [
    {
      label: 'Input Layer', cls: 'input',
      right: (
        <div className="arch-right-group">
          <span className="arch-tag">OHLCV Features</span>
          <span className="arch-arrow">↓</span>
          <span className="arch-tag">8 features · RSI-14</span>
        </div>
      ),
    },
    { label: 'XGBoost Ensemble',   cls: '',        note: `${estimators} estimators · mlogloss` },
    { label: 'Gradient Boosting',  cls: 'dropout', note: `max_depth=${depth}` },
    { label: 'Feature Weighting',  cls: '',        note: `LR=${lr} · gain importance` },
    { label: 'Label Fusion',       cls: 'fusion',  note: 'UP / DOWN → signal mapping' },
    { label: 'predict_proba()',    cls: '',        note: 'probability per class' },
    { label: 'Output Layer',       cls: 'output',  note: '3 classes: UP / DOWN / HOLD' },
  ];

  return (
    <div className="panel model-arch-card">
      <div className="arch-header">
        <div>
          <span className="arch-title">Model Architecture</span>
          <span className="arch-sub">XGBoost Gradient Boosted Trees</span>
        </div>
        <span className="arch-meta">{estimators} trees</span>
      </div>
      <div className="arch-diagram">
        {layers.map((layer, i) => (
          <React.Fragment key={layer.label}>
            <div className={`arch-block${layer.cls ? ` ${layer.cls}` : ''}`}>
              <span>{layer.label}</span>
              {layer.right ? layer.right : <span className="arch-note">{layer.note}</span>}
            </div>
            {i < layers.length - 1 && <div className="arch-connector">↓</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function FeatureImportance({ data, loading, theme, isDark }) {
  const sk       = isDark ? '#2a1f46' : '#dde4ef';
  const features = data?.feature_importance ?? [];

  return (
    <div className="panel">
      <div className="fi-header">
        <span className="fi-title">Feature Importance</span>
        <span className="fi-sub">XGBoost gain · top {features.length || 8}</span>
      </div>
      <div className="fi-bars">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="fi-row">
                <SkLine w={60} h={10} bg={sk} />
                <SkLine w="100%" h={6} bg={sk} />
                <SkLine w={28} h={10} bg={sk} />
              </div>
            ))
          : features.length === 0
          ? <div className="mt-loading" style={{ minHeight: 80 }}>No data</div>
          : features.map((f, idx) => {
              const color = theme === 'dark'
                ? (idx % 2 === 0 ? '#a78bfa' : '#f9c97b')
                : (idx % 2 === 0 ? '#4f46e5' : '#f59e0b');
              return (
                <div key={f.key} className="fi-row">
                  <span className="fi-label">{f.name}</span>
                  <div className="fi-bar-bg">
                    <div className="fi-bar" style={{ width: `${Math.min(100, f.value)}%`, background: color }} />
                  </div>
                  <span className="fi-value" style={{ color }}>{f.value}%</span>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

function ConfusionMatrix({ data, loading, isDark }) {
  const sk = isDark ? '#2a1f46' : '#dde4ef';
  const cm = data?.confusion_matrix;

  // Expect 2×2: [[UP/UP, UP/DOWN],[DOWN/UP, DOWN/DOWN]]
  const tp = cm?.matrix?.[0]?.[0] ?? 0;
  const fp = cm?.matrix?.[0]?.[1] ?? 0;
  const fn = cm?.matrix?.[1]?.[0] ?? 0;
  const tn = cm?.matrix?.[1]?.[1] ?? 0;

  const prec = cm?.precision != null ? `${(cm.precision * 100).toFixed(1)}%` : '—';
  const rec  = cm?.recall    != null ? `${(cm.recall    * 100).toFixed(1)}%` : '—';

  return (
    <div className="panel">
      <div className="cm-header">
        <span className="cm-title">Confusion Matrix</span>
        <span className="cm-sub">Test set · UP vs DOWN</span>
      </div>
      <p className="cm-axis-label">Predicted →</p>
      <div className="cm-table">
        <div className="cm-row">
          <div className="cm-cell cm-corner" />
          <div className="cm-cell cm-header-cell">UP</div>
          <div className="cm-cell cm-header-cell">DOWN</div>
        </div>
        <div className="cm-row">
          <div className="cm-cell cm-side-header">UP</div>
          <div className="cm-cell cm-green">
            {loading ? <SkLine w={32} h={18} bg={sk} /> : tp}
          </div>
          <div className="cm-cell cm-red">
            {loading ? <SkLine w={32} h={18} bg={sk} /> : fp}
          </div>
        </div>
        <div className="cm-row">
          <div className="cm-cell cm-side-header">DOWN</div>
          <div className="cm-cell cm-red">
            {loading ? <SkLine w={32} h={18} bg={sk} /> : fn}
          </div>
          <div className="cm-cell cm-green">
            {loading ? <SkLine w={32} h={18} bg={sk} /> : tn}
          </div>
        </div>
      </div>
      <p className="cm-axis-label">← Actual</p>
      <div className="cm-metrics">
        <div className="cm-metric">
          {loading
            ? <SkLine w={48} h={18} bg={sk} />
            : <span className="cm-metric-green" style={{ fontSize: 18 }}>{prec}</span>
          }
          PRECISION
        </div>
        <div className="cm-metric">
          {loading
            ? <SkLine w={48} h={18} bg={sk} />
            : <span className="cm-metric-purple" style={{ fontSize: 18 }}>{rec}</span>
          }
          RECALL
        </div>
      </div>
    </div>
  );
}

function EpochHistory({ data, loading, isDark }) {
  const sk     = isDark ? '#2a1f46' : '#dde4ef';
  const epochs = data?.epoch_history ?? [];

  return (
    <div className="panel">
      <div className="eh-header">
        <span className="eh-title">Epoch History</span>
        <span className="eh-sub">{epochs.length > 0 ? `${epochs.length} sampled rows` : 'Sampled checkpoints'}</span>
      </div>
      <table className="eh-table">
        <thead>
          <tr><th>EPOCH</th><th>LOSS</th><th>VAL LOSS</th><th>ACC</th></tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {[50,55,60,48].map((w,j) => (
                    <td key={j} style={{ padding: '4px' }}>
                      <SkLine w={w} h={10} bg={sk} />
                    </td>
                  ))}
                </tr>
              ))
            : epochs.length === 0
            ? <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 12 }}>No epoch data</td></tr>
            : epochs.map((row, idx) => {
                const isLatest = idx === epochs.length - 1;
                return (
                  <tr key={row.epoch} className={isLatest ? 'latest' : ''}>
                    <td>
                      {row.epoch}
                      {isLatest && <span className="eh-latest">LATEST</span>}
                    </td>
                    <td>{row.loss}</td>
                    <td>{row.val_loss}</td>
                    <td>{row.acc}</td>
                  </tr>
                );
              })
          }
        </tbody>
      </table>
    </div>
  );
}



/* ── Ticker Selector ── */
function TickerSelector({ active, onChange }) {
  return (
    <div className="ticker-selector">
      <span className="ticker-selector-label">Ticker</span>
      {TICKERS.map(t => (
        <button
          key={t}
          className={`ticker-btn${t === active ? ' active' : ''}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function ModelTrainingAndAnalytics() {
  useInjectStyles(STYLES);

  const [isDark,  setIsDark]  = useState(true);
  const [ticker,  setTicker]  = useState('AAPL');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const theme = isDark ? 'dark' : 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── Fetch model analytics from DB whenever ticker changes ──
  const fetchAnalytics = useCallback(async (t) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/model_analytics/${t}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} — run the pipeline for ${t} first`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(ticker);
  }, [ticker, fetchAnalytics]);

  const handleTickerChange = (t) => {
    setTicker(t);
  };

  return (
    <div className="mt-app">

      {/* ── Navbar (unchanged) ── */}
      <Navbar
        isDark={isDark}
        onToggle={() => setIsDark(d => !d)}
        activeLabel="Model"
      />

      {/* ── Page content ── */}
      <div className="mt-content">
        <div className="hero-block">
          <div>
            <h1 className="hero-title">Model Training &amp; Analytics</h1>
            <p className="hero-desc">
              XGBoost · Dataset: Kaggle OHLCV · Ticker:&nbsp;
              <strong style={{ color: 'var(--text)' }}>{ticker}</strong>
              {data?.trained_at && (
                <span style={{ marginLeft: 8, opacity: 0.6 }}>
                  · Last trained {new Date(data.trained_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <div className="hero-right">
            {/* ── TICKER SELECTOR (new) ── */}
            <TickerSelector active={ticker} onChange={handleTickerChange} />
           
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-error">
            ⚠ {error}
          </div>
        )}

        <div className="top-zone-row">
          <StatsCards data={data} loading={loading} isDark={isDark} />
        </div>

        <main className="main-content">
          <div className="main-grid-top">
            <TrainingLossChart data={data} loading={loading} theme={theme} isDark={isDark} />
            <ModelArchitecture data={data} />
          </div>
          <div className="main-grid-bottom">
            <FeatureImportance data={data} loading={loading} theme={theme} isDark={isDark} />
            <ConfusionMatrix   data={data} loading={loading} isDark={isDark} />
            <EpochHistory      data={data} loading={loading} isDark={isDark} />
          </div>
        </main>
      </div>

    </div>
  );
}