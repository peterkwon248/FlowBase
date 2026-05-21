/* @jsx React.createElement */
// FlowBase — rich Schema view: 3 sub-tabs (스키마/필드/관계) with ER diagram + field inventory + relations list.

const { useState: useSE, useMemo: useME, useRef: useRE } = React;

// ─────────────────────────────────────────────────────────────
// Schema layout — positions are presets, fields are derived from the
// real data layer (COLUMNS_BY_TABLE) so the diagram never drifts.
// ─────────────────────────────────────────────────────────────

const TABLE_POSITIONS = {
  people:     { x:  40, y:  40, width: 230 },
  companies:  { x:  40, y: 320, width: 230 },
  interviews: { x: 320, y:  40, width: 260 },
  themes:     { x: 640, y:  40, width: 230 },
  tasks:      { x: 320, y: 430, width: 260 },
};
const TABLE_AKAS = {
  interviews: "customer_interviews",
  people: "people",
  companies: "companies",
  themes: "themes",
  tasks: "tasks",
};

function buildSchemaTables() {
  const cols = window.COLUMNS_BY_TABLE || {};
  const defs = window.TABLE_DEFS || {};
  return Object.keys(cols).map((id) => {
    const def = defs[id] || { label: id, color: "var(--chart-1)" };
    const pos = TABLE_POSITIONS[id] || { x: 0, y: 0, width: 230 };
    return {
      id,
      label: def.label,
      aka: TABLE_AKAS[id] || id,
      color: def.color,
      accentBg: `color-mix(in oklch, ${def.color} 22%, var(--background))`,
      x: pos.x, y: pos.y, width: pos.width,
      fields: cols[id].map((c) => ({
        name: c.name,
        type: c.fk ? "fk" : (c.type === "num" ? "number" : c.type === "date" ? "datetime" : c.type),
        pk: c.name === "id",
        fk: c.fk,
        ai: c.ai,
        required: c.name === "id" || c.name === "name" || c.name === "label" || c.name === "title",
        note: c.options ? (c.options.slice(0, 3).join(" · ") + (c.options.length > 3 ? "…" : "")) : undefined,
      })),
    };
  });
}

function buildSchemaRelations() {
  // Real FKs declared in COLUMNS_BY_TABLE
  const real = [];
  const cols = window.COLUMNS_BY_TABLE || {};
  Object.keys(cols).forEach((id) => {
    cols[id].forEach((c) => {
      if (c.fk) real.push({ from: c.fk, to: id, via: c.name, cardinality: "1:N", ai: !!c.ai });
    });
  });
  // Conceptual relations — currently inline fields on interviews that
  // could be normalized to proper FKs. Shown dashed.
  const conceptual = [
    { from: "people",    to: "interviews", via: "(name)",    cardinality: "1:N", conceptual: true },
    { from: "companies", to: "interviews", via: "(company)", cardinality: "1:N", conceptual: true },
    { from: "themes",    to: "interviews", via: "(theme)",   cardinality: "1:N", conceptual: true, ai: true },
  ];
  return [...real, ...conceptual];
}

const SCHEMA_TABLES    = buildSchemaTables();
const SCHEMA_RELATIONS = buildSchemaRelations();

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fieldRowHeight() { return 28; }
function tableHeaderHeight() { return 34; }
function tableHeight(t) { return tableHeaderHeight() + t.fields.length * fieldRowHeight() + 8; }

function tableRect(t) {
  return { x: t.x, y: t.y, w: t.width, h: tableHeight(t) };
}

function edgePoint(t, side) {
  const r = tableRect(t);
  switch (side) {
    case "left":   return { x: r.x,         y: r.y + r.h / 2 };
    case "right":  return { x: r.x + r.w,   y: r.y + r.h / 2 };
    case "top":    return { x: r.x + r.w/2, y: r.y };
    case "bottom": return { x: r.x + r.w/2, y: r.y + r.h };
  }
}

function pickSides(a, b) {
  // pick edges that face each other
  const ax = a.x + a.width / 2, ay = a.y + tableHeight(a) / 2;
  const bx = b.x + b.width / 2, by = b.y + tableHeight(b) / 2;
  const dx = bx - ax, dy = by - ay;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? ["right", "left"] : ["left", "right"];
  } else {
    return dy > 0 ? ["bottom", "top"] : ["top", "bottom"];
  }
}

function bezierPath(p1, p2) {
  const dx = Math.abs(p2.x - p1.x);
  const k  = Math.max(40, dx / 2);
  const c1 = { x: p1.x + (p2.x > p1.x ? k : -k), y: p1.y };
  const c2 = { x: p2.x + (p2.x > p1.x ? -k : k), y: p2.y };
  return `M${p1.x},${p1.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
}

// ─────────────────────────────────────────────────────────────
// Field icon (extended from FieldTypeGlyph for more types)
// ─────────────────────────────────────────────────────────────

const SchemaFieldIcon = ({ type, pk }) => {
  if (pk) return <span style={{ width: 12, color: "var(--priority-med)", fontFamily: "var(--font-mono)", fontSize: 11, display: "inline-flex", justifyContent: "center" }}>♂</span>;
  const map = {
    text: IconType, string: IconType, num: IconHash, number: IconHash,
    date: IconCalendar, datetime: IconCalendar,
    email: IconAt, phone: IconAt,
    select: IconList, status: IconCircleHalf,
    fk: IconLink, uuid: IconHash,
  };
  const G = map[type] || IconType;
  return <G size={12} style={{ color: "var(--muted-foreground)" }} />;
};

// ─────────────────────────────────────────────────────────────
// Table card (used by ER diagram)
// ─────────────────────────────────────────────────────────────

const TableCard = ({ table, hovered, onHover }) => {
  const h = tableHeight(table);
  return (
    <div
      onMouseEnter={() => onHover?.(table.id)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        position: "absolute",
        left: table.x, top: table.y,
        width: table.width, height: h,
        background: "var(--card)",
        border: "1px solid " + (hovered ? "color-mix(in oklch, " + table.color + " 65%, var(--border))" : "var(--border)"),
        borderRadius: 10,
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "box-shadow 160ms ease, border-color 160ms ease",
        zIndex: hovered ? 5 : 2,
      }}>
      {/* Header */}
      <div style={{
        height: tableHeaderHeight(),
        padding: "0 12px",
        background: table.accentBg,
        color: table.color,
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid color-mix(in oklch, " + table.color + " 25%, var(--border))",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{table.label}</span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 10.5, fontWeight: 500,
          color: "color-mix(in oklch, " + table.color + " 65%, var(--muted-foreground))",
          fontFamily: "var(--font-mono)",
        }}>{table.aka}</span>
      </div>
      {/* Fields */}
      <div style={{ flex: 1, paddingBottom: 4 }}>
        {table.fields.map((f) => (
          <div key={f.name} style={{
            height: fieldRowHeight(),
            padding: "0 12px",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12,
            color: "var(--foreground)",
          }}>
            <SchemaFieldIcon type={f.type} pk={f.pk} />
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: f.pk ? 600 : 500 }}>{f.name}</span>
            {f.required && <span style={{ fontSize: 10, color: "var(--destructive)", marginLeft: -4 }}>*</span>}
            <div style={{ flex: 1 }} />
            {f.pk && <TypeChip label="PK" tone="amber" />}
            {f.type === "fk" && <TypeChip label="FK" tone="violet" />}
            {!f.pk && f.type !== "fk" && <TypeChip label={f.type} tone="neutral" />}
            {f.ai && <span style={{
              fontSize: 9, padding: "1px 4px", borderRadius: 3, fontWeight: 700,
              background: "color-mix(in oklch, var(--primary) 16%, transparent)",
              color: "var(--primary)",
              display: "inline-flex", alignItems: "center", gap: 2,
            }}>
              <IconSparkles size={8} />AI
            </span>}
          </div>
        ))}
      </div>
    </div>
  );
};

const TypeChip = ({ label, tone = "neutral" }) => {
  const toneMap = {
    neutral: { bg: "var(--muted)",            fg: "var(--muted-foreground)" },
    amber:   { bg: "var(--status-progress-bg)", fg: "var(--status-progress-fg)" },
    violet:  { bg: "var(--status-waiting-bg)",  fg: "var(--status-waiting-fg)" },
    green:   { bg: "var(--status-done-bg)",     fg: "var(--status-done-fg)" },
    blue:    { bg: "var(--status-todo-bg)",     fg: "var(--status-todo-fg)" },
  };
  const t = toneMap[tone] || toneMap.neutral;
  return (
    <span style={{
      fontSize: 9.5, padding: "1px 5px", borderRadius: 3,
      background: t.bg, color: t.fg,
      fontFamily: "var(--font-mono)", fontWeight: 600,
      letterSpacing: "0.02em", textTransform: "lowercase",
    }}>{label}</span>
  );
};

// ─────────────────────────────────────────────────────────────
// ER diagram (Schema sub-tab)
// ─────────────────────────────────────────────────────────────

const ERDiagram = ({ tables = SCHEMA_TABLES, relations = SCHEMA_RELATIONS }) => {
  const [hovered, setHovered] = useSE(null);
  const [zoom, setZoom] = useSE(1);
  const [pan, setPan] = useSE({ x: 0, y: 0 });
  const dragging = useRE(null);

  const onMouseDown = (e) => {
    if (e.target.closest("[data-card]")) return;
    dragging.current = { startX: e.clientX, startY: e.clientY, startPan: pan };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const d = dragging.current;
    setPan({ x: d.startPan.x + (e.clientX - d.startX), y: d.startPan.y + (e.clientY - d.startY) });
  };
  const onMouseUp = () => { dragging.current = null; };

  return (
    <div style={{
      flex: 1, position: "relative",
      background: "var(--background)",
      overflow: "hidden",
      cursor: dragging.current ? "grabbing" : "default",
    }}
    onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {/* Grid background */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <defs>
          <pattern id="er-grid" width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse" x={pan.x} y={pan.y}>
            <circle cx="1" cy="1" r="0.7" fill="var(--border-subtle)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#er-grid)" />
      </svg>

      {/* Diagram inner container — scaled + panned */}
      <div style={{
        position: "absolute",
        left: pan.x, top: pan.y,
        transform: `scale(${zoom})`,
        transformOrigin: "0 0",
        width: 1200, height: 720,
      }}>
        {/* Connection lines */}
        <svg width="1200" height="720" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
          {relations.map((rel, i) => {
            const a = tables.find(t => t.id === rel.from);
            const b = tables.find(t => t.id === rel.to);
            if (!a || !b) return null;
            const [sa, sb] = pickSides(a, b);
            const p1 = edgePoint(a, sa);
            const p2 = edgePoint(b, sb);
            const path = bezierPath(p1, p2);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const isActive = hovered === a.id || hovered === b.id;
            return (
              <g key={i} opacity={hovered && !isActive ? 0.3 : 1} style={{ transition: "opacity 160ms ease" }}>
                <path d={path} fill="none"
                  stroke={isActive ? "var(--primary)" : (rel.conceptual ? "var(--muted-foreground)" : "var(--border)")}
                  strokeWidth={isActive ? 1.75 : 1.25}
                  strokeDasharray={rel.conceptual ? "4 4" : undefined}
                  opacity={rel.conceptual && !isActive ? 0.55 : 1} />
                {/* "1" end */}
                <circle cx={p1.x} cy={p1.y} r={3} fill={isActive ? "var(--primary)" : "var(--muted-foreground)"} />
                {/* "N" end with crow-foot-ish marker */}
                <g transform={`translate(${p2.x}, ${p2.y})`}>
                  <circle cx={0} cy={0} r={3} fill={isActive ? "var(--primary)" : "var(--muted-foreground)"} />
                </g>
                {/* Cardinality pill */}
                <g transform={`translate(${midX - 14} ${midY - 9})`}>
                  <rect width="28" height="18" rx="4" fill="var(--card)" stroke={isActive ? "var(--primary)" : "var(--border)"} strokeWidth="1" />
                  <text x="14" y="13" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600" fill={isActive ? "var(--primary)" : "var(--muted-foreground)"} textAnchor="middle">{rel.cardinality}</text>
                  {rel.ai && (
                    <g transform="translate(28 0)">
                      <circle cx="0" cy="9" r="6" fill="color-mix(in oklch, var(--primary) 18%, transparent)" />
                      <text x="0" y="12.5" fontSize="9" fontWeight="700" fill="var(--primary)" textAnchor="middle">AI</text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </svg>

        {/* Table cards */}
        {tables.map((t) => (
          <div key={t.id} data-card>
            <TableCard table={t} hovered={hovered === t.id} onHover={setHovered} />
          </div>
        ))}
      </div>

      {/* Floating toolbar — top right */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        display: "flex", gap: 6,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: 4, borderRadius: 7,
          background: "var(--card)", border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}>
          <ZoomBtn onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(2)))}>−</ZoomBtn>
          <span style={{ minWidth: 38, textAlign: "center", fontSize: 11, fontVariantNumeric: "tabular-nums", color: "var(--muted-foreground)" }}>{Math.round(zoom * 100)}%</span>
          <ZoomBtn onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))}>+</ZoomBtn>
          <span style={{ width: 1, height: 16, background: "var(--border)", margin: "0 4px" }} />
          <ZoomBtn onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset view">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 21 3 14 10 14" /><polyline points="21 3 21 10 14 10" /></svg>
          </ZoomBtn>
        </div>
        <button style={{
          padding: "5px 11px", borderRadius: 6, border: "1px solid var(--border)",
          background: "var(--card)", color: "var(--muted-foreground)",
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <IconBolt size={11} />Generate SQL
        </button>
        <button style={{
          padding: "5px 11px", borderRadius: 6, border: "1px solid var(--primary)",
          background: "var(--primary)", color: "var(--primary-foreground)",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <IconPlus size={11} />Add table
        </button>
      </div>

      {/* Bottom meta */}
      <div style={{
        position: "absolute", bottom: 14, left: 16,
        display: "inline-flex", gap: 14,
        padding: "5px 10px", borderRadius: 6,
        background: "var(--card)", border: "1px solid var(--border)",
        fontSize: 11.5, color: "var(--muted-foreground)",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--chart-1)" }} />
          Tables: <b className="fb-tnum" style={{ fontWeight: 600, color: "var(--foreground)" }}>{tables.length}</b>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--chart-4)" }} />
          Relations: <b className="fb-tnum" style={{ fontWeight: 600, color: "var(--foreground)" }}>{relations.length}</b>
        </span>
      </div>
    </div>
  );
};

const ZoomBtn = ({ children, ...rest }) => (
  <button {...rest} style={{
    width: 22, height: 22, padding: 0, borderRadius: 4, border: "none",
    background: "transparent", color: "var(--muted-foreground)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: 13,
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────
// Fields inventory (sub-tab #2) — every field across every table
// ─────────────────────────────────────────────────────────────

const FieldsInventory = ({ tables = SCHEMA_TABLES }) => {
  const [activeTable, setActiveTable] = useSE(null);
  return (
    <div className="fb-scroll" style={{ flex: 1, overflow: "auto", padding: "16px 20px 24px", background: "var(--background)" }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}>Field inventory</h3>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
          Every column across every table. Click a card to focus that table in the Schema view.
        </p>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 14,
      }}>
        {tables.map((t) => (
          <div key={t.id}
            onMouseEnter={() => setActiveTable(t.id)}
            onMouseLeave={() => setActiveTable(null)}
            style={{
              background: "var(--card)",
              border: "1px solid " + (activeTable === t.id ? "color-mix(in oklch, " + t.color + " 50%, var(--border))" : "var(--border)"),
              borderRadius: 10,
              overflow: "hidden",
              display: "flex", flexDirection: "column",
              transition: "border-color 160ms ease",
            }}>
            <div style={{
              padding: "10px 14px",
              background: t.accentBg, color: t.color,
              display: "flex", alignItems: "center", gap: 8,
              borderBottom: "1px solid color-mix(in oklch, " + t.color + " 25%, var(--border))",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", opacity: 0.7 }}>{t.aka}</span>
              <span className="fb-tnum" style={{ fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: "color-mix(in oklch, " + t.color + " 20%, transparent)" }}>{t.fields.length}</span>
            </div>
            {t.fields.map((f) => (
              <div key={f.name} style={{
                padding: "7px 14px",
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 12.5,
                borderBottom: "1px solid var(--border-subtle)",
              }}>
                <SchemaFieldIcon type={f.type} pk={f.pk} />
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: f.pk ? 600 : 500, flex: 1 }}>{f.name}</span>
                {f.required && <span style={{ fontSize: 10, color: "var(--destructive)" }}>*</span>}
                <TypeChip
                  label={f.pk ? "PK" : f.type === "fk" ? "FK" : f.type}
                  tone={f.pk ? "amber" : f.type === "fk" ? "violet" : "neutral"}
                />
                {f.note && <span style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{f.note}</span>}
                {f.ai && <span style={{
                  fontSize: 9, padding: "1px 4px", borderRadius: 3, fontWeight: 700,
                  background: "color-mix(in oklch, var(--primary) 16%, transparent)",
                  color: "var(--primary)",
                  display: "inline-flex", alignItems: "center", gap: 2,
                }}><IconSparkles size={8} />AI</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Relations list (sub-tab #3)
// ─────────────────────────────────────────────────────────────

const RelationsList = ({ tables = SCHEMA_TABLES, relations = SCHEMA_RELATIONS }) => {
  const findT = (id) => tables.find(t => t.id === id);
  return (
    <div className="fb-scroll" style={{ flex: 1, overflow: "auto", padding: "16px 20px 24px", background: "var(--background)" }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}>Table relations</h3>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
          Foreign keys connecting tables. Cardinality and reference column shown for each link.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 880 }}>
        {relations.map((rel, i) => {
          const a = findT(rel.from), b = findT(rel.to);
          if (!a || !b) return null;
          return (
            <div key={i} style={{
              padding: "14px 16px", borderRadius: 10,
              background: "var(--card)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 10, fontSize: 13,
            }}>
              <TableChip table={a} />
              <IconChevronRight size={13} style={{ color: "var(--muted-foreground)" }} />
              <TableChip table={b} />
              <div style={{ flex: 1 }} />
              {rel.ai && (
                <span style={{
                  fontSize: 10.5, padding: "1px 6px", borderRadius: 3, fontWeight: 600,
                  background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                  color: "var(--primary)",
                  display: "inline-flex", alignItems: "center", gap: 3,
                }}>
                  <IconSparkles size={9} />AI-managed
                </span>
              )}
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 4,
                background: "var(--muted)", color: "var(--muted-foreground)",
                fontFamily: "var(--font-mono)", fontWeight: 600,
              }}>{rel.cardinality}</span>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{rel.via}</span>
            </div>
          );
        })}
        {relations.length === 0 && (
          <div style={{
            padding: 32, textAlign: "center", borderRadius: 10,
            background: "var(--card)", border: "1px dashed var(--border)",
            color: "var(--muted-foreground)", fontSize: 13,
          }}>
            No relations yet. Add a FK column to link tables.
          </div>
        )}
      </div>
    </div>
  );
};

const TableChip = ({ table }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "3px 8px", borderRadius: 5,
    background: table.accentBg, color: table.color,
    fontSize: 12.5, fontWeight: 600,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: table.color }} />
    {table.label}
    <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", opacity: 0.7, fontWeight: 500 }}>{table.aka}</span>
  </span>
);

// ─────────────────────────────────────────────────────────────
// Main Schema view with sub-tabs
// ─────────────────────────────────────────────────────────────

const RichSchemaView = ({ tables: tablesProp, relations = SCHEMA_RELATIONS, library, onCreateTableFromTemplate, onCreateBlankTable, tablesById }) => {
  // Merge seed schema tables with any user-created tables from runtime state
  const tables = useME(() => {
    const seed = tablesProp || SCHEMA_TABLES;
    if (!tablesById) return seed;
    const seedIds = new Set(seed.map(t => t.id));
    let nextX = 40, nextY = 720;
    const extras = Object.values(tablesById)
      .filter(t => !seedIds.has(t.id))
      .map((t, i) => {
        const y = nextY + i * 200;
        return {
          id: t.id,
          name: t.label,
          color: t.colorVar || "var(--chart-3)",
          x: 40, y, width: 260,
          fields: (t.columns || []).map(c => ({
            name: c.name,
            type: c.type || "text",
            ...(c.library ? { fkLabel: `@${c.library.assetName}` } : {}),
          })),
          isCustom: true,
        };
      });
    return [...seed, ...extras];
  }, [tablesProp, tablesById]);

  const [sub, setSub] = useSE("schema");
  const [newTableOpen, setNewTableOpen] = useSE(false);
  const subs = [
    { id: "schema",    label: "Schema",    icon: <IconSchema size={13} /> },
    { id: "fields",    label: "Fields",    icon: <IconList size={13} /> },
    { id: "relations", label: "Relations", icon: <IconLink size={13} /> },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "var(--background)" }}>
      {/* Sub-tab nav */}
      <div style={{
        padding: "0 20px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 2,
        height: 38, flexShrink: 0,
      }}>
        {subs.map((s) => {
          const on = sub === s.id;
          return (
            <button key={s.id} onClick={() => setSub(s.id)} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "0 10px", height: 38, border: "none",
              background: "transparent",
              color: on ? "var(--foreground)" : "var(--muted-foreground)",
              fontSize: 12.5, fontWeight: on ? 600 : 500,
              cursor: "pointer", position: "relative",
              borderBottom: on ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -1,
            }}>
              {s.icon}
              <span>{s.label}</span>
              {s.id === "schema" && <span className="fb-tnum" style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginLeft: 2 }}>{tables.length} tables</span>}
              {s.id === "relations" && <span className="fb-tnum" style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginLeft: 2 }}>{relations.length}</span>}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button onClick={() => setNewTableOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 5,
          background: "var(--primary)", border: "1px solid var(--primary)",
          color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          <IconPlus size={12} />
          New table
        </button>
      </div>

      {sub === "schema"    && <ERDiagram tables={tables} relations={relations} />}
      {sub === "fields"    && <FieldsInventory tables={tables} />}
      {sub === "relations" && <RelationsList tables={tables} relations={relations} />}

      {newTableOpen && (
        <NewTableModal
          library={library}
          onClose={() => setNewTableOpen(false)}
          onCreateFromTemplate={(templateId, tableName) => {
            onCreateTableFromTemplate?.(templateId, tableName);
            setNewTableOpen(false);
          }}
          onCreateBlank={(tableName) => {
            onCreateBlankTable?.(tableName);
            setNewTableOpen(false);
          }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// New Table Modal — pick a Library Template or start blank
// ─────────────────────────────────────────────────────────────

const NewTableModal = ({ library, onClose, onCreateFromTemplate, onCreateBlank }) => {
  const [selected, setSelected] = useSE(null);  // template id or "blank"
  const [tableName, setTableName] = useSE("");
  const lib = library || window.LIBRARY;
  const templates = lib?.templates || [];

  React.useEffect(() => {
    function h(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const create = () => {
    if (!tableName.trim() || !selected) return;
    if (selected === "blank") onCreateBlank(tableName.trim());
    else onCreateFromTemplate(selected, tableName.trim());
  };

  // Auto-suggest a table name when picking a template
  React.useEffect(() => {
    if (selected && selected !== "blank" && !tableName.trim()) {
      const tpl = templates.find(t => t.id === selected);
      if (tpl) setTableName(tpl.name);
    }
  }, [selected]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "color-mix(in oklch, var(--background) 60%, transparent)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 40,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(720px, 100%)", maxHeight: "calc(100vh - 80px)",
        background: "var(--popover)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--shadow-popover)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 6,
            background: "color-mix(in oklch, var(--primary) 18%, transparent)",
            color: "var(--primary)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}><IconSchema size={14} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>새 테이블 만들기</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
              Library Template에서 시작하거나, 빈 테이블로 시작
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 26, height: 26, borderRadius: 5, border: "none",
            background: "transparent", color: "var(--muted-foreground)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <IconX size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 10,
          }}>From Library Template</div>

          {templates.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted-foreground)", fontSize: 12.5,
              background: "var(--muted)", borderRadius: 7, marginBottom: 14,
            }}>
              아직 Template이 없습니다. Tables 모드에서 "Save as template"으로 첫 템플릿을 만들어보세요.
            </div>
          ) : (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 10, marginBottom: 18,
            }}>
              {templates.map(tpl => {
                const on = selected === tpl.id;
                const isMulti = !!tpl.multiTable && Array.isArray(tpl.tables);
                const fieldsCount = isMulti
                  ? tpl.tables.reduce((acc, t) => acc + (t.columns?.length || 0), 0)
                  : (tpl.fields?.length || 0) + (tpl.extraFields?.length || 0);
                return (
                  <button key={tpl.id} onClick={() => setSelected(tpl.id)} style={{
                    display: "flex", flexDirection: "column", gap: 6, textAlign: "left",
                    padding: 12, borderRadius: 8,
                    background: on ? "color-mix(in oklch, var(--primary) 8%, var(--card))" : "var(--card)",
                    border: "1px solid " + (on ? "var(--primary)" : "var(--border-subtle)"),
                    cursor: "pointer", transition: "all 120ms ease",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: 5,
                        background: "color-mix(in oklch, var(--chart-4) 18%, transparent)",
                        color: "var(--chart-4)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}><IconBox size={13} /></span>
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.name}</span>
                      {on && <IconCheck size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>{tpl.desc}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                      {isMulti && (
                        <span style={{
                          fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                          background: "color-mix(in oklch, var(--primary) 16%, transparent)",
                          color: "var(--primary)", fontWeight: 600,
                        }}>Creates {tpl.tables.length} tables</span>
                      )}
                      <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                        background: "var(--muted)", color: "var(--muted-foreground)",
                      }}>{fieldsCount} fields</span>
                      {(tpl.recommendedViews || []).map(v => (
                        <span key={v} style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                          background: "var(--muted)", color: "var(--muted-foreground)",
                        }}>{v}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 10,
          }}>Or start from scratch</div>

          <button onClick={() => setSelected("blank")} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
            padding: "12px 14px", borderRadius: 8,
            background: selected === "blank" ? "color-mix(in oklch, var(--primary) 8%, var(--card))" : "var(--card)",
            border: "1px solid " + (selected === "blank" ? "var(--primary)" : "var(--border-subtle)"),
            cursor: "pointer",
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              background: "var(--muted)", color: "var(--muted-foreground)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}><IconPlus size={14} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Blank table</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 1 }}>
                컬럼은 나중에 직접 추가
              </div>
            </div>
            {selected === "blank" && <IconCheck size={13} style={{ color: "var(--primary)" }} />}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <input value={tableName} onChange={e => setTableName(e.target.value)}
            placeholder="Table name (e.g. CS Returns)"
            style={{
              flex: 1, padding: "6px 10px", borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--foreground)",
              fontSize: 13, outline: "none", fontFamily: "var(--font-sans)",
            }} />
          <button onClick={onClose} style={{
            padding: "6px 12px", borderRadius: 6,
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={create} disabled={!selected || !tableName.trim()} style={{
            padding: "6px 14px", borderRadius: 6,
            background: "var(--primary)", border: "1px solid var(--primary)",
            color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600,
            cursor: selected && tableName.trim() ? "pointer" : "default",
            opacity: selected && tableName.trim() ? 1 : 0.5,
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <IconPlus size={11} />
            Create table
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  RichSchemaView, ERDiagram, FieldsInventory, RelationsList,
  SCHEMA_TABLES, SCHEMA_RELATIONS, TableCard, TableChip, TypeChip, SchemaFieldIcon,
  NewTableModal,
});
