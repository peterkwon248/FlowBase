// visual mockup: workspace-ux (logic-free)
"use client"

import { useState } from "react"
import { ChevronDown, Search, Check, Plus, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  WORKSPACES,
  ACTIVE_WORKSPACE_ID,
  getActiveWorkspace,
  workspaceColorDotClass,
} from "@/lib/mock-workspaces"
import { SCHEMA } from "@/lib/mock-data"

interface BreadcrumbBarProps {
  activeSection: string
  activeTable?: string
}

const SECTION_LABELS: Record<string, string> = {
  design: "설계",
  data: "데이터",
  operations: "운영",
}

export function BreadcrumbBar({ activeSection, activeTable }: BreadcrumbBarProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const activeWorkspace = getActiveWorkspace()
  const sectionLabel = SECTION_LABELS[activeSection] || activeSection
  const tableLabel = activeTable
    ? SCHEMA.find((t) => t.id === activeTable)?.label || activeTable
    : null

  const filteredWorkspaces = WORKSPACES.filter(
    (w) =>
      !w.archived &&
      w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-12 px-4 flex items-center gap-2 border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
      {/* Workspace dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md",
              "hover:bg-foreground/5 transition-colors text-left"
            )}
          >
            {activeWorkspace && (
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  workspaceColorDotClass(activeWorkspace.color)
                )}
              />
            )}
            <span className="text-sm font-medium">
              {activeWorkspace?.name || "워크스페이스"}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="w-64 p-0"
          sideOffset={4}
        >
          <div className="flex flex-col">
            {/* Search */}
            <div className="p-2 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  placeholder="워크스페이스 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>

            {/* Workspace List */}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredWorkspaces.map((workspace) => {
                const isActive = workspace.id === ACTIVE_WORKSPACE_ID
                return (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      console.log("switch to workspace:", workspace.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-left",
                      "hover:bg-foreground/5 transition-colors",
                      isActive && "bg-foreground/[0.03]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        workspaceColorDotClass(workspace.color)
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-sm block truncate",
                          isActive ? "font-semibold" : "font-medium"
                        )}
                      >
                        {workspace.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {workspace.tables}개 테이블
                      </span>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Actions */}
            <div className="border-t border-border/60 py-1">
              <button
                onClick={() => {
                  console.log("create new workspace")
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-foreground/5 transition-colors"
              >
                <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span>새 워크스페이스</span>
              </button>
              <button
                onClick={() => {
                  console.log("navigate /workspaces")
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-foreground/5 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span>전체 관리</span>
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Separator */}
      <span className="text-muted-foreground/40">/</span>

      {/* Section */}
      <button
        onClick={() => console.log("navigate to section:", activeSection)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {sectionLabel}
      </button>

      {/* Table (if present) */}
      {tableLabel && (
        <>
          <span className="text-muted-foreground/40">/</span>
          <button
            onClick={() => console.log("navigate to table:", activeTable)}
            className="text-sm text-foreground font-medium hover:text-foreground/80 transition-colors"
          >
            {tableLabel}
          </button>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Cmd+P hint */}
      <button
        onClick={() => console.log("open quick-switcher")}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
      >
        <kbd className="text-[10px] font-medium text-muted-foreground px-1 py-0.5 rounded bg-background border border-border/60">
          Cmd
        </kbd>
        <kbd className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-background border border-border/60">
          P
        </kbd>
      </button>
    </div>
  )
}
