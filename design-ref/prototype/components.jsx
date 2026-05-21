/* @jsx React.createElement */
// FlowBase — shared components: icons, sidebar, header, sheet, AI activity panel

// ─────────────────────────────────────────────────────────────
// ICONS (lucide-style: 24×24 viewBox, fill=none, stroke=currentColor, sw=1.5)
// ─────────────────────────────────────────────────────────────

const Icon = ({ children, size = 16, className = "", style = {} }) =>
  React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      style: { flexShrink: 0, ...style },
    },
    children
  );

const IconChevronDown = (p) => <Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>;
const IconChevronRight = (p) => <Icon {...p}><polyline points="9 18 15 12 9 6"/></Icon>;
const IconChevronLeft = (p) => <Icon {...p}><polyline points="15 18 9 12 15 6"/></Icon>;
const IconPlus = (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;
const IconFilter = (p) => <Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Icon>;
const IconArrowUpDown = (p) => <Icon {...p}><polyline points="7 10 12 5 17 10"/><polyline points="17 14 12 19 7 14"/></Icon>;
const IconMore = (p) => <Icon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icon>;
const IconSparkles = (p) => <Icon {...p}><path d="M12 3l1.6 4.7L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.3L12 3z"/><path d="M19 14l.7 2 2.3.7-2.3.7L19 19.7l-.7-2-2.3-.7 2.3-.7.7-2z"/></Icon>;
const IconTable = (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></Icon>;
const IconKanban = (p) => <Icon {...p}><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="15" rx="1"/></Icon>;
const IconChart = (p) => <Icon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></Icon>;
const IconSchema = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="10" y1="6.5" x2="14" y2="6.5"/><line x1="6.5" y1="10" x2="6.5" y2="14"/></Icon>;
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>;
const IconBox = (p) => <Icon {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Icon>;
const IconLayers = (p) => <Icon {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>;
const IconWiki = (p) => <Icon {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Icon>;
const IconFunction = (p) => <Icon {...p}><path d="M9 17a4 4 0 0 0 4-4V7a4 4 0 0 1 4-4"/><line x1="7" y1="10" x2="15" y2="10"/></Icon>;
const IconDb = (p) => <Icon {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></Icon>;
const IconInbox = (p) => <Icon {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></Icon>;
const IconSheet = (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></Icon>;
const IconSettings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>;
const IconTrash = (p) => <Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></Icon>;
const IconSun = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></Icon>;
const IconMoon = (p) => <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>;
const IconCheck = (p) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>;
const IconX = (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>;
const IconLink = (p) => <Icon {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>;
const IconUpload = (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>;
const IconType = (p) => <Icon {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></Icon>;
const IconHash = (p) => <Icon {...p}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></Icon>;
const IconAt = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></Icon>;
const IconList = (p) => <Icon {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Icon>;
const IconCircleDashed = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" strokeDasharray="3 3"/></Icon>;
const IconCircleHalf = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></Icon>;
const IconCircleClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></Icon>;
const IconCircleCheck = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2"/></Icon>;
const IconSignalHigh = (p) => <Icon {...p}><path d="M2 20h.01M7 20v-4M12 20v-8M17 20v-12"/></Icon>;
const IconSignalMed = (p) => <Icon {...p}><path d="M2 20h.01M7 20v-4M12 20v-8" /><path d="M17 20v-12" opacity="0.25"/></Icon>;
const IconSignalLow = (p) => <Icon {...p}><path d="M2 20h.01M7 20v-4"/><path d="M12 20v-8M17 20v-12" opacity="0.25"/></Icon>;
const IconFlame = (p) => <Icon {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></Icon>;
const IconBolt = (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>;
const IconCommand = (p) => <Icon {...p}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></Icon>;
const IconActivity = (p) => <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>;
const IconUndo = (p) => <Icon {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></Icon>;
const IconBranch = (p) => <Icon {...p}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></Icon>;
const IconFile = (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Icon>;
const IconExternalLink = (p) => <Icon {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></Icon>;

// ─────────────────────────────────────────────────────────────
// Demo data — Customer Interview Log
// ─────────────────────────────────────────────────────────────

const STATUS = {
  todo: { label: "미처리", icon: IconCircleDashed },
  progress: { label: "진행중", icon: IconCircleHalf },
  waiting: { label: "대기", icon: IconCircleClock },
  done: { label: "완료", icon: IconCircleCheck },
};

const PRIORITY = {
  Urgent: { icon: IconFlame, color: "var(--priority-urgent)" },
  High:   { icon: IconSignalHigh, color: "var(--priority-high)" },
  Med:    { icon: IconSignalMed, color: "var(--priority-med)" },
  Low:    { icon: IconSignalLow, color: "var(--priority-low)" },
};

const INTERVIEWS = [
  { id: "INT-018", name: "민지호",   company: "Folio",       date: "2026-05-17", theme: "Pricing pushback",   sentiment: "Negative", status: "todo",     priority: "Urgent", quote: "월 39불은 솔직히 비싸요. 팀 단위면 모를까…", aiTheme: true,  aiSentiment: true },
  { id: "INT-017", name: "Sarah Lim", company: "Northbeam",  date: "2026-05-16", theme: "Onboarding friction",sentiment: "Mixed",    status: "progress", priority: "High",   quote: "처음 5분이 제일 헷갈렸어요. import 어디서 시작하는지…", aiTheme: true, aiSentiment: false },
  { id: "INT-016", name: "조현우",   company: "Indie",        date: "2026-05-14", theme: "Feature: AI columns",sentiment: "Positive", status: "done",     priority: "Med",    quote: "이거 진짜 좋네요. 시트만 던지면 알아서 정리해주는 느낌.", aiTheme: false, aiSentiment: false },
  { id: "INT-015", name: "Daniel Park",company: "Halo Labs",  date: "2026-05-13", theme: "Sheet performance",  sentiment: "Negative", status: "waiting",  priority: "High",   quote: "300줄 넘으면 입력이 살짝 느려져요. 안 보일 만큼은 아닌데.", aiTheme: false, aiSentiment: true },
  { id: "INT-014", name: "정유진",   company: "Cloudpaper",   date: "2026-05-13", theme: "Sharing & roles",    sentiment: "Mixed",    status: "todo",     priority: "Med",    quote: "view-only 링크는 따로 만들 수 있나요?", aiTheme: true, aiSentiment: true },
  { id: "INT-013", name: "Aisha K.",  company: "Margin",      date: "2026-05-12", theme: "Pricing pushback",   sentiment: "Negative", status: "todo",     priority: "Urgent", quote: "Notion이 비슷한 거 무료로 주는데 굳이…", aiTheme: true, aiSentiment: false },
  { id: "INT-012", name: "한승호",   company: "Levy",         date: "2026-05-11", theme: "Feature: AI columns",sentiment: "Positive", status: "progress", priority: "Med",    quote: "AI 추천 카드 좋아요. 자동 적용 아니라서 더 좋아요.", aiTheme: false, aiSentiment: false },
  { id: "INT-011", name: "Maya R.",   company: "Foundry",     date: "2026-05-10", theme: "Onboarding friction",sentiment: "Mixed",    status: "done",     priority: "Low",    quote: "샘플 데이터 있으면 빠를 듯.", aiTheme: false, aiSentiment: false },
  { id: "INT-010", name: "박서연",   company: "Pleo",         date: "2026-05-09", theme: "Sharing & roles",    sentiment: "Positive", status: "waiting",  priority: "Med",    quote: "권한 모델 단순해서 좋아요. 3단계면 충분.", aiTheme: true, aiSentiment: true },
  { id: "INT-009", name: "Eitan G.",  company: "Solo PM",     date: "2026-05-08", theme: "Sheet performance",  sentiment: "Mixed",    status: "todo",     priority: "Low",    quote: "키보드 단축키만 좀 더 있으면 완벽.", aiTheme: false, aiSentiment: false },
];

const AI_TIMELINE = [
  { id: 1, kind: "infer", title: "Inferred 14 cells in Theme",           detail: "Free-text → 5 categories", time: "2m ago", status: "pending", count: 14 },
  { id: 2, kind: "infer", title: "Inferred 12 cells in Sentiment",       detail: "Quote → Positive/Mixed/Negative", time: "2m ago", status: "pending", count: 12 },
  { id: 3, kind: "schema", title: "Suggested column: Action item",       detail: "Detected to-do language in 6 quotes", time: "5m ago", status: "pending" },
  { id: 4, kind: "import", title: "Imported from Google Sheets",          detail: "“Customer Interviews” · 10 rows · 8 columns", time: "8m ago", status: "applied" },
  { id: 5, kind: "schema", title: "Renamed “col_3” → “Company”",          detail: "Header row pattern", time: "8m ago", status: "applied" },
  { id: 6, kind: "schema", title: "Set type: “date” → datetime",          detail: "ISO date pattern detected", time: "8m ago", status: "applied" },
];

// ─────────────────────────────────────────────────────────────
// Reusable UI atoms
// ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status, withIcon = true, size = "sm" }) => {
  const s = STATUS[status];
  if (!s) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 8px", borderRadius: 999,
        background: "var(--muted)", color: "var(--muted-foreground)",
        fontSize: size === "lg" ? 13 : 11.5, fontWeight: 500,
      }}>
        <span style={{ opacity: 0.6 }}>—</span>
      </span>
    );
  }
  const Glyph = s.icon;
  const tone = status;
  return (
    <span className="fb-status" data-tone={tone} style={size === "lg" ? { padding: "4px 10px", fontSize: 13 } : null}>
      {withIcon ? <Glyph size={size === "lg" ? 14 : 12} /> : <span className="fb-status-dot" />}
      <span>{s.label}</span>
    </span>
  );
};

const PriorityCell = ({ priority }) => {
  const p = PRIORITY[priority];
  if (!p) return null;
  const Glyph = p.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: p.color, fontSize: 12.5 }}>
      <Glyph size={14} />
      <span style={{ color: "var(--muted-foreground)" }}>{priority}</span>
    </span>
  );
};

const FieldTypeGlyph = ({ type }) => {
  const map = { text: IconType, num: IconHash, date: IconCalendar, email: IconAt, select: IconList, status: IconCircleHalf };
  const G = map[type] || IconType;
  return <G size={12} style={{ color: "var(--muted-foreground)" }} />;
};

// ─────────────────────────────────────────────────────────────
// Activity Bar (44px left rail) — Linear/Plot style
// ─────────────────────────────────────────────────────────────

const ActivityBar = ({ active = "data" }) => {
  const items = [
    { id: "inbox",   Glyph: IconInbox },
    { id: "data",    Glyph: IconDb },
    { id: "wiki",    Glyph: IconFile },
    { id: "search",  Glyph: IconSearch },
  ];
  return (
    <div style={{
      width: 44, flexShrink: 0,
      background: "var(--background)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "10px 0", gap: 4,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: "linear-gradient(140deg, var(--primary), color-mix(in oklch, var(--primary) 65%, white))",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: 700, fontSize: 13, letterSpacing: "-0.02em",
        marginBottom: 6,
      }}>F</div>
      {items.map(({ id, Glyph }) => (
        <button key={id} style={{
          width: 32, height: 32, border: "none", background: id === active ? "var(--active-bg-strong)" : "transparent",
          borderRadius: 6, color: id === active ? "var(--foreground)" : "var(--sidebar-muted)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          transition: "background 120ms ease, color 120ms ease",
        }}>
          <Glyph size={18} />
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button style={{ width: 32, height: 32, border: "none", background: "transparent", borderRadius: 6, color: "var(--sidebar-muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <IconSettings size={18} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Sidebar (~240px) with workspace + table list
// ─────────────────────────────────────────────────────────────

const Sidebar = ({ width = 240, density = "default" }) => {
  const tables = [
    { id: "interviews",   label: "Customer Interviews",  count: 142, active: true, color: "var(--chart-1)" },
    { id: "feedback",     label: "Product Feedback",     count:  87, color: "var(--chart-2)" },
    { id: "personas",     label: "Personas",             count:  12, color: "var(--chart-3)" },
    { id: "competitors",  label: "Competitor Notes",     count:  24, color: "var(--chart-4)" },
    { id: "launch_q3",    label: "Q3 Launch Tasks",      count:  56, color: "var(--chart-5)" },
  ];

  const rowPy = density === "compact" ? 4 : density === "comfortable" ? 8 : 6;

  return (
    <aside style={{
      width, flexShrink: 0,
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)",
      display: "flex", flexDirection: "column",
      fontSize: 13.5,
    }}>
      {/* Workspace switcher */}
      <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <button style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "6px 8px", borderRadius: 6, border: "none",
          background: "transparent", cursor: "pointer", color: "var(--sidebar-active-text)",
        }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--primary)", color: "white", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>P</span>
          <span style={{ fontWeight: 600, flex: 1, textAlign: "left" }}>peter's workspace</span>
          <IconChevronDown size={14} style={{ color: "var(--sidebar-muted)" }} />
        </button>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 9px", borderRadius: 6, border: "none",
          background: "var(--primary)", color: "var(--primary-foreground)",
          fontSize: 13, fontWeight: 500, cursor: "pointer", justifyContent: "flex-start",
        }}>
          <IconPlus size={14} /><span>New board</span>
        </button>
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 9px", borderRadius: 6, border: "1px solid var(--border)",
          background: "transparent", color: "var(--sidebar-foreground)",
          fontSize: 13, cursor: "pointer", justifyContent: "flex-start",
        }}>
          <IconUpload size={14} /><span>Import data</span>
        </button>
      </div>

      {/* Section: Boards */}
      <div style={{ padding: "10px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sidebar-muted)" }}>Boards</span>
        <button style={{ background: "transparent", border: "none", color: "var(--sidebar-muted)", cursor: "pointer", display: "flex", padding: 2 }}>
          <IconPlus size={12} />
        </button>
      </div>
      <nav style={{ padding: "0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
        {tables.map((t) => (
          <button key={t.id} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: `${rowPy}px 8px`, borderRadius: 5, border: "none",
            background: t.active ? "var(--sidebar-active)" : "transparent",
            color: t.active ? "var(--sidebar-active-text)" : "var(--sidebar-foreground)",
            fontWeight: t.active ? 600 : 400,
            cursor: "pointer", textAlign: "left", fontSize: 13.5,
            position: "relative",
          }}>
            {t.active && <span style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 2, background: "var(--primary)", borderRadius: 1 }} />}
            <IconSheet size={14} style={{ color: t.active ? "var(--primary)" : "var(--sidebar-muted)" }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
            <span className="fb-tnum" style={{ fontSize: 11, color: "var(--sidebar-muted)" }}>{t.count}</span>
          </button>
        ))}
      </nav>

      <div style={{ padding: "16px 14px 4px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sidebar-muted)" }}>Pinned views</span>
      </div>
      <nav style={{ padding: "0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
        {[
          { label: "Pricing pushback",   color: "var(--status-todo-fg)" },
          { label: "By sentiment",       color: "var(--chart-4)" },
          { label: "This week",          color: "var(--chart-3)" },
        ].map((v) => (
          <button key={v.label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: `${rowPy}px 8px`, borderRadius: 5, border: "none",
            background: "transparent", color: "var(--sidebar-foreground)",
            cursor: "pointer", textAlign: "left", fontSize: 13.5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.color }} />
            <span style={{ flex: 1 }}>{v.label}</span>
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{ padding: "8px 10px", borderTop: "1px solid var(--sidebar-border)", display: "flex", alignItems: "center", gap: 4 }}>
        <button style={{ background: "transparent", border: "none", color: "var(--sidebar-muted)", padding: 6, borderRadius: 5, cursor: "pointer", display: "flex" }}><IconTrash size={15} /></button>
        <button style={{ background: "transparent", border: "none", color: "var(--sidebar-muted)", padding: 6, borderRadius: 5, cursor: "pointer", display: "flex" }}><IconSettings size={15} /></button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--sidebar-muted)" }}>2.1 GB / 10 GB</span>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────
// View Switcher (segmented chips, style 1)
// ─────────────────────────────────────────────────────────────

const ViewSwitcher = ({ active = "sheet", compact = false }) => {
  const views = [
    { id: "sheet",    label: "Sheet",    Glyph: IconSheet },
    { id: "table",    label: "Table",    Glyph: IconTable },
    { id: "kanban",   label: "Kanban",   Glyph: IconKanban },
    { id: "chart",    label: "Chart",    Glyph: IconChart },
    { id: "schema",   label: "Schema",   Glyph: IconSchema },
  ];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: 2, background: "var(--muted)", borderRadius: 7, border: "1px solid var(--border-subtle)" }}>
      {views.map((v) => {
        const on = v.id === active;
        return (
          <button key={v.id} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: compact ? "3px 8px" : "4px 10px",
            borderRadius: 5, border: "none",
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

// Expose
Object.assign(window, {
  Icon, IconChevronDown, IconChevronRight, IconChevronLeft, IconPlus, IconSearch, IconFilter,
  IconArrowUpDown, IconMore, IconSparkles, IconTable, IconKanban, IconChart, IconSchema,
  IconCalendar, IconBox, IconLayers, IconWiki, IconFunction, IconDb, IconInbox, IconSheet, IconSettings, IconTrash, IconSun, IconMoon,
  IconCheck, IconX, IconLink, IconUpload, IconType, IconHash, IconAt, IconList,
  IconCircleDashed, IconCircleHalf, IconCircleClock, IconCircleCheck,
  IconSignalHigh, IconSignalMed, IconSignalLow, IconFlame, IconBolt, IconCommand,
  IconActivity, IconUndo, IconBranch, IconFile, IconExternalLink,
  STATUS, PRIORITY, INTERVIEWS, AI_TIMELINE,
  StatusBadge, PriorityCell, FieldTypeGlyph,
  ActivityBar, Sidebar, ViewSwitcher,
});
