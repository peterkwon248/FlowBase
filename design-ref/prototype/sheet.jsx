/* @jsx React.createElement */
// FlowBase — Sheet view, AI Activity panel, Board header, Import flow

// ─────────────────────────────────────────────────────────────
// Board Header — top utility strip (52px)
// ─────────────────────────────────────────────────────────────

const BoardHeader = ({ theme, setTheme, variant = "default" }) => {
  return (
    <header style={{
      height: 48, flexShrink: 0,
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--background)",
      display: "flex", alignItems: "center",
      padding: "0 14px", gap: 12,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <span style={{ color: "var(--muted-foreground)" }}>peter's workspace</span>
        <span style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>/</span>
        <span style={{ fontWeight: 600 }}>Customer Interviews</span>
        <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", padding: "1px 5px", borderRadius: 3, background: "var(--muted)", marginLeft: 4 }}>v2.1</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 9px", borderRadius: 6,
        background: "var(--muted)", border: "1px solid var(--border-subtle)",
        fontSize: 12.5, color: "var(--muted-foreground)", width: 220,
      }}>
        <IconSearch size={13} />
        <span style={{ flex: 1 }}>Search or jump to…</span>
        <span className="fb-kbd">⌘K</span>
      </div>

      {/* AI button */}
      <button style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)",
        background: "var(--card)", color: "var(--foreground)",
        fontSize: 12.5, fontWeight: 500, cursor: "pointer",
      }}>
        <IconSparkles size={13} style={{ color: "var(--primary)" }} />
        <span>Ask AI</span>
        <span className="fb-kbd">⌘J</span>
      </button>

      {/* Theme toggle */}
      <button onClick={() => setTheme && setTheme(theme === "dark" ? "light" : "dark")} style={{
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
// Board title block (Notion-feel) + view switcher row
// ─────────────────────────────────────────────────────────────

const BoardTitleBlock = ({ density, doc = false }) => {
  return (
    <div style={{ padding: doc ? "32px 32px 8px" : "20px 24px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: doc ? 8 : 6 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 7,
          background: "color-mix(in oklch, var(--chart-1) 18%, var(--background))",
          color: "var(--chart-1)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconDb size={16} />
        </span>
        <h1 style={{
          margin: 0,
          fontSize: doc ? 30 : 22,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--foreground)",
        }}>Customer Interviews</h1>
      </div>
      {doc && (
        <p style={{
          margin: "4px 0 0 38px",
          fontSize: 14.5, lineHeight: 1.6, color: "var(--muted-foreground)",
          fontWeight: 400, maxWidth: 720,
        }}>
          Every user conversation, scored and themed. AI drafts the theme and sentiment columns — confirm before they ship to the dashboard.
        </p>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginTop: doc ? 18 : 10, paddingLeft: doc ? 38 : 0,
      }}>
        <ViewSwitcher active="sheet" />
        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }} className="fb-tnum">142 rows · 8 columns</span>
        <div style={{ flex: 1 }} />
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 9px", borderRadius: 5,
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--muted-foreground)", fontSize: 12, cursor: "pointer",
        }}>
          <IconFilter size={12} />Filter
        </button>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 9px", borderRadius: 5,
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--muted-foreground)", fontSize: 12, cursor: "pointer",
        }}>
          <IconArrowUpDown size={12} />Sort
        </button>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 5,
          background: "var(--primary)", border: "1px solid var(--primary)",
          color: "var(--primary-foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}>
          <IconPlus size={12} />New row
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Sheet View — the editable spreadsheet
// ─────────────────────────────────────────────────────────────

const COLUMNS = [
  { name: "id",        label: "ID",         type: "text",   width: 86,  mono: true },
  { name: "name",      label: "Name",       type: "text",   width: 130 },
  { name: "company",   label: "Company",    type: "text",   width: 130 },
  { name: "date",      label: "Date",       type: "date",   width: 110, mono: true },
  { name: "theme",     label: "Theme",      type: "select", width: 180, ai: true },
  { name: "sentiment", label: "Sentiment",  type: "select", width: 112, ai: true },
  { name: "status",    label: "Status",     type: "status", width: 116 },
  { name: "priority",  label: "Priority",   type: "select", width: 96 },
  { name: "quote",     label: "Quote",      type: "text",   width: 380 },
];

const SENTIMENT_TONE = {
  Positive: { bg: "var(--status-done-bg)", fg: "var(--status-done-fg)" },
  Mixed:    { bg: "var(--status-progress-bg)", fg: "var(--status-progress-fg)" },
  Negative: { bg: "var(--status-todo-bg)", fg: "var(--status-todo-fg)" },
};

const SheetView = ({ density = "default", showAiBadges = true, selectedRow = "INT-018", focusedCell = { row: "INT-018", col: "theme" } }) => {
  const rowPy = density === "compact" ? 4 : density === "comfortable" ? 12 : 8;
  const cellPx = density === "compact" ? 8 : density === "comfortable" ? 12 : 10;
  const totalWidth = COLUMNS.reduce((acc, c) => acc + c.width, 0) + 88; // + selector + add col

  return (
    <div className="fb-scroll" style={{
      flex: 1, overflow: "auto",
      background: "var(--background)",
    }}>
      <table style={{
        borderCollapse: "separate", borderSpacing: 0,
        width: "max(100%, " + totalWidth + "px)",
        tableLayout: "fixed",
      }}>
        <colgroup>
          <col style={{ width: 40 }} />
          <col style={{ width: 36 }} />
          {COLUMNS.map((c) => <col key={c.name} style={{ width: c.width }} />)}
          <col style={{ width: 36 }} />
        </colgroup>
        <thead>
          <tr style={{ background: "var(--surface)" }}>
            <th style={thStyle()}>
              <input type="checkbox" style={{ verticalAlign: "middle" }} readOnly />
            </th>
            <th style={thStyle({ textAlign: "right" })}><span style={{ fontSize: 11, color: "var(--muted-foreground)" }} className="fb-tnum">#</span></th>
            {COLUMNS.map((c) => (
              <th key={c.name} style={thStyle()}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FieldTypeGlyph type={c.type} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)" }}>{c.label}</span>
                  {c.ai && showAiBadges && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                      background: "color-mix(in oklch, var(--primary) 15%, transparent)",
                      color: "var(--primary)",
                      marginLeft: 2,
                    }}>
                      <IconSparkles size={8} />AI
                    </span>
                  )}
                  <div style={{ flex: 1 }} />
                  <IconArrowUpDown size={11} style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
                </div>
              </th>
            ))}
            <th style={thStyle()}>
              <button style={{ background: "transparent", border: "none", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", padding: 2 }}>
                <IconPlus size={13} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {INTERVIEWS.map((row, idx) => {
            const isSelected = row.id === selectedRow;
            return (
              <tr key={row.id} style={{ background: isSelected ? "color-mix(in oklch, var(--primary) 7%, transparent)" : "transparent" }}>
                <td style={tdStyle(rowPy, cellPx)}>
                  <input type="checkbox" defaultChecked={isSelected} style={{ verticalAlign: "middle" }} />
                </td>
                <td style={tdStyle(rowPy, cellPx, { textAlign: "right", color: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" })}>{idx + 1}</td>
                {COLUMNS.map((c) => {
                  const v = row[c.name];
                  const isFocused = focusedCell && row.id === focusedCell.row && c.name === focusedCell.col;
                  const isPendingAi = (c.name === "theme" && row.aiTheme) || (c.name === "sentiment" && row.aiSentiment);
                  return (
                    <td key={c.name} style={tdStyle(rowPy, cellPx, {
                      fontFamily: c.mono ? "var(--font-mono)" : "var(--font-sans)",
                      color: c.mono ? "var(--muted-foreground)" : "var(--foreground)",
                      fontSize: c.mono ? 12 : 13,
                      position: "relative",
                      outline: isFocused ? "2px solid var(--primary)" : "none",
                      outlineOffset: -1,
                      borderRight: "1px solid var(--border-subtle)",
                    })}>
                      <CellRender col={c} value={v} pendingAi={isPendingAi} />
                    </td>
                  );
                })}
                <td style={tdStyle(rowPy, cellPx)} />
              </tr>
            );
          })}
          {/* Add row hint */}
          <tr>
            <td colSpan={COLUMNS.length + 3} style={{ ...tdStyle(rowPy, cellPx), color: "var(--muted-foreground)", borderBottom: "none" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                <IconPlus size={12} />New row
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

function thStyle(extra = {}) {
  return {
    textAlign: "left",
    padding: "8px 10px",
    fontWeight: 500,
    fontSize: 12,
    color: "var(--muted-foreground)",
    borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border-subtle)",
    background: "var(--surface)",
    position: "sticky", top: 0, zIndex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...extra,
  };
}
function tdStyle(py, px, extra = {}) {
  return {
    padding: `${py}px ${px}px`,
    borderBottom: "1px solid var(--border-subtle)",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...extra,
  };
}

const CellRender = ({ col, value, pendingAi }) => {
  if (col.type === "status") {
    return <StatusBadge status={value} />;
  }
  if (col.name === "priority") {
    return <PriorityCell priority={value} />;
  }
  if (col.name === "sentiment") {
    const tone = SENTIMENT_TONE[value];
    return (
      <span style={{
        position: "relative", paddingLeft: pendingAi ? 10 : 0,
        display: "inline-flex", alignItems: "center", gap: 6,
      }}>
        {pendingAi && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 5, height: 5, borderRadius: "50%", background: "var(--primary)" }} />}
        <span style={{
          padding: "2px 7px", borderRadius: 4,
          background: tone.bg, color: tone.fg,
          fontSize: 12, fontWeight: 500,
        }}>{value}</span>
      </span>
    );
  }
  if (col.name === "theme") {
    return (
      <span style={{ position: "relative", paddingLeft: pendingAi ? 10 : 0, display: "inline-flex", alignItems: "center" }}>
        {pendingAi && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 5, height: 5, borderRadius: "50%", background: "var(--primary)" }} />}
        <span className={pendingAi ? "fb-ai-cell" : ""} style={{ fontSize: 13 }}>{value}</span>
      </span>
    );
  }
  if (col.type === "date") {
    return <span>{value}</span>;
  }
  return <span style={{ display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>;
};

// ─────────────────────────────────────────────────────────────
// AI Activity Panel — Linear-style timeline on the right
// ─────────────────────────────────────────────────────────────

const AIActivityPanel = ({ width = 340, variant = "default" }) => {
  return (
    <aside style={{
      width, flexShrink: 0,
      background: variant === "doc" ? "var(--background)" : "var(--surface)",
      borderLeft: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column",
      fontSize: 13,
    }}>
      <div style={{
        height: 48, flexShrink: 0,
        padding: "0 14px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <IconSparkles size={14} style={{ color: "var(--primary)" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>AI Activity</span>
        <span style={{
          fontSize: 10, padding: "1px 5px", borderRadius: 3,
          background: "color-mix(in oklch, var(--primary) 18%, transparent)",
          color: "var(--primary)", fontWeight: 600,
        }}>3 pending</span>
        <div style={{ flex: 1 }} />
        <button style={{ background: "transparent", border: "none", color: "var(--muted-foreground)", padding: 4, borderRadius: 5, cursor: "pointer", display: "flex" }}>
          <IconMore size={14} />
        </button>
      </div>

      {/* Pending suggestions block */}
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 8 }}>
          Pending — needs you
        </div>
        {AI_TIMELINE.filter(t => t.status === "pending").map((t) => (
          <div key={t.id} style={{
            padding: 12, borderRadius: 7,
            border: "1px solid var(--border)",
            background: "var(--card)",
            marginBottom: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              {t.kind === "infer" ? (
                <IconSparkles size={13} style={{ color: "var(--primary)" }} />
              ) : (
                <IconBranch size={13} style={{ color: "var(--primary)" }} />
              )}
              <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>{t.title}</span>
              {t.count && (
                <span className="fb-tnum" style={{
                  fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
                  background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                  color: "var(--primary)",
                }}>{t.count}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 9, lineHeight: 1.5 }}>{t.detail}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 9px", borderRadius: 5, border: "1px solid var(--primary)",
                background: "var(--primary)", color: "var(--primary-foreground)",
                fontSize: 11.5, fontWeight: 500, cursor: "pointer",
              }}>
                <IconCheck size={11} />Apply
              </button>
              <button style={{
                padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)",
                background: "var(--card)", color: "var(--muted-foreground)",
                fontSize: 11.5, fontWeight: 500, cursor: "pointer",
              }}>Review</button>
              <button style={{
                padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)",
                background: "transparent", color: "var(--muted-foreground)",
                fontSize: 11.5, cursor: "pointer",
              }}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 10 }}>
          Timeline
        </div>
        <div style={{ position: "relative", paddingLeft: 14 }}>
          <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: "var(--border)" }} />
          {AI_TIMELINE.map((t) => (
            <div key={t.id} style={{ position: "relative", marginBottom: 12 }}>
              <span style={{
                position: "absolute", left: -14, top: 5,
                width: 9, height: 9, borderRadius: "50%",
                background: t.status === "pending" ? "var(--primary)" : "var(--card)",
                border: "1.5px solid " + (t.status === "pending" ? "var(--primary)" : "var(--border)"),
              }} />
              <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.35, color: "var(--foreground)" }}>{t.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>{t.detail}</div>
              <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginTop: 3, fontFamily: "var(--font-mono)" }}>{t.time}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Composer */}
      <div style={{
        padding: 12, borderTop: "1px solid var(--border-subtle)",
        background: variant === "doc" ? "var(--surface)" : "var(--background)",
      }}>
        <div style={{
          padding: "8px 10px", borderRadius: 7,
          border: "1px solid var(--border)", background: "var(--card)",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>Ask AI to transform, summarize, or add a column…</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="fb-kbd">/</span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>for actions</span>
            <div style={{ flex: 1 }} />
            <button style={{ background: "var(--primary)", border: "none", color: "var(--primary-foreground)", padding: 4, borderRadius: 5, cursor: "pointer", display: "flex" }}>
              <IconBolt size={11} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

// Bottom horizontal AI activity strip (variant 3)
const AIActivityStrip = () => {
  return (
    <div style={{
      height: 168, flexShrink: 0,
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        height: 36, padding: "0 14px", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <IconSparkles size={13} style={{ color: "var(--primary)" }} />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>AI Activity</span>
        <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "color-mix(in oklch, var(--primary) 18%, transparent)", color: "var(--primary)", fontWeight: 600 }}>3 pending</span>
        <div style={{ flex: 1 }} />
        <button style={{ background: "transparent", border: "none", color: "var(--muted-foreground)", fontSize: 11.5, padding: "3px 8px", borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <IconCheck size={11} />Accept all
        </button>
        <button style={{ background: "transparent", border: "none", color: "var(--muted-foreground)", padding: 4, borderRadius: 5, cursor: "pointer", display: "flex" }}>
          <IconChevronDown size={13} />
        </button>
      </div>
      <div className="fb-scroll" style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "10px 14px", display: "flex", gap: 10 }}>
        {AI_TIMELINE.map((t) => (
          <div key={t.id} style={{
            flexShrink: 0, width: 260,
            padding: 10, borderRadius: 7,
            border: "1px solid " + (t.status === "pending" ? "color-mix(in oklch, var(--primary) 40%, var(--border))" : "var(--border)"),
            background: "var(--card)",
            display: "flex", flexDirection: "column", gap: 5,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {t.kind === "infer" ? <IconSparkles size={12} style={{ color: t.status === "pending" ? "var(--primary)" : "var(--muted-foreground)" }} /> : t.kind === "import" ? <IconUpload size={12} style={{ color: "var(--muted-foreground)" }} /> : <IconBranch size={12} style={{ color: t.status === "pending" ? "var(--primary)" : "var(--muted-foreground)" }} />}
              <span style={{ fontSize: 12, fontWeight: 600 }}>{t.title}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.4 }}>{t.detail}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
              {t.status === "pending" ? (
                <>
                  <button style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--primary)", background: "var(--primary)", color: "var(--primary-foreground)", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>Apply</button>
                  <button style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "var(--muted-foreground)", fontSize: 11, cursor: "pointer" }}>Dismiss</button>
                </>
              ) : (
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <IconCheck size={11} style={{ color: "var(--status-done-fg)" }} />Applied · {t.time}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, {
  BoardHeader, BoardTitleBlock, SheetView, AIActivityPanel, AIActivityStrip,
  COLUMNS, SENTIMENT_TONE,
});
