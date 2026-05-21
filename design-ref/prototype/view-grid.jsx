/* @jsx React.createElement */
// FlowBase — Gallery / Card grid view. Per-table card renderer.

const GridView = ({ rows, cardConfig, onSelectRow, selectedIds = [], onSelect }) => {
  if (!cardConfig) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: 13, padding: 24, textAlign: "center" }}>
        No Gallery layout configured for this table yet.
      </div>
    );
  }
  const toggleSel = (e, id) => {
    e.stopPropagation();
    if (!onSelect) return;
    const has = selectedIds.includes(id);
    onSelect(has ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };
  return (
    <div className="fb-scroll" style={{
      flex: 1, overflow: "auto", padding: 16,
      background: "var(--background)",
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${cardConfig.minWidth || 240}px, 1fr))`,
      gap: 12,
      alignContent: "start",
    }}>
      {rows.map(row => {
        const selected = selectedIds.includes(row.id);
        return (
        <div key={row.id} onClick={(e) => toggleSel(e, row.id)} style={{
          position: "relative",
          background: "var(--card)",
          border: "1px solid " + (selected ? "var(--primary)" : "var(--border)"),
          borderRadius: 10, padding: 14, cursor: "pointer",
          display: "flex", flexDirection: "column", gap: 8,
          boxShadow: selected ? "0 0 0 1px var(--primary)" : "none",
          transition: "border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease",
        }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "color-mix(in oklch, var(--primary) 35%, var(--border))"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = selected ? "0 0 0 1px var(--primary), var(--shadow-md)" : "var(--shadow-md)"; }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = selected ? "0 0 0 1px var(--primary)" : "none"; }}>
          <input type="checkbox"
            checked={selected}
            onChange={(e) => toggleSel(e, row.id)}
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", top: 10, left: 10, margin: 0, cursor: "pointer", zIndex: 1 }} />
          <div style={{ paddingLeft: 20 }}>
            {cardConfig.render(row)}
          </div>
        </div>
        );
      })}
      {rows.length === 0 && (
        <div style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--border)", borderRadius: 8, fontSize: 13 }}>
          No items.
        </div>
      )}
    </div>
  );
};

Object.assign(window, { GridView });
