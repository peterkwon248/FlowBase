/* @jsx React.createElement */
// FlowBase — board variations + import flow + main app

// ─────────────────────────────────────────────────────────────
// V1 — Default Linear-canonical: compact density, persistent right AI panel
// ─────────────────────────────────────────────────────────────

const BoardV1 = ({ theme, setTheme, density = "default", showAiBadges = true }) => {
  return (
    <div data-theme={theme} style={{
      width: "100%", height: "100%",
      background: "var(--background)", color: "var(--foreground)",
      display: "flex", overflow: "hidden", fontFamily: "var(--font-sans)",
    }}>
      <ActivityBar />
      <Sidebar width={232} density="default" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <BoardHeader theme={theme} setTheme={setTheme} />
        <BoardTitleBlock />
        <SheetView density={density} showAiBadges={showAiBadges} />
        <BoardFooter />
      </main>
      <AIActivityPanel width={328} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// V2 — Doc-feel (Notion/Coda): comfortable, large title block, AI panel collapsed by default with notification dot
// ─────────────────────────────────────────────────────────────

const BoardV2 = ({ theme, setTheme, density = "comfortable", showAiBadges = true }) => {
  return (
    <div data-theme={theme} style={{
      width: "100%", height: "100%",
      background: "var(--background)", color: "var(--foreground)",
      display: "flex", overflow: "hidden", fontFamily: "var(--font-sans)",
    }}>
      <ActivityBar />
      <Sidebar width={232} density="comfortable" />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        <BoardHeader theme={theme} setTheme={setTheme} variant="doc" />
        <BoardTitleBlock doc />
        <div style={{ padding: "0 24px", display: "flex", gap: 12, marginBottom: 6 }}>
          <ChipStat label="Pricing pushback" value="2" tone="todo" />
          <ChipStat label="Onboarding" value="2" tone="progress" />
          <ChipStat label="Performance" value="2" tone="waiting" />
          <ChipStat label="Feature reqs" value="2" tone="done" />
          <ChipStat label="Sharing" value="2" tone="default" />
        </div>
        <SheetView density={density} showAiBadges={showAiBadges} />
        <BoardFooter />

        {/* Collapsed AI panel handle */}
        <button style={{
          position: "absolute", right: 16, top: 64,
          padding: "6px 12px", borderRadius: 7,
          background: "var(--card)", border: "1px solid var(--border)",
          color: "var(--foreground)", fontSize: 12, fontWeight: 500,
          display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
          boxShadow: "var(--shadow-sm)",
        }}>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <IconSparkles size={13} style={{ color: "var(--primary)" }} />
            <span style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: "50%", background: "var(--primary)", border: "1.5px solid var(--card)" }} />
          </span>
          <span>AI Activity</span>
          <span style={{
            fontSize: 10, padding: "1px 5px", borderRadius: 3,
            background: "color-mix(in oklch, var(--primary) 14%, transparent)",
            color: "var(--primary)", fontWeight: 600,
          }}>3</span>
        </button>
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// V3 — Focus mode: narrow sidebar + bottom AI strip (max sheet space)
// ─────────────────────────────────────────────────────────────

const BoardV3 = ({ theme, setTheme, density = "default", showAiBadges = true }) => {
  return (
    <div data-theme={theme} style={{
      width: "100%", height: "100%",
      background: "var(--background)", color: "var(--foreground)",
      display: "flex", overflow: "hidden", fontFamily: "var(--font-sans)",
    }}>
      <ActivityBar />
      <NarrowSidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <BoardHeader theme={theme} setTheme={setTheme} />
        <BoardTitleBlock />
        <SheetView density={density} showAiBadges={showAiBadges} />
        <AIActivityStrip />
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const ChipStat = ({ label, value, tone = "default" }) => {
  const toneMap = {
    todo:     { bg: "var(--status-todo-bg)",     fg: "var(--status-todo-fg)" },
    progress: { bg: "var(--status-progress-bg)", fg: "var(--status-progress-fg)" },
    waiting:  { bg: "var(--status-waiting-bg)",  fg: "var(--status-waiting-fg)" },
    done:     { bg: "var(--status-done-bg)",     fg: "var(--status-done-fg)" },
    default:  { bg: "var(--muted)",              fg: "var(--muted-foreground)" },
  };
  const t = toneMap[tone] || toneMap.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 9px", borderRadius: 6,
      background: t.bg, color: t.fg,
      fontSize: 12, fontWeight: 500,
    }}>
      <span>{label}</span>
      <span className="fb-tnum" style={{ opacity: 0.7 }}>{value}</span>
    </span>
  );
};

const NarrowSidebar = () => {
  const items = [
    { Glyph: IconSheet, color: "var(--chart-1)", active: true },
    { Glyph: IconSheet, color: "var(--chart-2)" },
    { Glyph: IconSheet, color: "var(--chart-3)" },
    { Glyph: IconSheet, color: "var(--chart-4)" },
    { Glyph: IconSheet, color: "var(--chart-5)" },
  ];
  return (
    <aside style={{
      width: 52, flexShrink: 0,
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "10px 0", gap: 4,
    }}>
      <button style={{
        width: 32, height: 32, borderRadius: 7, border: "none",
        background: "var(--primary)", color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        marginBottom: 4,
      }}>
        <IconPlus size={15} />
      </button>
      {items.map((it, i) => (
        <button key={i} style={{
          width: 32, height: 32, borderRadius: 7, border: "none",
          background: it.active ? "var(--sidebar-active)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          position: "relative",
        }}>
          {it.active && <span style={{ position: "absolute", left: -2, top: 6, bottom: 6, width: 2, background: "var(--primary)", borderRadius: 1 }} />}
          <it.Glyph size={15} style={{ color: it.active ? "var(--foreground)" : it.color }} />
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button style={{ width: 32, height: 32, borderRadius: 7, border: "none", background: "transparent", color: "var(--sidebar-muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <IconChevronRight size={14} />
      </button>
    </aside>
  );
};

const BoardFooter = () => {
  return (
    <div style={{
      height: 36, flexShrink: 0,
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface)",
      display: "flex", alignItems: "center", padding: "0 14px", gap: 10, fontSize: 11.5, color: "var(--muted-foreground)",
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span className="fb-tnum">1</span> selected
      </span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span className="fb-tnum">142 rows</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span className="fb-tnum">8 columns</span>
      <div style={{ flex: 1 }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-done-fg)" }} />
        <span>Synced · 2 min ago</span>
      </span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <IconUndo size={12} />Undo · <span className="fb-kbd">⌘Z</span>
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Import Flow — Google Sheets URL → AI schema preview → confirm
// ─────────────────────────────────────────────────────────────

const ImportFlow = ({ theme, setTheme }) => {
  return (
    <div data-theme={theme} style={{
      width: "100%", height: "100%",
      background: "var(--background)", color: "var(--foreground)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "var(--font-sans)",
    }}>
      {/* Top bar */}
      <header style={{
        height: 48, flexShrink: 0,
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--background)",
        display: "flex", alignItems: "center",
        padding: "0 16px", gap: 12,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: "linear-gradient(140deg, var(--primary), color-mix(in oklch, var(--primary) 65%, white))",
          color: "white", fontWeight: 700, fontSize: 12,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>F</div>
        <span style={{ fontWeight: 600, fontSize: 13 }}>FlowBase</span>
        <span style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>/</span>
        <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Import</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setTheme && setTheme(theme === "dark" ? "light" : "dark")} style={{
          width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
          background: "var(--card)", color: "var(--muted-foreground)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          {theme === "dark" ? <IconSun size={14} /> : <IconMoon size={14} />}
        </button>
        <button style={{
          padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)",
          background: "var(--card)", color: "var(--muted-foreground)", fontSize: 12.5, cursor: "pointer",
        }}>Cancel</button>
      </header>

      {/* Step progress */}
      <div style={{
        padding: "16px 32px 8px",
        display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--background)",
      }}>
        <StepDot n={1} label="Source"   state="done" />
        <StepLine done />
        <StepDot n={2} label="Preview"  state="active" />
        <StepLine />
        <StepDot n={3} label="Schema"   state="upcoming" />
        <StepLine />
        <StepDot n={4} label="Confirm"  state="upcoming" />
      </div>

      {/* Two-column main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: 24, gap: 20 }}>
        {/* Left: source + preview */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div>
            <SectionTitle title="Source" hint="Step 1 — confirmed" />
            <div style={{
              padding: 14, borderRadius: 8,
              background: "var(--card)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: 6,
                background: "color-mix(in oklch, var(--chart-2) 18%, var(--background))",
                color: "var(--chart-2)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <IconLink size={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Google Sheets — “Customer Interviews”</div>
                <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  docs.google.com/spreadsheets/d/1AbC…xYz/edit#gid=0
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--status-done-fg)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <IconCheck size={12} />Connected
              </span>
              <button style={{
                background: "transparent", border: "1px solid var(--border)",
                padding: "4px 8px", borderRadius: 5, fontSize: 11.5, color: "var(--muted-foreground)", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <IconExternalLink size={11} />Open
              </button>
            </div>
          </div>

          {/* Preview */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <SectionTitle title="Preview" hint="First 10 of 142 rows" />
            <div className="fb-scroll" style={{
              flex: 1, minHeight: 0, overflow: "auto",
              borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--card)",
            }}>
              <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", fontSize: 12.5 }}>
                <thead>
                  <tr>
                    {["id", "name", "company", "date", "theme", "sentiment", "status", "priority"].map((h, i) => (
                      <th key={h} style={{
                        padding: "8px 10px", textAlign: "left",
                        fontWeight: 500, color: "var(--muted-foreground)", fontSize: 11.5,
                        borderBottom: "1px solid var(--border)",
                        background: "var(--surface)",
                        position: "sticky", top: 0,
                      }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <FieldTypeGlyph type={i === 0 ? "text" : i === 3 ? "date" : i === 6 ? "status" : "text"} />
                          {h}
                          {(i === 4 || i === 5) && (
                            <span style={{
                              padding: "0px 4px", borderRadius: 3, fontSize: 9, fontWeight: 700,
                              background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                              color: "var(--primary)",
                            }}>AI</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INTERVIEWS.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td style={previewTd({ mono: true })}>{row.id}</td>
                      <td style={previewTd()}>{row.name}</td>
                      <td style={previewTd()}>{row.company}</td>
                      <td style={previewTd({ mono: true })}>{row.date}</td>
                      <td style={previewTd()}>
                        <span className={row.aiTheme ? "fb-ai-cell" : ""} style={{ fontSize: 12.5 }}>{row.theme}</span>
                      </td>
                      <td style={previewTd()}>
                        <span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 11, fontWeight: 500, background: SENTIMENT_TONE[row.sentiment].bg, color: SENTIMENT_TONE[row.sentiment].fg }}>{row.sentiment}</span>
                      </td>
                      <td style={previewTd()}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td style={previewTd()}>
                        <PriorityCell priority={row.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: AI recommendations */}
        <aside style={{
          width: 340, flexShrink: 0,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div>
            <SectionTitle title="AI recommendations" hint="Confirm to apply — nothing is auto" />
          </div>

          <RecCard
            icon={<IconType size={13} />}
            title="Header row detected"
            detail="Row 1 contains 8 column names. Use as headers."
            applied
          />
          <RecCard
            icon={<IconHash size={13} />}
            title="Detected types for 8 columns"
            detail="3 text · 1 date · 2 select · 1 status · 1 priority"
            applied
          />
          <RecCard
            icon={<IconSparkles size={13} />}
            title="Add AI column: Theme"
            detail="Infer themes from “quote” free-text. 5 categories detected (Pricing, Onboarding, Performance, Features, Sharing)."
            pending
            primary
          />
          <RecCard
            icon={<IconSparkles size={13} />}
            title="Add AI column: Sentiment"
            detail="Score quotes as Positive / Mixed / Negative."
            pending
            primary
          />
          <RecCard
            icon={<IconBranch size={13} />}
            title="Suggested view: By sentiment"
            detail="Kanban grouped by Sentiment, sorted by Date."
            pending
          />

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0 0", borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>3 pending · 2 applied</span>
            <div style={{ flex: 1 }} />
            <button style={{
              padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)",
              background: "transparent", color: "var(--muted-foreground)", fontSize: 12.5, cursor: "pointer",
            }}>Skip all</button>
            <button style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid var(--primary)",
              background: "var(--primary)", color: "var(--primary-foreground)",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <IconCheck size={12} />Continue
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

const previewTd = (extra = {}) => ({
  padding: "7px 10px",
  fontSize: 12.5,
  borderBottom: "1px solid var(--border-subtle)",
  whiteSpace: "nowrap",
  color: extra.mono ? "var(--muted-foreground)" : "var(--foreground)",
  fontFamily: extra.mono ? "var(--font-mono)" : "var(--font-sans)",
});

const SectionTitle = ({ title, hint }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
    <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{title}</h3>
    {hint && <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{hint}</span>}
  </div>
);

const RecCard = ({ icon, title, detail, applied, pending, primary }) => {
  return (
    <div style={{
      padding: 12, borderRadius: 8,
      background: "var(--card)",
      border: "1px solid " + (primary && pending ? "color-mix(in oklch, var(--primary) 30%, var(--border))" : "var(--border)"),
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 5,
          background: "color-mix(in oklch, var(--primary) 14%, transparent)",
          color: "var(--primary)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, flex: 1 }}>{title}</span>
        {applied && <span style={{ fontSize: 10.5, color: "var(--status-done-fg)", display: "inline-flex", alignItems: "center", gap: 3 }}><IconCheck size={10} />Applied</span>}
        {pending && <span style={{ fontSize: 10.5, color: "var(--primary)", fontWeight: 600 }}>Pending</span>}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5, paddingLeft: 29 }}>{detail}</div>
      {pending && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, paddingLeft: 29, marginTop: 2 }}>
          <button style={{
            padding: "3px 9px", borderRadius: 5, border: "1px solid var(--primary)",
            background: primary ? "var(--primary)" : "var(--card)",
            color: primary ? "var(--primary-foreground)" : "var(--primary)",
            fontSize: 11.5, fontWeight: 500, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 3,
          }}>
            <IconCheck size={10} />Apply
          </button>
          <button style={{
            padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)",
            background: "transparent", color: "var(--muted-foreground)",
            fontSize: 11.5, cursor: "pointer",
          }}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

const StepDot = ({ n, label, state }) => {
  const isDone = state === "done";
  const isActive = state === "active";
  const dotBg = isDone || isActive ? "var(--primary)" : "var(--card)";
  const dotColor = isDone || isActive ? "var(--primary-foreground)" : "var(--muted-foreground)";
  const border = isDone || isActive ? "1.5px solid var(--primary)" : "1.5px solid var(--border)";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: dotBg, border,
        color: dotColor, fontSize: 11, fontWeight: 700,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        {isDone ? <IconCheck size={11} /> : n}
      </span>
      <span style={{
        fontSize: 12.5,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
      }}>{label}</span>
    </div>
  );
};

const StepLine = ({ done }) => (
  <span style={{ width: 36, height: 1.5, background: done ? "var(--primary)" : "var(--border)", opacity: done ? 0.6 : 1 }} />
);

Object.assign(window, {
  BoardV1, BoardV2, BoardV3, ImportFlow,
});
