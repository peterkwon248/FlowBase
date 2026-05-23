// FlowBase V2 — Workspace 모드 (Schema · Automations)
// 출처: design-ref/prototype/prototype-app.jsx — activeWorkspaceItem
// 설계: docs/02-design/features/flowbase-v2-library.design.md (Workspace)

"use client"

import { type LucideIcon, Network, Zap } from "lucide-react"
import { SchemaView } from "@/components/sections/schema-view"
import { AutomationsView } from "@/components/workspace/automations-view"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { ActiveWorkspaceItem } from "@/types/flowbase"

const ITEMS: { id: ActiveWorkspaceItem; label: string; Icon: LucideIcon }[] = [
  { id: "schema", label: "Schema", Icon: Network },
  { id: "automations", label: "Automations", Icon: Zap },
]

export function WorkspaceMode() {
  const activeWorkspaceItem = useFlowBase((s) => s.activeWorkspaceItem)
  const setActiveWorkspaceItem = useFlowBase((s) => s.setActiveWorkspaceItem)

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* 탭 */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border-subtle px-4 py-2">
        {ITEMS.map(({ id, label, Icon }) => {
          const active = id === activeWorkspaceItem
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveWorkspaceItem(id)}
              data-workspace-item={id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                active
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.75} />
              {label}
            </button>
          )
        })}
      </div>

      {/* 콘텐츠 */}
      {activeWorkspaceItem === "automations" ? (
        <AutomationsView />
      ) : (
        <SchemaView />
      )}
    </div>
  )
}
