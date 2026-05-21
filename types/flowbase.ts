// FlowBase V2 — 핵심 데이터 모델 (제네릭 컬럼 구동)
// 출처: design-ref/prototype/{tables-data,cell-types,prototype-app}.jsx
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §2
// 프로토타입은 테이블마다 컬럼 정의가 다른 generic row 모델 — 고정 TableRow ❌.

export type TicketStatus = "미처리" | "진행중" | "대기" | "완료"
// LOCK 색 (lib/tokens.ts statusColorClass/statusBgClass):
//   미처리 = blue · 진행중 = amber · 대기 = violet · 완료 = emerald

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

// 뷰 집합. "schema"는 Phase 6에서 4번째 탭으로 추가 (워크스페이스 레벨 — 전 보드 렌더).
export type ViewMode =
  | "sheet"
  | "kanban"
  | "chart"
  | "schema"
  | "grid"
  | "timeline"

export type SortDir = "asc" | "desc"

export type SortState = { key: string; dir: SortDir } | null

export type CellCoord = { row: string; col: string }

export interface PanelState {
  activityBar: boolean
  sidebar: boolean
  aiPanel: boolean
}

// 스토어 상태 (lib/flowbase-store.ts). 액션은 스토어 파일에 정의.
// theme은 next-themes 소유, editingCell은 sheet-view.tsx 로컬 — 둘 다 제외.
export interface FlowBaseState {
  // 보드 데이터 (persist)
  boards: Record<string, Board>
  activeBoardId: string

  // 전역 UI (persist)
  panels: PanelState
  viewByBoardId: Record<string, ViewMode>

  // 세션 ephemeral (persist ❌ — 보드 전환 시 초기화)
  search: string
  filter: TicketStatus[]
  sort: SortState
  selectedRowIds: string[]
  focusedCell: CellCoord | null
}
