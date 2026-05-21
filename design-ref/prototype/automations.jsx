/* @jsx React.createElement */
// FlowBase — Automations: cross-table workflow rules + AI-suggested automations.

const { useState: useAS } = React;

// ─────────────────────────────────────────────────────────────
// Demo data
// ─────────────────────────────────────────────────────────────

const AUTOMATION_RULES = [
  {
    id: "AUT-001",
    name: "Negative interviews → urgent task",
    when:  { table: "interviews", event: "row added or sentiment changes to", value: "Negative" },
    then:  [
      { action: "Add row to", target: "Tasks", detail: 'title: "Follow up with {name}", priority: Urgent' },
      { action: "Notify",     target: "@peter" },
    ],
    status: "active",
    aiSuggested: true,
    runsThisWeek: 4,
    lastRun: "2 hours ago",
  },
  {
    id: "AUT-002",
    name: "Theme=Pricing → assign to sales",
    when:  { table: "interviews", event: "AI Theme confirmed as", value: "Pricing pushback" },
    then:  [
      { action: "Set", target: "priority", detail: "High" },
      { action: "Notify",  target: "#sales-leads" },
    ],
    status: "active",
    aiSuggested: false,
    runsThisWeek: 7,
    lastRun: "20 min ago",
  },
  {
    id: "AUT-003",
    name: "Daily summary at 9am",
    when:  { table: "—", event: "every day at", value: "09:00 KST" },
    then:  [
      { action: "Generate", target: "AI digest", detail: "yesterday's interviews by sentiment + theme" },
      { action: "Email to", target: "peter@flowbase.app" },
    ],
    status: "active",
    aiSuggested: false,
    runsThisWeek: 7,
    lastRun: "Today 09:00",
  },
  {
    id: "AUT-004",
    name: "Overdue task → 대기",
    when:  { table: "tasks", event: "due date passes and status is", value: "진행중" },
    then:  [
      { action: "Set status", target: "tasks", detail: "대기" },
      { action: "Notify",     target: "{assignee}" },
    ],
    status: "paused",
    aiSuggested: false,
    runsThisWeek: 0,
    lastRun: "5 days ago",
  },
  {
    id: "AUT-005",
    name: "Archive completed after 30 days",
    when:  { table: "interviews", event: "status=완료 for", value: "30 days" },
    then:  [{ action: "Archive row", target: "interviews" }],
    status: "draft",
    aiSuggested: false,
    runsThisWeek: 0,
    lastRun: "never",
  },
];

const AUTOMATIONS_SUGGESTED = [
  {
    id: "SUG-001",
    summary: "Auto-create weekly Pricing pushback digest",
    detail: "You've had 5 Pricing pushback interviews this week — Claude can generate a Monday digest and add it as a new row in your Notes table.",
    confidence: 0.86,
  },
  {
    id: "SUG-002",
    summary: "Auto-flag tasks stuck in 진행중 14+ days",
    detail: "3 tasks have been in 진행중 for over 2 weeks. Move them to 대기 with a comment summarizing what's blocking?",
    confidence: 0.73,
  },
  {
    id: "SUG-003",
    summary: "Slack ping on Negative + Urgent",
    detail: "When sentiment=Negative AND priority=Urgent, post the row to your Slack channel for live triage.",
    confidence: 0.91,
  },
];

// ─────────────────────────────────────────────────────────────
// Rule card
// ─────────────────────────────────────────────────────────────

const RuleCard = ({ rule, onToggle, onEdit }) => {
  const tone = {
    active:  { bg: "var(--status-done-bg)",     fg: "var(--status-done-fg)",     dot: "var(--status-done-fg)",   label: "Active" },
    paused:  { bg: "var(--status-waiting-bg)",  fg: "var(--status-waiting-fg)",  dot: "var(--status-waiting-fg)", label: "Paused" },
    draft:   { bg: "var(--muted)",              fg: "var(--muted-foreground)",   dot: "var(--muted-foreground)", label: "Draft" },
  }[rule.status];

  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: 16,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone.dot }} />
        <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>{rule.name}</span>
        {rule.aiSuggested && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3,
            background: "color-mix(in oklch, var(--primary) 14%, transparent)",
            color: "var(--primary)",
            display: "inline-flex", alignItems: "center", gap: 3,
          }}>
            <IconSparkles size={9} />AI built
          </span>
        )}
        <span style={{
          fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 3,
          background: tone.bg, color: tone.fg,
        }}>{tone.label}</span>
        <button onClick={() => onToggle(rule.id)} style={{
          width: 30, height: 18, borderRadius: 10,
          background: rule.status === "active" ? "var(--primary)" : "var(--muted)",
          border: "none", padding: 2, cursor: "pointer",
          display: "flex", alignItems: "center",
          justifyContent: rule.status === "active" ? "flex-end" : "flex-start",
          transition: "all 160ms ease",
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: "50%",
            background: "white", boxShadow: "0 1px 2px rgba(0,0,0,.3)",
          }} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <RulePart kind="when" rule={rule.when} />
        {rule.then.map((step, i) => (
          <RulePart key={i} kind="then" step={step} />
        ))}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        paddingTop: 4, borderTop: "1px solid var(--border-subtle)",
        fontSize: 11.5, color: "var(--muted-foreground)",
      }}>
        <span>Runs this week: <b className="fb-tnum" style={{ fontWeight: 600, color: "var(--foreground)" }}>{rule.runsThisWeek}</b></span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Last run: {rule.lastRun}</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => onEdit?.(rule.id)} style={{
          background: "transparent", border: "none", color: "var(--muted-foreground)",
          fontSize: 11.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0,
        }}>
          <IconBranch size={11} />Edit
        </button>
      </div>
    </div>
  );
};

const RulePart = ({ kind, rule, step }) => {
  const isWhen = kind === "when";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "8px 12px", borderRadius: 7,
      background: isWhen ? "color-mix(in oklch, var(--chart-1) 6%, var(--background))" : "color-mix(in oklch, var(--chart-2) 6%, var(--background))",
      border: "1px solid " + (isWhen ? "color-mix(in oklch, var(--chart-1) 22%, var(--border))" : "color-mix(in oklch, var(--chart-2) 22%, var(--border))"),
      fontSize: 12.5,
    }}>
      <span style={{
        fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        padding: "1px 5px", borderRadius: 3,
        background: isWhen ? "var(--chart-1)" : "var(--chart-2)",
        color: "white",
        marginTop: 1,
      }}>{isWhen ? "When" : "Then"}</span>
      {isWhen ? (
        <span style={{ flex: 1, lineHeight: 1.55 }}>
          {rule.table !== "—" && <code style={codeStyle}>{rule.table}</code>}{rule.table !== "—" && " · "}
          <span>{rule.event}</span> <code style={codeStyle}>{rule.value}</code>
        </span>
      ) : (
        <span style={{ flex: 1, lineHeight: 1.55 }}>
          <span style={{ fontWeight: 500 }}>{step.action}</span> <code style={codeStyle}>{step.target}</code>
          {step.detail && <><br/><span style={{ color: "var(--muted-foreground)", fontSize: 11.5 }}>{step.detail}</span></>}
        </span>
      )}
    </div>
  );
};

const codeStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: 11.5,
  padding: "1px 5px",
  borderRadius: 3,
  background: "var(--muted)",
  color: "var(--foreground)",
  fontWeight: 500,
};

// ─────────────────────────────────────────────────────────────
// AI suggestion card
// ─────────────────────────────────────────────────────────────

const SuggestionCard = ({ s, onAccept, onDismiss }) => (
  <div style={{
    padding: 14, borderRadius: 9,
    background: "var(--card)",
    border: "1px solid color-mix(in oklch, var(--primary) 30%, var(--border))",
    display: "flex", flexDirection: "column", gap: 9,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <IconSparkles size={13} style={{ color: "var(--primary)" }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, flex: 1 }}>{s.summary}</span>
      <span style={{
        fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 3,
        background: "color-mix(in oklch, var(--primary) 14%, transparent)",
        color: "var(--primary)",
        fontVariantNumeric: "tabular-nums",
      }}>{Math.round(s.confidence * 100)}%</span>
    </div>
    <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55 }}>{s.detail}</div>
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={() => onAccept(s.id)} style={{
        padding: "4px 10px", borderRadius: 5,
        background: "var(--primary)", color: "var(--primary-foreground)",
        border: "1px solid var(--primary)", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        <IconCheck size={11} />Build automation
      </button>
      <button onClick={() => onDismiss(s.id)} style={{
        padding: "4px 10px", borderRadius: 5,
        background: "transparent", color: "var(--muted-foreground)",
        border: "1px solid var(--border)", fontSize: 11.5, cursor: "pointer",
      }}>Dismiss</button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────

const AutomationsView = () => {
  const [rules, setRules] = useAS(AUTOMATION_RULES);
  const [suggestions, setSuggestions] = useAS(AUTOMATIONS_SUGGESTED);
  const [tab, setTab] = useAS("all");

  const toggleRule = (id) => setRules(rs => rs.map(r =>
    r.id === id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r
  ));
  const acceptSuggestion = (id) => {
    const s = suggestions.find(x => x.id === id);
    setSuggestions(ss => ss.filter(x => x.id !== id));
    setRules(rs => [...rs, {
      id: "AUT-" + String(rs.length + 1).padStart(3, "0"),
      name: s.summary,
      when: { table: "—", event: "AI-built rule", value: "" },
      then: [{ action: "Configure", target: "this rule", detail: "Click Edit to set the trigger and actions" }],
      status: "draft",
      aiSuggested: true,
      runsThisWeek: 0,
      lastRun: "never",
    }]);
  };
  const dismissSuggestion = (id) => setSuggestions(ss => ss.filter(x => x.id !== id));

  const counts = {
    all:    rules.length,
    active: rules.filter(r => r.status === "active").length,
    paused: rules.filter(r => r.status === "paused").length,
    draft:  rules.filter(r => r.status === "draft").length,
  };
  const filteredRules = tab === "all" ? rules : rules.filter(r => r.status === tab);

  return (
    <div className="fb-scroll" style={{
      flex: 1, overflow: "auto",
      background: "var(--background)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 7,
            background: "color-mix(in oklch, var(--chart-2) 18%, var(--background))",
            color: "var(--chart-2)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconBolt size={15} />
          </span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Automations</h1>
          <div style={{ flex: 1 }} />
          <button style={{
            padding: "5px 11px", borderRadius: 6, border: "1px solid var(--border)",
            background: "var(--card)", color: "var(--muted-foreground)",
            fontSize: 12, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <IconSparkles size={11} style={{ color: "var(--primary)" }} />Ask AI to build a rule
          </button>
          <button style={{
            padding: "5px 13px", borderRadius: 6, border: "1px solid var(--primary)",
            background: "var(--primary)", color: "var(--primary-foreground)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <IconPlus size={11} />New rule
          </button>
        </div>
        <p style={{
          margin: "4px 0 0 38px",
          fontSize: 13.5, lineHeight: 1.55, color: "var(--muted-foreground)",
          maxWidth: 720,
        }}>
          Cross-table rules — every time data changes, FlowBase runs your automations.
          Add new ones manually, or accept AI suggestions below.
        </p>
      </div>

      {/* AI suggestions banner */}
      {suggestions.length > 0 && (
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{
            padding: 14, borderRadius: 10,
            background: "color-mix(in oklch, var(--primary) 5%, var(--card))",
            border: "1px solid color-mix(in oklch, var(--primary) 22%, var(--border))",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <IconSparkles size={14} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>AI suggestions</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
                background: "color-mix(in oklch, var(--primary) 18%, transparent)",
                color: "var(--primary)",
              }}>{suggestions.length} pending</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>Based on the last 7 days of activity</span>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 10,
            }}>
              {suggestions.map((s) => (
                <SuggestionCard key={s.id} s={s} onAccept={acceptSuggestion} onDismiss={dismissSuggestion} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        padding: "0 24px", borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 2, height: 36,
      }}>
        {["all", "active", "paused", "draft"].map((t) => {
          const on = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "0 10px", height: 36, border: "none",
              background: "transparent",
              color: on ? "var(--foreground)" : "var(--muted-foreground)",
              fontSize: 12.5, fontWeight: on ? 600 : 500,
              cursor: "pointer", textTransform: "capitalize",
              borderBottom: on ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -1,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <span>{t}</span>
              <span className="fb-tnum" style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>{counts[t]}</span>
            </button>
          );
        })}
      </div>

      {/* Rules list */}
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, maxWidth: 880 }}>
        {filteredRules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} />
        ))}
        {filteredRules.length === 0 && (
          <div style={{
            padding: 32, textAlign: "center", borderRadius: 10,
            background: "var(--card)", border: "1px dashed var(--border)",
            color: "var(--muted-foreground)", fontSize: 13,
          }}>
            No {tab} rules yet.
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { AutomationsView, RuleCard, SuggestionCard, AUTOMATION_RULES, AUTOMATIONS_SUGGESTED });
