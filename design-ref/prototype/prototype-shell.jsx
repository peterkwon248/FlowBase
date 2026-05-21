/* @jsx React.createElement */
// FlowBase Prototype — full interactive shell

const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

// ─────────────────────────────────────────────────────────────
// Interactive Sidebar (board switcher)
// ─────────────────────────────────────────────────────────────

const InteractiveSidebar = ({ activeTableId, activeWorkspaceItem, onSelectTable, onSelectWorkspaceItem, tables, tableCounts, workspaceLabel, onImport, onNewTable }) => {
  const [hover, setHover] = useS(null);
  const [collapsed, setCollapsed] = useS({ tables: false, pinned: false });
  const allCollapsed = collapsed.tables && collapsed.pinned;
  const toggleAll = () => {
    const next = !allCollapsed;
    setCollapsed({ tables: next, pinned: next });
  };
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)",
      display: "flex", flexDirection: "column",
      fontSize: 13.5,
    }}>
      <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <button style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "6px 8px", borderRadius: 6, border: "none",
          background: "transparent", cursor: "pointer", color: "var(--sidebar-active-text)",
        }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--primary)", color: "white", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>P</span>
          <span style={{ fontWeight: 600, flex: 1, textAlign: "left" }}>peter's tables</span>
          <IconChevronDown size={14} style={{ color: "var(--sidebar-muted)" }} />
        </button>
      </div>

      {/* Active workspace label */}
      <div style={{
        padding: "10px 14px 6px",
        display: "flex", alignItems: "center", gap: 7,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--chart-1)" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{workspaceLabel}</span>
        <div style={{ flex: 1 }} />
        <button style={{
          background: "transparent", border: "none", color: "var(--sidebar-muted)",
          padding: 2, borderRadius: 4, cursor: "pointer", display: "flex",
        }} title="Switch workspace">
          <IconChevronDown size={12} />
        </button>
      </div>

      <div style={{ padding: "4px 10px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <button onClick={onNewTable} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 9px", borderRadius: 6, border: "none",
          background: "var(--primary)", color: "var(--primary-foreground)",
          fontSize: 13, fontWeight: 500, cursor: "pointer", justifyContent: "flex-start",
        }}>
          <IconPlus size={14} /><span>New table</span>
        </button>
        <button onClick={onImport} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 9px", borderRadius: 6, border: "1px solid var(--border)",
          background: "transparent", color: "var(--sidebar-foreground)",
          fontSize: 13, cursor: "pointer", justifyContent: "flex-start",
        }}>
          <IconUpload size={14} /><span>Import data</span>
        </button>
      </div>

      <div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setCollapsed(c => ({ ...c, tables: !c.tables }))} style={{
          background: "transparent", border: "none", padding: 0, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sidebar-muted)",
        }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed.tables ? "rotate(-90deg)" : "none", transition: "transform 120ms ease" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Tables
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="fb-tnum" style={{ fontSize: 11, color: "var(--sidebar-muted)" }}>{tables.length}</span>
          <button onClick={toggleAll} title={allCollapsed ? "Expand all" : "Collapse all"} style={{
            background: "transparent", border: "none", color: "var(--sidebar-muted)",
            padding: 2, borderRadius: 4, cursor: "pointer", display: "flex",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {!allCollapsed ? (<><polyline points="17 11 12 6 7 11" /><polyline points="17 18 12 13 7 18" /></>) : (<><polyline points="7 13 12 18 17 13" /><polyline points="7 6 12 11 17 6" /></>)}
            </svg>
          </button>
        </div>
      </div>
      {!collapsed.tables && (
      <nav style={{ padding: "0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
        {tables.map((t) => {
          const active = !activeWorkspaceItem && t.id === activeTableId;
          const h = hover === t.id;
          return (
            <button key={t.id}
              onClick={() => onSelectTable(t.id)}
              onMouseEnter={() => setHover(t.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", borderRadius: 5, border: "none",
                background: active ? "var(--sidebar-active)" : h ? "var(--sidebar-hover)" : "transparent",
                color: active ? "var(--sidebar-active-text)" : "var(--sidebar-foreground)",
                fontWeight: active ? 600 : 400,
                cursor: "pointer", textAlign: "left", fontSize: 13.5, position: "relative",
              }}>
              {active && <span style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 2, background: "var(--primary)", borderRadius: 1 }} />}
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.colorVar, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
              <span className="fb-tnum" style={{ fontSize: 11, color: "var(--sidebar-muted)" }}>{tableCounts[t.id] ?? "·"}</span>
            </button>
          );
        })}
      </nav>
      )}

      {/* Workspace section moved to Activity Bar > Workspace mode. Sidebar focuses on data only. */}

      <div style={{ padding: "16px 14px 4px" }}>
        <button onClick={() => setCollapsed(c => ({ ...c, pinned: !c.pinned }))} style={{
          background: "transparent", border: "none", padding: 0, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sidebar-muted)",
        }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed.pinned ? "rotate(-90deg)" : "none", transition: "transform 120ms ease" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Pinned views
        </button>
      </div>
      {!collapsed.pinned && (
      <nav style={{ padding: "0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
        {[
          { label: "Pricing pushback",   color: "var(--status-todo-fg)" },
          { label: "By sentiment",       color: "var(--chart-4)" },
          { label: "This week",          color: "var(--chart-3)" },
        ].map((v) => (
          <button key={v.label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 8px", borderRadius: 5, border: "none",
            background: "transparent", color: "var(--sidebar-foreground)",
            cursor: "pointer", textAlign: "left", fontSize: 13.5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.color }} />
            <span style={{ flex: 1 }}>{v.label}</span>
          </button>
        ))}
      </nav>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ padding: "8px 10px", borderTop: "1px solid var(--sidebar-border)", display: "flex", alignItems: "center", gap: 4 }}>
        <button style={{ background: "transparent", border: "none", color: "var(--sidebar-muted)", padding: 6, borderRadius: 5, cursor: "pointer", display: "flex" }}><IconTrash size={15} /></button>
        <button style={{ background: "transparent", border: "none", color: "var(--sidebar-muted)", padding: 6, borderRadius: 5, cursor: "pointer", display: "flex" }}><IconSettings size={15} /></button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--sidebar-muted)" }}>2.1 / 10 GB</span>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────
// Filter / search bar
// ─────────────────────────────────────────────────────────────

const FilterChips = ({ rows, filter, onChange }) => {
  const counts = {
    todo:     rows.filter(r => r.status === "todo").length,
    progress: rows.filter(r => r.status === "progress").length,
    waiting:  rows.filter(r => r.status === "waiting").length,
    done:     rows.filter(r => r.status === "done").length,
  };
  const chip = (key) => {
    const active = filter.has(key);
    const toneMap = {
      todo:     { bg: "var(--status-todo-bg)",     fg: "var(--status-todo-fg)" },
      progress: { bg: "var(--status-progress-bg)", fg: "var(--status-progress-fg)" },
      waiting:  { bg: "var(--status-waiting-bg)",  fg: "var(--status-waiting-fg)" },
      done:     { bg: "var(--status-done-bg)",     fg: "var(--status-done-fg)" },
    };
    const t = toneMap[key];
    const Glyph = STATUS[key].icon;
    return (
      <button key={key} onClick={() => {
        const next = new Set(filter);
        if (next.has(key)) next.delete(key); else next.add(key);
        onChange(next);
      }} style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 9px", borderRadius: 6,
        background: active ? t.bg : "transparent",
        color: active ? t.fg : "var(--muted-foreground)",
        border: active ? "1px solid transparent" : "1px solid var(--border)",
        fontSize: 12, fontWeight: 500, cursor: "pointer",
      }}>
        <Glyph size={11} style={{ color: active ? t.fg : "var(--muted-foreground)" }} />
        <span>{STATUS[key].label}</span>
        <span className="fb-tnum" style={{ opacity: 0.65 }}>{counts[key]}</span>
      </button>
    );
  };
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {chip("todo")}{chip("progress")}{chip("waiting")}{chip("done")}
      {filter.size > 0 && (
        <button onClick={() => onChange(new Set())} style={{
          padding: "4px 9px", borderRadius: 6, border: "1px solid var(--border)",
          background: "transparent", color: "var(--muted-foreground)",
          fontSize: 12, cursor: "pointer",
        }}>Clear</button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Header (interactive, theme toggle, search)
// ─────────────────────────────────────────────────────────────

const InteractiveHeader = ({ theme, setTheme, search, onSearch, workspaceLabel, tableLabel, leadingSlot, breadcrumb, navSlot }) => {
  return (
    <header style={{
      height: 48, flexShrink: 0,
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--background)",
      display: "flex", alignItems: "center",
      padding: "0 14px", gap: 10,
    }}>
      {leadingSlot}
      {navSlot}
      <div style={{ flex: "1 1 0", minWidth: 0, overflow: "hidden", display: "flex" }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, maxWidth: "100%" }}>
          {breadcrumb ? breadcrumb : (
            <>
              <span style={{ color: "var(--muted-foreground)" }}>peter's tables</span>
              <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
              <span style={{ color: "var(--muted-foreground)" }}>{workspaceLabel}</span>
              <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
              <span style={{ fontWeight: 600 }}>{tableLabel}</span>
            </>
          )}
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 9px", borderRadius: 6,
        background: "var(--muted)", border: "1px solid var(--border-subtle)",
        fontSize: 12.5, width: 220, flexShrink: 0,
      }}>
        <IconSearch size={13} style={{ color: "var(--muted-foreground)" }} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search rows…"
          style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            fontSize: 12.5, color: "var(--foreground)", padding: 0, fontFamily: "var(--font-sans)",
          }}
        />
        {search ? (
          <button onClick={() => onSearch("")} style={{ background: "transparent", border: "none", color: "var(--muted-foreground)", display: "flex", cursor: "pointer", padding: 0 }}><IconX size={12} /></button>
        ) : <span className="fb-kbd">⌘K</span>}
      </div>

      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{
        width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
        background: "var(--card)", color: "var(--muted-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }} title="Toggle theme">
        {theme === "dark" ? <IconSun size={14} /> : <IconMoon size={14} />}
      </button>

      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, var(--chart-4), var(--chart-1))" }} />
    </header>
  );
};

// ─────────────────────────────────────────────────────────────
// Interactive view switcher
// ─────────────────────────────────────────────────────────────

const InteractiveViewSwitcher = ({ view, onChange, capabilities }) => {
  const all = [
    { id: "sheet",    label: "Sheet",     Glyph: IconSheet,    always: true },
    { id: "kanban",   label: "Kanban",    Glyph: IconKanban,   capKey: "kanban" },
    { id: "chart",    label: "Dashboard", Glyph: IconChart,    capKey: "dashboard" },
    { id: "grid",     label: "Gallery",   Glyph: IconTable,    capKey: "grid" },
    { id: "timeline", label: "Timeline",  Glyph: IconCalendar, capKey: "timeline" },
  ];
  const views = all.filter(v => v.always || (capabilities && capabilities[v.capKey]));
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: 2, background: "var(--muted)", borderRadius: 7, border: "1px solid var(--border-subtle)" }}>
      {views.map((v) => {
        const on = v.id === view;
        return (
          <button key={v.id} onClick={() => onChange(v.id)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 5, border: "none",
            background: on ? "var(--surface-elevated)" : "transparent",
            color: on ? "var(--foreground)" : "var(--muted-foreground)",
            fontSize: 12.5, fontWeight: on ? 600 : 500,
            cursor: "pointer", boxShadow: on ? "var(--shadow-sm)" : "none",
            transition: "background 120ms ease, color 120ms ease",
          }}>
            <v.Glyph size={13} />{v.label}
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Kanban view (interactive: click status to change column)
// ─────────────────────────────────────────────────────────────

const KanbanView = ({ rows, onUpdateRow, cardConfig, selectedIds = [], onSelect }) => {
  const cfg = cardConfig || {
    title:    (r) => `${r.name || ""} ${r.company ? "· " + r.company : ""}`.trim() || r.id,
    subtitle: (r) => r.quote || null,
    badge:    (r) => r.theme || null,
    date:     (r) => r.date || null,
    priority: (r) => r.priority,
  };
  const toggleSel = (e, id) => {
    e.stopPropagation();
    if (!onSelect) return;
    const has = selectedIds.includes(id);
    onSelect(has ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };
  return (
    <div className="fb-scroll" style={{
      flex: 1, overflow: "auto", padding: 16,
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(260px, 1fr))",
      gap: 14, background: "var(--background)",
    }}>
      {STATUS_OPTIONS.map((s) => {
        const items = rows.filter(r => r.status === s);
        const Glyph = STATUS[s].icon;
        const toneMap = {
          todo:     "var(--status-todo-fg)",
          progress: "var(--status-progress-fg)",
          waiting:  "var(--status-waiting-fg)",
          done:     "var(--status-done-fg)",
        };
        return (
          <div key={s} style={{
            display: "flex", flexDirection: "column",
            background: "var(--surface)", borderRadius: 10,
            border: "1px solid var(--border-subtle)", overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 6,
              borderBottom: "1px solid var(--border-subtle)",
            }}>
              <Glyph size={13} style={{ color: toneMap[s] }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{STATUS[s].label}</span>
              <span className="fb-tnum" style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{items.length}</span>
              <div style={{ flex: 1 }} />
              <button style={{ background: "transparent", border: "none", color: "var(--muted-foreground)", padding: 2, borderRadius: 4, cursor: "pointer", display: "flex" }}>
                <IconPlus size={13} />
              </button>
            </div>
            <div className="fb-scroll" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", flex: 1 }}>
              {items.map((row) => {
                const title = cfg.title(row);
                const subtitle = cfg.subtitle(row);
                const badge = cfg.badge(row);
                const date = cfg.date(row);
                const priority = cfg.priority ? cfg.priority(row) : null;
                return (
                  <div key={row.id} onClick={(e) => toggleSel(e, row.id)} style={{
                    padding: 10, borderRadius: 7,
                    background: "var(--card)",
                    border: "1px solid " + (selectedIds.includes(row.id) ? "var(--primary)" : "var(--border-subtle)"),
                    display: "flex", flexDirection: "column", gap: 6,
                    cursor: "pointer",
                    boxShadow: selectedIds.includes(row.id) ? "0 0 0 1px var(--primary)" : "none",
                    transition: "border-color 120ms ease, box-shadow 120ms ease",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => toggleSel(e, row.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ margin: 0, cursor: "pointer" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted-foreground)" }}>{row.id}</span>
                      <span style={{ flex: 1 }} />
                      {priority && <PriorityCell priority={priority} />}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{title}</div>
                    {subtitle && (
                      <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{subtitle}</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      {badge && (
                        <span style={{
                          padding: "1px 6px", borderRadius: 3, fontSize: 11, fontWeight: 500,
                          background: "color-mix(in oklch, var(--chart-1) 12%, transparent)",
                          color: "var(--chart-1)",
                        }}>{badge}</span>
                      )}
                      <div style={{ flex: 1 }} />
                      {date && <span style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{date}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 3, marginTop: 4, borderTop: "1px solid var(--border-subtle)", paddingTop: 6 }}>
                      {STATUS_OPTIONS.filter(o => o !== s).map((o) => (
                        <button key={o} onClick={() => onUpdateRow(row.id, { status: o })} title={`Move to ${STATUS[o].label}`} style={{
                          flex: 1, padding: "3px 0", borderRadius: 4,
                          background: "transparent", border: "1px solid var(--border)",
                          color: "var(--muted-foreground)", fontSize: 10.5,
                          cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>
                          →{STATUS[o].label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div style={{ padding: 18, textAlign: "center", color: "var(--muted-foreground)", fontSize: 12, border: "1px dashed var(--border)", borderRadius: 6 }}>
                  Drop or click → to add
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Stub views for Chart / Schema (encouraging — show what's coming)
// ─────────────────────────────────────────────────────────────

const StubView = ({ title, icon, children }) => (
  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
    <div style={{ maxWidth: 420, textAlign: "center", padding: 32 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 12,
        background: "color-mix(in oklch, var(--primary) 12%, transparent)",
        color: "var(--primary)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16,
      }}>{icon}</div>
      <h3 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 8px" }}>{title}</h3>
      <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  </div>
);

const ChartView = ({ rows }) => {
  const sentimentCounts = {
    Positive: rows.filter(r => r.sentiment === "Positive").length,
    Mixed:    rows.filter(r => r.sentiment === "Mixed").length,
    Negative: rows.filter(r => r.sentiment === "Negative").length,
  };
  const themeCounts = THEME_OPTIONS.reduce((acc, t) => {
    acc[t] = rows.filter(r => r.theme === t).length;
    return acc;
  }, {});
  const total = rows.length || 1;
  const maxTheme = Math.max(...Object.values(themeCounts), 1);

  return (
    <div className="fb-scroll" style={{ flex: 1, overflow: "auto", padding: 24, background: "var(--background)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{
          padding: 18, background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border-subtle)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 14 }}>Sentiment breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(sentimentCounts).map(([k, n]) => {
              const tone = SENTIMENT_TONE[k];
              const pct = (n / total) * 100;
              return (
                <div key={k}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{k}</span>
                    <span className="fb-tnum" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{n} · {pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 8, background: "var(--muted)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: pct + "%", height: "100%", background: tone.fg, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          padding: 18, background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border-subtle)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 14 }}>Top themes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).filter(([_, n]) => n > 0).map(([k, n]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 12.5 }}>{k}</span>
                <div style={{ width: 120, height: 8, background: "var(--muted)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: (n / maxTheme * 100) + "%", height: "100%", background: "var(--chart-1)", borderRadius: 4 }} />
                </div>
                <span className="fb-tnum" style={{ fontSize: 11.5, color: "var(--muted-foreground)", minWidth: 16, textAlign: "right" }}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          gridColumn: "span 2",
          padding: 18, background: "var(--card)", borderRadius: 10,
          border: "1px solid var(--border-subtle)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 14 }}>By status</div>
          <div style={{ display: "flex", gap: 12 }}>
            {STATUS_OPTIONS.map((s) => {
              const n = rows.filter(r => r.status === s).length;
              const toneMap = {
                todo:     { bg: "var(--status-todo-bg)",     fg: "var(--status-todo-fg)" },
                progress: { bg: "var(--status-progress-bg)", fg: "var(--status-progress-fg)" },
                waiting:  { bg: "var(--status-waiting-bg)",  fg: "var(--status-waiting-fg)" },
                done:     { bg: "var(--status-done-bg)",     fg: "var(--status-done-fg)" },
              }[s];
              return (
                <div key={s} style={{
                  flex: 1, padding: 14, borderRadius: 7,
                  background: toneMap.bg, color: toneMap.fg,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>{STATUS[s].label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{n}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const SchemaView = ({ columns }) => (
  <div className="fb-scroll" style={{ flex: 1, overflow: "auto", padding: 24, background: "var(--background)" }}>
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 12 }}>Schema · customer_interviews</div>
      <div style={{
        background: "var(--card)", borderRadius: 10,
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
        <div style={{
          padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)",
          background: "var(--surface)", display: "flex", alignItems: "center", gap: 8,
        }}>
          <IconDb size={14} style={{ color: "var(--chart-1)" }} />
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>customer_interviews</span>
          <span className="fb-tnum" style={{ fontSize: 11, color: "var(--muted-foreground)" }}>142 rows</span>
        </div>
        {columns.map((c, i) => (
          <div key={c.name} style={{
            padding: "9px 14px",
            display: "flex", alignItems: "center", gap: 10,
            borderBottom: i < columns.length - 1 ? "1px solid var(--border-subtle)" : "none",
            fontSize: 13,
          }}>
            <FieldTypeGlyph type={c.type} />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{c.name}</span>
            <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 3, background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{c.type}</span>
            {c.ai && (
              <span style={{
                fontSize: 10, padding: "1px 5px", borderRadius: 3, fontWeight: 600,
                background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                color: "var(--primary)",
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
                <IconSparkles size={9} />AI inferred
              </span>
            )}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{c.width}px</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Panels menu — toggle Activity bar / Sidebar / AI panel + kbd shortcuts
// ─────────────────────────────────────────────────────────────

const PanelsMenu = ({ panels, onToggle, onShowAll, onHideAll }) => {
  const [open, setOpen] = useS(false);
  const wrapperRef = useR(null);

  useE(() => {
    if (!open) return;
    function h(e) {
      // Close when clicking OUTSIDE the wrapper (button + popover).
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
        background: open ? "var(--active-bg-strong)" : "var(--card)",
        color: "var(--muted-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        flexShrink: 0,
      }} title="Panels (⌘\\)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          width: 230, padding: 4,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 8, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
        }}>
          <div style={{ padding: "8px 10px 6px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Panels</div>
          <PanelMenuRow Glyph={ActivityBarGlyph}     label="Activity bar" kbd="⌘⇧A" on={panels.activityBar} onToggle={() => onToggle("activityBar")} />
          <PanelMenuRow Glyph={SidebarGlyph}         label="Sidebar"      kbd="⌘⇧F" on={panels.sidebar}     onToggle={() => onToggle("sidebar")} />
          <PanelMenuRow Glyph={DetailBarGlyphSmall}  label="Detail bar"   kbd="⌘I"    on={panels.detailBar}   onToggle={() => onToggle("detailBar")} />
          <PanelMenuRow Glyph={DetailPanelGlyph}     label="AI panel"     kbd="⌘B"  on={panels.aiPanel}     onToggle={() => onToggle("aiPanel")} />
          <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
          <SimpleMenuRow label="Show all panels" onClick={() => { onShowAll(); setOpen(false); }} />
          <SimpleMenuRow label="Hide all panels" onClick={() => { onHideAll(); setOpen(false); }} />
        </div>
      )}
    </div>
  );
};

const PanelMenuRow = ({ Glyph, label, kbd, on, onToggle }) => (
  <button onClick={onToggle} style={{
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "6px 10px", border: "none",
    background: "transparent", borderRadius: 5, cursor: "pointer",
    color: "var(--foreground)", textAlign: "left",
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
    <Glyph on={on} />
    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{label}</span>
    <span className="fb-kbd" style={{ minWidth: 0, padding: "1px 5px" }}>{kbd}</span>
    <span style={{ width: 14, display: "flex", justifyContent: "center" }}>
      {on && <IconCheck size={12} style={{ color: "var(--primary)" }} />}
    </span>
  </button>
);

const SimpleMenuRow = ({ label, onClick }) => (
  <button onClick={onClick} style={{
    display: "block", width: "100%", padding: "6px 10px", border: "none",
    background: "transparent", borderRadius: 5, cursor: "pointer",
    color: "var(--foreground)", textAlign: "left", fontSize: 13,
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
    {label}
  </button>
);

// Tiny illustrative icons of the actual panels — visual hint of WHAT each row controls.
const PanelGlyphBase = ({ on, children }) => (
  <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: on ? "var(--foreground)" : "var(--muted-foreground)", opacity: on ? 1 : 0.6, flexShrink: 0 }}>
    <rect x="0.5" y="0.5" width="21" height="13" rx="1.5" />
    {children}
  </svg>
);
const ActivityBarGlyph = ({ on }) => (
  <PanelGlyphBase on={on}>
    <rect x="0.5" y="0.5" width="3.5" height="13" rx="1.5" fill="currentColor" opacity={on ? "0.85" : "0.35"} stroke="none" />
  </PanelGlyphBase>
);
const SidebarGlyph = ({ on }) => (
  <PanelGlyphBase on={on}>
    <rect x="0.5" y="0.5" width="8" height="13" rx="1.5" fill="currentColor" opacity={on ? "0.85" : "0.35"} stroke="none" />
  </PanelGlyphBase>
);
const DetailPanelGlyph = ({ on }) => (
  <PanelGlyphBase on={on}>
    <rect x="14" y="0.5" width="7.5" height="13" rx="1.5" fill="currentColor" opacity={on ? "0.85" : "0.35"} stroke="none" />
  </PanelGlyphBase>
);
const DetailBarGlyphSmall = ({ on }) => (
  <PanelGlyphBase on={on}>
    <rect x="16" y="0.5" width="5.5" height="13" rx="1.5" fill="currentColor" opacity={on ? "0.85" : "0.35"} stroke="none" />
    <line x1="17.2" y1="4" x2="20.3" y2="4" stroke="white" strokeWidth="0.7" opacity={on ? "0.9" : "0.6"} />
    <line x1="17.2" y1="7" x2="20.3" y2="7" stroke="white" strokeWidth="0.7" opacity={on ? "0.9" : "0.6"} />
    <line x1="17.2" y1="10" x2="19" y2="10" stroke="white" strokeWidth="0.7" opacity={on ? "0.9" : "0.6"} />
  </PanelGlyphBase>
);

// Edge collapse buttons — small chevron pinned to a panel edge for quick close.
const EdgeCollapse = ({ side, onClick, title }) => {
  // side: "left" closes a panel on the left rail; "right" closes one on the right rail
  const style = {
    width: 16, height: 28, padding: 0,
    background: "var(--card)",
    border: "1px solid var(--border)",
    color: "var(--muted-foreground)",
    borderRadius: side === "left" ? "0 5px 5px 0" : "5px 0 0 5px",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "absolute", top: 12, zIndex: 5,
    boxShadow: "var(--shadow-sm)",
  };
  if (side === "left") style.right = -8;
  else style.left = -8;
  return (
    <button onClick={onClick} title={title} style={style}>
      {side === "left" ? <IconChevronLeft size={12} /> : <IconChevronRight size={12} />}
    </button>
  );
};

// Expand handle when a panel is closed — small floating tab on the edge to reopen.
const ExpandTab = ({ side, onClick, label, count }) => {
  const style = {
    position: "absolute", top: 12, zIndex: 5,
    height: 28, padding: "0 8px",
    background: "var(--card)", border: "1px solid var(--border)",
    color: "var(--muted-foreground)", fontSize: 11, fontWeight: 500,
    cursor: "pointer",
    borderRadius: 5,
    display: "inline-flex", alignItems: "center", gap: 5,
    boxShadow: "var(--shadow-sm)",
  };
  if (side === "left") style.left = 8;
  else style.right = 8;
  return (
    <button onClick={onClick} style={style}>
      {side === "left" ? <IconChevronRight size={12} /> : <IconChevronLeft size={12} />}
      <span>{label}</span>
      {count != null && count > 0 && (
        <span style={{
          fontSize: 10, padding: "0 5px", borderRadius: 3,
          background: "color-mix(in oklch, var(--primary) 18%, transparent)",
          color: "var(--primary)", fontWeight: 600,
        }}>{count}</span>
      )}
    </button>
  );
};

Object.assign(window, {
  PanelsMenu, EdgeCollapse, ExpandTab,
  InteractiveSidebar,
  FilterChips, InteractiveHeader, InteractiveViewSwitcher,
  KanbanView, StubView, ChartView, SchemaView,
  SegmentedControl, RowHeightControl, StyleControl,
});

const SegmentedControl = ({ value, options, onChange, title }) => (
  <div title={title} style={{
    display: "inline-flex", padding: 2, gap: 1,
    background: "var(--muted)", borderRadius: 6, border: "1px solid var(--border-subtle)",
  }}>
    {options.map(o => {
      const on = o.id === value;
      return (
        <button key={o.id} onClick={() => onChange(o.id)} title={o.title || o.label} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "3px 7px", borderRadius: 4, border: "none",
          background: on ? "var(--surface-elevated)" : "transparent",
          color: on ? "var(--foreground)" : "var(--muted-foreground)",
          fontSize: 11, fontWeight: on ? 600 : 500,
          cursor: "pointer", boxShadow: on ? "var(--shadow-sm)" : "none",
          minWidth: 22,
        }}>{o.label}</button>
      );
    })}
  </div>
);
const RowHeightControl = ({ value, onChange }) => (
  <SegmentedControl
    title="Row height" value={value} onChange={onChange}
    options={[
      { id: "short",  label: "S", title: "Short — compact rows" },
      { id: "medium", label: "M", title: "Medium" },
      { id: "tall",   label: "T", title: "Tall — wraps long text" },
    ]}
  />
);
const StyleControl = ({ value, onChange }) => (
  <SegmentedControl
    title="Cell style" value={value} onChange={onChange}
    options={[
      { id: "default", label: "Default" },
      { id: "rich",    label: "Rich"    },
    ]}
  />
);
Object.assign(window, { SegmentedControl, RowHeightControl, StyleControl });
