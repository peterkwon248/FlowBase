/* @jsx React.createElement */
// FlowBase — Dashboard Builder (Phase 1)
//   "+ Add chart" → user-built charts saved per-table.
//   Chart types: Bar, Pie/Donut, Line, KPI.

const { useState: useDbS, useEffect: useDbE, useRef: useDbR, useMemo: useDbM } = React;

// ─────────────────────────────────────────────────────────────
// Chart type catalog
// ─────────────────────────────────────────────────────────────

const CHART_TYPES = [
  {
    id: "kpi",
    label: "KPI",
    icon: "#",
    desc: "Single big number — count or sum",
    needs: { metric: true },
  },
  {
    id: "bar",
    label: "Bar",
    icon: "▌",
    desc: "Compare values across categories",
    needs: { categorical: true },
  },
  {
    id: "donut",
    label: "Donut",
    icon: "◐",
    desc: "Proportion (best for ≤6 categories)",
    needs: { categorical: true },
  },
  {
    id: "line",
    label: "Line",
    icon: "～",
    desc: "Trend over time",
    needs: { date: true },
  },
  {
    id: "area",
    label: "Area",
    icon: "▲",
    desc: "Stacked area over time (with split)",
    needs: { date: true },
  },
  {
    id: "stacked-bar",
    label: "Stacked",
    icon: "▌▌",
    desc: "Two categoricals — stacked",
    needs: { categorical2: true },
  },
  {
    id: "heatmap",
    label: "Heatmap",
    icon: "▦",
    desc: "Two categoricals — matrix",
    needs: { categorical2: true },
  },
];

// ─────────────────────────────────────────────────────────────
// Compute default charts from columns (used when user hasn't customized)
// ─────────────────────────────────────────────────────────────

function defaultChartsFor(columns) {
  const out = [];
  const categorical = columns.filter(c => ["status", "select", "priority"].includes(c.type));
  const dates = columns.filter(c => c.type === "date");
  const numerics = columns.filter(c => c.type === "num");

  // 1. Total KPI
  out.push({ id: "_auto_count", type: "kpi", title: "Total rows", metric: "count", _auto: true });

  // 2. KPI per numeric (sum) — up to 2
  numerics.slice(0, 2).forEach(c => {
    out.push({
      id: "_auto_sum_" + c.name, type: "kpi",
      title: `Sum of ${c.label || c.name}`,
      metric: "sum", metricCol: c.name, _auto: true,
    });
  });

  // 3. Bar by first categorical
  if (categorical[0]) {
    out.push({
      id: "_auto_bar_" + categorical[0].name, type: "bar",
      title: `By ${categorical[0].label || categorical[0].name}`,
      dim: categorical[0].name, _auto: true,
    });
  }

  // 4. Donut by second categorical (or first if only one)
  if (categorical[1]) {
    out.push({
      id: "_auto_donut_" + categorical[1].name, type: "donut",
      title: `${categorical[1].label || categorical[1].name} distribution`,
      dim: categorical[1].name, _auto: true,
    });
  } else if (categorical[0] && !out.some(c => c.dim === categorical[0].name && c.type === "donut")) {
    // already added a bar for first cat — if we want a donut variation, add only if 5+ rows
  }

  // 5. Line over first date
  if (dates[0]) {
    out.push({
      id: "_auto_line_" + dates[0].name, type: "line",
      title: `Over ${dates[0].label || dates[0].name}`,
      dateCol: dates[0].name, granularity: "week", _auto: true,
    });
  }

  return out;
}

// What's missing? Used to render "fix it" cards.
function missingChartHints(columns) {
  const categorical = columns.find(c => ["status", "select", "priority"].includes(c.type));
  const dateCol = columns.find(c => c.type === "date");
  const numCol = columns.find(c => c.type === "num");
  const out = [];
  if (!categorical) out.push({
    kind: "categorical",
    chartTypes: ["Bar", "Donut"],
    hint: "Bar · Donut 차트를 보려면 카테고리 컬럼(Status / Select / Priority)이 필요합니다.",
    fix: { kind: "basic", name: "category", label: "Category", type: "select", width: 140 },
    fixLabel: "Add Category column",
  });
  if (!dateCol) out.push({
    kind: "date",
    chartTypes: ["Line"],
    hint: "Line 차트(시계열)를 보려면 Date 컬럼이 필요합니다.",
    fix: { kind: "basic", name: "date", label: "Date", type: "date", width: 110 },
    fixLabel: "Add Date column",
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// Main dashboard renderer (replaces GenericDashboard when charts exist)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Dashboard Template picker — small button + popover listing Library Dashboards
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Save current Dashboard as Library template — small popover
// ─────────────────────────────────────────────────────────────

const SaveDashboardAsTemplateButton = ({ onSave }) => {
  const [open, setOpen] = useDbS(false);
  const [name, setName] = useDbS("");
  const [desc, setDesc] = useDbS("");
  const wrap = useDbR(null);
  useDbE(() => {
    if (!open) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    onSave(name.trim(), desc.trim());
    setOpen(false);
    setName(""); setDesc("");
  };

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Save dashboard layout as Library template" style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 10px", borderRadius: 6,
        background: open ? "var(--active-bg-strong)" : "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
      }}>
        <span style={{ fontSize: 11 }}>📊</span>
        Save as template
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 320, padding: 14,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 9, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
        }}>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 10, lineHeight: 1.4 }}>
            현재 dashboard 레이아웃을 Library에 저장. 컬럼 시그니처에 맞는 다른 테이블에서 재사용됩니다.
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>Name</div>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder="Dashboard name"
            style={fieldSelect()} />
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginTop: 10, marginBottom: 4 }}>Description (optional)</div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="What is this dashboard for?" rows={2}
            style={{ ...fieldSelect(), resize: "vertical" }} />
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <button onClick={() => setOpen(false)} style={{
              flex: 1, padding: "6px 10px", borderRadius: 6,
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={submit} disabled={!name.trim()} style={{
              flex: 1.3, padding: "6px 10px", borderRadius: 6,
              background: "var(--primary)", border: "1px solid var(--primary)",
              color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600,
              cursor: name.trim() ? "pointer" : "default", opacity: name.trim() ? 1 : 0.5,
            }}>Save to Library</button>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardTemplatePicker = ({ library, columns, currentMatchId, onApply }) => {
  const [open, setOpen] = useDbS(false);
  const wrap = useDbR(null);
  useDbE(() => {
    if (!open) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const dashboards = library.dashboards || [];
  // Compute match score for each
  const ranked = dashboards.map(d => {
    const m = window.matchSignature ? window.matchSignature(d, columns) : { score: 0, matched: false };
    return { d, ...m };
  }).sort((a, b) => b.score - a.score);

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Apply Library Dashboard template" style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 10px", borderRadius: 6,
        background: open ? "var(--active-bg-strong)" : "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
      }}>
        <span style={{ fontSize: 11 }}>📊</span>
        Apply template
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 320, padding: 6,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 8, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
          maxHeight: 360, overflowY: "auto",
        }} className="fb-scroll">
          <div style={{ padding: "6px 8px 4px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Library Dashboards
          </div>
          {ranked.map(({ d, score, matched }) => {
            const isCurrent = d.id === currentMatchId;
            return (
              <button key={d.id} onClick={() => { onApply(d.id); setOpen(false); }} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                width: "100%", padding: "8px 10px", border: "none",
                background: isCurrent ? "color-mix(in oklch, var(--primary) 8%, transparent)" : "transparent",
                borderRadius: 6, cursor: "pointer", textAlign: "left",
                color: "var(--foreground)", marginBottom: 2,
              }}
              onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "var(--hover-bg)"; }}
              onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 16, lineHeight: 1, marginTop: 1 }}>{d.icon || "📊"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.name}</span>
                    {matched ? (
                      <span style={{ fontSize: 10, padding: "0 5px", borderRadius: 3, background: "var(--status-done-bg)", color: "var(--status-done-fg)", fontWeight: 600 }}>
                        {score}% fit
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>partial</span>
                    )}
                    {isCurrent && <span style={{ fontSize: 10, color: "var(--primary)", fontWeight: 600 }}>current</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2, lineHeight: 1.4 }}>{d.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CustomDashboard = ({ rows, columns, tableLabel, charts, onAddChart, onEditChart, onDeleteChart, onMoveChart, onReorderChart, onAddColumn, onApplyDashboardTemplate, onResetDashboard, onSaveDashboardAsTemplate, onAiBuildDashboard, matchInfo, library, customized }) => {
  const [pickerOpen, setPickerOpen] = useDbS(false);
  const [editingId, setEditingId] = useDbS(null);

  // If user never customized, show computed auto-charts; otherwise show stored charts.
  const displayCharts = charts || [];
  const hints = missingChartHints(columns);

  // Drag-reorder for chart cards
  const drag = window.useDragReorder(displayCharts, (id, newIdx) => onReorderChart?.(id, newIdx), "vertical");

  const editing = editingId ? displayCharts.find(c => c.id === editingId) : null;

  return (
    <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: 20, background: "var(--background)" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          {displayCharts.length} {displayCharts.length === 1 ? "chart" : "charts"}
          {!customized && matchInfo && (
            <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 3, background: "color-mix(in oklch, var(--primary) 16%, transparent)", color: "var(--primary)", fontSize: 9.5, letterSpacing: 0, textTransform: "none", fontWeight: 600 }}>
              {matchInfo.dashboard.name}
            </span>
          )}
          {!customized && !matchInfo && displayCharts.length > 0 && (
            <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 3, background: "var(--muted)", color: "var(--muted-foreground)", fontSize: 9.5, letterSpacing: 0, textTransform: "none" }}>auto</span>
          )}
        </span>
        <div style={{ flex: 1 }} />
        {/* Template picker — list available Library Dashboards */}
        {onApplyDashboardTemplate && library?.dashboards?.length > 0 && (
          <DashboardTemplatePicker
            library={library}
            columns={columns}
            currentMatchId={matchInfo?.dashboard?.id}
            onApply={onApplyDashboardTemplate}
          />
        )}
        {customized && onResetDashboard && (
          <button onClick={() => {
            if (window.confirm("Dashboard 커스텀을 초기화할까요? auto-detect로 돌아갑니다.")) onResetDashboard();
          }} style={{
            padding: "5px 10px", borderRadius: 6,
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--muted-foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>Reset</button>
        )}
        {/* Save current dashboard as Library template */}
        {customized && onSaveDashboardAsTemplate && (
          <SaveDashboardAsTemplateButton onSave={onSaveDashboardAsTemplate} />
        )}
        {/* AI Build — fallback for tables with no template match */}
        {!customized && !matchInfo && displayCharts.length > 0 && onAiBuildDashboard && (
          <button onClick={onAiBuildDashboard} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 10px", borderRadius: 6,
            background: "color-mix(in oklch, var(--primary) 18%, transparent)",
            border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
            color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            <IconSparkles size={11} />
            Build with AI
          </button>
        )}
        <button onClick={() => setPickerOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 6,
          background: "var(--primary)", border: "1px solid var(--primary)",
          color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          <IconPlus size={11} />
          Add chart
        </button>
      </div>

      {/* Charts */}
      {displayCharts.length === 0 && hints.length === 0 ? (
        <DashboardEmptyState columns={columns} onAdd={(spec) => onAddChart(spec)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "120px", gap: 14, alignItems: "stretch" }}>
          {displayCharts.map((chart, i) => (
            <DashChartCard
              key={chart.id}
              chart={chart}
              rows={rows}
              columns={columns}
              onEdit={() => setEditingId(chart.id)}
              onDelete={() => onDeleteChart(chart.id)}
              onMoveUp={i > 0 ? () => onMoveChart(chart.id, -1) : null}
              onMoveDown={i < displayCharts.length - 1 ? () => onMoveChart(chart.id, 1) : null}
              onToggleWidth={() => onEditChart(chart.id, { width: chart.width === "half" ? "full" : "half" })}
              onSetHeight={(h) => onEditChart(chart.id, { height: h })}
              isAuto={!!chart._auto}
              dragItemProps={drag ? drag.getItemProps(chart.id) : null}
              dragHandleProps={drag ? drag.getHandleProps(chart.id) : null}
              isDragging={drag ? drag.isDragging(chart.id) : false}
              dropTargetSide={drag && drag.dropTarget?.id === chart.id ? drag.dropTarget.side : null}
            />
          ))}

          {/* Missing-data hint cards */}
          {hints.map(h => (
            <div key={h.kind} style={{
              padding: "14px 16px",
              background: "color-mix(in oklch, var(--muted) 50%, var(--card))",
              border: "1px dashed var(--border)",
              borderRadius: 10,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 7,
                background: "var(--muted)", color: "var(--muted-foreground)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <IconChart size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>
                  {h.chartTypes.join(" · ")} not yet available
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.4 }}>{h.hint}</div>
              </div>
              {onAddColumn && (
                <button onClick={() => onAddColumn(h.fix)} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "5px 11px", borderRadius: 6,
                  background: "var(--primary)", border: "1px solid var(--primary)",
                  color: "var(--primary-foreground)",
                  fontSize: 11.5, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                }}>
                  <IconPlus size={10} />
                  {h.fixLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chart picker / editor modal */}
      {pickerOpen && (
        <ChartEditor
          columns={columns}
          onClose={() => setPickerOpen(false)}
          onSave={(spec) => {
            onAddChart(spec);
            setPickerOpen(false);
          }}
        />
      )}
      {editing && (
        <ChartEditor
          initial={editing}
          columns={columns}
          onClose={() => setEditingId(null)}
          onSave={(spec) => {
            onEditChart(editing.id, spec);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Empty state — suggestions based on column types
// ─────────────────────────────────────────────────────────────

const DashboardEmptyState = ({ columns, onAdd }) => {
  const categorical = columns.find(c => ["status", "select", "priority"].includes(c.type));
  const dateCol = columns.find(c => c.type === "date");
  const numCol = columns.find(c => c.type === "num");

  const suggestions = [];
  suggestions.push({ id: "kpi-count", title: "Total rows", type: "kpi", spec: { type: "kpi", title: "Total", metric: "count" } });
  if (categorical) suggestions.push({
    id: "bar-cat",
    title: `Bar by ${categorical.label || categorical.name}`,
    type: "bar",
    spec: { type: "bar", title: `By ${categorical.label || categorical.name}`, dim: categorical.name },
  });
  if (categorical) suggestions.push({
    id: "donut-cat",
    title: `Donut by ${categorical.label || categorical.name}`,
    type: "donut",
    spec: { type: "donut", title: `${categorical.label || categorical.name} distribution`, dim: categorical.name },
  });
  if (dateCol) suggestions.push({
    id: "line-date",
    title: `Trend over ${dateCol.label || dateCol.name}`,
    type: "line",
    spec: { type: "line", title: "Over time", dateCol: dateCol.name, granularity: "week" },
  });

  return (
    <div style={{ padding: "40px 20px", textAlign: "center" }}>
      <div style={{
        display: "inline-flex", width: 44, height: 44, borderRadius: 10,
        background: "color-mix(in oklch, var(--primary) 14%, transparent)",
        color: "var(--primary)",
        alignItems: "center", justifyContent: "center", marginBottom: 12,
      }}>
        <IconChart size={20} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Build your dashboard</div>
      <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 20, maxWidth: 420, margin: "0 auto 20px" }}>
        차트를 추가해서 데이터를 한눈에 보세요. 추천부터 시작해도 좋아요.
      </div>

      {suggestions.length > 0 && (
        <>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--muted-foreground)", marginBottom: 8,
          }}>✨ Suggested</div>
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8,
            maxWidth: 520, margin: "0 auto 18px",
          }}>
            {suggestions.map(s => {
              const ct = CHART_TYPES.find(c => c.id === s.type);
              return (
                <button key={s.id} onClick={() => onAdd(s.spec)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 999,
                  background: "var(--card)", border: "1px solid var(--border)",
                  color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)" }}>{ct?.icon}</span>
                  {s.title}
                </button>
              );
            })}
          </div>
        </>
      )}

      <button onClick={onAdd} style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "7px 14px", borderRadius: 6,
        background: "var(--primary)", border: "1px solid var(--primary)",
        color: "var(--primary-foreground)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
      }}>
        <IconPlus size={12} />
        Add chart
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Chart card wrapper
// ─────────────────────────────────────────────────────────────

const DashChartCard = ({ chart, rows, columns, onEdit, onDelete, onMoveUp, onMoveDown, onToggleWidth, onSetHeight, isAuto, dragItemProps, dragHandleProps, isDragging, dropTargetSide }) => {
  const [menuOpen, setMenuOpen] = useDbS(false);
  const [hovering, setHovering] = useDbS(false);
  const wrap = useDbR(null);
  useDbE(() => {
    if (!menuOpen) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  // Width support: full (4 cols), half (2 cols), one-third (~1.33), two-thirds (~2.67), quarter (1 col)
  const widthMap = {
    "full":        "span 12",
    "half":        "span 6",
    "one-third":   "span 4",
    "two-thirds":  "span 8",
    "quarter":     "span 3",
  };
  // Height support — auto-rows × N
  const heightMap = {
    "short":   "span 1",
    "medium":  "span 2",
    "tall":    "span 3",
  };
  const colSpan = widthMap[chart.width] || "span 12";
  const defaultHeight = chart.type === "kpi" ? "short" : "medium";
  const rowSpan = heightMap[chart.height || defaultHeight];
  // Inner chart pixel height based on height level
  const innerH = chart.height === "tall" ? 380 : chart.height === "short" ? 110 : 240;

  return (
    <div
      {...(dragItemProps || {})}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: "relative",
        padding: 14,
        background: "var(--card)",
        border: "1px solid " + (hovering ? "var(--border)" : "var(--border-subtle)"),
        borderRadius: 8,
        gridColumn: colSpan,
        gridRow: rowSpan,
        opacity: isDragging ? 0.4 : 1,
        boxShadow: hovering && !isDragging ? "0 0 0 1px color-mix(in oklch, var(--primary) 14%, transparent)" : "none",
        transition: "opacity 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
        display: "flex", flexDirection: "column",
        minHeight: 0,
      }}>
      {/* Drop indicators (left/right because grid layout) */}
      {dropTargetSide === "before" && (
        <span style={{
          position: "absolute", left: -8, top: 0, bottom: 0, width: 3,
          background: "var(--primary)", borderRadius: 2, pointerEvents: "none",
        }} />
      )}
      {dropTargetSide === "after" && (
        <span style={{
          position: "absolute", right: -8, top: 0, bottom: 0, width: 3,
          background: "var(--primary)", borderRadius: 2, pointerEvents: "none",
        }} />
      )}

      {/* Header bar — whole bar is the drag target */}
      <div
        {...(dragHandleProps || {})}
        title={dragHandleProps ? "Drag to reorder" : undefined}
        style={{
          ...(dragHandleProps?.style || {}),
          display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          cursor: dragHandleProps ? (isDragging ? "grabbing" : "grab") : "default",
          userSelect: "none", flexShrink: 0,
        }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "-0.005em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chart.title || "Untitled chart"}</div>
        {isAuto && (
          <span title="Auto-generated · Edit to customize" style={{
            fontSize: 9, padding: "1px 5px", borderRadius: 3,
            background: "var(--muted)", color: "var(--muted-foreground)",
            fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
          }}>auto</span>
        )}
        <div style={{ flex: 1 }} />
        <div ref={wrap} style={{ position: "relative", display: "inline-flex" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
            onMouseDown={(e) => e.stopPropagation()}
            draggable={false}
            style={{
            width: 22, height: 22, padding: 0, borderRadius: 4, border: "none",
            background: menuOpen ? "var(--active-bg-strong)" : "transparent",
            color: "var(--muted-foreground)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={(e) => { if (!menuOpen) e.currentTarget.style.background = "var(--hover-bg)"; }}
          onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = "transparent"; }}>
            <IconMore size={13} />
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0,
              width: 160, padding: 4, zIndex: 30,
              background: "var(--popover)", border: "1px solid var(--border)",
              borderRadius: 7, boxShadow: "var(--shadow-popover)",
              fontSize: 12.5,
            }}>
              <DbMenuItem onClick={() => { onEdit(); setMenuOpen(false); }}>✏ Edit</DbMenuItem>
              {onToggleWidth && (
                <DbMenuItem onClick={() => { onToggleWidth(); setMenuOpen(false); }}>
                  {chart.width === "half" ? "↔ Make full-width" : "⇆ Make half-width"}
                </DbMenuItem>
              )}
              {onSetHeight && (
                <>
                  <DbMenuItem onClick={() => { onSetHeight("short");  setMenuOpen(false); }}>{chart.height === "short" ? "✓ " : ""}Height: Short</DbMenuItem>
                  <DbMenuItem onClick={() => { onSetHeight("medium"); setMenuOpen(false); }}>{(chart.height || (chart.type === "kpi" ? "short" : "medium")) === "medium" ? "✓ " : ""}Height: Medium</DbMenuItem>
                  <DbMenuItem onClick={() => { onSetHeight("tall");   setMenuOpen(false); }}>{chart.height === "tall" ? "✓ " : ""}Height: Tall</DbMenuItem>
                </>
              )}
              {onMoveUp && <DbMenuItem onClick={() => { onMoveUp(); setMenuOpen(false); }}>↑ Move up</DbMenuItem>}
              {onMoveDown && <DbMenuItem onClick={() => { onMoveDown(); setMenuOpen(false); }}>↓ Move down</DbMenuItem>}
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
              <DbMenuItem destructive onClick={() => { onDelete(); setMenuOpen(false); }}>🗑 Delete</DbMenuItem>
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", position: "relative" }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <ChartRender chart={{ ...chart, _innerH: innerH }} rows={rows} columns={columns} />
        </div>
      </div>
    </div>
  );
};

const DbMenuItem = ({ children, onClick, destructive }) => (
  <button onClick={onClick} style={{
    display: "block", width: "100%", padding: "6px 10px", textAlign: "left",
    background: "transparent", border: "none", borderRadius: 5, cursor: "pointer",
    color: destructive ? "var(--destructive)" : "var(--foreground)", fontSize: 12.5,
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────
// Chart renderers
// ─────────────────────────────────────────────────────────────

const ChartRender = ({ chart, rows, columns }) => {
  // KPI stays hand-rolled (large number is more impactful as plain HTML)
  if (chart.type === "kpi") return <KpiChart chart={chart} rows={rows} columns={columns} />;

  // Try ECharts for all visual charts
  const ecOption = useDbM(() => {
    if (!window.chartToECOption) return null;
    return window.chartToECOption(chart, rows);
  }, [chart, rows]);

  if (ecOption && window.ECharts) {
    // Use the chart card's natural height (innerH from card) — for ECharts pass undefined to allow container fill
    return <window.ECharts option={ecOption} height={chart._innerH || 220} />;
  }

  // Fallback to hand-rolled SVG renderers (also works if ECharts hasn't loaded yet)
  if (chart.type === "bar")   return <BarChartC  chart={chart} rows={rows} columns={columns} />;
  if (chart.type === "donut") return <DonutChart chart={chart} rows={rows} columns={columns} />;
  if (chart.type === "line")  return <LineChartC chart={chart} rows={rows} columns={columns} />;
  return <ChartHint>Loading chart…</ChartHint>;
};

const KpiChart = ({ chart, rows, columns }) => {
  let value = 0, label = "", suffix = chart.suffix || "";

  if (chart.metric === "count" || !chart.metric) {
    value = rows.length;
    label = "rows";
  } else if (chart.metric === "sum") {
    const vals = rows.map(r => Number(r[chart.metricCol])).filter(v => !isNaN(v));
    value = vals.reduce((a, b) => a + b, 0);
    const col = columns.find(c => c.name === chart.metricCol);
    label = col?.label || chart.metricCol;
  } else if (chart.metric === "avg") {
    const vals = rows.map(r => Number(r[chart.metricCol])).filter(v => !isNaN(v));
    value = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const col = columns.find(c => c.name === chart.metricCol);
    label = `avg · ${col?.label || chart.metricCol}`;
  } else if (chart.metric === "min" || chart.metric === "max") {
    const vals = rows.map(r => Number(r[chart.metricCol])).filter(v => !isNaN(v));
    value = vals.length > 0 ? (chart.metric === "min" ? Math.min(...vals) : Math.max(...vals)) : 0;
    const col = columns.find(c => c.name === chart.metricCol);
    label = `${chart.metric} · ${col?.label || chart.metricCol}`;
  } else if (chart.metric === "pct") {
    const total = rows.length;
    const hit = rows.filter(r => String(r[chart.metricCol]) === chart.metricValue).length;
    value = total > 0 ? Math.round((hit / total) * 100) : 0;
    suffix = "%";
    label = `${chart.metricValue}`;
  } else if (chart.metric === "countValue") {
    value = rows.filter(r => String(r[chart.metricCol]) === chart.metricValue).length;
    label = chart.metricValue;
  } else if (chart.metric === "countNotValue") {
    value = rows.filter(r => r[chart.metricCol] && String(r[chart.metricCol]) !== chart.metricValue).length;
    label = "items";
  } else if (chart.metric === "overdueCount") {
    const today = new Date().toISOString().slice(0, 10);
    value = rows.filter(r => {
      const d = r[chart.metricCol];
      if (!d) return false;
      const status = chart.statusCol ? r[chart.statusCol] : null;
      if (status && (status === "done" || status === "Done" || status === "완료")) return false;
      return String(d) < today;
    }).length;
    label = "overdue";
  } else if (chart.metric === "latestDate") {
    const dates = rows.map(r => r[chart.metricCol]).filter(Boolean).sort();
    value = dates[dates.length - 1] || "—";
    label = "latest";
  } else if (chart.metric === "ratio") {
    const num = rows.map(r => Number(r[chart.numCol])).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0);
    const den = rows.map(r => Number(r[chart.denCol])).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0);
    value = den > 0 ? num / den : 0;
    const numC = columns.find(c => c.name === chart.numCol);
    const denC = columns.find(c => c.name === chart.denCol);
    label = `${numC?.label || chart.numCol} / ${denC?.label || chart.denCol}`;
  }

  const isNumber = typeof value === "number";
  // Apply chart-level numberFormat if set, else fallback to compact default
  const display = isNumber
    ? (window.fbFormat && (chart.numberFormat || chart.decimals !== undefined)
        ? window.fbFormat(value, chart)
        : (Number.isInteger(value) ? value.toLocaleString() : value.toFixed(value < 10 ? 2 : 1)))
    : String(value);

  // Adaptive font sizing — long strings get smaller font
  const fullText = display + (suffix || "");
  const fontSize = fullText.length <= 4 ? 36
                  : fullText.length <= 6 ? 30
                  : fullText.length <= 8 ? 24
                  : fullText.length <= 11 ? 20
                  : 16;

  return (
    <div style={{
      padding: "4px 2px",
      display: "flex", flexDirection: "column", justifyContent: "center",
      minHeight: 0, height: "100%",
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 4,
        minWidth: 0, overflow: "hidden",
      }}>
        <span style={{
          fontSize, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05,
          minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFeatureSettings: '"tnum"',
        }}>{display}</span>
        {suffix && (
          <span style={{
            fontSize: Math.max(11, Math.round(fontSize * 0.45)),
            fontWeight: 600, color: "var(--muted-foreground)", flexShrink: 0,
          }}>{suffix}</span>
        )}
      </div>
      {label && (
        <span style={{
          fontSize: 11, color: "var(--muted-foreground)", marginTop: 4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{label}</span>
      )}
    </div>
  );
};

const BarChartC = ({ chart, rows }) => {
  if (!chart.dim) return <ChartHint>차트에 dimension 컬럼을 지정해주세요.</ChartHint>;
  const counts = {};
  rows.forEach(r => {
    const v = r[chart.dim];
    if (v === undefined || v === null || v === "") return;
    counts[v] = (counts[v] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <ChartHint>데이터 없음 — 셀에 값을 입력해보세요.</ChartHint>;
  const max = Math.max(...entries.map(([, n]) => n));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
      {entries.map(([k, n], i) => {
        const w = (n / max) * 100;
        const c = chartColor(i);
        return (
          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(k)}</span>
              <span className="fb-tnum" style={{ fontWeight: 600 }}>{n}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "color-mix(in oklch, var(--border-subtle) 60%, transparent)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: w + "%", background: c, borderRadius: 4, transition: "width 240ms ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart = ({ chart, rows }) => {
  if (!chart.dim) return <ChartHint>차트에 dimension 컬럼을 지정해주세요.</ChartHint>;
  const counts = {};
  rows.forEach(r => {
    const v = r[chart.dim];
    if (v === undefined || v === null || v === "") return;
    counts[v] = (counts[v] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <ChartHint>데이터 없음.</ChartHint>;
  const total = entries.reduce((a, [, n]) => a + n, 0);
  const r = 60, cx = 90, cy = 90, sw = 24;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "8px 0" }}>
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="color-mix(in oklch, var(--border-subtle) 80%, transparent)" strokeWidth={sw} />
        {entries.map(([k, n], i) => {
          const frac = n / total;
          const dash = C * frac;
          const gap = C - dash;
          const rot = (offset / total) * 360 - 90;
          offset += n;
          return (
            <circle key={k} cx={cx} cy={cy} r={r} fill="none"
              stroke={chartColor(i)} strokeWidth={sw}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rot} ${cx} ${cy})`} />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={28} fontWeight={700} fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">total</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        {entries.map(([k, n], i) => {
          const pct = Math.round((n / total) * 100);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: chartColor(i), flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(k)}</span>
              <span className="fb-tnum" style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{pct}%</span>
              <span className="fb-tnum" style={{ fontWeight: 600, minWidth: 24, textAlign: "right" }}>{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LineChartC = ({ chart, rows }) => {
  if (!chart.dateCol) return <ChartHint>Date 컬럼을 지정해주세요.</ChartHint>;
  const granularity = chart.granularity || "week";
  // Bucket rows by period
  const buckets = {};
  rows.forEach(r => {
    const v = r[chart.dateCol];
    if (!v) return;
    const d = new Date(v);
    if (isNaN(d.getTime())) return;
    let key;
    if (granularity === "day") key = d.toISOString().slice(0, 10);
    else if (granularity === "week") {
      const day = (d.getDay() + 6) % 7;
      const monday = new Date(d.getTime() - day * 86400000);
      key = monday.toISOString().slice(0, 10);
    } else if (granularity === "month") key = d.toISOString().slice(0, 7);
    else key = d.toISOString().slice(0, 10);
    buckets[key] = (buckets[key] || 0) + 1;
  });
  const entries = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return <ChartHint>날짜 데이터 없음.</ChartHint>;

  const W = 540, H = 160, pad = { l: 36, r: 12, t: 12, b: 24 };
  const maxY = Math.max(...entries.map(([, n]) => n));
  const xStep = entries.length > 1 ? (W - pad.l - pad.r) / (entries.length - 1) : 0;
  const points = entries.map(([k, n], i) => {
    const x = pad.l + i * xStep;
    const y = pad.t + (1 - n / maxY) * (H - pad.t - pad.b);
    return { x, y, k, n };
  });
  const path = points.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
  const area = path + ` L${points[points.length-1].x.toFixed(1)} ${H - pad.b} L${points[0].x.toFixed(1)} ${H - pad.b} Z`;
  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ maxWidth: W, display: "block" }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={pad.l} x2={W - pad.r}
            y1={pad.t + f * (H - pad.t - pad.b)}
            y2={pad.t + f * (H - pad.t - pad.b)}
            stroke="color-mix(in oklch, var(--border-subtle) 70%, transparent)" strokeWidth="1" />
        ))}
        <path d={area} fill="color-mix(in oklch, var(--primary) 14%, transparent)" />
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(p => (
          <circle key={p.k} cx={p.x} cy={p.y} r="3" fill="var(--primary)" />
        ))}
        {points.map((p, i) => {
          if (entries.length > 8 && i % Math.ceil(entries.length / 6) !== 0) return null;
          return (
            <text key={p.k} x={p.x} y={H - 6} textAnchor="middle"
              fontSize="9.5" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{p.k.slice(5)}</text>
          );
        })}
        <text x={pad.l - 6} y={pad.t + 4} textAnchor="end" fontSize="9.5" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{maxY}</text>
        <text x={pad.l - 6} y={H - pad.b} textAnchor="end" fontSize="9.5" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">0</text>
      </svg>
      <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted-foreground)" }}>
        per {granularity} · {entries.length} period{entries.length === 1 ? "" : "s"}
      </div>
    </div>
  );
};

const ChartHint = ({ children }) => (
  <div style={{ padding: "20px 12px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 12.5 }}>
    {children}
  </div>
);

function chartColor(i) {
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  return palette[i % palette.length];
}

// ─────────────────────────────────────────────────────────────
// Chart Editor — modal form for create/edit
// ─────────────────────────────────────────────────────────────

const ChartEditor = ({ initial, columns, onClose, onSave }) => {
  const [type, setType] = useDbS(initial?.type || "bar");
  const [title, setTitle] = useDbS(initial?.title || "");
  const [showAdvanced, setShowAdvanced] = useDbS(false);
  const [numberFormat, setNumberFormat] = useDbS(initial?.numberFormat || "raw"); // raw|percent|compact|currency
  const [decimals, setDecimals] = useDbS(initial?.decimals ?? 0);
  const [showLabels, setShowLabels] = useDbS(initial?.showLabels ?? true);
  const [sortOrder, setSortOrder] = useDbS(initial?.sortOrder || "count-desc"); // count-desc|count-asc|name-asc|name-desc
  const [dim, setDim] = useDbS(initial?.dim || initial?.dimX || "");
  const [dateCol, setDateCol] = useDbS(initial?.dateCol || "");
  const [granularity, setGranularity] = useDbS(initial?.granularity || "week");
  const [metric, setMetric] = useDbS(initial?.metric || "count");
  const [metricCol, setMetricCol] = useDbS(initial?.metricCol || "");
  const [stackBy, setStackBy] = useDbS(initial?.stackBy || initial?.dimY || initial?.splitBy || "");

  useDbE(() => {
    function h(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const categorical = columns.filter(c => ["status", "select", "priority", "text"].includes(c.type) && c.name !== "id");
  const dates = columns.filter(c => c.type === "date");
  const numerics = columns.filter(c => c.type === "num");

  // Auto-pick defaults when type changes
  useDbE(() => {
    if ((type === "bar" || type === "donut") && !dim && categorical[0]) setDim(categorical[0].name);
    if (type === "line" && !dateCol && dates[0]) setDateCol(dates[0].name);
  }, [type]);

  const canSave = () => {
    if (type === "kpi") return metric === "count" || (metricCol && ["sum", "avg", "min", "max"].includes(metric));
    if (type === "bar" || type === "donut") return !!dim;
    if (type === "line") return !!dateCol;
    if (type === "area") return !!dateCol;
    if (type === "stacked-bar" || type === "heatmap") return !!dim && !!stackBy;
    return false;
  };

  // Auto-title
  const computedTitle = () => {
    if (title.trim()) return title;
    if (type === "kpi") {
      if (metric === "count") return "Total rows";
      const c = columns.find(x => x.name === metricCol);
      return `${metric} of ${c?.label || metricCol}`;
    }
    if (type === "bar" || type === "donut") {
      const c = columns.find(x => x.name === dim);
      return `By ${c?.label || dim}`;
    }
    if (type === "line") {
      const c = columns.find(x => x.name === dateCol);
      return `Over ${c?.label || dateCol}`;
    }
    return "Chart";
  };

  const submit = () => {
    if (!canSave()) return;
    const spec = { type, title: computedTitle(), numberFormat, decimals, showLabels, sortOrder };
    if (type === "kpi") { spec.metric = metric; if (metric !== "count") spec.metricCol = metricCol; }
    if (type === "bar" || type === "donut") spec.dim = dim;
    if (type === "line") { spec.dateCol = dateCol; spec.granularity = granularity; }
    if (type === "area") { spec.dateCol = dateCol; spec.granularity = granularity; if (stackBy) spec.splitBy = stackBy; }
    if (type === "stacked-bar") { spec.dim = dim; spec.stackBy = stackBy; }
    if (type === "heatmap") { spec.dimX = dim; spec.dimY = stackBy; }
    onSave(spec);
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "color-mix(in oklch, var(--background) 60%, transparent)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 40,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(560px, 100%)", maxHeight: "calc(100vh - 80px)",
        background: "var(--popover)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--shadow-popover)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            width: 26, height: 26, borderRadius: 6,
            background: "color-mix(in oklch, var(--primary) 18%, transparent)",
            color: "var(--primary)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}><IconChart size={13} /></span>
          <div style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>
            {initial ? "Edit chart" : "Add chart"}
          </div>
          <button onClick={onClose} style={{
            width: 26, height: 26, borderRadius: 5, border: "none",
            background: "transparent", color: "var(--muted-foreground)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}><IconX size={12} /></button>
        </div>

        {/* Body */}
        <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {/* Chart type */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 8 }}>Chart type</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
            {CHART_TYPES.map(ct => {
              const on = ct.id === type;
              return (
                <button key={ct.id} onClick={() => setType(ct.id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "10px 6px", borderRadius: 7,
                  background: on ? "color-mix(in oklch, var(--primary) 10%, var(--card))" : "var(--card)",
                  border: "1px solid " + (on ? "var(--primary)" : "var(--border-subtle)"),
                  color: "var(--foreground)", cursor: "pointer",
                }} title={ct.desc}>
                  <span style={{ fontSize: 16, fontFamily: "var(--font-mono)", color: on ? "var(--primary)" : "var(--muted-foreground)" }}>{ct.icon}</span>
                  <span style={{ fontSize: 11.5, fontWeight: on ? 600 : 500 }}>{ct.label}</span>
                </button>
              );
            })}
          </div>

          {/* Configuration per type */}
          {type === "kpi" && (
            <>
              <FieldLabel>Metric</FieldLabel>
              <select value={metric} onChange={e => setMetric(e.target.value)} style={fieldSelect()}>
                <option value="count">Count rows</option>
                <option value="sum">Sum of column</option>
                <option value="avg">Average of column</option>
                <option value="min">Min of column</option>
                <option value="max">Max of column</option>
              </select>
              {metric !== "count" && (
                <>
                  <FieldLabel>Number column</FieldLabel>
                  <select value={metricCol} onChange={e => setMetricCol(e.target.value)} style={fieldSelect()}>
                    <option value="">— Pick —</option>
                    {numerics.map(c => <option key={c.name} value={c.name}>{c.label || c.name}</option>)}
                  </select>
                  {numerics.length === 0 && <FieldHint>이 테이블에 숫자 컬럼이 없습니다.</FieldHint>}
                </>
              )}
            </>
          )}

          {(type === "bar" || type === "donut") && (
            <>
              <FieldLabel>Dimension (group by)</FieldLabel>
              <select value={dim} onChange={e => setDim(e.target.value)} style={fieldSelect()}>
                <option value="">— Pick —</option>
                {categorical.map(c => <option key={c.name} value={c.name}>{c.label || c.name} ({c.type})</option>)}
              </select>
              {categorical.length === 0 && <FieldHint>이 테이블에 카테고리 컬럼이 없습니다.</FieldHint>}
            </>
          )}

          {(type === "stacked-bar" || type === "heatmap") && (
            <>
              <FieldLabel>X-axis (dimension)</FieldLabel>
              <select value={dim} onChange={e => setDim(e.target.value)} style={fieldSelect()}>
                <option value="">— Pick —</option>
                {categorical.map(c => <option key={c.name} value={c.name}>{c.label || c.name}</option>)}
              </select>
              <FieldLabel>Y-axis / Stack by</FieldLabel>
              <select value={stackBy} onChange={e => setStackBy(e.target.value)} style={fieldSelect()}>
                <option value="">— Pick —</option>
                {categorical.filter(c => c.name !== dim).map(c => <option key={c.name} value={c.name}>{c.label || c.name}</option>)}
              </select>
              {categorical.length < 2 && <FieldHint>두 개의 카테고리 컬럼이 필요합니다.</FieldHint>}
            </>
          )}

          {type === "area" && (
            <>
              <FieldLabel>Date column</FieldLabel>
              <select value={dateCol} onChange={e => setDateCol(e.target.value)} style={fieldSelect()}>
                <option value="">— Pick —</option>
                {dates.map(c => <option key={c.name} value={c.name}>{c.label || c.name}</option>)}
              </select>
              <FieldLabel>Granularity</FieldLabel>
              <div style={{ display: "inline-flex", padding: 2, gap: 1, background: "var(--muted)", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
                {[{id:"day",label:"Day"},{id:"week",label:"Week"},{id:"month",label:"Month"}].map(g => {
                  const on = granularity === g.id;
                  return <button key={g.id} onClick={() => setGranularity(g.id)} style={{
                    padding: "4px 10px", borderRadius: 4, border: "none",
                    background: on ? "var(--surface-elevated)" : "transparent",
                    color: on ? "var(--foreground)" : "var(--muted-foreground)",
                    fontSize: 11.5, fontWeight: on ? 600 : 500, cursor: "pointer",
                    boxShadow: on ? "var(--shadow-sm)" : "none",
                  }}>{g.label}</button>;
                })}
              </div>
              <FieldLabel>Split by (optional)</FieldLabel>
              <select value={stackBy} onChange={e => setStackBy(e.target.value)} style={fieldSelect()}>
                <option value="">No split (single area)</option>
                {categorical.map(c => <option key={c.name} value={c.name}>{c.label || c.name}</option>)}
              </select>
            </>
          )}

          {type === "line" && (
            <>
              <FieldLabel>Date column</FieldLabel>
              <select value={dateCol} onChange={e => setDateCol(e.target.value)} style={fieldSelect()}>
                <option value="">— Pick —</option>
                {dates.map(c => <option key={c.name} value={c.name}>{c.label || c.name}</option>)}
              </select>
              {dates.length === 0 && <FieldHint>이 테이블에 Date 컬럼이 없습니다.</FieldHint>}
              <FieldLabel>Granularity</FieldLabel>
              <div style={{ display: "inline-flex", padding: 2, gap: 1, background: "var(--muted)", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
                {[
                  { id: "day", label: "Day" },
                  { id: "week", label: "Week" },
                  { id: "month", label: "Month" },
                ].map(g => {
                  const on = granularity === g.id;
                  return (
                    <button key={g.id} onClick={() => setGranularity(g.id)} style={{
                      padding: "4px 10px", borderRadius: 4, border: "none",
                      background: on ? "var(--surface-elevated)" : "transparent",
                      color: on ? "var(--foreground)" : "var(--muted-foreground)",
                      fontSize: 11.5, fontWeight: on ? 600 : 500, cursor: "pointer",
                      boxShadow: on ? "var(--shadow-sm)" : "none",
                    }}>{g.label}</button>
                  );
                })}
              </div>
            </>
          )}

          {/* Title (optional) */}
          <FieldLabel>Title (optional)</FieldLabel>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder={computedTitle()}
            style={fieldSelect()} />

          {/* Advanced display options accordion */}
          <button onClick={() => setShowAdvanced(s => !s)} type="button" style={{
            display: "flex", alignItems: "center", gap: 5,
            width: "100%", marginTop: 14, padding: "6px 0",
            background: "transparent", border: "none",
            color: "var(--muted-foreground)", cursor: "pointer",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", textAlign: "left",
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAdvanced ? "none" : "rotate(-90deg)", transition: "transform 120ms ease" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Display options
          </button>

          {showAdvanced && (
            <div style={{ padding: "6px 0 4px", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Number format — for all chart types */}
              <div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>Number format</div>
                <div style={{ display: "inline-flex", padding: 2, gap: 1, background: "var(--muted)", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
                  {[
                    { id: "raw",      label: "12,345" },
                    { id: "percent",  label: "%" },
                    { id: "compact",  label: "12k" },
                    { id: "currency", label: "₩" },
                  ].map(f => {
                    const on = numberFormat === f.id;
                    return (
                      <button key={f.id} type="button" onClick={() => setNumberFormat(f.id)} style={{
                        padding: "4px 10px", borderRadius: 4, border: "none",
                        background: on ? "var(--surface-elevated)" : "transparent",
                        color: on ? "var(--foreground)" : "var(--muted-foreground)",
                        fontSize: 11.5, fontWeight: on ? 600 : 500, cursor: "pointer",
                        boxShadow: on ? "var(--shadow-sm)" : "none",
                      }}>{f.label}</button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Decimals</span>
                  <select value={decimals} onChange={e => setDecimals(Number(e.target.value))} style={{ ...fieldSelect(), width: 60, padding: "3px 6px", fontSize: 11.5 }}>
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </div>
              </div>

              {/* Show labels — bar/donut/line/area/heatmap/stacked */}
              {type !== "kpi" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input id="ce-labels" type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
                  <label htmlFor="ce-labels" style={{ fontSize: 12, cursor: "pointer" }}>Show data labels on chart</label>
                </div>
              )}

              {/* Sort order — bar/donut/stacked */}
              {(type === "bar" || type === "donut" || type === "stacked-bar") && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>Sort order</div>
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={fieldSelect()}>
                    <option value="count-desc">Count ↓ (most first)</option>
                    <option value="count-asc">Count ↑ (least first)</option>
                    <option value="name-asc">Label A → Z</option>
                    <option value="name-desc">Label Z → A</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 18px", borderTop: "1px solid var(--border-subtle)",
          display: "flex", gap: 8, justifyContent: "flex-end",
        }}>
          <button onClick={onClose} style={{
            padding: "6px 14px", borderRadius: 6,
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={submit} disabled={!canSave()} style={{
            padding: "6px 14px", borderRadius: 6,
            background: "var(--primary)", border: "1px solid var(--primary)",
            color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600,
            cursor: canSave() ? "pointer" : "default", opacity: canSave() ? 1 : 0.5,
          }}>{initial ? "Save" : "Add chart"}</button>
        </div>
      </div>
    </div>
  );
};

const FieldLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 6, marginTop: 12 }}>{children}</div>
);

const FieldHint = ({ children }) => (
  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>{children}</div>
);

const fieldSelect = () => ({
  width: "100%", padding: "7px 10px", borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--card)", color: "var(--foreground)",
  fontSize: 12.5, outline: "none", fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
});

Object.assign(window, {
  CHART_TYPES, CustomDashboard, ChartEditor, DashChartCard,
  defaultChartsFor, missingChartHints,
});
