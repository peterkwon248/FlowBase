// FlowBase V2 — 카테고리 값별 랭킹 막대 (div 기반)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §5 (Q1=a)
// 출처: design-ref/prototype/chart-dashboard.jsx GenericDashboard

import { cn } from "@/lib/utils"

export interface CategoryBarItem {
  label: string
  count: number
  colorClass: string // Tailwind bg 클래스 (status는 LOCK 색)
}

interface CategoryBarProps {
  items: CategoryBarItem[]
  total: number
}

export function CategoryBar({ items, total }: CategoryBarProps) {
  const max = Math.max(1, ...items.map((i) => i.count))

  if (items.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        이 컬럼에 값이 없습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((it) => {
        const pct = total > 0 ? Math.round((it.count / total) * 100) : 0
        return (
          <div key={it.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate">{it.label}</span>
              <span className="tabular-nums text-[11px] text-muted-foreground">
                {pct}%
              </span>
              <span className="w-7 text-right font-semibold tabular-nums">
                {it.count}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", it.colorClass)}
                style={{ width: `${(it.count / max) * 100}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
