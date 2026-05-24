// FlowBase V2 — Workspace 사이드바 (Schema · Automations)
// 출처: design-ref/prototype/library-view.jsx WorkspaceSidebar (line 1811)
//
// 두 항목 + 헤더/푸터. activeWorkspaceItem 구동. panels.sidebar 토글에
// 따라 노출/숨김 (Tables/Library/Wiki와 동일).

"use client"

import { Layers, Network, Zap, type LucideIcon } from "lucide-react"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { ActiveWorkspaceItem } from "@/types/flowbase"

interface Item {
  id: ActiveWorkspaceItem
  label: string
  desc: string
  Icon: LucideIcon
}

const ITEMS: Item[] = [
  {
    id: "schema",
    label: "Schema",
    desc: "Tables · Fields · Relations",
    Icon: Network,
  },
  {
    id: "automations",
    label: "Automations",
    desc: "Cross-table triggers · WHEN-THEN",
    Icon: Zap,
  },
]

export function WorkspaceSidebar() {
  const active = useFlowBase((s) => s.activeWorkspaceItem)
  const setActive = useFlowBase((s) => s.setActiveWorkspaceItem)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border-subtle bg-surface text-[13px]">
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5">
        <span className="flex size-5 items-center justify-center rounded bg-chart-4/15 text-chart-4">
          <Layers className="size-3" strokeWidth={1.75} />
        </span>
        <span className="text-[13px] font-semibold">Workspace</span>
      </div>

      <div className="flex-1 px-2 py-2">
        {ITEMS.map(({ id, label, desc, Icon }) => {
          const on = id === active
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              data-workspace-item={id}
              className={cn(
                "relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                on
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              )}
            >
              {on && (
                <span className="absolute inset-y-2 left-1 w-0.5 rounded bg-primary" />
              )}
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  on ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={1.75}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "text-[13px]",
                    on ? "font-semibold" : "font-medium",
                  )}
                >
                  {label}
                </div>
                <div className="truncate text-[10.5px] text-muted-foreground">
                  {desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="border-t border-border-subtle px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Where structure and
        <br />
        behavior are designed.
      </div>
    </aside>
  )
}
