/* @jsx React.createElement */
// FlowBase — Linear-style Filter / Display popovers + right Detail Bar.

const { useState: useVcS, useEffect: useVcE, useRef: useVcR, useMemo: useVcM } = React;

// ─────────────────────────────────────────────────────────────
// Shared: popover button wrapper (used by FilterMenu, DisplayMenu)
// ─────────────────────────────────────────────────────────────

function useClickOutside(ref, onClose, open) {
  useVcE(() => {
    if (!open) return;
    function h(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
}

const ToolbarIconButton = React.forwardRef(({ active, onClick, title, children }, ref) => (
  <button ref={ref} onClick={onClick} title={title} style={{
    width: 28, height: 28, borderRadius: 6,
    border: "1px solid " + (active ? "var(--border)" : "var(--border-subtle)"),
    background: active ? "var(--active-bg-strong)" : "transparent",
    color: active ? "var(--foreground)" : "var(--muted-foreground)",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
    transition: "background 120ms ease, color 120ms ease",
  }}
  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-bg)"; }}
  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
    {children}
  </button>
));

// ─────────────────────────────────────────────────────────────
// Filter menu (popover)  —  Linear-style "Add Filter..."
// ─────────────────────────────────────────────────────────────

const FilterMenu = ({
  rows, columns, statusFilter, onChangeStatus, priorityFilter, onChangePriority,
  themeFilter, onChangeTheme, sentimentFilter, onChangeSentiment,
}) => {
  const [open, setOpen] = useVcS(false);
  const [sub, setSub] = useVcS(null);   // "status" | "priority" | "theme" | "sentiment" | null
  const wrap = useVcR(null);
  useClickOutside(wrap, () => { setOpen(false); setSub(null); }, open);

  const hasStatus    = !!columns.find(c => c.name === "status");
  const hasPriority  = !!columns.find(c => c.name === "priority");
  const hasTheme     = !!columns.find(c => c.name === "theme");
  const hasSentiment = !!columns.find(c => c.name === "sentiment");

  const totalActive = (statusFilter?.size || 0) + (priorityFilter?.size || 0)
                    + (themeFilter?.size || 0) + (sentimentFilter?.size || 0);

  const PRIORITIES  = ["Urgent", "High", "Med", "Low"];
  const THEMES_LIST = ["Pricing pushback", "Onboarding friction", "Feature: AI columns", "Sheet performance", "Sharing & roles", "Other"];
  const SENTIMENTS  = ["Positive", "Mixed", "Negative"];

  const filterableFields = [
    hasStatus    && { id: "status",    label: "Status",    Glyph: IconCircleHalf },
    hasPriority  && { id: "priority",  label: "Priority",  Glyph: IconSignalHigh },
    hasTheme     && { id: "theme",     label: "Theme",     Glyph: IconList },
    hasSentiment && { id: "sentiment", label: "Sentiment", Glyph: IconSparkles },
  ].filter(Boolean);

  const STATUS_OPTS = ["todo", "progress", "waiting", "done"];

  const renderSub = () => {
    if (!sub) return null;
    if (sub === "status") {
      return (
        <CheckboxList
          title="Status"
          options={STATUS_OPTS.map(s => ({ id: s, label: STATUS[s].label, Glyph: STATUS[s].icon, count: rows.filter(r => r.status === s).length }))}
          selected={statusFilter}
          onChange={onChangeStatus}
          onBack={() => setSub(null)}
        />
      );
    }
    if (sub === "priority") {
      return (
        <CheckboxList
          title="Priority"
          options={PRIORITIES.map(p => ({ id: p, label: p, count: rows.filter(r => r.priority === p).length }))}
          selected={priorityFilter}
          onChange={onChangePriority}
          onBack={() => setSub(null)}
        />
      );
    }
    if (sub === "theme") {
      return (
        <CheckboxList
          title="Theme"
          options={THEMES_LIST.map(t => ({ id: t, label: t, count: rows.filter(r => r.theme === t).length }))}
          selected={themeFilter}
          onChange={onChangeTheme}
          onBack={() => setSub(null)}
        />
      );
    }
    if (sub === "sentiment") {
      return (
        <CheckboxList
          title="Sentiment"
          options={SENTIMENTS.map(s => ({ id: s, label: s, count: rows.filter(r => r.sentiment === s).length }))}
          selected={sentimentFilter}
          onChange={onChangeSentiment}
          onBack={() => setSub(null)}
        />
      );
    }
  };

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <ToolbarIconButton active={open || totalActive > 0} onClick={() => setOpen(o => !o)} title="Filter (F)">
        <IconFilter size={14} />
        {totalActive > 0 && (
          <span style={{
            position: "absolute", top: -3, right: -3,
            minWidth: 14, height: 14, padding: "0 3px", borderRadius: 7,
            background: "var(--primary)", color: "var(--primary-foreground)",
            fontSize: 9, fontWeight: 700, lineHeight: "14px",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>{totalActive}</span>
        )}
      </ToolbarIconButton>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 240, padding: 4,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 8, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
        }}>
          {!sub ? (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 10px 6px",
                fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--muted-foreground)",
              }}>
                <span>Add Filter...</span>
                <div style={{ flex: 1 }} />
                <span className="fb-kbd" style={{ textTransform: "none", letterSpacing: 0 }}>F</span>
              </div>
              {filterableFields.length === 0 && (
                <div style={{ padding: "10px 12px", color: "var(--muted-foreground)", fontSize: 12.5 }}>
                  No filterable columns on this table.
                </div>
              )}
              {filterableFields.map(f => (
                <button key={f.id} onClick={() => setSub(f.id)} style={menuRowStyle()}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <f.Glyph size={13} style={{ color: "var(--muted-foreground)" }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{f.label}</span>
                  <IconChevronRight size={11} style={{ color: "var(--muted-foreground)" }} />
                </button>
              ))}
              {totalActive > 0 && (
                <>
                  <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
                  <button onClick={() => {
                    onChangeStatus?.(new Set()); onChangePriority?.(new Set());
                    onChangeTheme?.(new Set());  onChangeSentiment?.(new Set());
                  }} style={menuRowStyle()}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <IconX size={12} style={{ color: "var(--muted-foreground)" }} />
                    <span style={{ flex: 1, fontSize: 13, color: "var(--muted-foreground)" }}>Clear all filters</span>
                  </button>
                </>
              )}
            </>
          ) : renderSub()}
        </div>
      )}
    </div>
  );
};

const menuRowStyle = () => ({
  display: "flex", alignItems: "center", gap: 9,
  width: "100%", padding: "6px 10px",
  border: "none", background: "transparent", borderRadius: 5, cursor: "pointer",
  color: "var(--foreground)", textAlign: "left",
});

const CheckboxList = ({ title, options, selected, onChange, onBack }) => {
  return (
    <>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 10px 6px",
        fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--muted-foreground)",
        width: "100%", border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
      }}>
        <IconChevronLeft size={11} />
        <span>{title}</span>
      </button>
      <div style={{ maxHeight: 260, overflowY: "auto" }} className="fb-scroll">
        {options.map(o => {
          const on = selected?.has(o.id);
          return (
            <button key={o.id} onClick={() => {
              const next = new Set(selected || []);
              if (next.has(o.id)) next.delete(o.id); else next.add(o.id);
              onChange(next);
            }} style={menuRowStyle()}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <span style={{
                width: 14, height: 14, borderRadius: 3,
                border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
                background: on ? "var(--primary)" : "transparent",
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {on && <IconCheck size={9} style={{ color: "var(--primary-foreground)" }} />}
              </span>
              {o.Glyph && <o.Glyph size={12} style={{ color: "var(--muted-foreground)" }} />}
              <span style={{ flex: 1, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>
              <span className="fb-tnum" style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{o.count}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Display menu (popover)  —  Linear-style "Display"
//   View type tabs · Grouping · Ordering · Display properties (column visibility) · Row height · Cell style
// ─────────────────────────────────────────────────────────────

const VIEW_TYPES = [
  { id: "sheet",    label: "Sheet",     Glyph: IconSheet },
  { id: "kanban",   label: "Board",     Glyph: IconKanban },
  { id: "chart",    label: "Dashboard", Glyph: IconChart },
  { id: "grid",     label: "Gallery",   Glyph: IconTable },
  { id: "timeline", label: "Timeline",  Glyph: IconCalendar },
];

// ─────────────────────────────────────────────────────────────
// Quick-fix specs — what column to add to unlock each missing view
// ─────────────────────────────────────────────────────────────

function quickFixFor(viewId) {
  if (viewId === "kanban") {
    return {
      label: "Add Status column",
      spec: { kind: "basic", name: "status", label: "Status", type: "status", width: 120 },
    };
  }
  if (viewId === "chart") {
    return {
      label: "Add Category column",
      spec: { kind: "basic", name: "category", label: "Category", type: "select", width: 140 },
    };
  }
  if (viewId === "timeline") {
    return {
      label: "Add Date column",
      spec: { kind: "basic", name: "date", label: "Date", type: "date", width: 110 },
    };
  }
  return null;
}

const DisplayMenu = ({
  view, onChangeView,
  enabledViews, onToggleView,
  viewSupport,
  groupBy, onChangeGroupBy,
  sort, onSort,
  rowHeight, onChangeRowHeight,
  cellStyle, onChangeCellStyle,
  newRowPosition, onChangeNewRowPosition,
  wordWrap, onChangeWordWrap,
  columns, hiddenCols, onToggleCol, onResetCols,
  onAddColumn,
}) => {
  const [open, setOpen] = useVcS(false);
  const wrap = useVcR(null);
  useClickOutside(wrap, () => setOpen(false), open);

  const visibleViews = VIEW_TYPES.filter(v => enabledViews.has(v.id));

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <ToolbarIconButton active={open} onClick={() => setOpen(o => !o)} title="Display">
        <IconSliders size={14} />
      </ToolbarIconButton>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 320, padding: 14,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 10, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
          maxHeight: "min(560px, calc(100vh - 120px))",
          overflowY: "auto",
        }} className="fb-scroll">
          {/* View type tabs (the user's primary ask) — wraps to 2 rows when needed */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
            gap: 4, padding: 3,
            background: "var(--muted)", borderRadius: 8,
            border: "1px solid var(--border-subtle)", marginBottom: 12,
          }}>
            {visibleViews.map(v => {
              const on = v.id === view;
              return (
                <button key={v.id} onClick={() => onChangeView(v.id)} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "6px 6px", borderRadius: 6, border: "none",
                  background: on ? "var(--surface-elevated)" : "transparent",
                  color: on ? "var(--foreground)" : "var(--muted-foreground)",
                  fontSize: 12, fontWeight: on ? 600 : 500,
                  cursor: "pointer", boxShadow: on ? "var(--shadow-sm)" : "none",
                  minWidth: 0, whiteSpace: "nowrap",
                  transition: "background 120ms ease, color 120ms ease",
                }} title={v.label}>
                  <v.Glyph size={12} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grouping */}
          <DisplayRow label="Grouping">
            <InlineSelect
              value={groupBy || "none"}
              onChange={onChangeGroupBy}
              options={[
                { id: "none", label: "No grouping" },
                ...columns.filter(c => ["status", "priority", "select"].includes(c.type))
                  .map(c => ({ id: c.name, label: c.label.trim() || c.name })),
              ]}
            />
          </DisplayRow>

          {/* Ordering */}
          <DisplayRow label="Ordering">
            <InlineSelect
              value={sort.key}
              onChange={(k) => onSort(k, "set")}
              options={columns.filter(c => c.type !== "button").map(c => ({ id: c.name, label: c.label.trim() || c.name }))}
              suffix={
                <button onClick={() => onSort(sort.key, "toggleDir")} style={{
                  width: 20, height: 20, padding: 0, border: "none", borderRadius: 4,
                  background: "transparent", color: "var(--muted-foreground)",
                  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                }} title="Toggle direction"
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  {sort.dir === "asc" ? "↑" : "↓"}
                </button>
              }
            />
          </DisplayRow>

          {/* Row height (sheet only) */}
          {view === "sheet" && (
            <DisplayRow label="Row height">
              <PillRow value={rowHeight} onChange={onChangeRowHeight} options={[
                { id: "short",  label: "Short" },
                { id: "medium", label: "Medium" },
                { id: "tall",   label: "Tall" },
              ]} />
            </DisplayRow>
          )}

          {/* Cell style (sheet only) */}
          {view === "sheet" && (
            <DisplayRow label="Cell style">
              <PillRow value={cellStyle} onChange={onChangeCellStyle} options={[
                { id: "default", label: "Default" },
                { id: "bold",    label: "Bold" },
                { id: "muted",   label: "Muted" },
              ]} />
            </DisplayRow>
          )}

          {/* Word wrap toggle (sheet only) */}
          {view === "sheet" && onChangeWordWrap && (
            <DisplayRow label="Word wrap">
              <PillRow value={wordWrap ? "on" : "off"} onChange={(v) => onChangeWordWrap(v === "on")} options={[
                { id: "off", label: "Off" },
                { id: "on",  label: "On" },
              ]} />
            </DisplayRow>
          )}

          {/* New row position */}
          {onChangeNewRowPosition && (
            <DisplayRow label="New row">
              <PillRow value={newRowPosition || "top"} onChange={onChangeNewRowPosition} options={[
                { id: "top",    label: "Top" },
                { id: "bottom", label: "Bottom" },
              ]} />
            </DisplayRow>
          )}

          {/* Available views — tri-state pills: enabled / opt-in / unavailable */}
          <SectionHeader>Available views</SectionHeader>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {VIEW_TYPES.map(v => {
              const support = viewSupport?.[v.id] || { supported: true };
              const enabled = enabledViews.has(v.id);
              const required = v.id === "sheet";
              const unavailable = !support.supported;

              // Tone
              let bg, fg, border, opacity = 1;
              if (unavailable) {
                bg = "transparent"; fg = "var(--muted-foreground)";
                border = "1px dashed var(--border-subtle)"; opacity = 0.55;
              } else if (enabled) {
                bg = "var(--active-bg-strong)"; fg = "var(--foreground)";
                border = "1px solid transparent";
              } else {
                bg = "transparent"; fg = "var(--muted-foreground)";
                border = "1px solid var(--border-subtle)";
              }

              const tooltip = unavailable
                ? `Unavailable — ${support.hint || support.reason}`
                : (required ? "Always available" : (enabled ? "Click to hide from view switcher" : "Click to show in view switcher"));

              return (
                <button
                  key={v.id}
                  onClick={() => !unavailable && !required && onToggleView(v.id)}
                  disabled={unavailable || required}
                  title={tooltip}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 9px", borderRadius: 999,
                    border, background: bg, color: fg, opacity,
                    fontSize: 11.5, fontWeight: 500,
                    cursor: unavailable || required ? "default" : "pointer",
                    position: "relative",
                  }}>
                  <v.Glyph size={10} />
                  <span>{v.label}</span>
                  {unavailable && (
                    <span style={{
                      marginLeft: 2, padding: "0 4px", borderRadius: 3,
                      background: "var(--muted)", color: "var(--muted-foreground)",
                      fontSize: 9, fontWeight: 600, letterSpacing: "0.03em",
                    }}>!</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Tiny hint when at least one is unavailable — with quick-fix buttons */}
          {viewSupport && Object.values(viewSupport).some(s => !s.supported) && (
            <div style={{
              marginTop: 8, padding: "8px 10px",
              borderRadius: 6, background: "var(--muted)",
              fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.5,
            }}>
              {VIEW_TYPES.filter(v => viewSupport[v.id] && !viewSupport[v.id].supported).map(v => {
                const fix = quickFixFor(v.id);
                return (
                  <div key={v.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                    <v.Glyph size={10} style={{ marginTop: 3, opacity: 0.7, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div>
                        <b style={{ color: "var(--foreground)" }}>{v.label}</b> · {viewSupport[v.id].hint || viewSupport[v.id].reason}
                      </div>
                      {fix && onAddColumn && (
                        <button onClick={() => {
                          onAddColumn(fix.spec);
                          // Don't close the popover — user sees view become available
                        }} style={{
                          marginTop: 4,
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 9px", borderRadius: 4,
                          background: "var(--primary)", border: "1px solid var(--primary)",
                          color: "var(--primary-foreground)",
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}>
                          <IconPlus size={9} />
                          {fix.label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Display properties (column visibility, sheet/gallery only) */}
          {(view === "sheet" || view === "grid") && (
            <>
              <SectionHeader>
                <span>Display properties</span>
                {hiddenCols && hiddenCols.size > 0 && (
                  <button onClick={onResetCols} style={{
                    marginLeft: "auto", padding: 0, border: "none",
                    background: "transparent", color: "var(--primary)",
                    fontSize: 11, fontWeight: 500, cursor: "pointer",
                  }}>Reset</button>
                )}
              </SectionHeader>
              <PillCloud
                items={columns
                  .filter(c => c.name !== "id" && c.type !== "button")
                  .map(c => ({ id: c.name, label: c.label.trim() || c.name }))}
                isOn={(id) => !(hiddenCols && hiddenCols.has(id))}
                onToggle={onToggleCol}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

const DisplayRow = ({ label, children }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 8, minHeight: 28,
  }}>
    <span style={{ fontSize: 12.5, color: "var(--foreground)", flex: 1 }}>{label}</span>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const SectionHeader = ({ children }) => (
  <div style={{
    display: "flex", alignItems: "center",
    fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--muted-foreground)",
    margin: "12px 0 8px", paddingTop: 10,
    borderTop: "1px solid var(--border-subtle)",
  }}>{children}</div>
);

const InlineSelect = ({ value, onChange, options, suffix }) => {
  const [open, setOpen] = useVcS(false);
  const wrap = useVcR(null);
  useClickOutside(wrap, () => setOpen(false), open);
  const current = options.find(o => o.id === value) || options[0];
  return (
    <div ref={wrap} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 8px", borderRadius: 5,
        background: open ? "var(--active-bg-strong)" : "var(--muted)",
        border: "1px solid var(--border-subtle)",
        color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
        maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{current?.label || "—"}</span>
        <IconChevronDown size={11} style={{ color: "var(--muted-foreground)" }} />
      </button>
      {suffix}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: suffix ? 24 : 0,
          minWidth: 160, padding: 4,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 7, boxShadow: "var(--shadow-popover)",
          zIndex: 300, maxHeight: 240, overflowY: "auto",
        }} className="fb-scroll">
          {options.map(o => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "5px 8px", border: "none",
              background: "transparent", borderRadius: 4, cursor: "pointer",
              color: "var(--foreground)", textAlign: "left", fontSize: 12.5,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>
              {value === o.id && <IconCheck size={11} style={{ color: "var(--primary)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PillRow = ({ value, options, onChange }) => (
  <div style={{
    display: "inline-flex", padding: 2, gap: 1,
    background: "var(--muted)", borderRadius: 6,
    border: "1px solid var(--border-subtle)",
  }}>
    {options.map(o => {
      const on = o.id === value;
      return (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: "3px 8px", borderRadius: 4, border: "none",
          background: on ? "var(--surface-elevated)" : "transparent",
          color: on ? "var(--foreground)" : "var(--muted-foreground)",
          fontSize: 11.5, fontWeight: on ? 600 : 500,
          cursor: "pointer", boxShadow: on ? "var(--shadow-sm)" : "none",
        }}>{o.label}</button>
      );
    })}
  </div>
);

const PillCloud = ({ items, isOn, isDisabled, onToggle }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
    {items.map(it => {
      const on = isOn(it.id);
      const disabled = isDisabled ? isDisabled(it.id) : false;
      return (
        <button key={it.id}
          onClick={() => !disabled && onToggle(it.id)}
          disabled={disabled}
          title={disabled ? "Always available" : (on ? "Hide" : "Show")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px", borderRadius: 999,
            border: "1px solid " + (on ? "transparent" : "var(--border-subtle)"),
            background: on ? "var(--active-bg-strong)" : "transparent",
            color: on ? "var(--foreground)" : "var(--muted-foreground)",
            fontSize: 11.5, fontWeight: 500,
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.55 : 1,
          }}>
          {it.Glyph && <it.Glyph size={10} />}
          <span>{it.label}</span>
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Right Detail Bar (toggle + panel)
//   Aggregate insights: count by status / priority / theme / sentiment / etc.
// ─────────────────────────────────────────────────────────────

const DetailBarToggle = ({ open, onToggle }) => (
  <ToolbarIconButton active={open} onClick={onToggle} title="Detail bar">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </svg>
  </ToolbarIconButton>
);

const DetailBar = ({ rows, allRows, columns, tableLabel, activeTableId, onClose, onDrilldownFilter, selectedIds = [], focusedCell, onClearSelection, onOpenRow, tablesById, activity, quickFilters, onApplyQuickFilter }) => {
  const [expanded, setExpanded] = useVcS(false);
  const [openCats, setOpenCats] = useVcS({});
  const [forcedMode, setForcedMode] = useVcS(null);
  const linear = false;  // charts removed entirely; flag retained for compat

  // ── Mode detection (auto-aware, manual override) ──
  const dataRows = allRows || rows;
  const selectedRows = (selectedIds || []).map(id => dataRows.find(r => r.id === id)).filter(Boolean);
  const focusedRow = focusedCell ? dataRows.find(r => r.id === focusedCell.row) : null;
  const isFiltered = rows.length !== dataRows.length;

  // Auto-detected mode
  const autoMode = selectedRows.length === 1 ? "row"
                  : selectedRows.length > 1 ? "selection"
                  : focusedRow ? "row"
                  : "overview";
  const mode = forcedMode || autoMode;

  // The row to "peek" at when in row mode + pager support
  const [pagerIdx, setPagerIdx] = useVcS(0);
  // Reset pager when selection changes
  useVcE(() => { setPagerIdx(0); }, [selectedRows.length]);
  const pagerRows = mode === "row" ? (selectedRows.length > 0 ? selectedRows : (focusedRow ? [focusedRow] : [])) : [];
  const safeIdx = Math.min(pagerIdx, Math.max(0, pagerRows.length - 1));
  const peekRow = mode === "row" ? (pagerRows[safeIdx] || null) : null;

  // Aggregation source rows differ by mode
  const aggRows = mode === "selection" ? selectedRows : rows; // categoryName → bool (which categories are expanded)

  // Build aggregations for ALL meaningful column types (categorical, numeric, date)
  const aggs = useVcM(() => {
    const out = [];
    const seen = new Set();
    columns.forEach(c => {
      if (seen.has(c.name) || c.name === "id" || c.type === "button" || c.type === "avatar" || c.type === "reaction" || c.type === "fk") return;
      seen.add(c.name);

      if (c.type === "num") {
        const vals = aggRows.map(r => Number(r[c.name])).filter(v => !isNaN(v));
        const empty = aggRows.length - vals.length;
        if (vals.length === 0) return;
        const sum = vals.reduce((a, b) => a + b, 0);
        const avg = sum / vals.length;
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        out.push({ name: c.name, label: c.label?.trim() || c.name, type: "num",
          stats: { sum, avg, min, max, count: vals.length, empty }, values: vals });
        return;
      }
      if (c.type === "date") {
        const dates = aggRows.map(r => r[c.name]).filter(Boolean);
        if (dates.length === 0) return;
        const sorted = [...dates].sort();
        const buckets = {};
        sorted.forEach(d => {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return;
          const day = (dt.getDay() + 6) % 7;
          const monday = new Date(dt.getTime() - day * 86400000).toISOString().slice(0, 10);
          buckets[monday] = (buckets[monday] || 0) + 1;
        });
        const entries = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
        out.push({ name: c.name, label: c.label?.trim() || c.name, type: "date",
          stats: { earliest: sorted[0], latest: sorted[sorted.length - 1], count: dates.length, empty: aggRows.length - dates.length },
          spark: entries });
        return;
      }
      if (["status", "select", "priority"].includes(c.type)) {
        const counts = {};
        let empty = 0;
        aggRows.forEach(r => {
          const v = r[c.name];
          if (v === undefined || v === null || v === "") { empty++; return; }
          counts[v] = (counts[v] || 0) + 1;
        });
        const entries = Object.entries(counts);
        if (entries.length === 0) return;
        out.push({ name: c.name, label: c.label?.trim() || c.name, type: c.type, entries, empty });
        return;
      }
      if (c.type === "text" || c.type === "email") {
        const counts = {};
        let empty = 0;
        aggRows.forEach(r => {
          const v = r[c.name];
          if (v === undefined || v === null || v === "") { empty++; return; }
          counts[v] = (counts[v] || 0) + 1;
        });
        const distinct = Object.keys(counts).length;
        if (distinct === 0 || distinct > Math.max(aggRows.length * 0.7, 20)) return;
        const entries = Object.entries(counts);
        out.push({ name: c.name, label: c.label?.trim() || c.name, type: "text", entries, empty });
      }
    });
    return out;
  }, [aggRows, columns]);

  // Rule-based highlights
  const insights = useVcM(() => {
    const list = [];
    if (rows.length === 0) return list;
    aggs.filter(a => a.entries).forEach(a => {
      const sorted = [...a.entries].sort((x, y) => y[1] - x[1]);
      if (sorted.length > 0 && sorted[0][1] >= Math.ceil(rows.length * 0.4)) {
        const pct = Math.round((sorted[0][1] / rows.length) * 100);
        const second = sorted[1] ? ` · ${sorted[1][0]} ${Math.round((sorted[1][1] / rows.length) * 100)}%` : "";
        list.push({ kind: "dominant", label: a.label, value: sorted[0][0], pct, detail: second });
      }
    });
    const highEmpty = aggs.filter(a => {
      const e = a.empty || a.stats?.empty || 0;
      return e >= Math.ceil(rows.length * 0.3);
    });
    if (highEmpty.length > 0) {
      list.push({ kind: "warn", text: `${highEmpty.length}개 컬럼이 30% 이상 비어있음`, cols: highEmpty.map(a => a.label).join(", ") });
    }
    return list.slice(0, 3);
  }, [aggs, rows.length]);

  const categorical = aggs.filter(a => a.entries);
  const numericList = aggs.filter(a => a.type === "num");
  const dateList = aggs.filter(a => a.type === "date");

  return (
    <aside style={{
      width: expanded ? 420 : 300, flexShrink: 0,
      borderLeft: "1px solid var(--border-subtle)",
      background: "var(--surface)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      transition: "width 200ms ease",
    }}>
      {/* Header */}
      <div style={{
        height: 40, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 12px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Insights</span>
        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }} className="fb-tnum">{rows.length} rows</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setExpanded(e => !e)} title={expanded ? "Collapse" : "Expand"} style={{
          width: 22, height: 22, borderRadius: 4, border: "none",
          background: "transparent", color: "var(--muted-foreground)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {expanded ? (<><polyline points="14 4 20 4 20 10"/><polyline points="10 20 4 20 4 14"/><line x1="20" y1="4" x2="14" y2="10"/><line x1="4" y1="20" x2="10" y2="14"/></>)
                      : (<><polyline points="20 4 14 4 14 10"/><polyline points="4 20 10 20 10 14"/><line x1="14" y1="10" x2="20" y2="4"/><line x1="10" y1="14" x2="4" y2="20"/></>)}
          </svg>
        </button>
        <button onClick={onClose} style={{
          width: 22, height: 22, borderRadius: 4, border: "none",
          background: "transparent", color: "var(--muted-foreground)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <IconX size={12} />
        </button>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {/* Mode bar — segmented control */}
        <div style={{
          display: "flex", padding: 2, gap: 1, marginBottom: 12,
          background: "var(--muted)", borderRadius: 6,
          border: "1px solid var(--border-subtle)",
        }}>
          {[
            { id: "overview",  label: "Overview", count: dataRows.length },
            { id: "row",       label: "Row",      count: peekRow ? 1 : (selectedRows.length > 0 ? selectedRows.length : 0) },
            { id: "selection", label: "Selection", count: selectedRows.length },
          ].map(m => {
            const on = mode === m.id;
            const disabled = (m.id === "row" && !peekRow && selectedRows.length === 0) || (m.id === "selection" && selectedRows.length < 2);
            return (
              <button key={m.id}
                onClick={() => !disabled && setForcedMode(m.id === autoMode ? null : m.id)}
                disabled={disabled}
                style={{
                  flex: 1, padding: "4px 6px", borderRadius: 5, border: "none",
                  background: on ? "var(--surface-elevated)" : "transparent",
                  color: on ? "var(--foreground)" : "var(--muted-foreground)",
                  cursor: disabled ? "default" : "pointer", boxShadow: on ? "var(--shadow-sm)" : "none",
                  fontSize: 11, fontWeight: on ? 600 : 500,
                  opacity: disabled ? 0.4 : 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                <span>{m.label}</span>
                {m.count > 0 && <span style={{ fontSize: 9.5, opacity: 0.7 }} className="fb-tnum">{m.count}</span>}
              </button>
            );
          })}
        </div>

        {/* ── Row peek mode ── */}
        {mode === "row" && peekRow && (
          <>
            {pagerRows.length > 1 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
                padding: "5px 8px", borderRadius: 5,
                background: "var(--muted)", fontSize: 11.5, color: "var(--muted-foreground)",
              }}>
                <button onClick={() => setPagerIdx((safeIdx - 1 + pagerRows.length) % pagerRows.length)}
                  title="Previous selected row"
                  style={{
                    width: 22, height: 22, borderRadius: 4, border: "1px solid var(--border-subtle)",
                    background: "var(--card)", color: "var(--foreground)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <IconChevronLeft size={11} />
                </button>
                <span style={{ flex: 1, textAlign: "center" }} className="fb-tnum">
                  <b style={{ color: "var(--foreground)" }}>{safeIdx + 1}</b> / {pagerRows.length}
                </span>
                <button onClick={() => setPagerIdx((safeIdx + 1) % pagerRows.length)}
                  title="Next selected row"
                  style={{
                    width: 22, height: 22, borderRadius: 4, border: "1px solid var(--border-subtle)",
                    background: "var(--card)", color: "var(--foreground)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <IconChevronRight size={11} />
                </button>
              </div>
            )}
            <RowPeek row={peekRow} columns={columns} tablesById={tablesById} onOpenRow={onOpenRow} />
          </>
        )}

        {/* ── Selection mode — comparison-focused ── */}
        {mode === "selection" && selectedRows.length > 0 && (
          <SelectionComparison
            selectedRows={selectedRows}
            allRows={dataRows}
            columns={columns}
            onClearSelection={onClearSelection}
            onOpenRow={onOpenRow}
          />
        )}

        {/* Filter indicator */}
        {mode === "overview" && isFiltered && (
          <div style={{
            padding: "6px 10px", marginBottom: 10,
            background: "var(--muted)", borderRadius: 5,
            fontSize: 11, color: "var(--muted-foreground)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <IconFilter size={10} />
            <span><b style={{ color: "var(--foreground)" }} className="fb-tnum">{rows.length}</b> of <b style={{ color: "var(--foreground)" }} className="fb-tnum">{dataRows.length}</b> rows shown (filtered)</span>
          </div>
        )}

        {/* Aggregations (Overview + Selection) */}
        {mode !== "row" && (
          <>
        {/* Highlights — varied chip style */}
        {insights.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <SectionLabel>
              <IconSparkles size={10} style={{ color: "var(--primary)" }} />
              <span style={{ color: "var(--primary)" }}>Highlights</span>
            </SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{
                  padding: "8px 10px", borderRadius: 6,
                  background: ins.kind === "warn"
                    ? "color-mix(in oklch, var(--destructive) 8%, var(--card))"
                    : "color-mix(in oklch, var(--primary) 6%, var(--card))",
                  border: "1px solid " + (ins.kind === "warn"
                    ? "color-mix(in oklch, var(--destructive) 22%, transparent)"
                    : "color-mix(in oklch, var(--primary) 18%, transparent)"),
                  fontSize: 11.5, lineHeight: 1.4,
                }}>
                  {ins.kind === "dominant" ? (
                    <>
                      <span style={{ color: "var(--muted-foreground)" }}>{ins.label}</span>{" "}
                      <span style={{ fontWeight: 600 }}>{ins.value}</span>
                      <span style={{ marginLeft: 4, fontWeight: 700, color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{ins.pct}%</span>
                      {ins.detail && <span style={{ color: "var(--muted-foreground)", fontSize: 10.5 }}>{ins.detail}</span>}
                    </>
                  ) : (
                    <>
                      <span style={{ color: "var(--destructive)", fontWeight: 600 }}>⚠</span>{" "}
                      <span>{ins.text}</span>
                      {ins.cols && <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginTop: 2 }}>{ins.cols}</div>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linear-style Overview — properties list, no charts */}
        {linear && mode === "overview" && (
          <LinearOverview aggs={aggs} total={rows.length} columns={columns} onDrilldown={onDrilldownFilter} />
        )}

        {/* Recent activity — Real timeline from aiHistory + table mutations */}
        {mode === "overview" && activity && activity.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <SectionLabel>Recent activity</SectionLabel>
            <div style={{
              background: "var(--card)", border: "1px solid var(--border-subtle)",
              borderRadius: 7, overflow: "hidden",
            }}>
              {activity.slice(0, 8).map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "7px 10px",
                  borderBottom: i < Math.min(activity.length, 8) - 1 ? "1px solid var(--border-subtle)" : "none",
                  fontSize: 11.5, lineHeight: 1.4,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "var(--primary)", flexShrink: 0, marginTop: 6,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                    {a.detail && (
                      <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</div>
                    )}
                  </div>
                  {a.time && <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{a.time}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick filters — table-local saved views */}
        {mode === "overview" && quickFilters && quickFilters.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <SectionLabel>Quick filters</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {quickFilters.map(f => (
                <button key={f.id} onClick={() => onApplyQuickFilter?.(f)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 10px", borderRadius: 5,
                  background: "var(--card)", border: "1px solid var(--border-subtle)",
                  color: "var(--foreground)", textAlign: "left", cursor: "pointer",
                  fontSize: 11.5,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: f.color || "var(--primary)", flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                  {f.count !== undefined && (
                    <span className="fb-tnum" style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>{f.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KPI grid removed — Dashboard handles deep charts. Detail bar focuses on context. */}
        {false && mode === "overview" && (categorical.length > 0 || numericList.length > 0 || dateList.length > 0) && (
          <div style={{ marginBottom: 14 }}>
            <SectionLabel>Overview</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: expanded ? "repeat(3, 1fr)" : "repeat(2, 1fr)", gap: 8 }}>
              {numericList.map(a => (
                <CompactKpi key={a.name} label={a.label}
                  value={a.stats.sum.toLocaleString()}
                  subValue={`avg ${a.stats.avg.toFixed(a.stats.avg < 10 ? 1 : 0)}`}
                  type="num" empty={a.stats.empty}
                />
              ))}
              {categorical.map(a => {
                const sorted = [...a.entries].sort((x, y) => y[1] - x[1]);
                const top = sorted[0];
                const topPct = Math.round((top[1] / rows.length) * 100);
                return (
                  <CompactKpi key={a.name} label={a.label}
                    value={a.entries.length}
                    subValue={`top: ${top[0]} ${topPct}%`}
                    type="cat"
                    miniDist={sorted.slice(0, 5)}
                    total={rows.length}
                    aggName={a.name}
                    onClick={() => setOpenCats(o => ({ ...o, [a.name]: !o[a.name] }))}
                    active={openCats[a.name]}
                    empty={a.empty}
                  />
                );
              })}
              {dateList.map(a => (
                <CompactKpi key={a.name} label={a.label}
                  value={a.stats.latest?.slice(5) || "—"}
                  subValue={`from ${a.stats.earliest?.slice(5) || "—"}`}
                  type="date"
                  spark={a.spark}
                  empty={a.stats.empty}
                  aggName={a.name}
                  onClick={() => setOpenCats(o => ({ ...o, [a.name]: !o[a.name] }))}
                  active={openCats[a.name]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Drill-in details — only for categorical cards user clicked */}
        {categorical.some(a => openCats[a.name]) && (
          <div>
            <SectionLabel>Details</SectionLabel>
            {categorical.filter(a => openCats[a.name]).map(a => (
              <div key={a.name} style={{
                padding: "10px 12px", marginBottom: 8,
                background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: 7,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  <span>{a.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "0 4px", background: "var(--muted)", borderRadius: 2 }}>{a.type}</span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setOpenCats(o => ({ ...o, [a.name]: false }))} style={{
                    background: "transparent", border: "none", color: "var(--muted-foreground)",
                    padding: 0, cursor: "pointer", fontSize: 14, lineHeight: 1,
                  }}>×</button>
                </div>
                <Aggregation agg={a} total={rows.length} onDrilldown={onDrilldownFilter} />
              </div>
            ))}
          </div>
        )}

        {aggs.length === 0 && mode !== "row" && (
          <div style={{ padding: 24, color: "var(--muted-foreground)", fontSize: 12.5, textAlign: "center" }}>
            아직 집계할 데이터가 없습니다.
          </div>
        )}
          </>
        )}
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────
// Selection Comparison — selected vs rest analysis
// ─────────────────────────────────────────────────────────────

const SelectionComparison = ({ selectedRows, allRows, columns, onClearSelection, onOpenRow }) => {
  const selIds = new Set(selectedRows.map(r => r.id));
  const restRows = allRows.filter(r => !selIds.has(r.id));

  // Compute per-column comparison
  const comparisons = useVcM(() => {
    const out = [];
    columns.forEach(c => {
      if (c.name === "id" || c.type === "button" || c.type === "avatar" || c.type === "reaction" || c.type === "fk") return;

      if (c.type === "num") {
        const selVals = selectedRows.map(r => Number(r[c.name])).filter(v => !isNaN(v));
        const restVals = restRows.map(r => Number(r[c.name])).filter(v => !isNaN(v));
        if (selVals.length === 0 && restVals.length === 0) return;
        const selAvg = selVals.length > 0 ? selVals.reduce((a, b) => a + b, 0) / selVals.length : 0;
        const restAvg = restVals.length > 0 ? restVals.reduce((a, b) => a + b, 0) / restVals.length : 0;
        const delta = restAvg !== 0 ? ((selAvg - restAvg) / restAvg) * 100 : 0;
        out.push({ name: c.name, label: c.label?.trim() || c.name, type: "num", selAvg, restAvg, delta });
        return;
      }

      if (["status", "select", "priority", "text"].includes(c.type)) {
        // Find dominant value in selection
        const selCounts = {};
        selectedRows.forEach(r => {
          const v = r[c.name];
          if (v === undefined || v === null || v === "") return;
          selCounts[v] = (selCounts[v] || 0) + 1;
        });
        const restCounts = {};
        restRows.forEach(r => {
          const v = r[c.name];
          if (v === undefined || v === null || v === "") return;
          restCounts[v] = (restCounts[v] || 0) + 1;
        });
        const selTotal = selectedRows.length;
        const restTotal = restRows.length;
        const selSorted = Object.entries(selCounts).sort((a, b) => b[1] - a[1]);
        if (selSorted.length === 0) return;
        const [topVal, topN] = selSorted[0];
        const selPct = (topN / selTotal) * 100;
        const restPct = restTotal > 0 ? ((restCounts[topVal] || 0) / restTotal) * 100 : 0;
        const delta = selPct - restPct;
        // Check if all selected rows share the same value
        const allSame = selSorted.length === 1 && topN === selTotal;
        out.push({ name: c.name, label: c.label?.trim() || c.name, type: "cat", topVal, selPct, restPct, delta, allSame });
        return;
      }
    });
    return out;
  }, [selectedRows, restRows, columns]);

  // Headline insights — what's significantly different
  const headlines = comparisons
    .filter(c => Math.abs(c.delta) >= 15 || c.allSame)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: "10px 12px", marginBottom: 10,
        background: "color-mix(in oklch, var(--primary) 6%, var(--card))",
        border: "1px solid color-mix(in oklch, var(--primary) 18%, transparent)",
        borderRadius: 6,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500 }}>
          <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: 18 }} className="fb-tnum">{selectedRows.length}</span>
          <span style={{ color: "var(--muted-foreground)" }}>vs {restRows.length} other rows</span>
          <div style={{ flex: 1 }} />
          <button onClick={onClearSelection} style={{
            background: "transparent", border: "none", color: "var(--muted-foreground)",
            cursor: "pointer", fontSize: 11, padding: 0,
          }}>Clear</button>
        </div>
      </div>

      {/* Headline differences */}
      {headlines.length > 0 && (
        <>
          <SectionLabel>
            <IconSparkles size={10} style={{ color: "var(--primary)" }} />
            <span style={{ color: "var(--primary)" }}>Key differences</span>
          </SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {headlines.map((c, i) => (
              <div key={c.name} style={{
                padding: "8px 10px", borderRadius: 6,
                background: "var(--card)", border: "1px solid var(--border-subtle)",
                fontSize: 11.5, lineHeight: 1.4,
              }}>
                {c.type === "num" ? (
                  <>
                    <span style={{ color: "var(--muted-foreground)" }}>{c.label}:</span>{" "}
                    <span style={{ fontWeight: 600 }}>{c.selAvg.toFixed(1)}</span>{" "}
                    <span style={{
                      color: c.delta > 0 ? "var(--status-done-fg)" : "var(--status-todo-fg)",
                      fontWeight: 700, fontFamily: "var(--font-mono)",
                    }}>{c.delta > 0 ? "↑" : "↓"} {Math.abs(c.delta).toFixed(0)}%</span>
                    <span style={{ color: "var(--muted-foreground)" }}> vs rest avg {c.restAvg.toFixed(1)}</span>
                  </>
                ) : c.allSame ? (
                  <>
                    <span style={{ color: "var(--muted-foreground)" }}>{c.label}: all share</span>{" "}
                    <span style={{ fontWeight: 600 }}>{c.topVal}</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: "var(--muted-foreground)" }}>{c.label}: </span>
                    <span style={{ fontWeight: 600 }}>{c.topVal}</span>{" "}
                    <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>{c.selPct.toFixed(0)}%</span>
                    <span style={{ color: "var(--muted-foreground)" }}> · rest {c.restPct.toFixed(0)}%</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Selected rows mini-list */}
      <SectionLabel>Selected rows</SectionLabel>
      <div style={{
        background: "var(--card)", border: "1px solid var(--border-subtle)",
        borderRadius: 7, overflow: "hidden", marginBottom: 14,
        maxHeight: 200, overflowY: "auto",
      }} className="fb-scroll">
        {selectedRows.map((row, i) => {
          const titleCol = columns.find(c => ["text", "avatar"].includes(c.type) && c.name !== "id");
          const titleVal = titleCol ? row[titleCol.name] : (row.name || row.title || row.id);
          return (
            <div key={row.id}
              onClick={() => onOpenRow?.(row.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px",
                borderBottom: i < selectedRows.length - 1 ? "1px solid var(--border-subtle)" : "none",
                cursor: "pointer", fontSize: 11.5,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted-foreground)", flexShrink: 0 }}>{row.id}</span>
              <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titleVal || "—"}</span>
              <IconChevronRight size={10} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            </div>
          );
        })}
      </div>

      {/* All comparisons below */}
      <SectionLabel>All fields</SectionLabel>
      <div style={{
        background: "var(--card)", border: "1px solid var(--border-subtle)",
        borderRadius: 7, overflow: "hidden",
      }}>
        {comparisons.map((c, i) => {
          // Build per-column distinct-values display for categoricals
          let valDisplay;
          if (c.type === "num") {
            valDisplay = (
              <>
                <span className="fb-tnum" style={{ fontWeight: 600 }}>{c.selAvg.toFixed(1)}</span>
                <span style={{ color: "var(--muted-foreground)", fontSize: 10 }}>/</span>
                <span className="fb-tnum" style={{ color: "var(--muted-foreground)" }}>{c.restAvg.toFixed(1)}</span>
              </>
            );
          } else {
            // Show ALL distinct values in selection
            const selCounts = {};
            selectedRows.forEach(r => {
              const v = r[c.name];
              if (v === undefined || v === null || v === "") return;
              selCounts[v] = (selCounts[v] || 0) + 1;
            });
            const entries = Object.entries(selCounts).sort((a, b) => b[1] - a[1]);
            if (entries.length === 0) {
              valDisplay = <span style={{ color: "var(--muted-foreground)", fontStyle: "italic" }}>—</span>;
            } else if (entries.length === 1) {
              valDisplay = <span style={{ fontWeight: 500 }} title={entries[0][0]}>{entries[0][0]}</span>;
            } else {
              // Multiple distinct values — list them with counts
              valDisplay = (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                  {entries.map(([k, n]) => (
                    <span key={k} title={`${k}: ${n}`} style={{
                      fontSize: 10.5, padding: "0 5px", borderRadius: 3,
                      background: "var(--muted)",
                      maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      <span style={{ fontWeight: 500 }}>{k}</span>
                      <span style={{ color: "var(--muted-foreground)", marginLeft: 3 }} className="fb-tnum">{n}</span>
                    </span>
                  ))}
                </div>
              );
            }
          }
          return (
            <div key={c.name} style={{
              padding: "7px 10px",
              borderBottom: i < comparisons.length - 1 ? "1px solid var(--border-subtle)" : "none",
              fontSize: 11.5, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: "var(--muted-foreground)", flexShrink: 0, minWidth: 60 }}>{c.label}</span>
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", minWidth: 0 }}>{valDisplay}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RowPeek = ({ row, columns, tablesById, onOpenRow }) => {
  // Group fields by category
  const idCol = columns.find(c => c.name === "id");
  const titleish = columns.find(c => ["text", "avatar"].includes(c.type) && c.name !== "id");
  const titleVal = titleish ? row[titleish.name] : (row.name || row.title || row.id);

  // FK / library-linked related records
  const related = [];
  columns.forEach(c => {
    if (!c.library || c.library.kind !== "optionList") return;
    const val = row[c.name];
    if (!val) return;
    // Find other rows in OTHER tables sharing this option-list value
    Object.entries(tablesById || {}).forEach(([tid, tbl]) => {
      const hits = (tbl.rows || []).filter(r => {
        if (r.id === row.id) return false;
        return tbl.columns?.some(cc =>
          cc.library?.kind === "optionList" && cc.library.id === c.library.id && r[cc.name] === val
        );
      });
      if (hits.length > 0) {
        related.push({ tableId: tid, tableLabel: tbl.label, viaCol: c.label || c.name, value: val, hits: hits.slice(0, 3) });
      }
    });
  });

  return (
    <div>
      {/* Header card */}
      <div style={{
        padding: "10px 12px", marginBottom: 10,
        background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: 7,
      }}>
        <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", marginBottom: 3 }}>
          {row.id}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis" }}>
          {titleVal}
        </div>
        <button onClick={() => onOpenRow?.(row.id)} style={{
          padding: "3px 9px", borderRadius: 5,
          background: "var(--primary)", border: "1px solid var(--primary)",
          color: "var(--primary-foreground)", fontSize: 11, fontWeight: 600, cursor: "pointer",
        }}>Focus in sheet →</button>
      </div>

      {/* All fields grid */}
      <SectionLabel>Fields</SectionLabel>
      <div style={{
        background: "var(--card)", border: "1px solid var(--border-subtle)",
        borderRadius: 7, overflow: "hidden", marginBottom: 14,
      }}>
        {columns.filter(c => c.name !== "id" && c.type !== "button" && c.type !== "avatar").map((c, i, arr) => {
          const v = row[c.name];
          const isEmpty = v === undefined || v === null || v === "";
          return (
            <div key={c.name} style={{
              display: "grid", gridTemplateColumns: "70px 1fr", gap: 10,
              padding: "7px 12px", alignItems: "center",
              borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
              fontSize: 12,
            }}>
              <div style={{ color: "var(--muted-foreground)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.label?.trim() || c.name}
              </div>
              <div style={{
                color: isEmpty ? "var(--muted-foreground)" : "var(--foreground)",
                fontStyle: isEmpty ? "italic" : "normal",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontFamily: c.mono || c.type === "date" ? "var(--font-mono)" : "var(--font-sans)",
              }}>
                {isEmpty ? "—" : String(v)}
              </div>
            </div>
          );
        })}
      </div>

      {/* FK Related */}
      {related.length > 0 && (
        <>
          <SectionLabel>Related</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {related.map((r, i) => (
              <div key={i} style={{
                padding: "8px 10px", borderRadius: 6,
                background: "var(--card)", border: "1px solid var(--border-subtle)",
                fontSize: 11.5,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{r.tableLabel}</span>
                  <span style={{ color: "var(--muted-foreground)", fontSize: 10.5 }}>· via {r.viaCol} = {r.value}</span>
                </div>
                {r.hits.map(h => (
                  <div key={h.id} style={{
                    fontSize: 11, color: "var(--muted-foreground)", padding: "1px 0",
                    fontFamily: "var(--font-mono)",
                  }}>
                    · {h.id}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Linear-style Overview — text-dense properties list, no charts
const LinearOverview = ({ aggs, total, columns, onDrilldown }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0,
      border: "1px solid var(--border-subtle)", borderRadius: 6,
      background: "var(--card)", overflow: "hidden",
    }}>
      {aggs.map((a, i) => {
        const isLast = i === aggs.length - 1;
        // For categoricals — show top value + count
        if (a.entries) {
          const sorted = [...a.entries].sort((x, y) => y[1] - x[1]);
          const top = sorted[0];
          const topPct = total > 0 ? Math.round((top[1] / total) * 100) : 0;
          return (
            <div key={a.name} onClick={() => onDrilldown?.(a.name, top[0])}
              style={{
                display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 8,
                padding: "8px 12px", alignItems: "center",
                borderBottom: !isLast ? "1px solid var(--border-subtle)" : "none",
                fontSize: 12, cursor: onDrilldown ? "pointer" : "default",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <span style={{ color: "var(--muted-foreground)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: chartColorFor(a.name, top[0], 0), flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{top[0]}</span>
                {sorted.length > 1 && (
                  <span style={{ color: "var(--muted-foreground)", fontSize: 10.5 }}>+{sorted.length - 1}</span>
                )}
              </span>
              <span className="fb-tnum" style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{top[1]} · {topPct}%</span>
            </div>
          );
        }
        // Numeric — sum + avg
        if (a.type === "num") {
          return (
            <div key={a.name} style={{
              display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 8,
              padding: "8px 12px", alignItems: "center",
              borderBottom: !isLast ? "1px solid var(--border-subtle)" : "none",
              fontSize: 12,
            }}>
              <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{a.label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                <span style={{ fontWeight: 600 }}>{a.stats.sum.toLocaleString()}</span>
                <span style={{ color: "var(--muted-foreground)" }}>avg {a.stats.avg.toFixed(1)}</span>
              </span>
              <span className="fb-tnum" style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{a.stats.count}</span>
            </div>
          );
        }
        // Date
        if (a.type === "date") {
          return (
            <div key={a.name} style={{
              display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 8,
              padding: "8px 12px", alignItems: "center",
              borderBottom: !isLast ? "1px solid var(--border-subtle)" : "none",
              fontSize: 12,
            }}>
              <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{a.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted-foreground)" }}>
                {a.stats.earliest} → {a.stats.latest}
              </span>
              <span className="fb-tnum" style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{a.stats.count}</span>
            </div>
          );
        }
        return null;
      })}
      {aggs.length === 0 && (
        <div style={{ padding: 20, fontSize: 12, color: "var(--muted-foreground)", textAlign: "center" }}>
          No data
        </div>
      )}
    </div>
  );
};

// Section label helper
const SectionLabel = ({ children }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--muted-foreground)",
    marginBottom: 8,
  }}>{children}</div>
);

// Compact KPI tile — one column summary, click to drill in
const CompactKpi = ({ label, value, subValue, type, miniDist, total, spark, empty, onClick, active, aggName }) => {
  const clickable = !!onClick;
  return (
    <div onClick={onClick} style={{
      padding: "8px 10px", borderRadius: 6,
      background: active ? "color-mix(in oklch, var(--primary) 8%, var(--card))" : "var(--card)",
      border: "1px solid " + (active ? "var(--primary)" : "var(--border-subtle)"),
      cursor: clickable ? "pointer" : "default",
      transition: "background 120ms ease, border-color 120ms ease",
      display: "flex", flexDirection: "column", gap: 4, minWidth: 0, overflow: "hidden",
    }}
    onMouseEnter={(e) => { if (clickable && !active) e.currentTarget.style.borderColor = "var(--border)"; }}
    onMouseLeave={(e) => { if (clickable && !active) e.currentTarget.style.borderColor = "var(--border-subtle)"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{label}</span>
        {type === "num"  && <span style={{ fontSize: 9, color: "var(--muted-foreground)", opacity: 0.6 }}>#</span>}
        {type === "cat"  && <span style={{ fontSize: 9, color: "var(--muted-foreground)", opacity: 0.6 }}>◐</span>}
        {type === "date" && <span style={{ fontSize: 9, color: "var(--muted-foreground)", opacity: 0.6 }}>📅</span>}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: type === "date" ? "var(--font-mono)" : "var(--font-sans)" }} className="fb-tnum">
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subValue}</div>
      )}
      {/* Mini distribution — donut for small categoricals (≤4), bar for larger sets */}
      {miniDist && total > 0 && miniDist.length <= 4 && miniDist.length >= 2 && (() => {
        const r = 14, sw = 5, cx = 18, cy = 18;
        const C = 2 * Math.PI * r;
        let offset = 0;
        const sum = miniDist.reduce((a, [, n]) => a + n, 0);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <svg width={36} height={36} viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="color-mix(in oklch, var(--border-subtle) 80%, transparent)" strokeWidth={sw} />
              {miniDist.map(([k, n], i) => {
                const frac = n / sum;
                const dash = C * frac;
                const gap = C - dash;
                const rot = (offset / sum) * 360 - 90;
                offset += n;
                return <circle key={k} cx={cx} cy={cy} r={r} fill="none"
                  stroke={chartColorFor(aggName, k, i)} strokeWidth={sw}
                  strokeDasharray={`${dash} ${gap}`}
                  transform={`rotate(${rot} ${cx} ${cy})`} />;
              })}
            </svg>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {miniDist.slice(0, 3).map(([k, n], i) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9.5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 1, background: chartColorFor(aggName, k, i), flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--muted-foreground)" }}>{String(k)}</span>
                  <span className="fb-tnum" style={{ color: "var(--foreground)", fontWeight: 600 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {miniDist && total > 0 && miniDist.length > 4 && (
        <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
          {miniDist.map(([k, n], i) => (
            <div key={k} title={`${k}: ${n}`} style={{
              width: `${(n / total) * 100}%`,
              background: chartColorFor(aggName, k, i),
            }} />
          ))}
        </div>
      )}
      {/* Sparkline for date */}
      {spark && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 14, marginTop: 2 }}>
          {spark.slice(-12).map(([k, n]) => {
            const max = Math.max(...spark.map(([, x]) => x), 1);
            return <div key={k} title={`${k}: ${n}`} style={{
              flex: 1, height: `${(n / max) * 100}%`, minHeight: 1,
              background: "var(--primary)", borderRadius: "1px 1px 0 0", opacity: 0.85,
            }} />;
          })}
        </div>
      )}
      {empty > 0 && (
        <div style={{ fontSize: 9.5, color: "var(--muted-foreground)", marginTop: 1 }}>{empty} empty</div>
      )}
    </div>
  );
};

const chartColorFor = (aggName, key, i) => {
  if (aggName === "status") {
    const m = { todo: "var(--status-todo-fg)", progress: "var(--status-progress-fg)", waiting: "var(--status-waiting-fg)", done: "var(--status-done-fg)" };
    return m[key] || "var(--muted-foreground)";
  }
  if (aggName === "priority") {
    const m = { Urgent: "var(--chart-1)", High: "var(--chart-2)", Med: "var(--chart-4)", Low: "var(--muted-foreground)" };
    return m[key] || "var(--muted-foreground)";
  }
  if (aggName === "sentiment") {
    const m = { Positive: "var(--status-done-fg)", Mixed: "var(--status-waiting-fg)", Negative: "var(--status-todo-fg)" };
    return m[key] || "var(--muted-foreground)";
  }
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  return palette[i % palette.length];
};

// Render one aggregation — handles categorical, numeric, date types
const AggBody = ({ agg, total, sortBy, onDrilldown }) => {
  // Numeric — show stats tiles + histogram
  if (agg.type === "num") {
    const s = agg.stats;
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          <NumTile label="Total" value={s.sum.toLocaleString()} />
          <NumTile label="Avg" value={s.avg.toFixed(s.avg < 10 ? 2 : 0)} />
          <NumTile label="Min" value={s.min.toLocaleString()} />
          <NumTile label="Max" value={s.max.toLocaleString()} />
        </div>
        {/* Histogram */}
        <Histogram values={agg.values} />
        {s.empty > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted-foreground)" }}>
            {s.empty} empty
          </div>
        )}
      </div>
    );
  }

  // Date — sparkline + earliest/latest
  if (agg.type === "date") {
    const s = agg.stats;
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          <NumTile label="Earliest" value={s.earliest} mono />
          <NumTile label="Latest" value={s.latest} mono />
        </div>
        <Sparkline data={agg.spark} />
        {s.empty > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted-foreground)" }}>
            {s.empty} empty
          </div>
        )}
      </div>
    );
  }

  // Categorical — sortable bar list, clickable for drilldown
  const entries = sortBy === "name"
    ? [...agg.entries].sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    : [...agg.entries].sort((a, b) => b[1] - a[1]);
  return <Aggregation agg={{ ...agg, entries }} total={total} onDrilldown={onDrilldown} />;
};

const NumTile = ({ label, value, mono }) => (
  <div style={{ padding: "6px 9px", background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: 5 }}>
    <div style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 1 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
  </div>
);

const Histogram = ({ values, bins = 10 }) => {
  if (!values || values.length === 0) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const step = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  values.forEach(v => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / step));
    counts[idx]++;
  });
  const maxC = Math.max(...counts);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 50, padding: "4px 0" }}>
      {counts.map((c, i) => (
        <div key={i} title={`${(min + i * step).toFixed(1)} – ${(min + (i + 1) * step).toFixed(1)}: ${c}`} style={{
          flex: 1,
          height: maxC > 0 ? `${(c / maxC) * 100}%` : "2%",
          minHeight: 2,
          background: "var(--primary)",
          borderRadius: "2px 2px 0 0",
          opacity: c > 0 ? 0.85 : 0.2,
        }} />
      ))}
    </div>
  );
};

const Sparkline = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(([, n]) => n));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 36 }}>
      {data.slice(-12).map(([k, n], i) => (
        <div key={k} title={`${k}: ${n}`} style={{
          flex: 1,
          height: max > 0 ? `${(n / max) * 100}%` : "2%",
          minHeight: 2,
          background: "var(--primary)",
          borderRadius: "2px 2px 0 0",
          opacity: 0.85,
        }} />
      ))}
    </div>
  );
};

const Aggregation = ({ agg, total, onDrilldown }) => {
  const max = Math.max(1, ...agg.entries.map(([, n]) => n));
  // Color rule
  const colorFor = (key) => {
    if (agg.name === "status") {
      const m = { todo: "var(--status-todo-fg)", progress: "var(--status-progress-fg)", waiting: "var(--status-waiting-fg)", done: "var(--status-done-fg)" };
      return m[key] || "var(--muted-foreground)";
    }
    if (agg.name === "priority") {
      const m = { Urgent: "var(--chart-1)", High: "var(--chart-2)", Med: "var(--chart-4)", Low: "var(--muted-foreground)" };
      return m[key] || "var(--muted-foreground)";
    }
    if (agg.name === "sentiment") {
      const m = { Positive: "var(--status-done-fg)", Mixed: "var(--status-waiting-fg)", Negative: "var(--status-todo-fg)" };
      return m[key] || "var(--muted-foreground)";
    }
    return "var(--chart-1)";
  };
  const labelFor = (key) => {
    if (agg.name === "status" && STATUS[key]) return STATUS[key].label;
    return String(key);
  };
  const drillable = !!onDrilldown;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {agg.entries.map(([k, n]) => {
        const pct = total > 0 ? Math.round((n / total) * 100) : 0;
        const w = (n / max) * 100;
        const c = colorFor(k);
        return (
          <div key={k}
            onClick={drillable ? () => onDrilldown(agg.name, k) : undefined}
            title={drillable ? `Click to filter ${agg.label || agg.name} = ${labelFor(k)}` : undefined}
            style={{
              display: "flex", flexDirection: "column", gap: 4,
              padding: "4px 6px", margin: "0 -6px", borderRadius: 4,
              cursor: drillable ? "pointer" : "default",
              transition: "background 120ms ease",
            }}
            onMouseEnter={(e) => { if (drillable) e.currentTarget.style.background = "var(--hover-bg)"; }}
            onMouseLeave={(e) => { if (drillable) e.currentTarget.style.background = "transparent"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }} />
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--foreground)" }}>{labelFor(k)}</span>
              <span className="fb-tnum" style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{pct}%</span>
              <span className="fb-tnum" style={{ color: "var(--foreground)", fontWeight: 600, minWidth: 20, textAlign: "right" }}>{n}</span>
            </div>
            <div style={{
              height: 4, borderRadius: 999, overflow: "hidden",
              background: "color-mix(in oklch, var(--border-subtle) 70%, transparent)",
            }}>
              <div style={{ width: w + "%", height: "100%", background: c, borderRadius: 999, transition: "width 200ms ease" }} />
            </div>
          </div>
        );
      })}
      {agg.empty > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--muted-foreground)", padding: "2px 6px", margin: "0 -6px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", border: "1px dashed var(--muted-foreground)", flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Empty</span>
          <span className="fb-tnum">{Math.round((agg.empty / total) * 100)}%</span>
          <span className="fb-tnum" style={{ fontWeight: 600 }}>{agg.empty}</span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// IconSliders + IconList shims (use existing icons where possible)
// ─────────────────────────────────────────────────────────────

const IconSliders = (p) => (
  <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
    <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
  </svg>
);

// Expose
Object.assign(window, {
  FilterMenu, DisplayMenu, DetailBarToggle, DetailBar,
  ToolbarIconButton, VIEW_TYPES,
});
