// FlowBase V2 — Activity bar (좌측 44px 레일)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §3 (D2 — 최소 레일)
// 출처: design-ref/prototype/library-view.jsx InteractiveActivityBar
//
// V2 MVP는 최소 — 로고 + Tables(단일) + Settings 플레이스홀더.
// Inbox/Library/Wiki 모드는 plan §5 비목표라 제외.

"use client"

import { Database, Settings } from "lucide-react"

export function ActivityBar() {
  return (
    <nav className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border-subtle bg-background py-2.5">
      {/* 로고 */}
      <div className="mb-1.5 flex size-7 items-center justify-center rounded-md bg-primary text-[13px] font-bold tracking-tight text-primary-foreground">
        F
      </div>
      {/* Tables — 현재 유일 모드 (활성 고정) */}
      <button
        type="button"
        title="Tables"
        className="relative flex size-8 items-center justify-center rounded-md bg-foreground/[0.06] text-foreground"
      >
        <span className="absolute -left-2.5 inset-y-1.5 w-0.5 rounded-full bg-primary" />
        <Database className="size-[18px]" strokeWidth={1.75} />
      </button>
      <div className="flex-1" />
      {/* Settings — 준비 중 */}
      <button
        type="button"
        title="Settings — 준비 중"
        disabled
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground/40"
      >
        <Settings className="size-[18px]" strokeWidth={1.75} />
      </button>
    </nav>
  )
}
