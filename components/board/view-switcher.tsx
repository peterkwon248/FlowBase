// FlowBase V2 — 뷰 스위처 (Sheet | Kanban | Dashboard)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §2
// 출처: design-ref/prototype/view-controls.jsx VIEW_TYPES
//
// 스토어 viewByBoardId·setView·selectActiveView (Phase 1A 완비) 연동.
// Kanban은 status 컬럼이 있는 보드에서만 활성 (D2).

"use client"

import {
  LayoutDashboard,
  type LucideIcon,
  SquareKanban,
  Table2,
} from "lucide-react"
import {
  selectActiveBoard,
  selectActiveView,
  useFlowBase,
} from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { ViewMode } from "@/types/flowbase"

interface ViewDef {
  id: ViewMode
  label: string
  icon: LucideIcon
}

const VIEWS: ViewDef[] = [
  { id: "sheet", label: "Sheet", icon: Table2 },
  { id: "kanban", label: "Kanban", icon: SquareKanban },
  { id: "chart", label: "Dashboard", icon: LayoutDashboard },
]

export function ViewSwitcher() {
  const view = useFlowBase(selectActiveView)
  const board = useFlowBase(selectActiveBoard)
  const setView = useFlowBase((s) => s.setView)

  const hasStatus = board?.columns.some((c) => c.type === "status") ?? false

  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
      {VIEWS.map((v) => {
        const disabled = v.id === "kanban" && !hasStatus
        const active = view === v.id
        const Icon = v.icon
        return (
          <button
            key={v.id}
            type="button"
            disabled={disabled}
            onClick={() => setView(v.id)}
            title={
              disabled ? "status 컬럼이 있는 보드에서 사용 가능" : v.label
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
            {v.label}
          </button>
        )
      })}
    </div>
  )
}
