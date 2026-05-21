// FlowBase V2 — 차트 카드 래퍼 (제목 + accent dot)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §5
// 출처: design-ref/prototype/chart-dashboard.jsx ChartCard

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  subtitle?: string
  accent?: string
  className?: string
  children: ReactNode
}

export function ChartCard({
  title,
  subtitle,
  accent = "var(--chart-1)",
  className,
  children,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border-subtle bg-card p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-[2px]"
          style={{ background: accent }}
        />
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold">{title}</span>
          {subtitle && (
            <span className="text-[11px] text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
