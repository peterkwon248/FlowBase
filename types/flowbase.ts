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

// 셀 타입 — 프로토타입 cell-types.jsx + tables-data.jsx 기준 + multiSelect (Notion/Airtable 호환)
// multiSelect: cell = string[] (여러 태그). select와 options 재사용. Status는 단일 select 격리 LOCK.
// formula: 다른 컬럼 값에서 계산된 read-only 셀 (G7-C C-F3). ColumnDef.formula에 expression.
export type ColumnType =
  | "text"
  | "num"
  | "date"
  | "email"
  | "select"
  | "multiSelect"
  | "status"
  | "avatar"
  | "reaction"
  | "button"
  | "fk"
  | "formula"

// Formula 컬럼의 결과 타입. 셀 렌더가 이 값으로 포맷 분기.
export type FormulaResultType = "text" | "number" | "date" | "boolean"

export interface ColumnDef {
  name: string // row 필드 key
  label: string // 표시 이름
  type: ColumnType
  width?: number // px
  mono?: boolean // 모노스페이스 표시
  ai?: boolean // AI 추론 컬럼 (theme/sentiment)
  options?: string[] // type === "select" | "multiSelect"
  subtitleField?: string // type === "avatar" — 부제 컬럼명
  fk?: string // type === "fk" — 대상 보드 id
  buttonLabel?: string // type === "button"
  buttonAction?: string // type === "button" — 액션 식별자
  libraryFieldId?: string // Promote to Library 후 연결된 LibraryField id
  functionId?: string // Attach function — Library function id (실행은 향후)
  // G3-3: MATCH_FROM_DROPDOWN sourceField 명시. 미설정이면 첫 text/select column auto.
  functionSourceField?: string
  // G7-A3: cell value 룰 기반 색 강조. sheet view에서 적용.
  formatRules?: FormatRule[]
  // G7-C C-F3: formula 컬럼. expression + 자동 추출 deps + 결과 타입.
  //   formula        — Notion 식 표현식 (e.g., `concat(prop("name"), " - ", prop("status"))`)
  //   formulaDeps    — parser가 자동 추출한 의존 컬럼명 (prop("X") → X). useMemo 의존성에 사용.
  //   formulaResultType — 셀 표시 포맷 (text/number/date/boolean).
  // LOCK: editable ❌ · column-header-menu의 "Edit formula"로만 수정.
  formula?: string
  formulaDeps?: string[]
  formulaResultType?: FormulaResultType
}

// G7-A3 Conditional formatting
export type FormatTone = "red" | "amber" | "emerald" | "blue"
export type FormatRule =
  | { kind: "lt"; value: number; tone: FormatTone } // value < N
  | { kind: "gt"; value: number; tone: FormatTone } // value > N
  | { kind: "eq"; value: string; tone: FormatTone } // value === X
  | { kind: "contains"; value: string; tone: FormatTone } // text 포함

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

// 보드별 사용자 정의 대시보드 차트 — Board.charts에 저장 (옵션).
// 비어 있으면 dashboard-view가 컬럼에서 auto-derive 폴백.
export type ChartType =
  | "kpi"
  | "bar"
  | "donut"
  | "line"
  | "stacked-bar"
  | "heatmap"
  | "scatter"   // D2 — numeric × numeric 상관 (sourceCol=xCol, valueCol=yCol)
  | "histogram" // D3 — numeric 분포 (sourceCol=numeric, auto bin)
  | "pivot"     // G1-1 — rowField(sourceCol) × colField(groupByCol) × aggFn(valueCol)
  | "bullet"    // G7-A1 — aggFn(valueCol) vs goal + 선택 reference. KPI 강화 변형.
  | "funnel"    // G7-A2 — stage(sourceCol)별 count 단계 drop-off.

export type ChartWidth = "quarter" | "half" | "two-thirds" | "full"

// Line chart 시간 bucket 단위 — daily/weekly/monthly/quarterly/yearly. default weekly(호환).
export type TimeScale = "day" | "week" | "month" | "quarter" | "year"

// 집계 함수 — 도메인 무관 fit의 핵심. count(현행) 외에 numeric 컬럼 통계 노출.
// 사용처: KPI 단일 값 · Bar/Donut group별 값 · Line 시간 bucket 값.
//   count   = row 수 (valueCol 무관, default)
//   sum     = valueCol 합
//   avg     = valueCol 산술 평균
//   min/max = valueCol 최소/최대
//   median  = valueCol 중앙값 (홀수 가운데 / 짝수 두 값 평균)
// status/select 컬럼에는 sum 등 의미 ❌ — UI 단에서 aggFn!==count면 valueCol 강제 노출.
export type AggFn = "count" | "sum" | "avg" | "min" | "max" | "median"

export interface ChartConfig {
  id: string
  type: ChartType
  title: string
  sourceCol: string // 주요 컬럼 (categorical 또는 numeric 또는 date)
  groupByCol?: string // stacked-bar용 두 번째 categorical
  width: ChartWidth
  // 집계 옵션 — undefined === "count" 호환 (마이그레이션 ❌).
  aggFn?: AggFn
  // sum/avg/min/max/median 대상 numeric 컬럼. aggFn === "count"면 무시.
  valueCol?: string
  // line chart 시간 bucket. undefined = "week" 호환.
  timeScale?: TimeScale
  // G1-3: 목표값 — KPI tile에서 progress bar 표시 (값/goal * 100%).
  goal?: number
  // 목표 라벨 (예: "Q1 quota") — UI 표시 용. 미설정 시 "goal" default.
  goalLabel?: string
  // G7-A1 Bullet — 선택 reference (이전 기간/팀 평균) 마커. 선 또는 작은 marker.
  referenceValue?: number
  referenceLabel?: string
}

export interface Board {
  id: string
  label: string
  colorVar?: string // 사이드바 컬러 토큰 (var(--chart-N))
  idPrefix?: string // 새 행 id 접두 (예: "INT-")
  columns: ColumnDef[]
  rows: TableRow[]
  aiHistory: AIHistoryEntry[]
  charts?: ChartConfig[] // 사용자 정의 dashboard. 없으면 auto-derive.
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
  // 직전 N개 revisions FIFO. updateWikiPage(body 변경 시)가 prev push.
  // body diff/version history Dialog가 이걸 표시. revert 가능. cap N=20.
  revisions?: PageRevision[]
}

export interface PageRevision {
  ts: number       // epoch ms (해당 revision으로 *바뀌기 직전*의 timestamp)
  title: string
  body: string
}

// ─── Workspace — Automations ───
// 출처: design-ref/prototype/automations.jsx

export type ActiveWorkspaceItem =
  | "schema"
  | "automations"
  | "history"
  | "snapshots"

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

// ─── View-specific Display Options (Linear "Display" 버튼 패턴) ───
// view마다 의미 있는 옵션이 다르므로 view별 인터페이스. 보드별 + view별 persist.

export interface SheetViewSettings {
  hiddenColumns?: string[]  // name list — 숨겨질 컬럼
  density?: "compact" | "normal"
  columnWidths?: Record<string, number>  // column name → width(px). 사용자 조정값. 미설정 시 ColumnDef.width fallback.
  // GroupBy — status/select 컬럼 name. 있으면 Sheet 뷰가 그룹 헤더로 행을 묶음.
  groupBy?: string
  // 다중 sort — Linear "Ordering" 패턴. 있으면 state.sort 무시(Sheet view 한정). 우선순위 = 배열 순서.
  sorts?: { key: string; dir: SortDir }[]
}

export interface KanbanViewSettings {
  groupBy?: string          // 컬럼 name (status/select). 미설정 시 status 자동.
  cardFields?: string[]     // 카드에 표시할 추가 필드 (id/title 외)
}

export interface GalleryViewSettings {
  coverField?: string       // avatar/text 컬럼 — 카드 헤더
  cardFields?: string[]     // 카드 본문 필드
  columns?: 2 | 3 | 4       // grid 컬럼 수
}

export interface TimelineViewSettings {
  dateField?: string                      // 정렬·bar 기준 date 컬럼
  scale?: "day" | "week" | "month"        // colWidth 조절 (day=34/week=14/month=8)
}

export interface DashboardViewSettings {
  density?: "compact" | "normal"
}

export interface ViewSettings {
  sheet?: SheetViewSettings
  kanban?: KanbanViewSettings
  gallery?: GalleryViewSettings
  timeline?: TimelineViewSettings
  dashboard?: DashboardViewSettings
}

// ─── Saved Views — Notion 식 named view (G7-C C-V1) ───
// 사용자가 현재 view의 filter/sort/viewSettings 조합을 named view로 persist.
// 보드별 N개 view (e.g., "My open tasks", "This quarter pipeline").
// LOCK: filter+sort+viewSettings 풀세트 저장 (Notion 패턴). viewType은 저장 시점의 viewByBoardId.
// 적용 시 viewType 호환 안 되면 toast warning + sheet fallback.

export interface SavedView {
  id: string
  boardId: string                                 // 보드별 격리
  name: string                                    // 사용자 정의 (빈 문자열 시 "Untitled view")
  viewType: ViewMode                              // 저장 시점의 viewByBoardId
  settings: ViewSettings                          // 저장 시점의 viewSettings[boardId] 전체 스냅샷
  columnFilters: Record<string, FilterCondition[]> // 저장 시점의 columnFilters
  sort: SortState                                 // 저장 시점의 state.sort
  createdAt: string                               // ISO
  updatedAt: string                               // ISO — Update from current 시 갱신
}

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

// 삭제된 행 항목 — boardId + row 스냅샷.
export interface TrashedRow {
  boardId: string
  boardLabel: string // 복원/삭제 후에도 보드 라벨 표시
  row: TableRow
  deletedAt: string // ISO
}

// 삭제된 Wiki 페이지 — page 스냅샷 + deletedAt. 30일 후 자동 만료.
export interface TrashedWikiPage {
  page: WikiPage
  deletedAt: string // ISO
}

// 멤버/권한 — 백엔드 없는 mock. Phase 2(W11)에서 실 분리.
// Owner는 워크스페이스당 1명, 변경/삭제 ❌. 다른 role은 Settings에서 편집.
export type MemberRole = "owner" | "admin" | "member" | "viewer"

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  initial: string // avatar 표시용 1글자
  role: MemberRole
  joinedAt: string // ISO date
  lastSeenAt?: string // ISO timestamp — 마지막 활동
}

// role-based edit 권한 — Owner/Admin/Member는 편집 가능, Viewer는 readonly.
// Phase 2 W11 (실 분리) 전 까지 mock check (mutation 액션의 toast 알림).
export function roleCanEdit(role: MemberRole): boolean {
  return role !== "viewer"
}

export type ThemeAccent = "purple" | "blue" | "emerald" | "amber"

// 워크스페이스 설정 (persist) — Settings 모달이 편집.
export interface WorkspaceSettings {
  workspaceLabel: string
  workspaceInitial: string // 1글자 — 사이드바 아이콘 표시
  members: WorkspaceMember[]
  themeAccent?: ThemeAccent // default 'purple' (settings 모드 영구 적용)
  // 현재 로그인 사용자 — Members 가운데 1명. role enforcement 기준.
  // 시드/migrate에서 owner(peter)로 init. Phase 2(W11) 실 인증으로 교체.
  currentUserId?: string
}

// Data export/import 스냅샷 형식 — store.exportData() 결과 + importWorkspace 입력.
// boards 필수, 나머지는 옵션 (있는 것만 머지).
export interface ExportedSnapshot {
  exportedAt?: string
  storeVersion?: number
  boards?: Record<string, Board>
  library?: Library
  wikiPages?: WikiPage[]
  automations?: AutomationRule[]
}

// ─── Snapshots — GitHub 식 명시 save point ───
// 사용자가 "Save snapshot" 명시 클릭 시 워크스페이스 전체 상태 deep copy.
// Restore = 현재 상태 자동 새 snapshot 저장 + 그 시점으로 복원 (되돌릴 수 있게).
// LOCK (Key Design #18):
//   - persist = deep state copy (option A). compression/replay는 후속.
//   - Restore → 자동 새 snapshot 생성 (branch 단순화 — 진짜 격리 branch ❌)
//   - cap ❌ (사용자 명시 save니까 자동 trim 안 함). quota 도달 시 사용자가 직접 정리.
//   - events는 복원 ❌ — append-only timeline 유지. snapshot_restored 이벤트만 push.

// Restore 대상 상태 — 사용자 데이터 전체. events/undo/ephemeral 제외.
export interface SnapshotState {
  boards: Record<string, Board>
  library: Library
  wikiPages: WikiPage[]
  automations: AutomationRule[]
  suggestedAutomations: SuggestedAutomation[]
  trashedBoards: TrashedBoard[]
  trashedRows: TrashedRow[]
  trashedWikiPages: TrashedWikiPage[]
  settings: WorkspaceSettings
  schemaPositions: Record<string, { x: number; y: number }>
  viewSettings: Record<string, ViewSettings>
  // G7-C C-V1: Saved Views도 snapshot에 포함 (Restore round-trip).
  savedViews: Record<string, SavedView[]>
  activeSavedViewId: Record<string, string | null>
}

export interface Snapshot {
  id: string
  ts: number             // saved timestamp (epoch ms)
  label: string          // 사용자 정의 (필수, 빈 문자열 시 "Untitled snapshot")
  description?: string
  by: string             // memberId (settings.currentUserId 시점)
  state: SnapshotState
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

// ─── EventStore — 통합 액션 timeline (Phase A 인프라) ───
// 모든 사용자 액션의 시간순 single source of truth. 향후 derived views:
//   - Workspace > History (전역 timeline UI)
//   - Detail bar > Activity 탭 (row 단위 view)
//   - AI panel > Timeline (kind=ai_* filter view)
//   - WorkspaceMemory (frequency view — 현 Phase 1 코드는 별도 유지, 향후 derived 가능)
// LOCK: append-only · 90일 expire · 1000개 cap · persist.
// 호환: ChangeEvent와 별개로 유지. publishChange는 양쪽 다 push (ephemeral + persist).
export type EventKind =
  | "row_added"
  | "row_updated"
  | "ai_infer"  // pushAi(kind=infer) 흡수
  | "ai_ask"    // pushAi(kind=ask) 흡수
  | "snapshot_saved"     // GitHub 식 명시 save point — Snapshot 모델
  | "snapshot_restored"  // Restore 시 자동 새 snapshot도 saved로 push (이 이벤트는 사용자 액션만)
// 향후: row_deleted · comment_added · mention · snooze · column_added · ...

export interface TimestampedEvent {
  id: string
  ts: number               // epoch ms
  kind: EventKind
  boardId?: string         // 없으면 워크스페이스 단위
  rowId?: string           // 단일 행 대상일 때
  rowIds?: string[]        // bulk (AI infer 등)
  title?: string           // 표시용 (AI activity 흡수)
  detail?: string
  status?: AIHistoryStatus // ai_infer/ask 호환
  prev?: TableRow          // row_updated
  next?: TableRow          // row_added/updated
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

// FilterMenu condition — 컬럼 type별 다른 형태. negation operator(not_in/not_contains) 포함.
export type FilterCondition =
  | { kind: "in"; values: string[] } // status / select — 포함
  | { kind: "not_in"; values: string[] } // status / select — 제외
  | { kind: "range"; min?: number; max?: number } // num
  | { kind: "date-range"; from?: string; to?: string } // date (YYYY-MM-DD)
  | { kind: "contains"; text: string } // text / email — 부분 match (case-insensitive)
  | { kind: "not_contains"; text: string } // text / email — 부분 미일치

export type SortDir = "asc" | "desc"

export type SortState = { key: string; dir: SortDir } | null

export type CellCoord = { row: string; col: string }

// ─── Workspace Memory — 자동 학습 cache (Library와 분리) ───
// 셀에 입력된 값을 column scope별로 자동 기억. frequency 2+ 부터 cell editor의 "Recent" 섹션에 노출.
// LOCK: Memory ≠ Library. promote는 명시 click 시만 (Phase 2 — Library OptionList bridge).
// scope 키 = `{colName}::{libraryFieldId ?? "_"}` — 같은 colName이라도 다른 LibraryField 참조면 격리(cross-board 의미 충돌 방지).

export interface MemoryEntry {
  value: string         // 입력된 값 (string 정규화)
  count: number         // 사용 횟수
  lastUsedTs: number    // 최근 사용 시각 (epoch ms)
}

// Phase B1: recent filter/sort snapshot — 자동 학습 (debounce 2s) + JSON dedupe + 최대 10개.
// Click 시 그 snapshot을 active board에 재적용. FilterMenu Recent 섹션 entry.
export interface RecentFilterSnapshot {
  ts: number                                   // 최근 사용 시각 (epoch ms)
  boardId: string
  conditions: Record<string, FilterCondition[]>  // 시점의 columnFilters 전체
}

export interface RecentSortSnapshot {
  ts: number
  boardId: string
  sort: SortState                              // 단일 sort key (state.sort)
}

export interface WorkspaceMemory {
  byScope: Record<string, MemoryEntry[]>
  recentFilters: RecentFilterSnapshot[]
  recentSorts: RecentSortSnapshot[]
}

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
  trashedRows: TrashedRow[]
  trashedWikiPages: TrashedWikiPage[]
  settings: WorkspaceSettings

  // Schema ER 카드 수동 위치 (persist) — 없으면 auto-layout
  schemaPositions: Record<string, { x: number; y: number }>

  // View Display 옵션 (persist) — 보드별 + view별. Display 버튼에서 편집.
  viewSettings: Record<string, ViewSettings>

  // Saved Views (persist) — 보드별 Notion 식 named view 카탈로그. G7-C C-V1.
  // viewSettings는 "active" 슬롯, savedViews는 "저장된 카탈로그" — 별개 슬라이스.
  savedViews: Record<string, SavedView[]>
  // 보드별 현재 활성 view id (apply 후 헤더 칩 표시용). null = 활성 view 없음 (manual 편집 모드).
  activeSavedViewId: Record<string, string | null>

  // Workspace Memory (persist) — 자동 학습 cache. Library와 분리.
  workspaceMemory: WorkspaceMemory

  // EventStore (persist) — 통합 액션 timeline. Phase A 인프라.
  // 향후 Workspace > History · Detail Activity · AI Timeline 모두 이 source에서 derive.
  events: TimestampedEvent[]

  // Snapshots (persist) — GitHub 식 명시 save point. 최신 우선 정렬(newest first).
  snapshots: Snapshot[]

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
  filter: TicketStatus[] // legacy: status chips (filter-chips.tsx)
  // 다중 필드 필터 (FilterMenu) — discriminated union
  //   status/select → in (values)
  //   num            → range (min/max)
  //   date           → date-range (from/to ISO YYYY-MM-DD)
  // 컬럼당 multiple condition (AND 결합). OR 결합은 후속 phase.
  // ephemeral (persist ❌). RecentFilterSnapshot.conditions도 같은 형식.
  columnFilters: Record<string, FilterCondition[]>
  sort: SortState
  selectedRowIds: string[]
  focusedCell: CellCoord | null
  searchOpen: boolean // ⌘K 모달 visibility

  // 인메모리 nav-history (persist ❌ — 세션 한정 ⏰‹›)
  navStack: NavEntry[]
  navIndex: number // 현재 entry의 navStack 인덱스 (-1 = 비어있음)

  // 자동화 런타임이 구독하는 마지막 데이터 변경 (persist ❌)
  lastChange: ChangeEvent | null

  // Ask AI 포커스 요청 토큰 (persist ❌). 매 요청 시 timestamp set →
  // AiComposer가 변화 감지해 input focus. 0 = 요청 없음(초기).
  askAiFocusToken: number
}
