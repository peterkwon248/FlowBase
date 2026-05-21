/* @jsx React.createElement */
// FlowBase — Timeline (Gantt-style) view.
// Generic: works on any table that has a date-type column.

const TimelineView = ({ rows, dateField = "due", endField = null, startField = "created", titleField = "title", idField = "id", subtitleField = "assignee", selectedIds = [], onSelect }) => {
  const toggleSel = (e, id) => {
    e.stopPropagation();
    if (!onSelect) return;
    const has = selectedIds.includes(id);
    onSelect(has ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };
  const dated = rows.filter(r => r[dateField]);
  if (dated.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: 13, padding: 24, textAlign: "center" }}>
        No rows with <code style={{ fontFamily: "var(--font-mono)", background: "var(--muted)", padding: "1px 5px", borderRadius: 3, margin: "0 4px" }}>{dateField}</code> dates. Add a date to see the timeline.
      </div>
    );
  }

  const dayMs = 86_400_000;
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);

  // Range = earliest (min of start/today) → latest end, padded
  const allDates = [];
  dated.forEach(r => {
    if (r[startField]) allDates.push(new Date(r[startField]).getTime());
    if (r[dateField])  allDates.push(new Date(r[dateField]).getTime());
    if (endField && r[endField]) allDates.push(new Date(r[endField]).getTime());
  });
  const minD = Math.min(...allDates, today.getTime());
  const maxD = Math.max(...allDates, today.getTime());
  const pad = dayMs * 2;
  const startMs = minD - pad;
  const endMs   = maxD + pad;

  const days = [];
  for (let t = startMs; t <= endMs; t += dayMs) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }

  const sorted = [...dated].sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]));
  const colWidth = 34;

  const statusColorMap = {
    todo:     "var(--status-todo-fg)",
    progress: "var(--status-progress-fg)",
    waiting:  "var(--status-waiting-fg)",
    done:     "var(--status-done-fg)",
  };
  const statusLabel = { todo: "미처리", progress: "진행중", waiting: "대기", done: "완료" };

  return (
    <div className="fb-scroll" style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
      <div style={{ minWidth: "100%", width: "100%", display: "block" }}>
        {/* Header */}
        <div style={{ display: "flex", position: "sticky", top: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)", zIndex: 2 }}>
          <div style={{ width: 280, flexShrink: 0, padding: "10px 14px", borderRight: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Item ({sorted.length}) · by {dateField}
          </div>
          <div style={{ display: "flex" }}>
            {days.map(d => {
              const isToday = d === todayISO;
              const isWeekend = [0, 6].includes(new Date(d).getDay());
              return (
                <div key={d} style={{
                  width: colWidth, padding: "8px 0", textAlign: "center",
                  borderRight: "1px solid var(--border-subtle)",
                  background: isToday ? "color-mix(in oklch, var(--primary) 14%, transparent)" : (isWeekend ? "var(--muted)" : "transparent"),
                  fontSize: 10, color: isToday ? "var(--primary)" : "var(--muted-foreground)",
                  fontFamily: "var(--font-mono)", fontWeight: isToday ? 600 : 500,
                  display: "flex", flexDirection: "column", lineHeight: 1.2, gap: 1,
                }}>
                  <span>{d.slice(5)}</span>
                  <span style={{ fontSize: 8.5, opacity: 0.7 }}>{["일","월","화","수","목","금","토"][new Date(d).getDay()]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rows */}
        {sorted.map(task => {
          const dueIdx     = days.indexOf(task[dateField]);
          const createdIdx = task[startField] ? days.indexOf(task[startField]) : Math.max(0, dueIdx - 4);
          const barStart   = createdIdx >= 0 ? createdIdx : 0;
          const barEnd     = Math.max(barStart, dueIdx);
          const barWidth   = Math.max(1, barEnd - barStart + 1);
          const sc         = statusColorMap[task.status] || "var(--chart-1)";
          const overdue    = task[dateField] < todayISO && task.status && task.status !== "done";
          const title      = task[titleField] || task.name || task.quote || task[idField];
          return (
            <div key={task[idField]} onClick={(e) => toggleSel(e, task[idField])} style={{
              display: "flex", borderBottom: "1px solid var(--border-subtle)",
              minHeight: 40, alignItems: "stretch",
              background: selectedIds.includes(task[idField]) ? "color-mix(in oklch, var(--primary) 7%, transparent)" : "transparent",
              cursor: "pointer",
            }}>
              <div style={{ width: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--border-subtle)" }}>
                <input type="checkbox"
                  checked={selectedIds.includes(task[idField])}
                  onChange={(e) => toggleSel(e, task[idField])}
                  onClick={(e) => e.stopPropagation()}
                  style={{ margin: 0, cursor: "pointer" }} />
              </div>
              <div style={{ width: 280, flexShrink: 0, padding: "8px 14px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, fontSize: 10.5, color: "var(--muted-foreground)" }}>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{task[idField]}</span>
                  {task[subtitleField] && <>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span>{subtitleField === "assignee" ? "@" : ""}{task[subtitleField]}</span>
                  </>}
                  {overdue && (
                    <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "var(--status-todo-bg)", color: "var(--status-todo-fg)" }}>OVERDUE</span>
                  )}
                </div>
              </div>
              <div style={{ position: "relative", display: "flex", flex: 1 }}>
                {days.map(d => {
                  const isToday = d === todayISO;
                  const isWeekend = [0, 6].includes(new Date(d).getDay());
                  return <div key={d} style={{
                    width: colWidth,
                    borderRight: "1px solid var(--border-subtle)",
                    background: isToday ? "color-mix(in oklch, var(--primary) 8%, transparent)" : (isWeekend ? "color-mix(in oklch, var(--muted) 50%, transparent)" : "transparent"),
                  }} />;
                })}
                {dueIdx >= 0 && (
                  <div style={{
                    position: "absolute",
                    left: barStart * colWidth + 3,
                    width: barWidth * colWidth - 6,
                    top: "50%", transform: "translateY(-50%)",
                    height: 24, borderRadius: 5,
                    background: `color-mix(in oklch, ${sc} 22%, var(--card))`,
                    borderLeft: `3px solid ${sc}`,
                    display: "flex", alignItems: "center", padding: "0 8px", gap: 5,
                    fontSize: 11, fontWeight: 500, color: sc,
                    overflow: "hidden", whiteSpace: "nowrap",
                  }}>
                    {task.status && statusLabel[task.status] && <span style={{ flexShrink: 0 }}>{statusLabel[task.status]}</span>}
                    {task.status && task.priority && <span style={{ opacity: 0.7, fontSize: 10 }}>·</span>}
                    {task.priority && <span style={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: 10.5, opacity: 0.8 }}>{task.priority}</span>}
                    {!task.status && !task.priority && <span style={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: 10.5, opacity: 0.8 }}>{task[dateField]}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { TimelineView });
