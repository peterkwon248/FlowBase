/* @jsx React.createElement */
// FlowBase — workspace data model: multiple tables with realistic demo data.

// ─────────────────────────────────────────────────────────────
// Companies
// ─────────────────────────────────────────────────────────────

const COMPANIES = [
  { id: "CO-001", name: "Folio",       industry: "Productivity",   tier: "Pro",  website: "folio.io",        people: 4,  created: "2026-02-11" },
  { id: "CO-002", name: "Northbeam",   industry: "E-commerce",     tier: "Free", website: "northbeam.co",    people: 2,  created: "2026-03-02" },
  { id: "CO-003", name: "Indie",       industry: "Solo",           tier: "Free", website: "indie.so",        people: 1,  created: "2026-03-14" },
  { id: "CO-004", name: "Halo Labs",   industry: "AI tooling",     tier: "Pro",  website: "halolabs.ai",     people: 3,  created: "2026-01-22" },
  { id: "CO-005", name: "Cloudpaper",  industry: "Document mgmt",  tier: "Ent",  website: "cloudpaper.com",  people: 5,  created: "2025-11-08" },
  { id: "CO-006", name: "Margin",      industry: "Finance",        tier: "Free", website: "margin.fi",       people: 1,  created: "2026-04-19" },
  { id: "CO-007", name: "Levy",        industry: "HR tech",        tier: "Pro",  website: "levyhq.com",      people: 2,  created: "2026-02-28" },
  { id: "CO-008", name: "Foundry",     industry: "Hardware",       tier: "Free", website: "foundry.build",   people: 2,  created: "2026-03-30" },
  { id: "CO-009", name: "Pleo",        industry: "FinTech",        tier: "Ent",  website: "pleo.io",         people: 6,  created: "2025-09-15" },
  { id: "CO-010", name: "Solo PM",     industry: "Consultancy",    tier: "Free", website: "solopm.dev",      people: 1,  created: "2026-04-04" },
  { id: "CO-011", name: "Drift",       industry: "SaaS",           tier: "Pro",  website: "drift.app",       people: 2,  created: "2026-01-19" },
  { id: "CO-012", name: "Petal",       industry: "E-commerce",     tier: "Free", website: "petal.shop",      people: 1,  created: "2026-05-01" },
];

// ─────────────────────────────────────────────────────────────
// People
// ─────────────────────────────────────────────────────────────

const PEOPLE = [
  { id: "PER-001", name: "민지호",        email: "minji@folio.io",          company_id: "CO-001", role: "Head of CS",     interviews: 3, last_contact: "2026-05-17" },
  { id: "PER-002", name: "Sarah Lim",     email: "sarah@northbeam.co",      company_id: "CO-002", role: "PM",             interviews: 2, last_contact: "2026-05-16" },
  { id: "PER-003", name: "조현우",        email: "hyunwoo.cho@indie.so",    company_id: "CO-003", role: "Founder",        interviews: 1, last_contact: "2026-05-14" },
  { id: "PER-004", name: "Daniel Park",   email: "dpark@halolabs.ai",       company_id: "CO-004", role: "Eng Lead",       interviews: 4, last_contact: "2026-05-13" },
  { id: "PER-005", name: "정유진",        email: "yujin@cloudpaper.com",    company_id: "CO-005", role: "Ops",            interviews: 2, last_contact: "2026-05-13" },
  { id: "PER-006", name: "Aisha K.",      email: "aisha@margin.fi",         company_id: "CO-006", role: "Founder",        interviews: 1, last_contact: "2026-05-12" },
  { id: "PER-007", name: "한승호",        email: "seungho@levyhq.com",      company_id: "CO-007", role: "Designer",       interviews: 2, last_contact: "2026-05-11" },
  { id: "PER-008", name: "Maya R.",       email: "maya@foundry.build",      company_id: "CO-008", role: "Hardware Eng",   interviews: 1, last_contact: "2026-05-10" },
  { id: "PER-009", name: "박서연",        email: "seoyeon@pleo.io",         company_id: "CO-009", role: "Product Lead",   interviews: 3, last_contact: "2026-05-09" },
  { id: "PER-010", name: "Eitan G.",      email: "eitan@solopm.dev",        company_id: "CO-010", role: "Solo PM",        interviews: 1, last_contact: "2026-05-08" },
  { id: "PER-011", name: "Yuna Kim",      email: "yuna@drift.app",          company_id: "CO-011", role: "PM",             interviews: 1, last_contact: "2026-05-15" },
  { id: "PER-012", name: "Lee Junho",     email: "junho@petal.shop",        company_id: "CO-012", role: "Founder",        interviews: 1, last_contact: "2026-05-18" },
  { id: "PER-013", name: "Mira Tan",      email: "mira@forge.tools",        company_id: "CO-004", role: "Researcher",     interviews: 1, last_contact: "2026-05-17" },
];

// ─────────────────────────────────────────────────────────────
// Themes (the dictionary table)
// ─────────────────────────────────────────────────────────────

const THEMES_TABLE = [
  { id: "TH-001", label: "Pricing pushback",      color: "red",    interviews: 14, dominant_sentiment: "Negative", is_ai: true,  created: "2026-04-12" },
  { id: "TH-002", label: "Onboarding friction",   color: "amber",  interviews:  9, dominant_sentiment: "Mixed",    is_ai: true,  created: "2026-04-12" },
  { id: "TH-003", label: "Feature: AI columns",   color: "green",  interviews: 12, dominant_sentiment: "Positive", is_ai: false, created: "2026-04-12" },
  { id: "TH-004", label: "Sheet performance",     color: "amber",  interviews:  7, dominant_sentiment: "Mixed",    is_ai: false, created: "2026-04-15" },
  { id: "TH-005", label: "Sharing & roles",       color: "blue",   interviews:  6, dominant_sentiment: "Mixed",    is_ai: true,  created: "2026-04-20" },
  { id: "TH-006", label: "Other",                 color: "gray",   interviews:  5, dominant_sentiment: "Mixed",    is_ai: false, created: "2026-04-12" },
];

// ─────────────────────────────────────────────────────────────
// Tasks — workflow table; status-driven, has Kanban view
// ─────────────────────────────────────────────────────────────

const TASKS = [
  { id: "TSK-001", title: "Follow up with 민지호 about pricing",        related: "INT-018", assignee: "peter",    status: "progress", priority: "Urgent", due: "2026-05-20", created: "2026-05-17" },
  { id: "TSK-002", title: "Write Pricing FAQ for $39 tier",             related: "INT-018", assignee: "peter",    status: "todo",     priority: "High",   due: "2026-05-24", created: "2026-05-17" },
  { id: "TSK-003", title: "Cut onboarding to 3 steps",                  related: "INT-017", assignee: "minji",    status: "progress", priority: "High",   due: "2026-05-22", created: "2026-05-16" },
  { id: "TSK-004", title: "Add sample data to first-run",               related: "INT-011", assignee: "peter",    status: "done",     priority: "Med",    due: "2026-05-14", created: "2026-05-10" },
  { id: "TSK-005", title: "Profile sheet input lag past 300 rows",      related: "INT-015", assignee: "daniel",   status: "waiting",  priority: "High",   due: "2026-05-23", created: "2026-05-13" },
  { id: "TSK-006", title: "Ship view-only share links",                 related: "INT-014", assignee: "peter",    status: "todo",     priority: "Med",    due: "2026-06-01", created: "2026-05-13" },
  { id: "TSK-007", title: "Reply to Aisha — Notion comparison",         related: "INT-013", assignee: "peter",    status: "todo",     priority: "Med",    due: "2026-05-19", created: "2026-05-12" },
  { id: "TSK-008", title: "Highlight AI column flow in landing",        related: "INT-012", assignee: "minji",    status: "progress", priority: "Med",    due: "2026-05-25", created: "2026-05-11" },
  { id: "TSK-009", title: "Document 3-tier permission model",           related: "INT-010", assignee: "minji",    status: "waiting",  priority: "Med",    due: "2026-05-28", created: "2026-05-09" },
  { id: "TSK-010", title: "Add ⌘+arrow keyboard nav",                   related: "INT-009", assignee: "daniel",   status: "todo",     priority: "Low",    due: "2026-06-05", created: "2026-05-08" },
  { id: "TSK-011", title: "Set up weekly Pricing pushback digest",      related: null,      assignee: "peter",    status: "todo",     priority: "Low",    due: "2026-05-26", created: "2026-05-18" },
  { id: "TSK-012", title: "Audit pending AI Theme cells before launch", related: null,      assignee: "minji",    status: "progress", priority: "High",   due: "2026-05-21", created: "2026-05-16" },
];

// ─────────────────────────────────────────────────────────────
// Helpers — resolve FK label
// ─────────────────────────────────────────────────────────────

function resolveCompany(id) { return COMPANIES.find(c => c.id === id); }
function resolvePerson(id)  { return PEOPLE.find(p => p.id === id); }
function resolveInterview(id) { return INTERVIEWS.find(i => i.id === id); }

// ─────────────────────────────────────────────────────────────
// Column defs per table
// ─────────────────────────────────────────────────────────────

const COLUMNS_BY_TABLE = {
  interviews: [
    { name: "id",        label: "ID",         type: "text",    width: 86,  mono: true },
    { name: "name",      label: "Name",       type: "avatar",  width: 150, subtitleField: "company" },
    { name: "company",   label: "Company",    type: "text",    width: 130 },
    { name: "date",      label: "Date",       type: "date",    width: 110, mono: true },
    { name: "theme",     label: "Theme",      type: "select",  width: 180, ai: true },
    { name: "sentiment", label: "Sentiment",  type: "select",  width: 112, ai: true },
    { name: "votes",     label: "Votes",      type: "reaction",width: 150 },
    { name: "status",    label: "Status",     type: "status",  width: 116 },
    { name: "priority",  label: "Priority",   type: "select",  width: 96 },
    { name: "quote",     label: "Quote",      type: "text",    width: 380 },
    { name: "actions",   label: " ",          type: "button",  width: 130, buttonLabel: "Reclassify", buttonAction: "reclassify" },
  ],
  people: [
    { name: "id",            label: "ID",            type: "text",    width: 86,  mono: true },
    { name: "name",          label: "Name",          type: "avatar",  width: 160, subtitleField: "role" },
    { name: "email",         label: "Email",         type: "email",   width: 200 },
    { name: "company_id",    label: "Company",       type: "fk",      width: 160, fk: "companies" },
    { name: "role",          label: "Role",          type: "text",    width: 140 },
    { name: "interviews",    label: "Interviews",    type: "num",     width: 100 },
    { name: "last_contact",  label: "Last contact",  type: "date",    width: 120, mono: true },
  ],
  companies: [
    { name: "id",       label: "ID",       type: "text",   width: 86,  mono: true },
    { name: "name",     label: "Name",     type: "avatar", width: 180 },
    { name: "industry", label: "Industry", type: "select", width: 140, options: ["Productivity", "E-commerce", "Solo", "AI tooling", "Document mgmt", "Finance", "HR tech", "Hardware", "FinTech", "Consultancy", "SaaS"] },
    { name: "tier",     label: "Tier",     type: "select", width: 96,  options: ["Free", "Pro", "Ent"] },
    { name: "website",  label: "Website",  type: "text",   width: 160 },
    { name: "people",   label: "People",   type: "num",    width: 80 },
    { name: "created",  label: "Created",  type: "date",   width: 110, mono: true },
  ],
  themes: [
    { name: "id",                 label: "ID",                 type: "text",    width: 86,  mono: true },
    { name: "label",              label: "Label",              type: "text",    width: 200 },
    { name: "color",              label: "Color",              type: "select",  width: 96,  options: ["red", "amber", "green", "blue", "violet", "gray"] },
    { name: "interviews",         label: "Interviews",         type: "num",     width: 100 },
    { name: "dominant_sentiment", label: "Dominant sentiment", type: "select",  width: 160, options: ["Positive", "Mixed", "Negative"] },
    { name: "is_ai",              label: "AI-inferred",        type: "select",  width: 110, options: ["true", "false"] },
    { name: "created",            label: "Created",            type: "date",    width: 110, mono: true },
  ],
  tasks: [
    { name: "id",        label: "ID",        type: "text",    width: 86,  mono: true },
    { name: "title",     label: "Title",     type: "text",    width: 320 },
    { name: "related",   label: "Related",   type: "fk",      width: 140, fk: "interviews" },
    { name: "assignee",  label: "Assignee",  type: "avatar",  width: 140 },
    { name: "status",    label: "Status",    type: "status",  width: 116 },
    { name: "priority",  label: "Priority",  type: "select",  width: 96 },
    { name: "due",       label: "Due",       type: "date",    width: 110, mono: true },
    { name: "created",   label: "Created",   type: "date",    width: 110, mono: true },
  ],
};

// ─────────────────────────────────────────────────────────────
// Table definitions (label, icon, capabilities)
// ─────────────────────────────────────────────────────────────

const TABLE_DEFS = {
  interviews: { label: "Interviews", color: "var(--chart-1)", count: 142, kanban: true,  dashboard: true,  hasAi: true,  grid: true,  timeline: false },
  people:     { label: "People",     color: "var(--chart-2)", count: 13,  kanban: false, dashboard: false, hasAi: false, grid: true,  timeline: false },
  companies:  { label: "Companies",  color: "var(--chart-3)", count: 12,  kanban: false, dashboard: false, hasAi: false, grid: true,  timeline: false },
  themes:     { label: "Themes",     color: "var(--chart-4)", count: 6,   kanban: false, dashboard: true,  hasAi: false, grid: true,  timeline: false, dictionary: true },
  tasks:      { label: "Tasks",      color: "var(--chart-5)", count: 12,  kanban: true,  dashboard: true,  hasAi: false, grid: false, timeline: true  },
};

const TABLE_ORDER = ["interviews", "tasks", "people", "companies", "themes"];

// ─────────────────────────────────────────────────────────────
// Wire-up: TABLES / WORKSPACE / initialTablesById expected by prototype-app
// ─────────────────────────────────────────────────────────────

const WORKSPACE = {
  id: "ws-customer-feedback",
  label: "고객 상담 DB",
  initials: "고",
};

const TABLES = TABLE_ORDER.map((id) => ({
  id,
  label:     TABLE_DEFS[id].label,
  colorVar:  TABLE_DEFS[id].color,
  count:     TABLE_DEFS[id].count,
  kanban:    TABLE_DEFS[id].kanban,
  dashboard: TABLE_DEFS[id].dashboard,
  hasAi:     TABLE_DEFS[id].hasAi,
  grid:      TABLE_DEFS[id].grid,
  timeline:  TABLE_DEFS[id].timeline,
}));

const ROWS_BY_TABLE = {
  interviews: () => initialRows(),
  people:     () => PEOPLE,
  companies:  () => COMPANIES,
  themes:     () => THEMES_TABLE,
  tasks:      () => TASKS,
};

function initialTablesById() {
  const out = {};
  TABLE_ORDER.forEach((id) => {
    out[id] = {
      id,
      label: TABLE_DEFS[id].label,
      columns: COLUMNS_BY_TABLE[id],
      rows: ROWS_BY_TABLE[id](),
    };
  });
  return out;
}

// Grid (Gallery) card config — visual per table
const GRID_CARD_CONFIG = {
  tasks: {
    minWidth: 240,
    render: (r) => (
      <React.Fragment>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "var(--muted-foreground)" }}>
          <span style={{ fontFamily: "var(--font-mono)" }}>{r.id}</span>
          {r.priority && <span style={{ opacity: 0.5 }}>·</span>}
          {r.priority && <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>{r.priority}</span>}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, marginTop: 4 }}>{r.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, color: "var(--muted-foreground)" }}>
          {r.assignee && <span>@{r.assignee}</span>}
          <div style={{ flex: 1 }} />
          {r.due && <span style={{ fontFamily: "var(--font-mono)" }}>{r.due}</span>}
        </div>
      </React.Fragment>
    ),
  },
  companies: {
    minWidth: 220,
    render: (r) => (
      <React.Fragment>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 8,
            background: window.hashColor ? window.hashColor(r.name) : "var(--chart-3)",
            color: "white", fontSize: 16, fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>{(r.name || "?").charAt(0)}</span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{r.industry}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 11, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>{r.tier}</span>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{r.people} people</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{r.website}</span>
        </div>
      </React.Fragment>
    ),
  },
  people: {
    minWidth: 220,
    render: (r) => {
      const co = window.resolveCompany?.(r.company_id);
      return (
        <React.Fragment>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 38, height: 38, borderRadius: "50%",
              background: window.hashColor ? window.hashColor(r.name) : "var(--chart-2)",
              color: "white", fontSize: 14, fontWeight: 700,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>{(r.name || "?").charAt(0)}</span>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</span>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{r.role}</span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{co?.name || "—"}</div>
          <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--muted-foreground)", alignItems: "center" }}>
            <span>{r.interviews} interviews</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{r.last_contact}</span>
          </div>
        </React.Fragment>
      );
    },
  },
  themes: {
    minWidth: 200,
    render: (r) => {
      const colorMap = { red: "var(--status-todo-fg)", amber: "var(--status-progress-fg)", green: "var(--status-done-fg)", blue: "var(--chart-1)", violet: "var(--chart-4)", gray: "var(--muted-foreground)" };
      const c = colorMap[r.color] || "var(--muted-foreground)";
      return (
        <React.Fragment>
          <div style={{ width: "100%", height: 70, borderRadius: 6, background: `color-mix(in oklch, ${c} 28%, var(--card))`, position: "relative" }}>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{r.interviews}</span>
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{r.label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted-foreground)" }}>
            <span>{r.dominant_sentiment}</span>
            <div style={{ flex: 1 }} />
            {(r.is_ai === true || r.is_ai === "true") && (
              <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "color-mix(in oklch, var(--primary) 14%, transparent)", color: "var(--primary)" }}>AI</span>
            )}
          </div>
        </React.Fragment>
      );
    },
  },
  interviews: {
    minWidth: 260,
    render: (r) => (
      <React.Fragment>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 26, height: 26, borderRadius: "50%",
            background: window.hashColor ? window.hashColor(r.name) : "var(--chart-1)",
            color: "white", fontSize: 11, fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{(r.name || "?").charAt(0)}</span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{r.company}</span>
          </div>
          <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{r.date}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>"{r.quote}"</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 10.5, fontWeight: 500, background: "color-mix(in oklch, var(--chart-1) 12%, transparent)", color: "var(--chart-1)" }}>{r.theme}</span>
          <span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 10.5, fontWeight: 500, background: "var(--muted)", color: "var(--muted-foreground)" }}>{r.sentiment}</span>
        </div>
      </React.Fragment>
    ),
  },
};

// Kanban card config per table — title/subtitle/badge/date/priority extractors
const KANBAN_CARD_CONFIG = {
  interviews: {
    title:    (r) => `${r.name || ""}${r.company ? " · " + r.company : ""}`.trim() || r.id,
    subtitle: (r) => r.quote || null,
    badge:    (r) => r.theme || null,
    date:     (r) => r.date || null,
    priority: (r) => r.priority,
  },
  tasks: {
    title:    (r) => r.title || r.id,
    subtitle: (r) => r.related ? `Related: ${r.related}` : null,
    badge:    (r) => r.assignee ? `@${r.assignee}` : null,
    date:     (r) => r.due ? `Due ${r.due}` : null,
    priority: (r) => r.priority,
  },
};

// ─────────────────────────────────────────────────────────────
// View support inference — capabilities derived from column types.
// Each view declares its minimum requirements; UI shows greyed pill with hint when not met.
// ─────────────────────────────────────────────────────────────

function inferViewSupport(columns) {
  const types = new Set(columns.map(c => c.type));
  const dateColumns = columns.filter(c => c.type === "date");
  const categoricalColumns = columns.filter(c => ["status", "select", "priority"].includes(c.type));

  // Pick a sensible default date field for timeline
  const preferredDate = dateColumns.find(c => ["due", "date", "start", "deadline"].includes(c.name))
    || dateColumns[0];

  // Pick a sensible default categorical field for board grouping
  const preferredGrouping = columns.find(c => c.type === "status")
    || categoricalColumns[0];

  return {
    sheet: {
      supported: true,
      summary: "Always available",
    },
    kanban: {
      supported: categoricalColumns.length > 0,
      reason:   categoricalColumns.length > 0
                  ? `Group by ${preferredGrouping?.label.trim() || preferredGrouping?.name}`
                  : "Status, Select, or Priority 컬럼 필요",
      hint:     "Add a Status column (e.g. todo/progress/done)",
      groupBy:  preferredGrouping?.name,
    },
    chart: {
      supported: categoricalColumns.length > 0 || types.has("num"),
      reason:   "Aggregate by categorical/numeric columns",
      hint:     "Add a categorical or numeric column",
    },
    grid: {
      supported: true,
      summary: "Card gallery — always available",
    },
    timeline: {
      supported: dateColumns.length > 0,
      reason:   dateColumns.length > 0
                  ? `Plot by ${preferredDate?.label.trim() || preferredDate?.name}`
                  : "Date 타입 컬럼 필요",
      hint:     "Add a Date column",
      dateField: preferredDate?.name,
      dateFieldOptions: dateColumns.map(c => ({ id: c.name, label: c.label.trim() || c.name })),
    },
  };
}

Object.assign(window, {
  COMPANIES, PEOPLE, THEMES_TABLE, TASKS,
  COLUMNS_BY_TABLE, TABLE_DEFS, TABLE_ORDER,
  resolveCompany, resolvePerson, resolveInterview,
  WORKSPACE, TABLES, initialTablesById,
  KANBAN_CARD_CONFIG, GRID_CARD_CONFIG,
  inferViewSupport,
});
