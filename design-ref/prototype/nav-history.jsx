/* @jsx React.createElement */
// FlowBase — global nav history (back/forward + recent history dropdown)

const { useState: useNvS, useEffect: useNvE, useRef: useNvR } = React;

// In-memory + sessionStorage-backed history stack
function NavHistoryProvider() {}

function useNavHistory() {
  const [stack, setStack] = useNvS([]);
  const [index, setIndex] = useNvS(-1);

  const push = (entry) => {
    setStack(prev => {
      // Drop forward stack if user is mid-history
      const base = prev.slice(0, index + 1);
      // Avoid pushing duplicate consecutive entries
      const last = base[base.length - 1];
      if (last && last.key === entry.key) return base;
      const next = [...base, entry].slice(-50); // cap 50
      return next;
    });
    setIndex(i => Math.min(i + 1, 49));
  };

  const goBack = () => {
    if (index > 0) {
      const target = stack[index - 1];
      setIndex(i => i - 1);
      return target;
    }
    return null;
  };
  const goForward = () => {
    if (index < stack.length - 1) {
      const target = stack[index + 1];
      setIndex(i => i + 1);
      return target;
    }
    return null;
  };

  const canBack = index > 0;
  const canForward = index < stack.length - 1;

  return { stack, index, push, goBack, goForward, canBack, canForward };
}

// Render the [⏰] [<] [>] cluster
const NavCluster = ({ canBack, canForward, onBack, onForward, history, onJump }) => {
  const [openHistory, setOpenHistory] = useNvS(false);
  const wrap = useNvR(null);
  useNvE(() => {
    if (!openHistory) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) setOpenHistory(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openHistory]);

  const btn = (active, onClick, title, children) => (
    <button onClick={onClick} title={title} disabled={!active} style={{
      width: 26, height: 26, borderRadius: 5, border: "1px solid var(--border-subtle)",
      background: "var(--card)", color: active ? "var(--muted-foreground)" : "var(--muted-foreground)",
      cursor: active ? "pointer" : "default", opacity: active ? 1 : 0.35,
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}
    onMouseEnter={(e) => { if (active) { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--foreground)"; } }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.color = "var(--muted-foreground)"; }}>
      {children}
    </button>
  );

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
      <div ref={wrap} style={{ position: "relative" }}>
        {btn(history && history.length > 0, () => setOpenHistory(o => !o), "Recent history", (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
        ))}
        {openHistory && history && history.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0,
            width: 280, padding: 4, zIndex: 200,
            background: "var(--popover)", border: "1px solid var(--border)",
            borderRadius: 7, boxShadow: "var(--shadow-popover)",
            maxHeight: 360, overflowY: "auto",
          }} className="fb-scroll">
            <div style={{
              padding: "6px 10px 4px",
              fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "var(--muted-foreground)",
            }}>Recent</div>
            {[...history].reverse().slice(0, 20).map((h, i) => (
              <button key={h.key + "-" + i} onClick={() => { onJump(h); setOpenHistory(false); }} style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "6px 10px", border: "none",
                background: "transparent", color: "var(--foreground)",
                textAlign: "left", cursor: "pointer", borderRadius: 5, fontSize: 12.5,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: "var(--muted)", color: "var(--muted-foreground)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, flexShrink: 0,
                }}>{h.icon || "·"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.label}</div>
                  {h.sub && (
                    <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.sub}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {btn(canBack, onBack, "Back (⌘[)", (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      ))}
      {btn(canForward, onForward, "Forward (⌘])", (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      ))}
    </div>
  );
};

Object.assign(window, { useNavHistory, NavCluster });
