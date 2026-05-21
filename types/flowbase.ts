// FlowBase V2 — 핵심 데이터 모델
// 출처: design-ref/handoff/STATE-SHAPES.md §1
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §2

export type TicketStatus = "미처리" | "진행중" | "대기" | "완료"
// LOCK 색 (lib/tokens.ts statusColorClass/statusBgClass):
//   미처리 = blue · 진행중 = amber · 대기 = violet · 완료 = emerald

export type TicketPriority = "Urgent" | "High" | "Med" | "Low"

export type Sentiment = "Positive" | "Mixed" | "Negative"

export type ColumnType = "text" | "num" | "date" | "email" | "select" | "status"

export interface ColumnDef {
  name: string // key (TableRow의 필드명과 일치)
  label: string // 표시 이름
  type: ColumnType
  width?: number // px
  ai?: boolean // AI 추론 컬럼 (theme/sentiment)
  options?: string[] // type === "select"일 때 가능값
}

export interface TableRow {
  id: string
  name: string
  company: string
  date: string // ISO yyyy-mm-dd
  theme: string
  sentiment: Sentiment
  status: TicketStatus
  priority: TicketPriority
  quote: string
  themeConfirmed: boolean // false = AI 추천 보류(pending)
  sentimentConfirmed: boolean
  createdAt?: string
  updatedAt?: string
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
  columns: ColumnDef[]
  rows: TableRow[]
  aiHistory: AIHistoryEntry[] // 보드별 (STATE-SHAPES §6)
  createdAt: string
  updatedAt: string
}

export type ViewMode = "sheet" | "kanban" | "chart" | "schema"
// "chart" = Dashboard. 프로토타입의 "table" 뷰는 V2에서 제거 (sheet가 대체).

export type SortDir = "asc" | "desc"

export type SortState = { key: string; dir: SortDir } | null

export type CellCoord = { row: string; col: string }

export interface PanelState {
  activityBar: boolean
  sidebar: boolean
  aiPanel: boolean
}

// 스토어 상태 (lib/flowbase-store.ts). 액션은 스토어 파일에 정의.
// editingCell은 의도적으로 제외 — sheet-view.tsx 로컬 state (design §15 Q3).
export interface FlowBaseState {
  // 보드 데이터 (persist)
  boards: Record<string, Board>
  activeBoardId: string

  // 전역 UI (persist) — theme은 next-themes가 소유 (스토어 비포함)
  panels: PanelState
  viewByBoardId: Record<string, ViewMode>

  // 세션 ephemeral (persist ❌ — 보드 전환 시 초기화)
  search: string
  filter: TicketStatus[]
  sort: SortState
  selectedRowIds: string[]
  focusedCell: CellCoord | null
}
