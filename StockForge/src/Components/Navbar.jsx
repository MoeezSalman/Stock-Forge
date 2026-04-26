import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard",   path: "/" },
  { label: "Predictions", path: "/alpha" },
  { label: "Sentiment",   path: "/sentiment" },
  { label: "Model",       path: "/model" },
];

/**
 * Props:
 *  isDark      boolean   — current theme state
 *  onToggle    fn        — called when theme button clicked
 *  activeLabel string    — which nav item to highlight  e.g. "Dashboard"
 *                          if omitted, auto-detected from URL
 */
export default function Navbar({ isDark, onToggle, activeLabel }) {
  const navigate = useNavigate();
  const location = useLocation();

  const mono = "'JetBrains Mono','Fira Code','Courier New',monospace";

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
    fontFamily:  mono,
    fontSize:    11,
    fontWeight:  600,
    padding:     "4px 12px",
    borderRadius: 5,
    cursor:      "pointer",
    border:      `1px solid ${isDark ? "#1e1e2e" : "#c8d4e8"}`,
    background:  isDark ? "#1a1a28" : "#e8edf7",
    color:       isDark ? "#666"    : "#334155",
    whiteSpace:  "nowrap",
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
        <div style={styles.logoIcon}>AS</div>
        <span>
          Alpha<span style={styles.accent}>Signal</span>
        </span>
      </div>

      {/* Nav links */}
      <div style={styles.links}>
        {NAV_ITEMS.map(({ label, path }) => {
          const isActive = activeLabel
            ? activeLabel === label
            : location.pathname === path;

          return (
            <button
              key={label}
              style={btnStyle(isActive)}
              onClick={() => navigate(path)}
            >
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
        <button style={exportStyle}>Export CSV</button>
        <button style={runStyle}>Run Analysis</button>
      </div>

    </nav>
  );
}