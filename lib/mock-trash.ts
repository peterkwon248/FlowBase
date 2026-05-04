// visual mockup: trash (logic-free)

export type TrashItemKind = "row" | "field" | "table" | "import" | "workspace"

export interface TrashItem {
  id: string
  name: string
  kind: TrashItemKind
  source: string
  deletedAt: string
  deletedBy: string
  expiresAt: string
}

// Helper to create dates relative to now
function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export const TRASH_ITEMS: TrashItem[] = [
  // Expiring soon (within 3 days) - 3 items
  {
    id: "trash-1",
    name: "김철수",
    kind: "row",
    source: "customers 테이블",
    deletedAt: daysAgo(27),
    deletedBy: "나",
    expiresAt: daysFromNow(3),
  },
  {
    id: "trash-2",
    name: "phone_number",
    kind: "field",
    source: "agents 테이블",
    deletedAt: daysAgo(28),
    deletedBy: "나",
    expiresAt: daysFromNow(2),
  },
  {
    id: "trash-3",
    name: "2024_Q3_import.csv",
    kind: "import",
    source: "tickets 테이블",
    deletedAt: daysAgo(29),
    deletedBy: "나",
    expiresAt: daysFromNow(1),
  },
  // Normal (7-15 days) - 5 items
  {
    id: "trash-4",
    name: "박영희",
    kind: "row",
    source: "customers 테이블",
    deletedAt: daysAgo(20),
    deletedBy: "나",
    expiresAt: daysFromNow(10),
  },
  {
    id: "trash-5",
    name: "legacy_notes",
    kind: "table",
    source: "고객 상담 DB 워크스페이스",
    deletedAt: daysAgo(22),
    deletedBy: "나",
    expiresAt: daysFromNow(8),
  },
  {
    id: "trash-6",
    name: "이민수",
    kind: "row",
    source: "agents 테이블",
    deletedAt: daysAgo(18),
    deletedBy: "나",
    expiresAt: daysFromNow(12),
  },
  {
    id: "trash-7",
    name: "department",
    kind: "field",
    source: "customers 테이블",
    deletedAt: daysAgo(23),
    deletedBy: "나",
    expiresAt: daysFromNow(7),
  },
  {
    id: "trash-8",
    name: "backup_import.csv",
    kind: "import",
    source: "notes 테이블",
    deletedAt: daysAgo(16),
    deletedBy: "나",
    expiresAt: daysFromNow(14),
  },
  // Fresh (25-30 days) - 4 items
  {
    id: "trash-9",
    name: "테스트 프로젝트",
    kind: "workspace",
    source: "워크스페이스",
    deletedAt: daysAgo(3),
    deletedBy: "나",
    expiresAt: daysFromNow(27),
  },
  {
    id: "trash-10",
    name: "old_tickets",
    kind: "table",
    source: "재고 관리 워크스페이스",
    deletedAt: daysAgo(5),
    deletedBy: "나",
    expiresAt: daysFromNow(25),
  },
  {
    id: "trash-11",
    name: "최지영",
    kind: "row",
    source: "customers 테이블",
    deletedAt: daysAgo(2),
    deletedBy: "나",
    expiresAt: daysFromNow(28),
  },
  {
    id: "trash-12",
    name: "metadata",
    kind: "field",
    source: "tickets 테이블",
    deletedAt: daysAgo(1),
    deletedBy: "나",
    expiresAt: daysFromNow(29),
  },
]

// Kind display info
export const KIND_INFO: Record<TrashItemKind, { label: string; icon: string }> = {
  row: { label: "행", icon: "Rows3" },
  field: { label: "필드", icon: "Columns3" },
  table: { label: "테이블", icon: "Database" },
  import: { label: "Import", icon: "Upload" },
  workspace: { label: "워크스페이스", icon: "Briefcase" },
}

// Kind badge classes with dark mode support
export const KIND_TONE: Record<TrashItemKind, string> = {
  row: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  field: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900",
  table: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  import: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  workspace: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
}
