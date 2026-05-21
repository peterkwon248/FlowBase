// FlowBase V2 — AI 추천 보류(pending) 마커
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §10
// 출처: design-ref/prototype/prototype.jsx (EditableSentiment/EditableTheme pending 표현)
//
// pending = AI가 채웠으나 사람이 아직 확정하지 않은 셀
//   (themeConfirmed / sentimentConfirmed === false).
// LOCK: 자동 적용 ❌ — 마커는 "검토 필요"의 시각 신호.

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AiPendingMarkProps {
  pending: boolean
  children: ReactNode
  // theme 셀처럼 텍스트에 점선 underline 적용 여부 (sentiment는 pill이라 underline ❌)
  underline?: boolean
}

// pending이면 좌측 보라 점 + (옵션) 점선 underline을 children에 적용한다.
// pending이 아니면 children을 그대로 통과시킨다.
export function AiPendingMark({
  pending,
  children,
  underline = false,
}: AiPendingMarkProps) {
  if (!pending) return <>{children}</>

  return (
    <span className="relative inline-flex items-center pl-2.5">
      <span
        aria-hidden
        className="absolute left-0 top-1/2 size-[5px] -translate-y-1/2 rounded-full bg-primary"
      />
      <span
        className={cn(
          underline &&
            "underline decoration-dotted decoration-primary/60 underline-offset-2",
        )}
      >
        {children}
      </span>
    </span>
  )
}
