// FlowBase V2 — 공통 Empty state (P-2)
// view들 사이의 시각 톤 일관성. Sheet의 onboarding tips와 동일 spacing/typography.
//
// 사용처:
//   - Gallery (visibleRows.length === 0)
//   - Timeline (no dateCol · no dated rows)
//   - 향후 추가 view
//
// Kanban per-column "Empty"는 다른 scale (column 단위 micro-empty)이라 별 — 적용 ❌.

"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  Icon?: LucideIcon
  title: string
  description?: string
  // 선택 액션 버튼 등 — 호출처가 children으로 전달.
  children?: React.ReactNode
  // 컨테이너 부가 클래스 — 호출처 spacing 조절.
  className?: string
}

export function EmptyState({
  Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center bg-background",
        className,
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-8 text-center">
        {Icon && (
          <Icon
            className="mb-1 size-7 text-muted-foreground/40"
            strokeWidth={1.5}
            aria-hidden
          />
        )}
        <h3 className="text-[13.5px] font-semibold">{title}</h3>
        {description && (
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}
