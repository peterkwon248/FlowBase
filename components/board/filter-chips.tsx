// FlowBase V2 — status 필터 chip 줄
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §7
// 출처: design-ref/prototype/prototype-shell.jsx FilterChips
//
// 스토어 filter(TicketStatus[]) 토글. status 컬럼 없는 보드면 미표시.

"use client"

import { statusIcon } from "@/components/sheet/editable-cell"
import { STATUS_OPTIONS } from "@/lib/flowbase-seed"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { statusBgClass, statusColorClass } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, type TicketStatus } from "@/types/flowbase"

export function FilterChips() {
  const board = useFlowBase(selectActiveBoard)
  const filter = useFlowBase((s) => s.filter)
  const setFilter = useFlowBase((s) => s.setFilter)

  if (!board || !board.columns.some((c) => c.type === "status")) return null

  const counts: Record<string, number> = {}
  for (const r of board.rows) {
    const s = String(r.status ?? "")
    counts[s] = (counts[s] ?? 0) + 1
  }

  const toggle = (s: TicketStatus) => {
    setFilter(
      filter.includes(s) ? filter.filter((x) => x !== s) : [...filter, s],
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STATUS_OPTIONS.map((s) => {
        const active = filter.includes(s)
        return (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
              active
                ? cn(statusBgClass(s), statusColorClass(s))
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {statusIcon(s)}
            <span>{STATUS_LABELS[s]}</span>
            <span className="tabular-nums opacity-70">{counts[s] ?? 0}</span>
          </button>
        )
      })}
      {filter.length > 0 && (
        <button
          type="button"
          onClick={() => setFilter([])}
          className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  )
}
