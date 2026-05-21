/* @jsx React.createElement */
// FlowBase — Right-click context menu (cell / row / column / chart)

const { useState: useCmS, useEffect: useCmE, useRef: useCmR } = React;

const ContextMenu = ({ x, y, items, onClose }) => {
  const ref = useCmR(null);
  useCmE(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", h);
    document.addEventListener("contextmenu", (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); });
    function k(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [onClose]);

  // Clamp to viewport
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = 220, h = items.length * 30 + 12;
  const left = Math.min(x, vw - w - 8);
  const top = Math.min(y, vh - h - 8);

  return (
    <div ref={ref} style={{
      position: "fixed", left, top, width: w, zIndex: 3000,
      padding: 4,
      background: "var(--popover)", border: "1px solid var(--border)",
      borderRadius: 7, boxShadow: "var(--shadow-popover), 0 8px 24px rgba(0,0,0,0.16)",
      fontSize: 12.5,
    }}>
      {items.map((it, i) => {
        if (it.type === "separator") return <div key={i} style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />;
        return (
          <button key={i} onClick={() => { it.onClick(); onClose(); }}
            disabled={it.disabled} style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "6px 10px", border: "none",
              background: "transparent", borderRadius: 5,
              color: it.destructive ? "var(--destructive)" : "var(--foreground)",
              textAlign: "left", cursor: it.disabled ? "default" : "pointer",
              opacity: it.disabled ? 0.4 : 1, fontSize: 12.5,
            }}
            onMouseEnter={(e) => { if (!it.disabled) e.currentTarget.style.background = "var(--hover-bg)"; }}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ width: 14, color: "var(--muted-foreground)", flexShrink: 0, fontSize: 11 }}>{it.icon || ""}</span>
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.shortcut && <span className="fb-kbd" style={{ fontSize: 10, padding: "1px 4px" }}>{it.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
};

Object.assign(window, { ContextMenu });
