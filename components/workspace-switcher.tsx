// visual mockup: workspace-ux (logic-free)
"use client"

import { useState } from "react"
import {
  Database,
  ChevronDown,
  Search,
  Check,
  Plus,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

interface WorkspaceSwitcherProps {
  collapsed?: boolean
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const activeWorkspace = getActiveWorkspace()
  const filteredWorkspaces = WORKSPACES.filter(
    (w) =>
      !w.archived &&
      w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mx-auto"
          >
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.5} />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          className="w-64 p-0"
          sideOffset={8}
        >
          <WorkspaceSwitcherContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredWorkspaces={filteredWorkspaces}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded-md",
            "hover:bg-foreground/5 transition-colors text-left"
          )}
        >
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Database className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-sidebar-foreground">FlowDB</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
            </div>
            {activeWorkspace && (
              <span className="text-xs text-muted-foreground truncate block">
                {activeWorkspace.name}
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-64 p-0"
        sideOffset={4}
      >
        <WorkspaceSwitcherContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredWorkspaces={filteredWorkspaces}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

interface WorkspaceSwitcherContentProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredWorkspaces: typeof WORKSPACES
  onClose: () => void
}

function WorkspaceSwitcherContent({
  searchQuery,
  setSearchQuery,
  filteredWorkspaces,
  onClose,
}: WorkspaceSwitcherContentProps) {
  return (
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
                onClose()
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
            onClose()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-foreground/5 transition-colors"
        >
          <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <span>새 워크스페이스</span>
        </button>
        <button
          onClick={() => {
            console.log("navigate /workspaces")
            onClose()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-foreground/5 transition-colors"
        >
          <ArrowRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <span>전체 관리</span>
        </button>
      </div>

      {/* Hint */}
      <div className="border-t border-border/60 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          Cmd+P 빠른 전환
        </span>
      </div>
    </div>
  )
}
