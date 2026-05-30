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
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { ActivityMode } from "@/types/flowbase"

const MODES: { id: ActivityMode; label: string; Icon: LucideIcon }[] = [
  { id: "inbox", label: "Inbox", Icon: Inbox },
  { id: "tables", label: "Workspace", Icon: Database },
  { id: "workspace", label: "Control", Icon: Layers },
  { id: "library", label: "Library", Icon: Library },
  { id: "wiki", label: "Wiki", Icon: BookText },
  { id: "search", label: "Search", Icon: Search },
]

export function ActivityBar() {
  const activityMode = useFlowBase((s) => s.activityMode)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)
  const members = useFlowBase((s) => s.settings.members)
  const currentUserId = useFlowBase((s) => s.settings.currentUserId)
  const workspaceLabel = useFlowBase((s) => s.settings.workspaceLabel)
  const workspaceInitial = useFlowBase((s) => s.settings.workspaceInitial)
  // 현재 사용자 — currentUserId 매칭(없으면 첫 멤버). 인증(M2) 전 데모.
  const me =
    (members ?? []).find((m) => m.id === currentUserId) ?? (members ?? [])[0]

  return (
    <nav className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border-subtle bg-background py-2.5">
      {/* 계정 — 현재 사용자 이니셜 + 클릭 시 계정/워크스페이스 메뉴 */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={me ? `${me.name} · account` : "Account"}
            data-account-trigger
            className="mb-1.5 flex size-7 items-center justify-center rounded-md bg-primary text-[13px] font-bold tracking-tight text-primary-foreground transition-transform hover:scale-105"
          >
            {me?.initial ?? "?"}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          className="w-60 p-0"
        >
          <div className="flex items-center gap-2.5 border-b border-border-subtle p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-[14px] font-bold text-primary-foreground">
              {me?.initial ?? "?"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">
                {me?.name ?? "Unknown user"}
              </div>
              <div className="truncate text-[11.5px] text-muted-foreground">
                {me?.email ?? "—"}
              </div>
            </div>
            {me?.role && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
                {me.role}
              </span>
            )}
          </div>
          <div className="p-2">
            <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Workspace
            </div>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary">
                {workspaceInitial}
              </span>
              <span className="truncate text-[12.5px] font-medium">
                {workspaceLabel}
              </span>
            </div>
          </div>
          <div className="border-t border-border-subtle px-3 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
            Sign-in & multiple accounts arrive with auth. Showing the demo user
            for now.
          </div>
        </PopoverContent>
      </Popover>
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
      {/* Settings/Trash는 status-bar.tsx 셸 푸터로 단일화 (모든 패널 상태 무관 always visible) */}
    </nav>
  )
}
