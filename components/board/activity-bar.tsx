// FlowBase V2 — Activity bar (좌측 44px 레일)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §3
// 출처: design-ref/prototype/library-view.jsx InteractiveActivityBar
//
// 6모드 레일 — Inbox · Tables · Workspace · Library · Wiki · Search.
// 모드 전환은 store의 activityMode. 셸(app/page.tsx)이 모드별 콘텐츠를 렌더.

"use client"

import {
  BookText,
  Database,
  Inbox,
  Layers,
  Library,
  type LucideIcon,
  Search,
  Settings,
} from "lucide-react"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { ActivityMode } from "@/types/flowbase"

const MODES: { id: ActivityMode; label: string; Icon: LucideIcon }[] = [
  { id: "inbox", label: "Inbox", Icon: Inbox },
  { id: "tables", label: "Tables", Icon: Database },
  { id: "workspace", label: "Workspace", Icon: Layers },
  { id: "library", label: "Library", Icon: Library },
  { id: "wiki", label: "Wiki", Icon: BookText },
  { id: "search", label: "Search", Icon: Search },
]

export function ActivityBar() {
  const activityMode = useFlowBase((s) => s.activityMode)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)

  return (
    <nav className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border-subtle bg-background py-2.5">
      {/* 로고 */}
      <div className="mb-1.5 flex size-7 items-center justify-center rounded-md bg-primary text-[13px] font-bold tracking-tight text-primary-foreground">
        F
      </div>
      {MODES.map(({ id, label, Icon }) => {
        const active = id === activityMode
        return (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setActivityMode(id)}
            className={cn(
              "relative flex size-8 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-foreground/[0.06] text-foreground"
                : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
            )}
          >
            {active && (
              <span className="absolute inset-y-1.5 -left-2.5 w-0.5 rounded-full bg-primary" />
            )}
            <Icon className="size-[18px]" strokeWidth={1.75} />
          </button>
        )
      })}
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
