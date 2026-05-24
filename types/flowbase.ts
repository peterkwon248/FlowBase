// FlowBase V2 — 핵심 데이터 모델 (제네릭 컬럼 구동)
// 출처: design-ref/prototype/{tables-data,cell-types,prototype-app}.jsx
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §2
// 프로토타입은 테이블마다 컬럼 정의가 다른 generic row 모델 — 고정 TableRow ❌.

export type TicketStatus = "미처리" | "진행중" | "대기" | "완료"
// LOCK 색 (lib/tokens.ts statusColorClass/statusBgClass):
//   미처리 = blue · 진행중 = amber · 대기 = violet · 완료 = emerald
// 디스플레이는 영어 — 키는 LOCK 의미론 보존, 라벨만 영어.
export const STATUS_LABELS: Record<TicketStatus, string> = {
  미처리: "Todo",
  진행중: "In progress",
  대기: "Waiting",
  완료: "Done",
}

export type TicketPriority = "Urgent" | "High" | "Med" | "Low"

export type Sentiment = "Positive" | "Mixed" | "Negative"

// 셀 타입 — 프로토타입 cell-types.jsx + tables-data.jsx 기준 10종
export type ColumnType =
  | "text"
  | "num"
  | "date"
  | "email"
  | "select"
  | "status"
  | "avatar"
  | "reaction"
  | "button"
  | "fk"

export interface ColumnDef {
  name: string // row 필드 key
  label: string // 표시 이름
  type: ColumnType
  width?: number // px
  mono?: boolean // 모노스페이스 표시
  ai?: boolean // AI 추론 컬럼 (theme/sentiment)
  options?: string[] // type === "select"
  subtitleField?: string // type === "avatar" — 부제 컬럼명
  fk?: string // type === "fk" — 대상 보드 id
  buttonLabel?: string // type === "button"
  buttonAction?: string // type === "button" — 액션 식별자
}

// reaction 셀(votes) 값
export interface Votes {
  positive: number
  mixed: number
  negative: number
}

// 제네릭 행 — id·AI 확정 플래그만 고정, 나머지 필드는 보드 columns 정의에 따라 동적.
export interface TableRow {
  id: string
  themeConfirmed?: boolean // false = AI theme 추천 보류(pending)
  sentimentConfirmed?: boolean
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export type AIHistoryKind = "infer" | "schema" | "import" | "ask" | "manual"

export type AIHistoryStatus = "pending" | "applied" | "dismissed" | "error"

export interface AIHistoryEntry {
  id: string
  kind: AIHistoryKind
  title: string
  detail?: string
  time: string // ISO
  status: AIHistoryStatus
  rowIds?: string[]
}

export interface Board {
  id: string
  label: string
  colorVar?: string // 사이드바 컬러 토큰 (var(--chart-N))
  idPrefix?: string // 새 행 id 접두 (예: "INT-")
  columns: ColumnDef[]
  rows: TableRow[]
  aiHistory: AIHistoryEntry[]
  createdAt: string
  updatedAt: string
}

// ─── Library — 워크스페이스 자산 카탈로그 (5 카테고리) ───
// 출처: design-ref/prototype/library-data.jsx · 설계: flowbase-v2-library.design.md §1

export type LibraryCategoryId =
  | "optionLists"
  | "fields"
  | "templates"
  | "functions"
  | "dashboards"

export interface OptionItem {
  id: string
  label: string
  color: string
}

export interface OptionList {
  id: string
  name: string
  desc?: string
  usedIn: string[] // "Board.Column" 표기
  options: OptionItem[]
}

export interface FieldConfig {
  required?: boolean
  default?: string
  format?: string
  validation?: string
  multiline?: boolean
  optionListId?: string // select — OptionList 참조
  options?: OptionItem[] // status — 인라인 옵션
}

export interface LibraryField {
  id: string
  name: string
  type: ColumnType
  desc?: string
  usedIn: string[]
  config: FieldConfig
}

export interface LibraryTemplate {
  id: string
  name: string
  desc?: string
  icon?: string
  usedIn: string[]
  // 단일 테이블
  fields?: string[] // LibraryField id 참조
  extraFields?: { name: string; type: ColumnType; config?: FieldConfig }[]
  recommendedViews?: ViewMode[]
  defaultGroupBy?: string
  // 멀티 테이블 도메인
  multiTable?: boolean
  tables?: {
    key: string
    label: string
    colorVar?: string
    columns: ColumnDef[]
  }[]
}

export interface LibraryFunctionParam {
  name: string
  type: "column" | "optionList" | "enum" | "text" | "regex"
  desc: string
  options?: string[]
}

export interface LibraryFunction {
  id: string
  name: string
  label: string
  icon?: string
  desc?: string
  usedIn: string[]
  params: LibraryFunctionParam[]
  example?: string
}

export interface LibraryDashboard {
  id: string
  name: string
  desc?: string
  icon?: string
  usedIn: string[]
  signature: { required: unknown[]; preferred: unknown[] } // B4에서 정밀화
  slots: Record<string, unknown>
  charts: { type: string; title: string; width: string }[] // 표시용 최소
}

export interface Library {
  optionLists: OptionList[]
  fields: LibraryField[]
  templates: LibraryTemplate[]
  functions: LibraryFunction[]
  dashboards: LibraryDashboard[]
}

// ─── Wiki — long-form 지식 문서 ───
// 출처: design-ref/prototype/wiki-view.jsx SEED_PAGES

export interface WikiPage {
  id: string
  title: string
  category: string // "Concepts" | "Runbooks" | "Reference" | "Onboarding" | "Team" | ...
  owner: string
  verified: boolean
  verifiedAt: string | null // ISO date (YYYY-MM-DD)
  expiresAt: string | null  // ISO date — 만료 시 재검증 필요
  updatedAt: string         // ISO date
  body: string              // Markdown 원문
}

// ─── Workspace — Automations ───
// 출처: design-ref/prototype/automations.jsx

export type ActiveWorkspaceItem = "schema" | "automations"

export interface AutomationTrigger {
  table?: string // "interviews", "tasks", "—" 등; "—"는 시간 기반
  event: string  // 자유 텍스트로 트리거 설명
  value: string
}

export interface AutomationStep {
  action: string // "Add row to", "Notify", "Set", ...
  target: string
  detail?: string
}

export type AutomationStatus = "active" | "paused" | "draft"

export interface AutomationRule {
  id: string
  name: string
  when: AutomationTrigger
  then: AutomationStep[]
  status: AutomationStatus
  aiSuggested?: boolean
  runsThisWeek: number
  lastRun: string
}

export interface SuggestedAutomation {
  id: string
  summary: string
  detail: string
  confidence: number // 0~1
}

// 보드 뷰 집합 — Tables 모드 안에서 전환. Schema는 Workspace 모드 소속이라 여기 없음.
export type ViewMode = "sheet" | "kanban" | "chart" | "grid" | "timeline"

// 액티비티 바 모드 — 앱 최상위 내비게이션 (프로토타입 InteractiveActivityBar 6모드).
export type ActivityMode =
  | "tables"
  | "library"
  | "workspace"
  | "wiki"
  | "inbox"
  | "search"

// 삭제된 보드 항목 — Trash 복원/영구 삭제 대상.
export interface TrashedBoard {
  board: Board
  deletedAt: string // ISO
}

// 워크스페이스 설정 (persist) — Settings 모달이 편집.
export interface WorkspaceSettings {
  workspaceLabel: string
  workspaceInitial: string // 1글자 — 사이드바 아이콘 표시
}

// 자동화 런타임이 listen하는 데이터 변경 이벤트 (ephemeral, persist ❌).
// addRow/updateRow/commitAiCell가 끝에 publish. lib/automation-runtime이
// useEffect로 받아 active rule 매칭 후 발화.
export interface ChangeEvent {
  kind: "row_added" | "row_updated"
  boardId: string
  rowId: string
  prev?: TableRow // row_updated일 때만
  next: TableRow
  timestamp: number // 같은 이벤트 중복 처리 방지
}

// 인메모리 nav-history 엔트리 — 헤더 시계/‹/› 버튼이 이 스택을 탐색.
// 출처: design-ref/prototype/nav-history.jsx
export interface NavEntry {
  key: string // 동일 entry 연속 push 방지용
  mode: ActivityMode
  label: string
  sub?: string
  // 모드별 선택 스냅샷 (해당 모드 아니면 무시)
  boardId?: string
  workspaceItem?: ActiveWorkspaceItem
  libCategory?: LibraryCategoryId
  libAssetId?: string | null
  wikiPageId?: string | null
}

export type SortDir = "asc" | "desc"

export type SortState = { key: string; dir: SortDir } | null

export type CellCoord = { row: string; col: string }

export interface PanelState {
  activityBar: boolean
  sidebar: boolean
  aiPanel: boolean
  detailBar: boolean
}

// 스토어 상태 (lib/flowbase-store.ts). 액션은 스토어 파일에 정의.
// theme은 next-themes 소유, editingCell은 sheet-view.tsx 로컬 — 둘 다 제외.
export interface FlowBaseState {
  // 보드 데이터 (persist)
  boards: Record<string, Board>
  activeBoardId: string

  // Library 자산 카탈로그 (persist)
  library: Library

  // 워크스페이스 (persist)
  automations: AutomationRule[]
  suggestedAutomations: SuggestedAutomation[]

  // Wiki (persist)
  wikiPages: WikiPage[]
  wikiSelectedId: string | null

  // Trash · Settings (persist)
  trashedBoards: TrashedBoard[]
  settings: WorkspaceSettings

  // 전역 UI (persist)
  panels: PanelState
  viewByBoardId: Record<string, ViewMode>
  activityMode: ActivityMode
  activeWorkspaceItem: ActiveWorkspaceItem
  libCategory: LibraryCategoryId
  libAssetId: string | null
  libView: "cards" | "sheet"

  // 세션 ephemeral (persist ❌ — 보드 전환 시 초기화)
  search: string
  filter: TicketStatus[]
  sort: SortState
  selectedRowIds: string[]
  focusedCell: CellCoord | null
  searchOpen: boolean // ⌘K 모달 visibility

  // 인메모리 nav-history (persist ❌ — 세션 한정 ⏰‹›)
  navStack: NavEntry[]
  navIndex: number // 현재 entry의 navStack 인덱스 (-1 = 비어있음)

  // 자동화 런타임이 구독하는 마지막 데이터 변경 (persist ❌)
  lastChange: ChangeEvent | null
}
