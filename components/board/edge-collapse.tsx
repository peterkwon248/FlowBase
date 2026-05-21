// FlowBase V2 — 패널 엣지 닫기 chevron
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §6
// 출처: design-ref/prototype/prototype-shell.jsx EdgeCollapse
//
// 패널(relative 컨테이너) 안쪽 가장자리에 absolute로 떠 있는 작은 chevron.

"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface EdgeCollapseProps {
  // "left" = 좌측 레일 패널(사이드바)의 우측 엣지 / "right" = 우측 패널(AI)의 좌측 엣지
  side: "left" | "right"
  onClick: () => void
  title?: string
}

export function EdgeCollapse({ side, onClick, title }: EdgeCollapseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "absolute top-1/2 z-[5] flex h-7 w-4 -translate-y-1/2 items-center justify-center border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground",
        side === "left" ? "-right-2 rounded-r-md" : "-left-2 rounded-l-md",
      )}
    >
      {side === "left" ? (
        <ChevronLeft className="size-3" />
      ) : (
        <ChevronRight className="size-3" />
      )}
    </button>
  )
}
