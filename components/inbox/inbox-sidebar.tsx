// FlowBase V2 — Inbox 사이드바 (필터 카테고리)
// 출처: design-ref/prototype/inbox-view.jsx InboxSidebar (line 289)
//
// kind별 카운트 + 활성 필터 강조. inbox-view에서 filter state를 prop으로 전달받음.

"use client"

import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Inbox as InboxIcon,
  Info,
  Lightbulb,
  type LucideIcon,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type InboxFilter = "all" | "alert" | "warn" | "ai" | "info" | "tip" | "log"

interface SidebarItem {
  id: InboxFilter
  label: string
  Icon: LucideIcon
  iconClass: string
}

const ITEMS: SidebarItem[] = [
  { id: "all", label: "All", Icon: InboxIcon, iconClass: "text-primary" },
  {
    id: "alert",
    label: "Alerts",
    Icon: AlertCircle,
    iconClass: "text-destructive",
  },
  {
    id: "warn",
    label: "Warnings",
    Icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  { id: "ai", label: "AI", Icon: Sparkles, iconClass: "text-primary" },
  {
    id: "info",
    label: "Info",
    Icon: Info,
    iconClass: "text-chart-3",
  },
  {
    id: "tip",
    label: "Tips",
    Icon: Lightbulb,
    iconClass: "text-muted-foreground",
  },
  {
    id: "log",
    label: "Activity log",
    Icon: FileText,
    iconClass: "text-muted-foreground",
  },
]

export function InboxSidebar({
  filter,
  onFilter,
  counts,
}: {
  filter: InboxFilter
  onFilter: (f: InboxFilter) => void
  counts: Record<string, number>
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border-subtle bg-surface text-[13px]">
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5">
        <span className="flex size-5 items-center justify-center rounded bg-primary/15 text-primary">
          <InboxIcon className="size-3" strokeWidth={1.75} />
        </span>
        <span className="text-[13px] font-semibold">Inbox</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="mb-1 px-2.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Inbox
        </div>
        {ITEMS.map(({ id, label, Icon, iconClass }) => {
          const on = filter === id
          const count = counts[id] ?? 0
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilter(id)}
              data-inbox-filter={id}
              className={cn(
                "relative flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors",
                on
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              )}
            >
              {on && (
                <span className="absolute inset-y-1.5 left-1 w-0.5 rounded bg-primary" />
              )}
              <Icon
                className={cn("size-3.5 shrink-0", iconClass)}
                strokeWidth={1.75}
              />
              <span className={cn("flex-1", on && "font-semibold text-foreground")}>
                {label}
              </span>
              {count > 0 && (
                <span className="text-[10.5px] tabular-nums text-muted-foreground">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="border-t border-border-subtle px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Suggestions, alerts,
        <br />
        all in one place.
      </div>
    </aside>
  )
}
