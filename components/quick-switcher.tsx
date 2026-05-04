// visual mockup: workspace-ux (logic-free)
"use client"

import { useState } from "react"
import {
  Table2,
  Plus,
  Trash2,
  BarChart3,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  WORKSPACES,
  ACTIVE_WORKSPACE_ID,
  workspaceColorDotClass,
} from "@/lib/mock-workspaces"
import { SCHEMA } from "@/lib/mock-data"

interface QuickSwitcherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickSwitcher({ open, onOpenChange }: QuickSwitcherProps) {
  const [search, setSearch] = useState("")

  const activeWorkspaceTables = SCHEMA // In real app, filter by active workspace

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="빠른 전환"
      description="워크스페이스, 테이블, 액션을 검색하세요"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="검색..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>결과가 없습니다.</CommandEmpty>

        {/* Workspaces */}
        <CommandGroup heading="워크스페이스">
          {WORKSPACES.filter((w) => !w.archived).map((workspace) => {
            const isActive = workspace.id === ACTIVE_WORKSPACE_ID
            return (
              <CommandItem
                key={workspace.id}
                value={`workspace-${workspace.name}`}
                onSelect={() => {
                  console.log("switch to workspace:", workspace.id)
                  onOpenChange(false)
                }}
                className={cn(isActive && "bg-foreground/[0.03]")}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    workspaceColorDotClass(workspace.color)
                  )}
                />
                <span className={cn(isActive && "font-semibold")}>
                  {workspace.name}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {workspace.tables}개 테이블
                </span>
                {isActive && (
                  <CommandShortcut>활성</CommandShortcut>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Tables in active workspace */}
        <CommandGroup heading="테이블">
          {activeWorkspaceTables.map((table) => (
            <CommandItem
              key={table.id}
              value={`table-${table.label}-${table.en}`}
              onSelect={() => {
                console.log("navigate to table:", table.id)
                onOpenChange(false)
              }}
            >
              <Table2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <span>{table.label}</span>
              <span className="text-xs text-muted-foreground ml-1">
                {table.en}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="액션">
          <CommandItem
            value="action-new-workspace"
            onSelect={() => {
              console.log("create new workspace")
              onOpenChange(false)
            }}
          >
            <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span>새 워크스페이스</span>
          </CommandItem>
          <CommandItem
            value="action-dashboard"
            onSelect={() => {
              console.log("navigate to dashboard")
              onOpenChange(false)
            }}
          >
            <BarChart3 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span>통합 대시보드</span>
          </CommandItem>
          <CommandItem
            value="action-trash"
            onSelect={() => {
              console.log("navigate to trash")
              onOpenChange(false)
            }}
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span>휴지통 열기</span>
          </CommandItem>
          <CommandItem
            value="action-settings"
            onSelect={() => {
              console.log("navigate to settings")
              onOpenChange(false)
            }}
          >
            <Settings className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span>설정</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Footer hints */}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 font-mono text-[10px]">
            Tab
          </kbd>
          <span>그룹 이동</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 font-mono text-[10px]">
            Enter
          </kbd>
          <span>선택</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 font-mono text-[10px]">
            Esc
          </kbd>
          <span>닫기</span>
        </div>
      </div>
    </CommandDialog>
  )
}
