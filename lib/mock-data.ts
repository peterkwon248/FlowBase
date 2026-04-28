// FlowDB mock data — single source of truth for design / data / operations sections.
// Source: claude_design/app.jsx (SCHEMA, RELATIONS, CUSTOMERS, TICKETS, AGENTS, NOTES, SUGGESTIONS).
// Indigo/amber/emerald/slate -> chart-1/2/3/4. Tone tokens map to FlowDB semantic colors.

export type ChartColor = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"

export type Tone =
  | ChartColor
  | "destructive"
  | "primary"
  | "warning"
  | "success"
  | "muted"

export type FieldType =
  | "uuid"
  | "string"
  | "email"
  | "phone"
  | "text"
  | "number"
  | "datetime"
  | "select"
  | "status"
  | "fk"

export interface Field {
  name: string
  type: FieldType
  pk?: boolean
  required?: boolean
  ref?: string
  enum?: string[]
}

export interface TableNode {
  id: string
  label: string
  en: string
  x: number
  y: number
  color: ChartColor
  fields: Field[]
}

export type Cardinality = "1:1" | "1:N" | "M:N"

export interface Relation {
  id: string
  from: string
  to: string
  cardinality: Cardinality
  label: string
}

export type TicketStatus = "미처리" | "진행중" | "대기" | "완료"
export type TicketPriority = "Low" | "Med" | "High" | "Urgent"
export type CustomerTier = "Free" | "Pro" | "Enterprise"
export type AgentTeam = "Inbound" | "VIP" | "Tech"
export type TicketChannel = "Email" | "Chat" | "Phone"

export interface Customer {
  id: string
  name: string
  company: string
  email: string
  tier: CustomerTier
  created_at: string
}

export interface Ticket {
  id: string
  customer_id: string
  subject: string
  channel: TicketChannel
  status: TicketStatus
  priority: TicketPriority
  assignee_id: string | null
  opened_at: string
  closed_at?: string
}

export interface Agent {
  id: string
  name: string
  email?: string
  team: AgentTeam
  load: number
}

export interface Note {
  id: string
  ticket_id: string
  author_id: string
  body: string
  created_at: string
}

export const SCHEMA: TableNode[] = [
  {
    id: "customers",
    label: "고객",
    en: "Customer",
    x: 60,
    y: 80,
    color: "chart-1",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "name", type: "string", required: true },
      { name: "company", type: "string" },
      { name: "email", type: "email" },
      { name: "phone", type: "phone" },
      { name: "tier", type: "select", enum: ["Free", "Pro", "Enterprise"] },
      { name: "created_at", type: "datetime" },
    ],
  },
  {
    id: "tickets",
    label: "상담",
    en: "Ticket",
    x: 460,
    y: 60,
    color: "chart-2",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "customer_id", type: "fk", ref: "customers" },
      { name: "subject", type: "string", required: true },
      { name: "channel", type: "select", enum: ["Email", "Chat", "Phone"] },
      {
        name: "status",
        type: "status",
        enum: ["미처리", "진행중", "대기", "완료"],
      },
      {
        name: "priority",
        type: "select",
        enum: ["Low", "Med", "High", "Urgent"],
      },
      { name: "assignee_id", type: "fk", ref: "agents" },
      { name: "opened_at", type: "datetime" },
      { name: "closed_at", type: "datetime" },
    ],
  },
  {
    id: "agents",
    label: "담당자",
    en: "Agent",
    x: 860,
    y: 60,
    color: "chart-3",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "name", type: "string", required: true },
      { name: "email", type: "email" },
      { name: "team", type: "select", enum: ["Inbound", "VIP", "Tech"] },
      { name: "load", type: "number" },
    ],
  },
  {
    id: "notes",
    label: "메모",
    en: "Note",
    x: 460,
    y: 360,
    color: "chart-4",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "ticket_id", type: "fk", ref: "tickets" },
      { name: "author_id", type: "fk", ref: "agents" },
      { name: "body", type: "text" },
      { name: "created_at", type: "datetime" },
    ],
  },
]

export const RELATIONS: Relation[] = [
  { id: "r-cust-tk", from: "customers", to: "tickets", cardinality: "1:N", label: "customer_id" },
  { id: "r-agent-tk", from: "agents", to: "tickets", cardinality: "1:N", label: "assignee_id" },
  { id: "r-tk-note", from: "tickets", to: "notes", cardinality: "1:N", label: "ticket_id" },
]

export const CUSTOMERS: Customer[] = [
  { id: "C-1041", name: "김민수", company: "브릭하우스", email: "minsu@brick.kr", tier: "Enterprise", created_at: "2026-02-14" },
  { id: "C-1042", name: "이서연", company: "랜턴랩", email: "seoyeon@lantern.io", tier: "Pro", created_at: "2026-03-02" },
  { id: "C-1043", name: "박지훈", company: "오프라인스튜디오", email: "jihoon@offline.co", tier: "Pro", created_at: "2026-03-08" },
  { id: "C-1044", name: "최예린", company: "코코넛", email: "yerin@coconut.kr", tier: "Free", created_at: "2026-03-19" },
  { id: "C-1045", name: "정도윤", company: "소금공장", email: "doyoon@salt.kr", tier: "Enterprise", created_at: "2026-04-01" },
  { id: "C-1046", name: "한가람", company: "플레인페이퍼", email: "garam@plain.kr", tier: "Pro", created_at: "2026-04-09" },
  { id: "C-1047", name: "조은비", company: "스몰웨이브", email: "eunbi@smallwave.io", tier: "Free", created_at: "2026-04-12" },
  { id: "C-1048", name: "윤재희", company: "버터필드", email: "jaehee@butter.kr", tier: "Pro", created_at: "2026-04-21" },
]

export const TICKETS: Ticket[] = [
  { id: "T-2207", customer_id: "C-1041", subject: "청구서 PDF 다운로드 안 됨", channel: "Email", status: "미처리", priority: "High", assignee_id: null, opened_at: "2026-04-26 09:14" },
  { id: "T-2208", customer_id: "C-1042", subject: "API 토큰 재발급 요청", channel: "Email", status: "진행중", priority: "Med", assignee_id: "A-03", opened_at: "2026-04-26 10:02" },
  { id: "T-2209", customer_id: "C-1043", subject: "SSO 도입 문의 (Okta)", channel: "Chat", status: "진행중", priority: "High", assignee_id: "A-01", opened_at: "2026-04-26 11:30" },
  { id: "T-2210", customer_id: "C-1044", subject: "결제 실패 — 카드사 거절", channel: "Phone", status: "미처리", priority: "Urgent", assignee_id: null, opened_at: "2026-04-27 08:41" },
  { id: "T-2211", customer_id: "C-1045", subject: "대량 데이터 임포트 시 타임아웃", channel: "Email", status: "대기", priority: "Med", assignee_id: "A-02", opened_at: "2026-04-27 09:55" },
  { id: "T-2212", customer_id: "C-1046", subject: "로그인 2단계 인증 해제 요청", channel: "Email", status: "완료", priority: "Low", assignee_id: "A-03", opened_at: "2026-04-25 16:20", closed_at: "2026-04-26 11:00" },
  { id: "T-2213", customer_id: "C-1047", subject: "모바일 앱에서 알림 수신 안 됨", channel: "Chat", status: "미처리", priority: "Med", assignee_id: null, opened_at: "2026-04-27 13:08" },
  { id: "T-2214", customer_id: "C-1048", subject: "계정 권한 분리(Owner/Admin)", channel: "Email", status: "진행중", priority: "Med", assignee_id: "A-01", opened_at: "2026-04-27 14:22" },
  { id: "T-2215", customer_id: "C-1041", subject: "엔터프라이즈 SLA 문서 요청", channel: "Email", status: "대기", priority: "Low", assignee_id: "A-02", opened_at: "2026-04-27 15:40" },
  { id: "T-2216", customer_id: "C-1043", subject: "워크스페이스 도메인 변경", channel: "Email", status: "미처리", priority: "Med", assignee_id: null, opened_at: "2026-04-28 08:02" },
  { id: "T-2217", customer_id: "C-1045", subject: "청구 주기 월→분기 변경", channel: "Email", status: "진행중", priority: "Low", assignee_id: "A-03", opened_at: "2026-04-28 08:30" },
  { id: "T-2218", customer_id: "C-1042", subject: "Webhook 이벤트 누락 (1.2%)", channel: "Email", status: "미처리", priority: "High", assignee_id: null, opened_at: "2026-04-28 09:11" },
  { id: "T-2219", customer_id: "C-1046", subject: "결제 영수증 사업자번호 누락", channel: "Email", status: "완료", priority: "Low", assignee_id: "A-02", opened_at: "2026-04-25 11:00", closed_at: "2026-04-25 12:30" },
]

export const AGENTS: Agent[] = [
  { id: "A-01", name: "강해린", email: "haerin@flowdb.kr", team: "VIP", load: 4 },
  { id: "A-02", name: "오민지", email: "minji@flowdb.kr", team: "Inbound", load: 6 },
  { id: "A-03", name: "신유진", email: "yujin@flowdb.kr", team: "Tech", load: 5 },
]

export const NOTES: Note[] = [
  { id: "N-501", ticket_id: "T-2208", author_id: "A-03", body: "토큰 재발급 정책 확인 후 회신 예정. 보안 팀 컨펌 대기.", created_at: "2026-04-26 10:30" },
  { id: "N-502", ticket_id: "T-2209", author_id: "A-01", body: "Okta 메타데이터 받아서 SAML 연동 테스트 진행 중.", created_at: "2026-04-26 12:10" },
  { id: "N-503", ticket_id: "T-2211", author_id: "A-02", body: "청크 단위 업로드로 우회 가이드 발송. 라이브러리 패치 검토.", created_at: "2026-04-27 10:45" },
  { id: "N-504", ticket_id: "T-2214", author_id: "A-01", body: "Owner 권한 정책 초안 작성, 법무 검토 후 적용.", created_at: "2026-04-27 16:00" },
  { id: "N-505", ticket_id: "T-2217", author_id: "A-03", body: "청구 주기 변경 영향 범위 확인 — 기존 약정 반영 필요.", created_at: "2026-04-28 09:00" },
]

export const STATUSES: TicketStatus[] = ["미처리", "진행중", "대기", "완료"]
export const PRIORITIES: TicketPriority[] = ["Low", "Med", "High", "Urgent"]

export const STATUS_TONE: Record<TicketStatus, Tone> = {
  "미처리": "destructive",
  "진행중": "primary",
  "대기": "warning",
  "완료": "success",
}

export const PRIORITY_TONE: Record<TicketPriority, Tone> = {
  Urgent: "destructive",
  High: "warning",
  Med: "primary",
  Low: "muted",
}

export const TIER_TONE: Record<CustomerTier, Tone> = {
  Enterprise: "chart-3",
  Pro: "chart-1",
  Free: "muted",
}

export interface Suggestion {
  id: string
  kind: string
  title: string
  body: string
  action: string
}

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    kind: "구조",
    title: "tickets.priority 가 Urgent 일 때 자동 알림",
    body: "미처리 Urgent 티켓 1건이 8시간째 대기 중입니다. 담당자 미지정 알림을 켤까요?",
    action: "규칙 추가",
  },
  {
    id: "s2",
    kind: "정리",
    title: "컬럼 타입 추천: phone → 전화번호 형식",
    body: "customers.phone 의 92% 가 010-XXXX-XXXX 패턴입니다. 형식 검증을 적용하시겠어요?",
    action: "적용",
  },
  {
    id: "s3",
    kind: "관계",
    title: "notes.author_id → agents.id 외래키 감지",
    body: "notes.author_id 값이 모두 agents 테이블에 존재합니다. 관계로 승격할까요?",
    action: "관계 만들기",
  },
]

// Tailwind class helpers — literals so JIT can scan them statically.
export function toneBadgeClass(tone: Tone): string {
  switch (tone) {
    case "destructive":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "primary":
      return "bg-primary/10 text-primary border-primary/20"
    case "warning":
      return "bg-warning/15 text-warning-foreground border-warning/30"
    case "success":
      return "bg-success/10 text-success border-success/20"
    case "muted":
      return "bg-muted text-muted-foreground border-border"
    case "chart-1":
      return "bg-chart-1/10 text-chart-1 border-chart-1/20"
    case "chart-2":
      return "bg-chart-2/10 text-chart-2 border-chart-2/20"
    case "chart-3":
      return "bg-chart-3/10 text-chart-3 border-chart-3/20"
    case "chart-4":
      return "bg-chart-4/10 text-chart-4 border-chart-4/20"
    case "chart-5":
      return "bg-chart-5/10 text-chart-5 border-chart-5/20"
  }
}

export function toneDotClass(tone: Tone): string {
  switch (tone) {
    case "destructive":
      return "bg-destructive"
    case "primary":
      return "bg-primary"
    case "warning":
      return "bg-warning"
    case "success":
      return "bg-success"
    case "muted":
      return "bg-muted-foreground"
    case "chart-1":
      return "bg-chart-1"
    case "chart-2":
      return "bg-chart-2"
    case "chart-3":
      return "bg-chart-3"
    case "chart-4":
      return "bg-chart-4"
    case "chart-5":
      return "bg-chart-5"
  }
}

export function colorBgClass(c: ChartColor): string {
  switch (c) {
    case "chart-1":
      return "bg-chart-1"
    case "chart-2":
      return "bg-chart-2"
    case "chart-3":
      return "bg-chart-3"
    case "chart-4":
      return "bg-chart-4"
    case "chart-5":
      return "bg-chart-5"
  }
}

export function colorTextClass(c: ChartColor): string {
  switch (c) {
    case "chart-1":
      return "text-chart-1"
    case "chart-2":
      return "text-chart-2"
    case "chart-3":
      return "text-chart-3"
    case "chart-4":
      return "text-chart-4"
    case "chart-5":
      return "text-chart-5"
  }
}

const customerById = new Map(CUSTOMERS.map((c) => [c.id, c]))
const agentById = new Map(AGENTS.map((a) => [a.id, a]))
const tableById = new Map(SCHEMA.map((t) => [t.id, t]))

export function getCustomer(id: string | null | undefined): Customer | undefined {
  if (!id) return undefined
  return customerById.get(id)
}

export function getAgent(id: string | null | undefined): Agent | undefined {
  if (!id) return undefined
  return agentById.get(id)
}

export function getTable(id: string): TableNode | undefined {
  return tableById.get(id)
}

export function getCustomerName(id: string | null | undefined): string {
  return getCustomer(id)?.name ?? (id ?? "—")
}

export function getAgentName(id: string | null | undefined): string {
  return getAgent(id)?.name ?? "미지정"
}

export function getTableLabel(id: string): string {
  return getTable(id)?.label ?? id
}

// Mock "now" of 2026-04-28 14:00 — used by ops list "X시간 경과" indicator.
export function ageInHours(opened: string): number {
  const NOW = new Date("2026-04-28T14:00:00").getTime()
  const t = new Date(opened.replace(" ", "T") + ":00").getTime()
  return Math.max(0, Math.round((NOW - t) / 3600000))
}

const TYPE_TO_SQL: Record<FieldType, string> = {
  uuid: "UUID",
  string: "VARCHAR(120)",
  email: "VARCHAR(160)",
  phone: "VARCHAR(40)",
  text: "TEXT",
  number: "INTEGER",
  datetime: "TIMESTAMPTZ",
  select: "VARCHAR(40)",
  status: "VARCHAR(40)",
  fk: "UUID",
}

export function generateSql(tables: TableNode[]): string {
  const localMap = new Map(tables.map((t) => [t.id, t]))
  const plural = (id: string) => {
    const t = localMap.get(id) ?? getTable(id)
    return t ? t.en.toLowerCase() + "s" : id
  }
  return tables
    .map((t) => {
      const cols = t.fields
        .map((f) => {
          const sqlType = TYPE_TO_SQL[f.type] ?? "TEXT"
          const parts: string[] = [`  ${f.name.padEnd(14)} ${sqlType}`]
          if (f.pk) parts.push("PRIMARY KEY")
          if (f.required && !f.pk) parts.push("NOT NULL")
          if (f.ref) parts.push(`REFERENCES ${plural(f.ref)}(id)`)
          if (f.enum)
            parts.push(
              `CHECK (${f.name} IN (${f.enum.map((e) => `'${e}'`).join(", ")}))`
            )
          return parts.join(" ")
        })
        .join(",\n")
      return `-- ${t.label}\nCREATE TABLE ${t.en.toLowerCase()}s (\n${cols}\n);`
    })
    .join("\n\n")
}
