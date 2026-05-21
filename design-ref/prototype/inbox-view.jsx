/* @jsx React.createElement */
// FlowBase — Inbox: AI suggestions, verified expirations, system notifications.

const { useState: useInS, useMemo: useInM, useEffect: useInE } = React;

// Build inbox items from workspace state — pure derivation, no extra storage
function buildInboxItems({ tablesById, library, wikiPages, aiHistory }) {
  const items = [];
  const today = new Date().toISOString().slice(0, 10);

  // 1. Wiki pages whose verification is expired or near expiry
  (wikiPages || []).forEach(p => {
    if (!p.expiresAt) return;
    if (!p.verified) return;
    const daysLeft = Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / 86400000);
    if (daysLeft <= 14) {
      items.push({
        id: "wiki-expire-" + p.id,
        kind: daysLeft < 0 ? "alert" : "warn",
        priority: daysLeft < 0 ? 10 : (daysLeft <= 7 ? 8 : 5),
        title: daysLeft < 0
          ? `Wiki page expired: ${p.title}`
          : `Wiki page expires in ${daysLeft}d: ${p.title}`,
        detail: `Owner: ${p.owner} · Category: ${p.category || "—"}`,
        actionLabel: "Open page",
        target: { mode: "wiki", pageId: p.id },
        time: p.expiresAt,
      });
    }
  });

  // 2. Unverified DRAFT wiki pages owned by current user
  (wikiPages || []).forEach(p => {
    if (p.verified) return;
    items.push({
      id: "wiki-draft-" + p.id,
      kind: "info",
      priority: 3,
      title: `Draft awaiting verification: ${p.title}`,
      detail: `${p.owner} hasn't marked this verified yet`,
      actionLabel: "Open page",
      target: { mode: "wiki", pageId: p.id },
      time: p.updatedAt,
    });
  });

  // 3. AI-suggested actions — pending AI confirmations in tables
  Object.entries(tablesById || {}).forEach(([tid, t]) => {
    const pendingTheme = (t.rows || []).filter(r => r.themeConfirmed === false).length;
    const pendingSent = (t.rows || []).filter(r => r.sentimentConfirmed === false).length;
    if (pendingTheme > 0) {
      items.push({
        id: "ai-theme-" + tid,
        kind: "ai",
        priority: 7,
        title: `${pendingTheme} AI Theme suggestions pending`,
        detail: `${t.label} · review and confirm`,
        actionLabel: "Review",
        target: { mode: "tables", tableId: tid },
        time: today,
      });
    }
    if (pendingSent > 0) {
      items.push({
        id: "ai-sent-" + tid,
        kind: "ai",
        priority: 7,
        title: `${pendingSent} AI Sentiment suggestions pending`,
        detail: `${t.label} · review and confirm`,
        actionLabel: "Review",
        target: { mode: "tables", tableId: tid },
        time: today,
      });
    }
  });

  // 4. Library: unused assets (dead code suggestion — gentle hint)
  if (library) {
    ["optionLists", "fields", "templates", "functions", "dashboards"].forEach(cat => {
      (library[cat] || []).forEach(a => {
        if (!a.usedIn || a.usedIn.length === 0) {
          // Don't flag freshly-created ones — heuristic: created with default name
          if (/^New /.test(a.name)) return;
          items.push({
            id: "lib-unused-" + a.id,
            kind: "tip",
            priority: 1,
            title: `Unused: ${a.name}`,
            detail: `Library · ${cat.slice(0, -1)} — consider archiving or applying`,
            actionLabel: "Open",
            target: { mode: "library", category: cat, assetId: a.id },
            time: today,
          });
        }
      });
    });
  }

  // 5. Tables with no rows — suggest data import
  Object.entries(tablesById || {}).forEach(([tid, t]) => {
    if ((t.rows || []).length === 0) {
      items.push({
        id: "empty-table-" + tid,
        kind: "tip",
        priority: 2,
        title: `Empty table: ${t.label}`,
        detail: "No rows yet — add some or import a CSV",
        actionLabel: "Open table",
        target: { mode: "tables", tableId: tid },
        time: today,
      });
    }
  });

  // 6. Workspace activity (recent AI history)
  (aiHistory || []).slice(-3).reverse().forEach((h, i) => {
    items.push({
      id: "activity-" + i + "-" + h.time,
      kind: "log",
      priority: 0,
      title: h.title,
      detail: h.detail,
      time: h.time,
      target: null,
    });
  });

  // Sort by priority desc, then time
  return items.sort((a, b) => b.priority - a.priority);
}

const InboxView = ({
  items, onNavigate,
  theme, setTheme, panels, onTogglePanel, onShowAllPanels, onHideAllPanels,
  filter, onFilter, counts, navSlot,
}) => {
  const [search, setSearch] = useInS("");

  const setFilter = onFilter;

  const filtered = useInM(() => {
    let list = filter === "all" ? items : items.filter(i => i.kind === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        String(i.title).toLowerCase().includes(q) ||
        String(i.detail || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, search]);

  const breadcrumb = (
    <>
      <span style={{ color: "var(--muted-foreground)" }}>peter's workspace</span>
      <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
      <span style={{ fontWeight: 600 }}>Inbox</span>
    </>
  );

  return (
    <main style={{
      flex: 1, display: "flex", flexDirection: "column",
      minWidth: 0, background: "var(--background)",
    }}>
      <InteractiveHeader
        theme={theme} setTheme={setTheme}
        search={search} onSearch={setSearch}
        breadcrumb={breadcrumb}
        leadingSlot={panels && onTogglePanel ? (
          <PanelsMenu panels={panels} onToggle={onTogglePanel} onShowAll={onShowAllPanels} onHideAll={onHideAllPanels} />
        ) : null}
        navSlot={navSlot}
      />

      {/* Filter bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "10px 20px 6px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        {[
          { id: "all",    label: "All",          tone: null },
          { id: "alert",  label: "Alerts",       tone: "var(--destructive)" },
          { id: "warn",   label: "Warnings",     tone: "var(--status-waiting-fg)" },
          { id: "ai",     label: "AI",           tone: "var(--primary)" },
          { id: "info",   label: "Info",         tone: "var(--chart-3)" },
          { id: "tip",    label: "Tips",         tone: "var(--muted-foreground)" },
        ].map(t => {
          const on = filter === t.id;
          const count = counts[t.id] || 0;
          return (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 5,
              background: on ? "var(--active-bg-strong)" : "transparent",
              border: "1px solid " + (on ? "transparent" : "var(--border-subtle)"),
              color: on ? "var(--foreground)" : "var(--muted-foreground)",
              fontSize: 12, fontWeight: on ? 600 : 500, cursor: "pointer",
            }}>
              {t.tone && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.tone, flexShrink: 0 }} />}
              <span>{t.label}</span>
              {count > 0 && <span className="fb-tnum" style={{ fontSize: 10.5, opacity: 0.7 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Items list */}
      <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 20px 30px" }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: 60, textAlign: "center",
            color: "var(--muted-foreground)", fontSize: 13,
          }}>
            <IconInbox size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>
              {filter === "all"
                ? "Inbox is empty. Nothing urgent right now."
                : `No items in "${filter}".`}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map(item => (
              <InboxItem key={item.id} item={item} onClick={() => item.target && onNavigate(item.target)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

const InboxItem = ({ item, onClick }) => {
  const toneMap = {
    alert: { color: "var(--destructive)", bg: "color-mix(in oklch, var(--destructive) 8%, var(--card))", icon: "⚠" },
    warn:  { color: "var(--status-waiting-fg)", bg: "color-mix(in oklch, var(--status-waiting-fg) 8%, var(--card))", icon: "○" },
    ai:    { color: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 6%, var(--card))", icon: "✨" },
    info:  { color: "var(--chart-3)", bg: "var(--card)", icon: "ℹ" },
    tip:   { color: "var(--muted-foreground)", bg: "var(--card)", icon: "💡" },
    log:   { color: "var(--muted-foreground)", bg: "var(--card)", icon: "·" },
  };
  const t = toneMap[item.kind] || toneMap.info;

  return (
    <button onClick={onClick} disabled={!item.target} style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "12px 14px",
      background: t.bg,
      border: "1px solid var(--border-subtle)",
      borderRadius: 8, textAlign: "left",
      cursor: item.target ? "pointer" : "default",
      transition: "border-color 120ms ease, background 120ms ease",
    }}
    onMouseEnter={(e) => { if (item.target) e.currentTarget.style.borderColor = "var(--border)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}>
      <span style={{
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        background: "color-mix(in oklch, " + t.color + " 12%, transparent)",
        color: t.color, fontSize: 13,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{t.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, color: "var(--foreground)" }}>
          {item.title}
        </div>
        {item.detail && (
          <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.4 }}>{item.detail}</div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        {item.time && (
          <span style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{item.time}</span>
        )}
        {item.actionLabel && item.target && (
          <span style={{
            fontSize: 11, fontWeight: 500, color: t.color,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            {item.actionLabel} →
          </span>
        )}
      </div>
    </button>
  );
};

const InboxSidebar = ({ filter, onFilter, counts }) => {
  const groups = [
    {
      label: "INBOX",
      items: [
        { id: "all",   label: "All",      icon: <IconInbox size={13} />, count: counts.all },
        { id: "alert", label: "Alerts",   color: "var(--destructive)", count: counts.alert },
        { id: "warn",  label: "Warnings", color: "var(--status-waiting-fg)", count: counts.warn },
        { id: "ai",    label: "AI",       icon: <IconSparkles size={13} style={{ color: "var(--primary)" }} />, count: counts.ai },
        { id: "info",  label: "Info",     color: "var(--chart-3)", count: counts.info },
        { id: "tip",   label: "Tips",     color: "var(--muted-foreground)", count: counts.tip },
      ],
    },
  ];

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)",
      display: "flex", flexDirection: "column",
      fontSize: 13.5,
    }}>
      <div style={{
        padding: "10px 12px 8px",
        borderBottom: "1px solid var(--sidebar-border)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: 5,
          background: "color-mix(in oklch, var(--primary) 22%, transparent)",
          color: "var(--primary)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconInbox size={13} />
        </span>
        <span style={{ fontWeight: 600 }}>Inbox</span>
      </div>

      <div style={{ padding: "8px 6px", flex: 1, overflowY: "auto" }} className="fb-scroll">
        {groups.map(g => (
          <div key={g.label} style={{ marginBottom: 8 }}>
            <div style={{
              padding: "6px 10px 4px",
              fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "var(--sidebar-muted)",
            }}>{g.label}</div>
            {g.items.map(it => {
              const on = filter === it.id;
              return (
                <button key={it.id} onClick={() => onFilter(it.id)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "6px 10px", borderRadius: 5,
                  border: "none",
                  background: on ? "var(--active-bg-strong)" : "transparent",
                  color: on ? "var(--foreground)" : "var(--sidebar-foreground, var(--foreground))",
                  cursor: "pointer", textAlign: "left",
                  fontSize: 13, fontWeight: on ? 600 : 400,
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--hover-bg)"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                  {on && <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, background: "var(--primary)", borderRadius: 1 }} />}
                  {it.icon ? it.icon : <span style={{ width: 8, height: 8, borderRadius: "50%", background: it.color, flexShrink: 0 }} />}
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.count > 0 && (
                    <span className="fb-tnum" style={{ fontSize: 10.5, color: "var(--sidebar-muted)" }}>{it.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
};

Object.assign(window, { InboxView, buildInboxItems, InboxSidebar });
