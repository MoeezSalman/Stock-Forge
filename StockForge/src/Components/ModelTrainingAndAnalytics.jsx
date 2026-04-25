import React, { useEffect, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

/* ══════════════════════════════════════════
   STYLES
══════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

/* ── Dark theme ── */
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
}

/* ── Light theme ── */
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
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { width: 100%; height: 100%; overflow-x: hidden; }

body {
  font-family: 'Manrope', sans-serif;
  background: var(--bg);
  color: var(--text);
  transition: background 0.25s, color 0.25s;
}

.app-container {
  min-height: 100vh; width: 100%;
  font-family: 'Manrope', sans-serif;
  color: var(--text);
  background: var(--bg);
  transition: background 0.25s;
}
[data-theme="dark"] .app-container { background: var(--app-grad); }

/* Header */
.header-main {
  width: 100%; padding: 0 24px; height: 52px;
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: center; column-gap: 28px;
  border-bottom: 1px solid var(--header-bdr);
  transition: border-color 0.25s;
}
.header-left { display: flex; align-items: center; gap: 8px; }
.logo-box {
  width: 22px; height: 22px; border-radius: 6px;
  background: var(--logo-grad);
  display: flex; align-items: center; justify-content: center;
}
.logo-inner { width: 11px; height: 11px; background: #fff; border-radius: 2px; opacity: 0.85; }
.brand { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -0.01em; }
.brand sup { font-size: 9px; color: #7e5dff; font-weight: 700; letter-spacing: 0.05em; vertical-align: super; }
[data-theme="light"] .brand sup { color: #4f46e5; }

.header-nav { display: flex; justify-content: center; align-items: center; gap: 4px; }
.nav-link {
  color: var(--text-sub); font-size: 11.5px; font-weight: 600;
  text-decoration: none; padding: 5px 10px; border-radius: 7px;
  transition: color 0.18s, background 0.18s; border: 1px solid transparent;
}
.nav-link.active { color: var(--nav-active-txt); background: var(--nav-active-bg); border-color: var(--nav-active-bdr); }
.nav-link:hover:not(.active) { color: var(--text); }

.header-right { justify-self: end; display: flex; align-items: center; gap: 10px; }

.epoch-pill {
  background: var(--epoch-bg); color: var(--epoch-txt);
  border: 1px solid var(--epoch-bdr); border-radius: 6px;
  padding: 5px 11px; font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.04em; white-space: nowrap;
  transition: background 0.25s, color 0.25s, border-color 0.25s;
}

/* Theme Toggle */
.theme-toggle {
  display: flex; align-items: center;
  background: var(--toggle-bg); border: 1px solid var(--toggle-bdr);
  border-radius: 8px; overflow: hidden; padding: 2px;
  gap: 2px;
  transition: background 0.25s, border-color 0.25s;
}
.theme-btn {
  background: transparent; border: none; cursor: pointer;
  font-family: 'Manrope', sans-serif; font-size: 10.5px; font-weight: 700;
  padding: 4px 10px; border-radius: 6px; color: var(--toggle-inactive);
  transition: background 0.2s, color 0.2s;
  display: flex; align-items: center; gap: 4px; white-space: nowrap;
}
.theme-btn.active {
  background: var(--toggle-active-bg);
  color: var(--toggle-active-txt);
}

/* Hero */
.hero-block {
  padding: 14px 24px 0;
  display: flex; justify-content: space-between; align-items: flex-end;
}
.hero-title { font-size: 30px; line-height: 1.08; letter-spacing: -0.02em; font-weight: 800; color: var(--text); }
.hero-desc  { margin: 4px 0 0; font-size: 12px; color: var(--text-sub); }
.hero-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

/* Tabs */
.tabs-row { display: flex; align-items: center; gap: 6px; }
.tab-btn {
  background: transparent; color: var(--text-sub);
  border: 1px solid var(--tab-bdr);
  font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 7px; cursor: pointer;
  font-family: 'Manrope', sans-serif; transition: color 0.18s, border-color 0.18s, background 0.18s;
}
.tab-btn.active { background: var(--tab-active-bg); color: var(--tab-active-txt); border-color: var(--tab-active-bdr); }
.tab-btn:hover:not(.active) { color: var(--text); border-color: var(--text-sub); }

/* Stats */
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

/* Main */
.main-content { padding: 0 24px 24px; }
.main-grid-top    { display: grid; grid-template-columns: 1.8fr 1fr; gap: 12px; margin-bottom: 12px; }
.main-grid-bottom { display: grid; grid-template-columns: 1.1fr 1fr 1.05fr; gap: 12px; }

.panel { background: var(--panel); border: 1px solid var(--line-panel); border-radius: 10px; padding: 14px 16px 10px; transition: background 0.25s, border-color 0.25s; }

/* Chart */
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

/* Arch */
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

/* Feature Importance */
.fi-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.fi-title  { color: var(--text); font-size: 16px; font-weight: 700; }
.fi-sub    { color: var(--text-dim); font-size: 9.5px; font-weight: 700; }
.fi-bars   { display: flex; flex-direction: column; gap: 7px; }
.fi-row    { display: grid; grid-template-columns: 72px 1fr 32px; align-items: center; column-gap: 7px; }
.fi-label  { color: var(--text-dim); font-size: 9.5px; font-weight: 600; }
.fi-bar-bg { height: 6px; background: var(--fi-bg); border-radius: 999px; }
.fi-bar    { height: 6px; border-radius: 999px; transition: width 0.4s ease; }
.fi-value  { font-size: 9.5px; font-weight: 700; text-align: right; }

/* Confusion Matrix */
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

/* Epoch History */
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

@media (max-width: 1200px) {
  .main-grid-top    { grid-template-columns: 1fr; }
  .main-grid-bottom { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .hero-block { flex-direction: column; align-items: flex-start; gap: 8px; }
}
`;

/* DATA */
const chartData = [
  { epoch: 0,  train: 0.62,  val: 0.71  },
  { epoch: 10, train: 0.44,  val: 0.54  },
  { epoch: 20, train: 0.28,  val: 0.38  },
  { epoch: 30, train: 0.18,  val: 0.28  },
  { epoch: 40, train: 0.0421,val: 0.0598},
  { epoch: 41, train: 0.0404,val: 0.0572},
  { epoch: 42, train: 0.0388,val: 0.0555},
  { epoch: 43, train: 0.0371,val: 0.0532},
  { epoch: 44, train: 0.0355,val: 0.0515},
  { epoch: 45, train: 0.0339,val: 0.0501},
  { epoch: 46, train: 0.0325,val: 0.0493},
  { epoch: 47, train: 0.0312,val: 0.0487},
  { epoch: 100,train: 0.018, val: 0.031 },
];

const features = [
  { name: 'Close Price',  value: 88, dColor: '#a78bfa', lColor: '#4f46e5' },
  { name: 'NLP Score',    value: 74, dColor: '#a78bfa', lColor: '#4f46e5' },
  { name: 'Volume',       value: 62, dColor: '#a78bfa', lColor: '#0ea5e9' },
  { name: 'RSI(14)',      value: 55, dColor: '#f9c97b', lColor: '#f59e0b' },
  { name: 'News Count',   value: 48, dColor: '#a78bfa', lColor: '#06b6d4' },
  { name: 'MACD',         value: 41, dColor: '#f9c97b', lColor: '#f59e0b' },
  { name: 'Volatility',   value: 33, dColor: '#a78bfa', lColor: '#94a3b8' },
  { name: 'Bollinger %B', value: 28, dColor: '#a78bfa', lColor: '#94a3b8' },
];

const epochs = [
  { epoch: 40, loss: '0.0421', val_loss: '0.0598', acc: '80.1%' },
  { epoch: 41, loss: '0.0404', val_loss: '0.0572', acc: '80.7%' },
  { epoch: 42, loss: '0.0388', val_loss: '0.0555', acc: '81.2%' },
  { epoch: 43, loss: '0.0371', val_loss: '0.0532', acc: '81.8%' },
  { epoch: 44, loss: '0.0355', val_loss: '0.0515', acc: '82.1%' },
  { epoch: 45, loss: '0.0339', val_loss: '0.0501', acc: '82.6%' },
  { epoch: 46, loss: '0.0325', val_loss: '0.0493', acc: '82.9%' },
  { epoch: 47, loss: '0.0312', val_loss: '0.0487', acc: '83.2%', latest: true },
];

function useInjectStyles(css) {
  useEffect(() => {
    const ID = 'dashboard-injected-styles';
    if (document.getElementById(ID)) return;
    const tag = document.createElement('style');
    tag.id = ID; tag.textContent = css;
    document.head.appendChild(tag);
    return () => { const el = document.getElementById(ID); if (el) el.remove(); };
  }, []);
}

function LossTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tt-epoch">Epoch {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value.toFixed(4)}</p>
      ))}
    </div>
  );
}


function StatsCards() {
  const cards = [
    { label: 'VAL ACCURACY', value: '83.2%',  valueClass: 'green',  sub: '▲ +2.4% vs last', subClass: 'green', highlight: true },
    { label: 'TRAIN LOSS',   value: '0.0312', valueClass: '',        sub: '▼ Converging',    subClass: 'green' },
    { label: 'VAL LOSS',     value: '0.0487', valueClass: '',        sub: '▼ −0.003',         subClass: 'blue'  },
    { label: 'RMSE',         value: '2.14',   valueClass: '',        sub: '$2.14 avg err',   subClass: ''      },
    { label: 'F1 SCORE',     value: '0.814',  valueClass: 'yellow',  sub: '▲ +0.02',          subClass: 'green' },
    { label: 'EPOCH',        value: '47/100', valueClass: '',        sub: 'ETA: 18 min',     subClass: ''      },
  ];
  return (
    <div className="stats-cards-row">
      {cards.map((c) => (
        <div key={c.label} className={`stats-card${c.highlight ? ' highlight' : ''}`}>
          <div className="stats-label">{c.label}</div>
          <div className={`stats-value${c.valueClass ? ` ${c.valueClass}` : ''}`}>{c.value}</div>
          <div className={`stats-sub${c.subClass ? ` ${c.subClass}` : ''}`}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function TrainingLossChart({ theme }) {
  const tc = theme === 'dark' ? '#8b6bff' : '#4f46e5';
  const vc = theme === 'dark' ? '#ffad49' : '#f59e0b';
  const gridColor = theme === 'dark' ? 'rgba(43,31,74,0.6)' : 'rgba(203,213,225,0.8)';
  const tickColor = theme === 'dark' ? '#5a5278' : '#94a3b8';
  const axisColor = theme === 'dark' ? '#2b1f4a' : '#cbd5e1';
  return (
    <div className="panel training-loss-chart">
      <div className="chart-header">
        <div>
          <span className="chart-title">Training &amp; Validation Loss</span>
          <span className="chart-sub">Cross-entropy · Adam · LR=0.001</span>
        </div>
        <div className="chart-legend-inline">
          <span className="legend-train">— Train</span>
          <span className="legend-val">— Val</span>
        </div>
      </div>
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
      <p className="chart-footer-now">▲ Now — Epoch 47</p>
    </div>
  );
}

function ModelArchitecture() {
  const layers = [
    { label: 'Input Layer', cls: 'input', right: (
        <div className="arch-right-group">
          <span className="arch-tag">OHLCV · 60 timesteps</span>
          <span className="arch-arrow">↓</span>
          <span className="arch-tag">NLP FinBERT 768-d</span>
        </div>
      )
    },
    { label: 'LSTM Layer 1',      cls: '',        note: '128 units · return_seq=True'  },
    { label: 'Dropout',           cls: 'dropout', note: 'p=0.3'                        },
    { label: 'LSTM Layer 2',      cls: '',        note: '64 units · return_seq=False'  },
    { label: 'Feature Fusion',    cls: 'fusion',  note: 'Concat(LSTM, NLP) → 832-d'   },
    { label: 'Dense + BatchNorm', cls: '',        note: '256 → 64 · ReLU'             },
    { label: 'Output Layer',      cls: 'output',  note: '3 classes: UP / DOWN / HOLD' },
  ];
  return (
    <div className="panel model-arch-card">
      <div className="arch-header">
        <div>
          <span className="arch-title">Model Architecture</span>
          <span className="arch-sub">LSTM + FinBERT Fusion Network</span>
        </div>
        <span className="arch-meta">~4.2M params</span>
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

function FeatureImportance({ theme }) {
  return (
    <div className="panel">
      <div className="fi-header">
        <span className="fi-title">Feature Importance</span>
        <span className="fi-sub">SHAP values · top 8</span>
      </div>
      <div className="fi-bars">
        {features.map((f) => {
          const color = theme === 'dark' ? f.dColor : f.lColor;
          return (
            <div key={f.name} className="fi-row">
              <span className="fi-label">{f.name}</span>
              <div className="fi-bar-bg">
                <div className="fi-bar" style={{ width: `${f.value}%`, background: color }} />
              </div>
              <span className="fi-value" style={{ color }}>{f.value}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfusionMatrix() {
  return (
    <div className="panel">
      <div className="cm-header">
        <span className="cm-title">Confusion Matrix</span>
        <span className="cm-sub">Test set · 1,200 samples</span>
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
          <div className="cm-cell cm-green">342</div>
          <div className="cm-cell cm-red">48</div>
        </div>
        <div className="cm-row">
          <div className="cm-cell cm-side-header">DOWN</div>
          <div className="cm-cell cm-red">62</div>
          <div className="cm-cell cm-green">288</div>
        </div>
      </div>
      <p className="cm-axis-label">← Actual</p>
      <div className="cm-metrics">
        <div className="cm-metric">
          <span className="cm-metric-green" style={{ fontSize: 18 }}>84.7%</span>PRECISION
        </div>
        <div className="cm-metric">
          <span className="cm-metric-purple" style={{ fontSize: 18 }}>82.3%</span>RECALL
        </div>
      </div>
    </div>
  );
}

function EpochHistory() {
  return (
    <div className="panel">
      <div className="eh-header">
        <span className="eh-title">Epoch History</span>
        <span className="eh-sub">Recent 8 epochs</span>
      </div>
      <table className="eh-table">
        <thead>
          <tr><th>EPOCH</th><th>LOSS</th><th>VAL LOSS</th><th>ACC</th></tr>
        </thead>
        <tbody>
          {epochs.map((row) => (
            <tr key={row.epoch} className={row.latest ? 'latest' : ''}>
              <td>{row.epoch}{row.latest && <span className="eh-latest">LATEST</span>}</td>
              <td>{row.loss}</td>
              <td>{row.val_loss}</td>
              <td>{row.acc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tabs() {
  const [active, setActive] = useState('Training');
  return (
    <div className="tabs-row">
      {['Training', 'Evaluation', 'Architecture', 'Data Pipeline'].map((t) => (
        <button key={t} className={`tab-btn${active === t ? ' active' : ''}`} onClick={() => setActive(t)}>{t}</button>
      ))}
    </div>
  );
}

// ── Main export: accepts isDark + toggleTheme as props from Dashboard ──
export default function ModelTrainingAndAnalytics({ isDark, toggleTheme }) {
  useInjectStyles(STYLES);

  // Derive theme string from the prop passed by Dashboard
  const theme = isDark ? 'dark' : 'light';

  // Keep data-theme attribute on <html> in sync with Dashboard's isDark state
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-container" style={{ flex: 1, overflowY: 'auto' }}>
      <div className="hero-block">
        <div>
          <h1 className="hero-title">Model Training &amp; Analytics</h1>
          <p className="hero-desc">LSTM + NLP Sentiment Fusion &nbsp;·&nbsp; Dataset: Kaggle Financial News + OHLCV</p>
        </div>
        <div className="hero-right">
          <Tabs />
        </div>
      </div>

      <div className="top-zone-row">
        <StatsCards />
      </div>

      <main className="main-content">
        <div className="main-grid-top">
          <TrainingLossChart theme={theme} />
          <ModelArchitecture />
        </div>
        <div className="main-grid-bottom">
          <FeatureImportance theme={theme} />
          <ConfusionMatrix />
          <EpochHistory />
        </div>
      </main>
    </div>
  );
}
