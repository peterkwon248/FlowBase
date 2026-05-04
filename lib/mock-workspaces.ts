// visual mockup: workspace-ux (logic-free)
// Mock workspace data for visual mockups only.

export type WorkspaceColor = "blue" | "emerald" | "violet" | "amber" | "rose"

export interface Workspace {
  id: string
  name: string
  color: WorkspaceColor
  tables: number
  members: number
  lastActivityAt: string  // ISO format
  archived: boolean
}

export const WORKSPACES: Workspace[] = [
  {
    id: "1",
    name: "고객 상담 DB",
    color: "blue",
    tables: 5,
    members: 3,
    lastActivityAt: "2026-04-28T14:00:00",
    archived: false,
  },
  {
    id: "2",
    name: "재고 관리",
    color: "emerald",
    tables: 3,
    members: 2,
    lastActivityAt: "2026-04-27T10:30:00",
    archived: false,
  },
  {
    id: "3",
    name: "프로젝트 추적",
    color: "violet",
    tables: 8,
    members: 5,
    lastActivityAt: "2026-04-26T16:45:00",
    archived: false,
  },
  {
    id: "4",
    name: "인사 관리",
    color: "amber",
    tables: 4,
    members: 2,
    lastActivityAt: "2026-04-20T09:00:00",
    archived: false,
  },
  {
    id: "5",
    name: "마케팅 캠페인",
    color: "rose",
    tables: 6,
    members: 4,
    lastActivityAt: "2026-04-15T11:20:00",
    archived: false,
  },
  {
    id: "6",
    name: "레거시 데이터",
    color: "blue",
    tables: 2,
    members: 1,
    lastActivityAt: "2026-03-01T08:00:00",
    archived: true,
  },
]

export const ACTIVE_WORKSPACE_ID = "1"

// Helper to get color dot class - light mode uses darker shades for better contrast
export function workspaceColorDotClass(color: WorkspaceColor): string {
  switch (color) {
    case "blue":
      return "bg-blue-600 dark:bg-blue-400"
    case "emerald":
      return "bg-emerald-600 dark:bg-emerald-400"
    case "violet":
      return "bg-violet-600 dark:bg-violet-400"
    case "amber":
      return "bg-amber-600 dark:bg-amber-400"
    case "rose":
      return "bg-rose-600 dark:bg-rose-400"
  }
}

// Helper to get text color class for workspace colors
export function workspaceColorTextClass(color: WorkspaceColor): string {
  switch (color) {
    case "blue":
      return "text-blue-600 dark:text-blue-400"
    case "emerald":
      return "text-emerald-600 dark:text-emerald-400"
    case "violet":
      return "text-violet-600 dark:text-violet-400"
    case "amber":
      return "text-amber-600 dark:text-amber-400"
    case "rose":
      return "text-rose-600 dark:text-rose-400"
  }
}

// Helper to get active workspace
export function getActiveWorkspace(): Workspace | undefined {
  return WORKSPACES.find(w => w.id === ACTIVE_WORKSPACE_ID)
}

// Format relative time
export function formatRelativeTime(isoDate: string): string {
  const now = new Date("2026-04-28T14:00:00").getTime()
  const date = new Date(isoDate).getTime()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "방금 전"
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  return `${Math.floor(diffDays / 30)}개월 전`
}
