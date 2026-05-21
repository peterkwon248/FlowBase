// FlowBase V2 — 닫힌 패널 재오픈 floating 탭
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §6
// 출처: design-ref/prototype/prototype-shell.jsx ExpandTab
//
// 패널이 닫혔을 때 보드 영역(relative) 가장자리에 떠 있는 작은 탭.

"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpandTabProps {
  side: "left" | "right"
  label: string
  onClick: () => void
  count?: number
}

export function ExpandTab({ side, label, onClick, count }: ExpandTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-[5] inline-flex h-7 -translate-y-1/2 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground shadow-sm hover:text-foreground",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      {side === "left" ? (
        <ChevronRight className="size-3" />
      ) : (
        <ChevronLeft className="size-3" />
      )}
      <span>{label}</span>
      {count != null && count > 0 && (
        <span className="rounded bg-primary/15 px-1 text-[10px] font-semibold text-primary">
          {count}
        </span>
      )}
    </button>
  )
}
