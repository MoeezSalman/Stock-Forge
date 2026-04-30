import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard",   path: "/" },
  { label: "Predictions", path: "/alpha" },
  { label: "Sentiment",   path: "/sentiment" },
  { label: "Model",       path: "/model" },
];

/**
 * Props:
 *  isDark        boolean   — current theme state
 *  onToggle      fn        — called when theme button clicked
 *  activeLabel   string    — which nav item to highlight
 *  exportData    object    — { ticker, data, history } passed from Dashboard for PDF export
 */
export default function Navbar({ isDark, onToggle, activeLabel, exportData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [exporting, setExporting] = useState(false);

  const mono = "'JetBrains Mono','Fira Code','Courier New',monospace";

  /* ── PDF Export ─────────────────────────────────────────────────────────── */
  const handleExportPDF = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      // Dynamically load jsPDF (UMD) – no npm install needed
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210; // A4 width mm
      const now = new Date();
      const ts  = now.toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZoneName: "short",
      });

      const ticker  = exportData?.ticker  ?? "AAPL";
      const d       = exportData?.data    ?? {};
      const history = exportData?.history ?? [];

      const price   = d.price  ? `$${Number(d.price).toFixed(2)}`  : "—";
      const change  = d.change ? Number(d.change).toFixed(2)        : "0.00";
      const isPos   = Number(d.change ?? 0) >= 0;
      const pct     = d.price && d.change
        ? ((d.change / (d.price - d.change)) * 100).toFixed(2)
        : "0.00";

      const signal    = d.prediction ?? "NEUTRAL";
      const conf      = d.confidence  ? `${(d.confidence * 100).toFixed(0)}%` : "—";
      const mktCap    = d.market_cap_label ?? "—";
      const predClose = d.predicted_close ? `$${Number(d.predicted_close).toFixed(2)}` : "—";

      const SIGNAL_COLOR = {
        "STRONG BUY": [59,  130, 246],
        "BUY":        [34,  197, 94 ],
        "HOLD":       [217, 119, 6  ],
        "REDUCE":     [239, 68,  68 ],
        "BULLISH":    [34,  197, 94 ],
        "NEUTRAL":    [217, 119, 6  ],
        "BEARISH":    [239, 68,  68 ],
      };
      const sigRgb = SIGNAL_COLOR[signal] ?? [217, 119, 6];

      // ── helpers ──────────────────────────────────────────────────────────
      const rgb  = (r, g, b) => { doc.setDrawColor(r,g,b); doc.setFillColor(r,g,b); };
      const text = (str, x, y, opts = {}) => {
        doc.setFontSize(opts.size ?? 9);
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        if (opts.color) doc.setTextColor(...opts.color);
        else doc.setTextColor(isDark ? 220 : 30, isDark ? 220 : 30, isDark ? 230 : 40);
        doc.text(String(str), x, y, { align: opts.align ?? "left" });
      };
      const rect = (x, y, w, h, fill = true) =>
        fill ? doc.rect(x, y, w, h, "F") : doc.rect(x, y, w, h, "S");
      const line = (x1, y1, x2, y2) => doc.line(x1, y1, x2, y2);

      // ── background ───────────────────────────────────────────────────────
      rgb(isDark ? 10 : 240, isDark ? 10 : 245, isDark ? 20 : 251);
      rect(0, 0, W, 297);

      // ── header band ──────────────────────────────────────────────────────
      rgb(isDark ? 13 : 79, isDark ? 13 : 70, isDark ? 24 : 229);
      rect(0, 0, W, 28);

      // accent stripe
      rgb(...sigRgb);
      rect(0, 26, W, 2);

      // logo text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Stock", 12, 12);
      doc.setTextColor(...sigRgb);
      doc.text("Forge", 30, 12);

      doc.setTextColor(180, 180, 200);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("AI-Powered Market Intelligence", 12, 18);

      // report title right side
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("EQUITY ANALYSIS REPORT", W - 12, 12, { align: "right" });
      doc.setTextColor(180, 180, 200);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${ts}`, W - 12, 18, { align: "right" });

      // ── ticker hero section ───────────────────────────────────────────────
      let y = 36;

      // ticker badge
      rgb(...sigRgb);
      doc.roundedRect(12, y, 28, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(ticker, 26, y + 6.5, { align: "center" });

      // company name
      const companyName = {
        AAPL: "Apple Inc.", MSFT: "Microsoft Corp.",
        AMZN: "Amazon.com Inc.", GOOGL: "Alphabet Inc.", NVDA: "NVIDIA Corp.",
      }[ticker] ?? ticker;

      text(companyName, 44, y + 4, { size: 11, bold: true });
      text("NASDAQ · Common Stock · XGBoost AI Model", 44, y + 9, {
        size: 7.5, color: [130, 130, 160],
      });

      // price block (right)
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isDark ? 220 : 15, isDark ? 220 : 15, isDark ? 230 : 25);
      doc.text(price, W - 12, y + 8, { align: "right" });

      doc.setFontSize(9);
      const chgColor = isPos ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(...chgColor);
      doc.setFont("helvetica", "bold");
      doc.text(`${isPos ? "▲ +" : "▼ "}${change}  (${isPos ? "+" : ""}${pct}%)`, W - 12, y + 14, { align: "right" });

      y += 20;

      // ── divider ──────────────────────────────────────────────────────────
      rgb(isDark ? 40 : 200, isDark ? 40 : 210, isDark ? 60 : 230);
      rect(12, y, W - 24, 0.3);
      y += 5;

      // ── signal card ──────────────────────────────────────────────────────
      rgb(...sigRgb.map(v => Math.min(255, v + (isDark ? -60 : 200))));
      const sigCardAlpha = isDark ? [30, 20, 50] : [240, 242, 255];
      rgb(...sigCardAlpha);
      doc.roundedRect(12, y, W - 24, 14, 2, 2, "F");
      rgb(...sigRgb);
      doc.roundedRect(12, y, W - 24, 14, 2, 2, "S");

      // signal label
      rgb(...sigRgb);
      doc.roundedRect(14, y + 2, 32, 10, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(signal, 30, y + 8, { align: "center" });

      text("Model Signal", 50, y + 5.5, { size: 7.5, color: [130, 130, 160] });
      text(signal, 50, y + 10.5, { size: 9, bold: true, color: sigRgb });

      text("Confidence", 105, y + 5.5, { size: 7.5, color: [130, 130, 160] });
      text(conf, 105, y + 10.5, { size: 9, bold: true });

      text("Predicted Close", 145, y + 5.5, { size: 7.5, color: [130, 130, 160] });
      text(predClose, 145, y + 10.5, { size: 9, bold: true });

      text("Market Cap", 180, y + 5.5, { size: 7.5, color: [130, 130, 160] });
      text(mktCap, 180, y + 10.5, { size: 9, bold: true });

      y += 20;

      // ── four stats cards ─────────────────────────────────────────────────
      const statsCards = [
        { label: "Open",    val: d.open   ? `$${Number(d.open).toFixed(2)}`   : "—" },
        { label: "High",    val: d.high   ? `$${Number(d.high).toFixed(2)}`   : "—", color: [34, 197, 94]   },
        { label: "Low",     val: d.low    ? `$${Number(d.low).toFixed(2)}`    : "—", color: [239, 68, 68]   },
        { label: "Volume",  val: d.volume ? `${(Number(d.volume)/1e6).toFixed(1)}M` : "—" },
      ];
      const cardW = (W - 24 - 9) / 4;

      statsCards.forEach((card, i) => {
        const cx = 12 + i * (cardW + 3);
        const bg = isDark ? [18, 18, 35] : [255, 255, 255];
        rgb(...bg);
        doc.roundedRect(cx, y, cardW, 16, 2, 2, "F");
        rgb(isDark ? 40 : 200, isDark ? 40 : 210, isDark ? 70 : 230);
        doc.roundedRect(cx, y, cardW, 16, 2, 2, "S");

        text(card.label.toUpperCase(), cx + cardW / 2, y + 5.5, {
          size: 6.5, color: [130, 130, 160], align: "center",
        });
        text(card.val, cx + cardW / 2, y + 12, {
          size: 10, bold: true, color: card.color, align: "center",
        });
      });

      y += 22;

      // ── price chart (drawn from history data) ────────────────────────────
      const sectionTitle = (label, yPos) => {
        rgb(...sigRgb);
        rect(12, yPos, 3, 5);
        text(label, 17, yPos + 4, { size: 9, bold: true });
        return yPos + 9;
      };

      y = sectionTitle("Price History Chart", y);

      const chartH = 42;
      const chartX = 12, chartY = y, chartW = W - 24;

      // chart bg
      rgb(isDark ? 15 : 248, isDark ? 15 : 249, isDark ? 28 : 252);
      doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, "F");
      rgb(isDark ? 40 : 200, isDark ? 40 : 210, isDark ? 70 : 230);
      doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, "S");

      if (history.length > 1) {
        const closes = history.map(h => Number(h.close)).filter(v => !isNaN(v) && v > 0);
        const forecasts = history.map(h => Number(h.predicted_close)).filter(v => !isNaN(v) && v > 0);

        const pad = 6;
        const allVals = [...closes, ...forecasts];
        const minV = Math.min(...allVals) * 0.998;
        const maxV = Math.max(...allVals) * 1.002;

        const sx = (i, total) => chartX + pad + (i / Math.max(total - 1, 1)) * (chartW - pad * 2);
        const sy = (v) => chartY + chartH - pad - ((v - minV) / (maxV - minV)) * (chartH - pad * 2);

        // grid lines (3 horizontal)
        doc.setDrawColor(isDark ? 40 : 200, isDark ? 40 : 210, isDark ? 60 : 225);
        doc.setLineWidth(0.2);
        [0, 0.5, 1].forEach(t => {
          const gv = minV + t * (maxV - minV);
          const gy = sy(gv);
          doc.line(chartX + pad, gy, chartX + chartW - pad, gy);
          doc.setFontSize(5.5);
          doc.setTextColor(130, 130, 160);
          doc.text(`$${gv.toFixed(0)}`, chartX + pad - 1, gy + 1.5, { align: "right" });
        });

        // area fill (approximate with filled polygon)
        if (closes.length > 1) {
          const pts = closes.map((v, i) => [sx(i, closes.length), sy(v)]);
          const last = pts[pts.length - 1];
          const first = pts[0];

          doc.setFillColor(139, 92, 246, 0.15);
          doc.setDrawColor(139, 92, 246);
          doc.setLineWidth(0.8);

          // draw line
          doc.lines(
            pts.slice(1).map(([x2, y2], i) => [x2 - pts[i][0], y2 - pts[i][1]]),
            pts[0][0], pts[0][1]
          );
        }

        // actual line (purple)
        if (history.length > 1) {
  const closes = history
    .map(h => Number(h.close))
    .filter(v => !isNaN(v) && v > 0);
  const forecasts = history
    .map(h => Number(h.predicted_close))
    .filter(v => !isNaN(v) && v > 0);

  const pad  = 8;
  const allV = [...closes, ...forecasts];
  const minV = Math.min(...allV) * 0.998;
  const maxV = Math.max(...allV) * 1.002;

  const sx = (i, total) =>
    chartX + pad + (i / Math.max(total - 1, 1)) * (chartW - pad * 2);
  const sy = (v) =>
    chartY + chartH - pad - ((v - minV) / (maxV - minV)) * (chartH - pad * 2);

  // grid lines
  doc.setLineWidth(0.2);
  [0, 0.5, 1].forEach(t => {
    const gv = minV + t * (maxV - minV);
    const gy = sy(gv);
    doc.setDrawColor(isDark ? 40 : 200, isDark ? 40 : 210, isDark ? 60 : 225);
    doc.line(chartX + pad, gy, chartX + chartW - pad, gy);
    doc.setFontSize(5.5);
    doc.setTextColor(130, 130, 160);
    doc.text(`$${gv.toFixed(0)}`, chartX + pad - 1, gy + 1.5, { align: "right" });
  });

  // actual price line — draw segment by segment
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.9);
  doc.setLineDashPattern([], 0);
  for (let i = 1; i < closes.length; i++) {
    doc.line(
      sx(i - 1, closes.length), sy(closes[i - 1]),
      sx(i,     closes.length), sy(closes[i])
    );
  }

  // forecast dashed line
  if (forecasts.length > 1) {
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.7);
    doc.setLineDashPattern([1, 1], 0);
    const total = closes.length + forecasts.length - 1;
    for (let i = 1; i < forecasts.length; i++) {
      doc.line(
        sx(closes.length - 1 + (i - 1), total), sy(forecasts[i - 1]),
        sx(closes.length - 1 + i,       total), sy(forecasts[i])
      );
    }
    doc.setLineDashPattern([], 0);
  }

  // live dot at last actual price
  const dotX2 = sx(closes.length - 1, closes.length);
  const dotY2 = sy(closes[closes.length - 1]);
  doc.setFillColor(245, 158, 11);
  doc.circle(dotX2, dotY2, 1.2, "F");

  // legend
  doc.setFontSize(6);
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.8);
  doc.line(chartX + chartW - 42, chartY + 4, chartX + chartW - 36, chartY + 4);
  doc.setTextColor(139, 92, 246);
  doc.text("Actual", chartX + chartW - 34, chartY + 5.5);

  doc.setDrawColor(217, 119, 6);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(chartX + chartW - 42, chartY + 10, chartX + chartW - 36, chartY + 10);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(217, 119, 6);
  doc.text("Forecast", chartX + chartW - 34, chartY + 11.5);

} else {
  doc.setTextColor(130, 130, 160);
  doc.setFontSize(8);
  doc.text(
    "No price history data available",
    chartX + chartW / 2, chartY + chartH / 2,
    { align: "center" }
  );
}

        // forecast line (amber dashed)
        if (forecasts.length > 1) {
          doc.setDrawColor(217, 119, 6);
          doc.setLineWidth(0.7);
          doc.setLineDashPattern([1, 1], 0);
          for (let i = 1; i < forecasts.length; i++) {
            const startI = closes.length - 1 + (i - 1);
            const endI   = closes.length - 1 + i;
            const total  = closes.length + forecasts.length - 1;
            doc.line(sx(startI, total), sy(forecasts[i-1]), sx(endI, total), sy(forecasts[i]));
          }
          doc.setLineDashPattern([], 0);
        }

        // live dot
        const dotX2 = sx(closes.length - 1, closes.length);
        const dotY2 = sy(closes[closes.length - 1]);
        doc.setFillColor(245, 158, 11);
        doc.circle(dotX2, dotY2, 1.2, "F");

        // legend
        doc.setFontSize(6);
        doc.setDrawColor(139, 92, 246); doc.setLineWidth(0.8);
        doc.line(chartX + chartW - 40, chartY + 4, chartX + chartW - 34, chartY + 4);
        doc.setTextColor(139, 92, 246);
        doc.text("Actual", chartX + chartW - 32, chartY + 5.5);

        doc.setDrawColor(217, 119, 6); doc.setLineDashPattern([1,1],0);
        doc.line(chartX + chartW - 40, chartY + 10, chartX + chartW - 34, chartY + 10);
        doc.setLineDashPattern([],0);
        doc.setTextColor(217, 119, 6);
        doc.text("Forecast", chartX + chartW - 32, chartY + 11.5);
      } else {
        doc.setTextColor(130, 130, 160);
        doc.setFontSize(8);
        doc.text("No price history data available", chartX + chartW / 2, chartY + chartH / 2, { align: "center" });
      }

      y += chartH + 6;

      // ── forecast section ─────────────────────────────────────────────────
      y = sectionTitle("Forecast Summary", y);

      const forecasts3 = [
        { label: "1-Day",  fc: d.forecast_1d  },
        { label: "5-Day",  fc: d.forecast_5d  },
        { label: "30-Day", fc: d.forecast_30d },
      ];
      const fcW = (W - 24 - 6) / 3;

      forecasts3.forEach(({ label, fc }, i) => {
        const fx = 12 + i * (fcW + 3);
        const sig2 = fc?.signal ?? "NEUTRAL";
        const col2 = SIGNAL_COLOR[sig2] ?? [217, 119, 6];
        const conf2 = fc ? `${(fc.confidence * 100).toFixed(0)}%` : "—";

        // card bg
        const bg2 = isDark ? [15, 12, 30] : [255, 255, 255];
        rgb(...bg2);
        doc.roundedRect(fx, y, fcW, 22, 2, 2, "F");
        rgb(...col2);
        doc.setLineWidth(0.4);
        doc.roundedRect(fx, y, fcW, 22, 2, 2, "S");

        // top accent line
        rgb(...col2);
        rect(fx, y, fcW, 1.5);

        text(label + " Forecast", fx + fcW / 2, y + 7, {
          size: 7.5, bold: true, color: [130, 130, 160], align: "center",
        });

        // signal badge
        rgb(...col2);
        doc.roundedRect(fx + fcW/2 - 14, y + 9.5, 28, 7, 1.5, 1.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(sig2, fx + fcW / 2, y + 14.5, { align: "center" });

        text(`Conf: ${conf2}`, fx + fcW / 2, y + 20, {
          size: 6.5, color: [130, 130, 160], align: "center",
        });
      });

      y += 28;

      // ── news sentiment section ────────────────────────────────────────────
      y = sectionTitle("Sentiment Analysis · Recent Headlines", y);

      const newsItems = [
        { source: "Bloomberg",   sentiment: "Positive", score: "+0.91", headline: "Record iPhone sales in Q2 beat analyst expectations by 8%" },
        { source: "Reuters",     sentiment: "Positive", score: "+0.76", headline: "Fed signals rate cuts could boost tech sector valuations"   },
        { source: "CNBC",        sentiment: "Negative", score: "-0.68", headline: "Supply chain concerns in Asia may limit production capacity" },
        { source: "WSJ",         sentiment: "Positive", score: "+0.83", headline: "Vision Pro gaining traction in enterprise market"           },
        { source: "FT",          sentiment: "Negative", score: "-0.22", headline: "Regulatory scrutiny on App Store continues in EU"           },
      ];

      const sentimentColors = {
        Positive: [34, 197, 94],
        Negative: [239, 68, 68],
        Neutral:  [163, 163, 163],
      };

      newsItems.forEach((n, i) => {
        const ny = y + i * 8;
        const sc = sentimentColors[n.sentiment] ?? [163, 163, 163];

        // alternate row bg
        if (i % 2 === 0) {
          rgb(isDark ? 18 : 245, isDark ? 18 : 247, isDark ? 35 : 252);
          rect(12, ny - 1, W - 24, 8);
        }

        // sentiment dot
        rgb(...sc);
        doc.circle(16, ny + 2.5, 1.5, "F");

        text(n.source, 20, ny + 4, { size: 6.5, bold: true, color: [130, 130, 160] });
        text(n.headline, 42, ny + 4, { size: 6.5 });

        // score badge
        rgb(...sc.map(v => isDark ? Math.max(0, v - 160) : Math.min(255, v + 180)));
        doc.roundedRect(W - 28, ny, 16, 6, 1, 1, "F");
        doc.setTextColor(...sc);
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.text(n.score, W - 20, ny + 4.2, { align: "center" });
      });

      y += newsItems.length * 8 + 6;

      // ── model performance ────────────────────────────────────────────────
      y = sectionTitle("Model Performance Metrics", y);

      const metrics = [
        { label: "Accuracy",  val: "83.2%", highlight: true  },
        { label: "F1 Score",  val: "0.814", highlight: true  },
        { label: "RMSE",      val: "2.14",  highlight: false },
        { label: "MAE",       val: "1.87",  highlight: false },
        { label: "Precision", val: "81.5%", highlight: false },
        { label: "Recall",    val: "79.3%", highlight: false },
      ];
      const mW = (W - 24 - 10) / 6;

      metrics.forEach((m, i) => {
        const mx = 12 + i * (mW + 2);
        const bg3 = isDark ? [15, 12, 30] : [255, 255, 255];
        rgb(...bg3);
        doc.roundedRect(mx, y, mW, 14, 1.5, 1.5, "F");
        rgb(isDark ? 40 : 200, isDark ? 40 : 210, isDark ? 70 : 230);
        doc.setLineWidth(0.3);
        doc.roundedRect(mx, y, mW, 14, 1.5, 1.5, "S");

        text(m.label, mx + mW / 2, y + 5, {
          size: 6, color: [130, 130, 160], align: "center",
        });
        text(m.val, mx + mW / 2, y + 11.5, {
          size: 9, bold: true,
          color: m.highlight ? sigRgb : undefined,
          align: "center",
        });
      });

      y += 20;

      // ── footer ───────────────────────────────────────────────────────────
      rgb(isDark ? 13 : 79, isDark ? 13 : 70, isDark ? 24 : 229);
      rect(0, 285, W, 12);
      rgb(...sigRgb);
      rect(0, 285, W, 0.8);

      doc.setTextColor(180, 180, 200);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        "StockForge · AI-Powered Market Intelligence · This report is generated algorithmically and is not financial advice.",
        W / 2, 291.5, { align: "center" }
      );
      doc.setTextColor(255, 255, 255);
      doc.text(`Page 1 of 1`, W - 12, 291.5, { align: "right" });

      // ── save ──────────────────────────────────────────────────────────────
      const filename = `StockForge_${ticker}_${now.toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);

    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Check the console for details.");
    } finally {
      setExporting(false);
    }
  };

  /* ── styles ─────────────────────────────────────────────────────────────── */
  const styles = {
    nav: {
      background:   isDark ? "#0d0d18" : "#ffffff",
      borderBottom: `1px solid ${isDark ? "#1a1a28" : "#dde4ef"}`,
      display:      "grid",
      gridTemplateColumns: "200px 1fr auto",
      alignItems:   "center",
      padding:      "0 16px",
      height:       44,
      position:     "sticky",
      top:          0,
      zIndex:       100,
      transition:   "background 0.25s, border-color 0.25s",
      fontFamily:   mono,
    },
    logo: {
      display:    "flex",
      alignItems: "center",
      gap:        8,
      fontWeight: 700,
      fontSize:   13,
      color:      isDark ? "#e2e2e2" : "#0f172a",
      cursor:     "pointer",
    },
    logoIcon: {
      width:          22,
      height:         22,
      borderRadius:   5,
      background:     isDark
        ? "linear-gradient(135deg,#6d28d9,#4f46e5)"
        : "linear-gradient(135deg,#4f46e5,#6d28d9)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       10,
      fontWeight:     900,
      color:          "#fff",
      flexShrink:     0,
    },
    accent: { color: isDark ? "#8b5cf6" : "#4f46e5" },
    links: {
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      gap:            2,
    },
    right: {
      display:    "flex",
      alignItems: "center",
      gap:        8,
    },
  };

  const btnStyle = (isActive) => ({
    fontFamily:  mono,
    fontSize:    12,
    fontWeight:  isActive ? 600 : 400,
    color:       isActive
      ? (isDark ? "#e2e2e2" : "#0f172a")
      : (isDark ? "#666"    : "#64748b"),
    background:  isActive
      ? (isDark ? "#1e1e30" : "#e8edf7")
      : "transparent",
    border:      "none",
    outline:     "none",
    borderRadius: 5,
    padding:     "4px 14px",
    cursor:      "pointer",
    transition:  "all 0.15s",
  });

  const toggleStyle = {
    fontFamily:  mono,
    fontSize:    11,
    fontWeight:  600,
    padding:     "4px 12px",
    borderRadius: 5,
    cursor:      "pointer",
    border:      `1px solid ${isDark ? "#1e1e2e" : "#c8d4e8"}`,
    background:  isDark ? "#1e1e30" : "#e8edf7",
    color:       isDark ? "#e2e2e2" : "#0f172a",
    display:     "flex",
    alignItems:  "center",
    gap:         5,
    whiteSpace:  "nowrap",
    transition:  "all 0.2s",
  };

  const exportStyle = {
    fontFamily:   mono,
    fontSize:     11,
    fontWeight:   600,
    padding:      "4px 12px",
    borderRadius: 5,
    cursor:       exporting ? "not-allowed" : "pointer",
    border:       `1px solid ${isDark ? "#3b82f688" : "#3b82f666"}`,
    background:   exporting
      ? (isDark ? "#1a1a28" : "#e8edf7")
      : (isDark ? "#1a2040" : "#eff6ff"),
    color:        exporting
      ? (isDark ? "#555" : "#94a3b8")
      : (isDark ? "#60a5fa" : "#2563eb"),
    whiteSpace:   "nowrap",
    display:      "flex",
    alignItems:   "center",
    gap:          5,
    transition:   "all 0.2s",
    opacity:      exporting ? 0.7 : 1,
  };

  const runStyle = {
    fontFamily:  mono,
    fontSize:    11,
    fontWeight:  700,
    padding:     "5px 14px",
    borderRadius: 5,
    cursor:      "pointer",
    border:      "none",
    background:  isDark
      ? "linear-gradient(135deg,#6d28d9,#4f46e5)"
      : "linear-gradient(135deg,#4f46e5,#6d28d9)",
    color:       "#fff",
    whiteSpace:  "nowrap",
  };

  return (
    <nav style={styles.nav}>

      {/* Logo */}
      <div style={styles.logo} onClick={() => navigate("/")}>
        <div style={styles.logoIcon}>SF</div>
        <span>Stock<span style={styles.accent}>Forge</span></span>
      </div>

      {/* Nav links */}
      <div style={styles.links}>
        {NAV_ITEMS.map(({ label, path }) => {
          const isActive = activeLabel
            ? activeLabel === label
            : location.pathname === path;
          return (
            <button key={label} style={btnStyle(isActive)} onClick={() => navigate(path)}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Right side */}
      <div style={styles.right}>
        <button style={toggleStyle} onClick={onToggle}>
          {isDark ? "☀ Light" : "☽ Dark"}
        </button>

        {/* Export PDF */}
        <button style={exportStyle} onClick={handleExportPDF} disabled={exporting}>
          {exporting ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 11 }}>⟳</span>
              Exporting…
            </>
          ) : (
            <>
              ↓ Export PDF
            </>
          )}
        </button>

        <button style={runStyle}>Run Analysis</button>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </nav>
  );
}

/* ── helper: load external script once ──────────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}