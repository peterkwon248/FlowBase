/* @jsx React.createElement */
// FlowBase — fully interactive prototype.
// Editable sheet · AI Apply/Dismiss · search · filter · sort · view switch · row select · theme toggle.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ─────────────────────────────────────────────────────────────
// Initial state — augment demo rows with mutable AI fields
// ─────────────────────────────────────────────────────────────

const initialRows = () =>
  INTERVIEWS.map((r) => ({
    ...r,
    aiSuggestedTheme:     r.aiTheme ? r.theme : null,
    aiSuggestedSentiment: r.aiSentiment ? r.sentiment : null,
    themeConfirmed:       !r.aiTheme,
    sentimentConfirmed:   !r.aiSentiment,
    votes: r.sentiment === "Positive" ? { positive: 2, mixed: 1, negative: 0 } :
           r.sentiment === "Negative" ? { positive: 0, mixed: 1, negative: 3 } :
                                        { positive: 1, mixed: 2, negative: 1 },
  }));

const STATUS_OPTIONS = ["todo", "progress", "waiting", "done"];
const PRIORITY_OPTIONS = ["Urgent", "High", "Med", "Low"];
const SENTIMENT_OPTIONS = ["Positive", "Mixed", "Negative"];
const THEME_OPTIONS = ["Pricing pushback", "Onboarding friction", "Feature: AI columns", "Sheet performance", "Sharing & roles", "Other"];

// ─────────────────────────────────────────────────────────────
// Popover primitives
// ─────────────────────────────────────────────────────────────

function useOutsideClick(ref, onClose) {
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

const Popover = ({ anchor, onClose, children, width = 180 }) => {
  const ref = useRef(null);
  useOutsideClick(ref, onClose);
  const rect = anchor?.getBoundingClientRect();
  if (!rect) return null;
  const style = {
    position: "fixed",
    top: rect.bottom + 4,
    left: rect.left,
    width,
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    boxShadow: "var(--shadow-popover)",
    zIndex: 1000,
    padding: 4,
    fontSize: 13,
  };
  return <div ref={ref} style={style}>{children}</div>;
};

const MenuItem = ({ icon, label, value, active, onClick, danger }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 8,
    width: "100%", padding: "6px 8px", border: "none",
    background: active ? "var(--hover-bg)" : "transparent",
    borderRadius: 5, cursor: "pointer", textAlign: "left",
    color: danger ? "var(--destructive)" : "var(--foreground)",
    fontSize: 13,
  }}
    onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
    onMouseLeave={(e) => e.currentTarget.style.background = active ? "var(--hover-bg)" : "transparent"}
  >
    {icon}
    <span style={{ flex: 1 }}>{label}</span>
    {active && <IconCheck size={12} style={{ color: "var(--primary)" }} />}
  </button>
);

// ─────────────────────────────────────────────────────────────
// Interactive cells
// ─────────────────────────────────────────────────────────────

const EditableStatus = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <button ref={ref} onClick={() => setOpen(!open)} style={{
        background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "inline-flex",
      }}>
        <StatusBadge status={value} />
      </button>
      {open && (
        <Popover anchor={ref.current} onClose={() => setOpen(false)} width={170}>
          <div style={{ padding: "4px 8px 6px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Status</div>
          {STATUS_OPTIONS.map((s) => {
            const G = STATUS[s].icon;
            return (
              <MenuItem
                key={s}
                icon={<G size={13} style={{ color: `var(--status-${s === "todo" ? "todo" : s === "progress" ? "progress" : s === "waiting" ? "waiting" : "done"}-fg)` }} />}
                label={STATUS[s].label}
                active={s === value}
                onClick={() => { onChange(s); setOpen(false); }}
              />
            );
          })}
        </Popover>
      )}
    </>
  );
};

const EditablePriority = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <button ref={ref} onClick={() => setOpen(!open)} style={{
        background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "inline-flex",
      }}>
        <PriorityCell priority={value} />
      </button>
      {open && (
        <Popover anchor={ref.current} onClose={() => setOpen(false)} width={150}>
          <div style={{ padding: "4px 8px 6px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Priority</div>
          {PRIORITY_OPTIONS.map((p) => {
            const Glyph = PRIORITY[p].icon;
            return (
              <MenuItem
                key={p}
                icon={<Glyph size={13} style={{ color: PRIORITY[p].color }} />}
                label={p}
                active={p === value}
                onClick={() => { onChange(p); setOpen(false); }}
              />
            );
          })}
        </Popover>
      )}
    </>
  );
};

const EditableSentiment = ({ value, pending, onCommit, onDismiss }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const tone = SENTIMENT_TONE[value] || SENTIMENT_TONE.Mixed;
  return (
    <>
      <span style={{ display: "inline-flex", alignItems: "center", position: "relative", paddingLeft: pending ? 10 : 0 }}>
        {pending && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 5, height: 5, borderRadius: "50%", background: "var(--primary)" }} />}
        <button ref={ref} onClick={() => setOpen(!open)} style={{
          background: tone.bg, color: tone.fg,
          border: "none", padding: "2px 7px", borderRadius: 4,
          fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}>{value}</button>
      </span>
      {open && (
        <Popover anchor={ref.current} onClose={() => setOpen(false)} width={170}>
          {pending && (
            <div style={{ padding: 8, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <IconSparkles size={11} style={{ color: "var(--primary)" }} />AI suggested
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { onCommit(); setOpen(false); }} style={{
                  flex: 1, padding: "4px 8px", borderRadius: 4,
                  background: "var(--primary)", color: "var(--primary-foreground)",
                  border: "none", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                }}><IconCheck size={11} />Accept</button>
                <button onClick={() => { onDismiss(); setOpen(false); }} style={{
                  flex: 1, padding: "4px 8px", borderRadius: 4,
                  background: "transparent", color: "var(--muted-foreground)",
                  border: "1px solid var(--border)", fontSize: 11.5, cursor: "pointer",
                }}>Dismiss</button>
              </div>
            </div>
          )}
          <div style={{ padding: "4px 8px 6px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Sentiment</div>
          {SENTIMENT_OPTIONS.map((s) => {
            const t = SENTIMENT_TONE[s];
            return (
              <MenuItem
                key={s}
                icon={<span style={{ width: 8, height: 8, borderRadius: 2, background: t.fg }} />}
                label={s}
                active={s === value}
                onClick={() => { onCommit(s); setOpen(false); }}
              />
            );
          })}
        </Popover>
      )}
    </>
  );
};

const EditableTheme = ({ value, pending, onCommit, onDismiss }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <span style={{ position: "relative", paddingLeft: pending ? 10 : 0, display: "inline-flex", alignItems: "center" }}>
        {pending && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 5, height: 5, borderRadius: "50%", background: "var(--primary)" }} />}
        <button ref={ref} onClick={() => setOpen(!open)} className={pending ? "fb-ai-cell" : ""} style={{
          background: "transparent", border: "none", padding: 0,
          fontSize: 13, color: "var(--foreground)", cursor: "pointer", textAlign: "left",
        }}>{value}</button>
      </span>
      {open && (
        <Popover anchor={ref.current} onClose={() => setOpen(false)} width={220}>
          {pending && (
            <div style={{ padding: 8, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <IconSparkles size={11} style={{ color: "var(--primary)" }} />AI suggested · review
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { onCommit(); setOpen(false); }} style={{
                  flex: 1, padding: "4px 8px", borderRadius: 4,
                  background: "var(--primary)", color: "var(--primary-foreground)",
                  border: "none", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                }}><IconCheck size={11} />Accept</button>
                <button onClick={() => { onDismiss(); setOpen(false); }} style={{
                  flex: 1, padding: "4px 8px", borderRadius: 4,
                  background: "transparent", color: "var(--muted-foreground)",
                  border: "1px solid var(--border)", fontSize: 11.5, cursor: "pointer",
                }}>Dismiss</button>
              </div>
            </div>
          )}
          <div style={{ padding: "4px 8px 6px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Theme</div>
          {THEME_OPTIONS.map((t) => (
            <MenuItem
              key={t}
              icon={<span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--chart-1)" }} />}
              label={t}
              active={t === value}
              onClick={() => { onCommit(t); setOpen(false); }}
            />
          ))}
        </Popover>
      )}
    </>
  );
};

const EditableText = ({ value, onChange, placeholder, mono, wide }) => {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);
  if (editing) {
    return (
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { onChange(v); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(v); setEditing(false); }
          if (e.key === "Escape") { setV(value); setEditing(false); }
        }}
        style={{
          width: "100%", padding: "1px 3px",
          border: "1.5px solid var(--primary)", borderRadius: 3,
          background: "var(--background)", color: "var(--foreground)",
          font: "inherit", outline: "none",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          fontSize: mono ? 12 : 13,
        }}
      />
    );
  }
  return (
    <span onClick={() => setEditing(true)} style={{
      display: "inline-block",
      width: wide ? "100%" : "auto", maxWidth: "100%",
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      cursor: "text",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
      fontSize: mono ? 12 : 13,
      color: mono ? "var(--muted-foreground)" : "var(--foreground)",
    }}>{value || <span style={{ color: "var(--muted-foreground)", fontStyle: "italic" }}>{placeholder}</span>}</span>
  );
};

// ─────────────────────────────────────────────────────────────
// Interactive sheet
// ─────────────────────────────────────────────────────────────

// Hover-shown drag handle for column headers — DEPRECATED, now whole header is the drag target
const ColumnDragHandle = () => null;

const InteractiveSheet = ({ rows, columns, density, cellStyle, wordWrap, selectedIds, onSelect, onUpdateRow, onCommitAi, onDismissAi, onButtonAction, sort, onSort, focusedCell, onFocusCell, onAddColumn, onPromoteColumnToLibrary, onUnlinkColumn, onDeleteColumn, onJumpToLibraryAsset, onAddRow, onAttachFunction, onDetachFunction, onReorderColumn }) => {
  const rowPy = density === "compact" ? 5 : density === "comfortable" ? 12 : 8;
  const cellPx = density === "compact" ? 8 : density === "comfortable" ? 12 : 10;
  const totalWidth = columns.reduce((acc, c) => acc + c.width, 0) + 132;

  // Column drag-reorder (horizontal). ID column is locked in position 0.
  const draggableCols = columns.filter(c => c.name !== "id");
  const colDrag = window.useDragReorder(
    draggableCols,
    (colName, newIdxAmongDraggable) => onReorderColumn?.(colName, newIdxAmongDraggable + 1),
    "horizontal"
  );

  return (
    <div className="fb-scroll" style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
      <table style={{
        borderCollapse: "separate", borderSpacing: 0,
        width: "max(100%, " + totalWidth + "px)",
        tableLayout: "fixed",
      }}>
        <colgroup>
          <col style={{ width: 40 }} />
          <col style={{ width: 36 }} />
          {columns.map((c) => <col key={c.name} style={{ width: c.width }} />)}
          <col style={{ width: 56 }} />
        </colgroup>
        <thead>
          <tr>
            <th style={thStyle()}>
              <input
                type="checkbox"
                checked={rows.length > 0 && selectedIds.length === rows.length}
                onChange={(e) => onSelect(e.target.checked ? rows.map(r => r.id) : [])}
              />
            </th>
            <th style={thStyle({ textAlign: "right" })}><span style={{ fontSize: 11, color: "var(--muted-foreground)" }} className="fb-tnum">#</span></th>
            {columns.map((c) => {
              const sorted = sort?.key === c.name;
              const isLocked = c.name === "id";
              const dragProps = (!isLocked && colDrag) ? colDrag.getItemProps(c.name) : {};
              const handleProps = (!isLocked && colDrag) ? colDrag.getHandleProps(c.name) : null;
              const isDragging = !isLocked && colDrag ? colDrag.isDragging(c.name) : false;
              return (
                <th key={c.name}
                  {...dragProps}
                  {...(handleProps || {})}
                  style={thStyle({
                    cursor: handleProps ? (isDragging ? "grabbing" : "grab") : "pointer",
                    position: "relative",
                    opacity: isDragging ? 0.5 : 1,
                    userSelect: "none",
                    transition: "opacity 120ms ease",
                  })}
                  onClick={(e) => {
                    if (e.target.closest('[data-col-menu]')) return;
                    onSort(c.name);
                  }}>
                  {/* Drop indicator: before */}
                  {colDrag && !isLocked && colDrag.isDropTarget(c.name, "before") && (
                    <span style={{
                      position: "absolute", left: -1, top: 4, bottom: 4, width: 2,
                      background: "var(--primary)", borderRadius: 1, pointerEvents: "none",
                    }} />
                  )}
                  {/* Drop indicator: after */}
                  {colDrag && !isLocked && colDrag.isDropTarget(c.name, "after") && (
                    <span style={{
                      position: "absolute", right: -1, top: 4, bottom: 4, width: 2,
                      background: "var(--primary)", borderRadius: 1, pointerEvents: "none",
                    }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FieldTypeGlyph type={c.type} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: sorted ? "var(--foreground)" : "var(--muted-foreground)" }}>{c.label}</span>
                    {c.library && (
                      <span title={`Linked to Library / @${c.library.assetName || c.library.id} · Click to open`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToLibraryAsset?.(c.library);
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center",
                          width: 14, height: 14, borderRadius: 3,
                          background: "color-mix(in oklch, var(--primary) 20%, transparent)",
                          color: "var(--primary)",
                          justifyContent: "center", flexShrink: 0,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "color-mix(in oklch, var(--primary) 35%, transparent)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "color-mix(in oklch, var(--primary) 20%, transparent)"}>
                        <IconLink size={8} />
                      </span>
                    )}
                    {c.rule && (
                      <span title={`Rule: ${c.rule.ruleId} · Click to open`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToLibraryAsset?.({ kind: "function", id: c.rule.ruleId, assetName: c.rule.ruleId });
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center",
                          width: 14, height: 14, borderRadius: 3,
                          background: "color-mix(in oklch, var(--primary) 18%, transparent)",
                          color: "var(--primary)",
                          justifyContent: "center", flexShrink: 0,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "color-mix(in oklch, var(--primary) 35%, transparent)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "color-mix(in oklch, var(--primary) 18%, transparent)"}>
                        <IconSparkles size={9} />
                      </span>
                    )}
                    {c.ai && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                        background: "color-mix(in oklch, var(--primary) 15%, transparent)",
                        color: "var(--primary)",
                      }}>
                        <IconSparkles size={8} />AI
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <IconArrowUpDown size={11} style={{ color: sorted ? "var(--primary)" : "var(--muted-foreground)", opacity: sorted ? 1 : 0.5 }} />
                    {/* Column header dropdown menu — replaced by right-click context menu */}
                    {false && (onPromoteColumnToLibrary || onUnlinkColumn || onDeleteColumn) && c.name !== "id" && (
                      <ColumnHeaderMenu
                        col={c}
                        columns={columns}
                        onPromote={onPromoteColumnToLibrary}
                        onUnlink={onUnlinkColumn}
                        onDelete={onDeleteColumn}
                        onAttachFunction={onAttachFunction}
                        onDetachFunction={onDetachFunction}
                      />
                    )}
                  </div>
                </th>
              );
            })}
            <th style={thStyle({ padding: 0, cursor: onAddColumn ? "default" : "default" })}>
              {onAddColumn && (
                <AddColumnButton onAddColumn={onAddColumn} existingColumns={columns} />
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isSelected = selectedIds.includes(row.id);
            return (
              <tr key={row.id}
                  style={{ background: isSelected ? "color-mix(in oklch, var(--primary) 7%, transparent)" : "transparent" }}>
                <td style={tdStyle(rowPy, cellPx)}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(isSelected ? selectedIds.filter(id => id !== row.id) : [...selectedIds, row.id])}
                  />
                </td>
                <td style={tdStyle(rowPy, cellPx, { textAlign: "right", color: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" })}>{idx + 1}</td>
                {columns.map((c) => {
                  const isFocused = focusedCell && focusedCell.row === row.id && focusedCell.col === c.name;
                  const isAuto = !!row["_auto_" + c.name];
                  const isPending = !!row["_pending_" + c.name];
                  const tdSt = tdStyle(rowPy, cellPx, {
                    position: "relative",
                    outline: isFocused ? "2px solid var(--primary)" : "none",
                    outlineOffset: -1,
                    borderRight: "1px solid var(--border-subtle)",
                    whiteSpace: wordWrap ? "normal" : "nowrap",
                    wordBreak: wordWrap ? "break-word" : "normal",
                    verticalAlign: wordWrap ? "top" : "middle",
                  });
                  return (
                    <td key={c.name} style={tdSt} onClick={() => onFocusCell({ row: row.id, col: c.name })}>
                      <CellEditor row={row} col={c} onUpdateRow={onUpdateRow} onCommitAi={onCommitAi} onDismissAi={onDismissAi} onButtonAction={onButtonAction} />
                      {isPending && (
                        <span title="AI is classifying..." style={{
                          position: "absolute", top: 2, right: 2,
                          display: "inline-flex", alignItems: "center",
                          width: 16, height: 16, borderRadius: 3,
                          background: "color-mix(in oklch, var(--primary) 22%, transparent)",
                          color: "var(--primary)",
                          justifyContent: "center", pointerEvents: "none",
                          animation: "fb-pulse 1s ease-in-out infinite",
                        }}>
                          <IconSparkles size={10} />
                        </span>
                      )}
                      {!isPending && isAuto && (
                        <span title="Auto-filled by Rule" style={{
                          position: "absolute", top: 2, right: 2,
                          display: "inline-flex", alignItems: "center",
                          width: 14, height: 14, borderRadius: 3,
                          background: "color-mix(in oklch, var(--primary) 18%, transparent)",
                          color: "var(--primary)",
                          justifyContent: "center", pointerEvents: "none",
                        }}>
                          <IconSparkles size={9} />
                        </span>
                      )}
                    </td>
                  );
                })}
                <td style={tdStyle(rowPy, cellPx)} />
              </tr>
            );
          })}
          {rows.length > 0 && (
            <tr>
              <td colSpan={columns.length + 3}
                onClick={onAddRow ? () => onAddRow() : undefined}
                style={{ ...tdStyle(rowPy, cellPx), color: "var(--muted-foreground)", borderBottom: "none", cursor: onAddRow ? "pointer" : "default" }}
                onMouseEnter={(e) => { if (onAddRow) e.currentTarget.style.background = "var(--hover-bg)"; }}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                  <IconPlus size={12} />New row
                </span>
              </td>
            </tr>
          )}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 3} style={{ ...tdStyle(rowPy, cellPx), padding: "40px 14px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 12.5, borderBottom: "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>아직 행이 없습니다.</span>
                  {onAddRow && (
                    <button onClick={onAddRow} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 12px", borderRadius: 5,
                      background: "var(--primary)", border: "1px solid var(--primary)",
                      color: "var(--primary-foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                    }}>
                      <IconPlus size={11} />Add first row
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Generic select cell editor for any select column
const EditableSelect = ({ value, options, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <button ref={ref} onClick={() => setOpen(!open)} style={{
        background: "var(--muted)", border: "1px solid var(--border-subtle)",
        padding: "1px 7px", borderRadius: 4,
        fontSize: 12, color: "var(--foreground)", cursor: "pointer",
      }}>{value || "—"}</button>
      {open && (
        <Popover anchor={ref.current} onClose={() => setOpen(false)} width={170}>
          {label && (
            <div style={{ padding: "4px 8px 6px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>{label}</div>
          )}
          {options.map((o) => (
            <MenuItem
              key={o}
              label={o}
              active={o === value}
              onClick={() => { onChange(o); setOpen(false); }}
            />
          ))}
        </Popover>
      )}
    </>
  );
};

// FK cell — resolve linked label
const FkCell = ({ value, target }) => {
  let label = value;
  if (target === "companies" && typeof window.resolveCompany === "function") {
    const c = window.resolveCompany(value);
    if (c) label = c.name;
  } else if (target === "interviews" && typeof window.resolveInterview === "function") {
    const i = window.resolveInterview(value);
    if (i) label = i.id;
  } else if (target === "people" && typeof window.resolvePerson === "function") {
    const p = window.resolvePerson(value);
    if (p) label = p.name;
  }
  if (!value) return <span style={{ color: "var(--muted-foreground)" }}>—</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13 }}>
      <span style={{ width: 5, height: 5, borderRadius: 1, background: "var(--chart-3)", opacity: 0.7 }} />
      <span>{label}</span>
      <code style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{value}</code>
    </span>
  );
};

const CellEditor = ({ row, col, onUpdateRow, onCommitAi, onDismissAi, onButtonAction }) => {
  if (col.name === "id") {
    return <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted-foreground)", fontSize: 12 }}>{row.id}</span>;
  }
  if (col.type === "avatar") {
    return <AvatarCell name={row[col.name]} subtitle={col.subtitleField ? row[col.subtitleField] : null} />;
  }
  if (col.type === "reaction") {
    return <ReactionCell value={row[col.name]} onChange={(v) => onUpdateRow(row.id, { [col.name]: v })} />;
  }
  if (col.type === "button") {
    return <ButtonCell
      label={col.buttonLabel || "Action"}
      icon={<IconSparkles size={11} />}
      tone={col.buttonTone || "ai"}
      onClick={() => onButtonAction?.(col, row)}
    />;
  }
  if (col.type === "status") {
    return <EditableStatus value={row.status} onChange={(v) => onUpdateRow(row.id, { status: v })} />;
  }
  if (col.name === "priority") {
    return <EditablePriority value={row.priority} onChange={(v) => onUpdateRow(row.id, { priority: v })} />;
  }
  if (col.ai && col.name === "sentiment") {
    const pending = row.sentimentConfirmed === false;
    return (
      <EditableSentiment
        value={row.sentiment}
        pending={pending}
        onCommit={(v) => onCommitAi(row.id, "sentiment", v)}
        onDismiss={() => onDismissAi(row.id, "sentiment")}
      />
    );
  }
  if (col.ai && col.name === "theme") {
    const pending = row.themeConfirmed === false;
    return (
      <EditableTheme
        value={row.theme}
        pending={pending}
        onCommit={(v) => onCommitAi(row.id, "theme", v)}
        onDismiss={() => onDismissAi(row.id, "theme")}
      />
    );
  }
  if (col.type === "fk") {
    return <LinkedCardCell value={row[col.name]} target={col.fk} />;
  }
  if (col.type === "select" && col.options) {
    return <EditableSelect value={row[col.name]} options={col.options} label={col.label} onChange={(v) => onUpdateRow(row.id, { [col.name]: v })} />;
  }
  // Library-linked select (Option List)
  if (col.type === "select" && col.library?.kind === "optionList") {
    const ol = window.LIBRARY?.optionLists.find(o => o.id === col.library.id);
    if (ol) {
      const opts = ol.options.map(o => o.label);
      return <EditableSelect value={row[col.name]} options={opts} label={col.label} onChange={(v) => onUpdateRow(row.id, { [col.name]: v })} />;
    }
  }
  // Library-linked field with embedded optionListId in config
  if (col.type === "select" && col.config?.optionListId) {
    const ol = window.LIBRARY?.optionLists.find(o => o.id === col.config.optionListId);
    if (ol) {
      const opts = ol.options.map(o => o.label);
      return <EditableSelect value={row[col.name]} options={opts} label={col.label} onChange={(v) => onUpdateRow(row.id, { [col.name]: v })} />;
    }
  }
  if (col.type === "num") {
    return <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 12, color: "var(--muted-foreground)" }}>{row[col.name]}</span>;
  }
  if (col.type === "date") {
    return <EditableText value={row[col.name] || ""} onChange={(v) => onUpdateRow(row.id, { [col.name]: v })} mono />;
  }
  if (col.type === "email") {
    return <EditableText value={row[col.name] || ""} onChange={(v) => onUpdateRow(row.id, { [col.name]: v })} mono />;
  }
  return <EditableText value={row[col.name] || ""} onChange={(v) => onUpdateRow(row.id, { [col.name]: v })} wide />;
};

// ─────────────────────────────────────────────────────────────
// Activity panel (interactive)
// ─────────────────────────────────────────────────────────────

const InteractiveActivityPanel = ({ rows, activeTableId, activeTableLabel, hasAi, onAcceptAll, onDismissAll, onAskAi, aiHistory, chatMessages, onSendChat, chatBusy }) => {
  const pendingTheme = hasAi ? rows.filter(r => !r.themeConfirmed).length : 0;
  const pendingSent  = hasAi ? rows.filter(r => !r.sentimentConfirmed).length : 0;
  const pendingTotal = pendingTheme + pendingSent;
  const [askInput, setAskInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [historyScope, setHistoryScope] = useState("all"); // "all" | "table"

  const tableSlug = (activeTableId || "").toLowerCase();
  const scopedHistory = historyScope === "table"
    ? aiHistory.filter(t => (t.title + " " + (t.detail || "")).toLowerCase().includes(tableSlug))
    : aiHistory;

  return (
    <aside style={{
      width: 340, flexShrink: 0,
      background: "var(--surface)",
      borderLeft: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", fontSize: 13,
    }}>
      <div style={{
        height: 48, padding: "0 14px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <IconSparkles size={14} style={{ color: "var(--primary)" }} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>AI Activity</span>
          {activeTableLabel && (
            <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>
              {activeTableLabel}{hasAi ? "" : " · no AI cols"}
            </span>
          )}
        </div>
        {pendingTotal > 0 && (
          <span style={{
            fontSize: 10, padding: "1px 5px", borderRadius: 3,
            background: "color-mix(in oklch, var(--primary) 18%, transparent)",
            color: "var(--primary)", fontWeight: 600,
          }}>{pendingTotal} pending</span>
        )}
        <div style={{ flex: 1 }} />
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {pendingTotal > 0 && (
          <div style={{ padding: "12px 14px 8px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 8 }}>
              Pending — needs you
            </div>
            {pendingTheme > 0 && (
              <PendingCard
                icon={<IconSparkles size={13} style={{ color: "var(--primary)" }} />}
                title={`Inferred Theme for ${pendingTheme} rows`}
                detail="Free-text → 5 categories (Pricing, Onboarding, Features, Sharing, Performance)"
                count={pendingTheme}
                onApply={() => onAcceptAll("theme")}
                onDismiss={() => onDismissAll("theme")}
              />
            )}
            {pendingSent > 0 && (
              <PendingCard
                icon={<IconSparkles size={13} style={{ color: "var(--primary)" }} />}
                title={`Inferred Sentiment for ${pendingSent} rows`}
                detail="Quote text → Positive / Mixed / Negative"
                count={pendingSent}
                onApply={() => onAcceptAll("sentiment")}
                onDismiss={() => onDismissAll("sentiment")}
              />
            )}
          </div>
        )}

        {!hasAi && (
          <div style={{ padding: "12px 14px 8px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 8 }}>
              Pending
            </div>
            <div style={{
              padding: 12, borderRadius: 8, border: "1px dashed var(--border)",
              background: "var(--card)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <IconSparkles size={12} style={{ color: "var(--muted-foreground)" }} />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>No AI columns yet</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5, marginBottom: 8 }}>
                Add an AI column to <b style={{ color: "var(--foreground)" }}>{activeTableLabel}</b> — Claude can infer values from existing fields like the free-text columns.
              </div>
              <button onClick={() => onAskAi(`Suggest a useful AI column for the ${activeTableLabel} table`)} style={{
                padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)",
                background: "var(--card)", color: "var(--primary)",
                fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <IconSparkles size={10} />Suggest a column
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              Timeline
            </span>
            <div style={{ flex: 1 }} />
            <div style={{
              display: "inline-flex", padding: 2, gap: 2,
              background: "var(--muted)", borderRadius: 5, fontSize: 10.5,
            }}>
              {[
                { id: "all",   label: "All" },
                { id: "table", label: "This table" },
              ].map((s) => (
                <button key={s.id} onClick={() => setHistoryScope(s.id)} style={{
                  padding: "2px 7px", borderRadius: 4, border: "none",
                  background: historyScope === s.id ? "var(--surface-elevated)" : "transparent",
                  color: historyScope === s.id ? "var(--foreground)" : "var(--muted-foreground)",
                  fontWeight: historyScope === s.id ? 600 : 500,
                  cursor: "pointer",
                }}>{s.label}</button>
              ))}
            </div>
          </div>
          <div style={{ position: "relative", paddingLeft: 14 }}>
            <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: "var(--border)" }} />
            {scopedHistory.length === 0 ? (
              <div style={{ paddingLeft: 0, marginLeft: -14, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                No AI activity yet on this table.
              </div>
            ) : (
              scopedHistory.slice().reverse().map((t, i) => (
                <div key={i} style={{ position: "relative", marginBottom: 12 }}>
                  <span style={{
                    position: "absolute", left: -14, top: 5,
                    width: 9, height: 9, borderRadius: "50%",
                    background: "var(--card)",
                    border: "1.5px solid var(--border)",
                  }} />
                  <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.35, color: "var(--foreground)" }}>{t.title}</div>
                  {t.detail && <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>{t.detail}</div>}
                  <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginTop: 3, fontFamily: "var(--font-mono)" }}>{t.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: 12, borderTop: "1px solid var(--border-subtle)" }}>
        {/* Chat messages */}
        {chatMessages && chatMessages.length > 0 && (
          <div className="fb-scroll" style={{
            maxHeight: 280, overflowY: "auto",
            marginBottom: 8, display: "flex", flexDirection: "column", gap: 6,
          }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{
                padding: "7px 10px", borderRadius: 7,
                background: m.role === "user"
                  ? "color-mix(in oklch, var(--primary) 10%, var(--card))"
                  : "var(--card)",
                border: "1px solid var(--border-subtle)",
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "92%",
              }}>
                <div style={{
                  fontSize: 9.5, fontWeight: 600, letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: m.role === "user" ? "var(--primary)" : "var(--muted-foreground)",
                  marginBottom: 3,
                }}>{m.role === "user" ? "You" : "AI"}</div>
                <div style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatBusy && (
              <div style={{
                padding: "7px 10px", borderRadius: 7,
                background: "var(--card)", border: "1px solid var(--border-subtle)",
                alignSelf: "flex-start", maxWidth: "92%",
                fontSize: 11, color: "var(--muted-foreground)",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ display: "inline-flex", gap: 2 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--muted-foreground)", animation: "fb-pulse 1s ease-in-out infinite" }} />
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--muted-foreground)", animation: "fb-pulse 1s ease-in-out infinite 0.15s" }} />
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--muted-foreground)", animation: "fb-pulse 1s ease-in-out infinite 0.3s" }} />
                </span>
                Thinking…
              </div>
            )}
          </div>
        )}
        <div style={{
          padding: 8, borderRadius: 7,
          border: "1px solid var(--border)", background: "var(--card)",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <input
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && askInput.trim() && !asking) {
                setAsking(true);
                const text = askInput;
                setAskInput("");
                if (onSendChat) await onSendChat(text);
                else if (onAskAi) await onAskAi(text);
                setAsking(false);
              }
            }}
            placeholder={`Ask AI about ${activeTableLabel || "this table"}…`}
            style={{
              border: "none", background: "transparent", outline: "none",
              fontSize: 12.5, color: "var(--foreground)",
              fontFamily: "var(--font-sans)", padding: 2,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="fb-kbd">↵</span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{asking || chatBusy ? "thinking…" : "to send"}</span>
            <div style={{ flex: 1 }} />
            <button onClick={async () => {
              if (askInput.trim() && !asking) {
                setAsking(true);
                const text = askInput;
                setAskInput("");
                if (onSendChat) await onSendChat(text);
                else if (onAskAi) await onAskAi(text);
                setAsking(false);
              }
            }} style={{
              background: "var(--primary)", border: "none",
              color: "var(--primary-foreground)", padding: "3px 8px", borderRadius: 4, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11,
            }}>
              <IconBolt size={10} />Send
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const PendingCard = ({ icon, title, detail, count, onApply, onDismiss }) => (
  <div style={{
    padding: 12, borderRadius: 7,
    border: "1px solid color-mix(in oklch, var(--primary) 30%, var(--border))",
    background: "var(--card)",
    marginBottom: 6,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
      {icon}
      <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, flex: 1 }}>{title}</span>
      {count != null && (
        <span className="fb-tnum" style={{
          fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
          background: "color-mix(in oklch, var(--primary) 14%, transparent)",
          color: "var(--primary)",
        }}>{count}</span>
      )}
    </div>
    <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 9, lineHeight: 1.5 }}>{detail}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button onClick={onApply} style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 9px", borderRadius: 5, border: "1px solid var(--primary)",
        background: "var(--primary)", color: "var(--primary-foreground)",
        fontSize: 11.5, fontWeight: 500, cursor: "pointer",
      }}>
        <IconCheck size={11} />Apply all
      </button>
      <button onClick={onDismiss} style={{
        padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)",
        background: "transparent", color: "var(--muted-foreground)",
        fontSize: 11.5, cursor: "pointer",
      }}>Dismiss</button>
    </div>
  </div>
);

Object.assign(window, {
  initialRows, STATUS_OPTIONS, PRIORITY_OPTIONS, SENTIMENT_OPTIONS, THEME_OPTIONS,
  Popover, MenuItem, useOutsideClick,
  EditableStatus, EditablePriority, EditableSentiment, EditableTheme, EditableText, EditableSelect, FkCell,
  InteractiveSheet, CellEditor, InteractiveActivityPanel, PendingCard,
});
