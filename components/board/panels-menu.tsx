// FlowBase V2 — 패널 토글 햄버거 메뉴
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §5
// 출처: design-ref/prototype/prototype-shell.jsx PanelsMenu
//
// 4개 패널(activityBar/sidebar/detailBar/aiPanel) 체크 토글 + Show/Hide all.

"use client"

import { Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFlowBase } from "@/lib/flowbase-store"

export function PanelsMenu() {
  const panels = useFlowBase((s) => s.panels)
  const togglePanel = useFlowBase((s) => s.togglePanel)
  const showAllPanels = useFlowBase((s) => s.showAllPanels)
  const hideAllPanels = useFlowBase((s) => s.hideAllPanels)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="패널"
          className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-foreground/[0.05]"
        >
          <Menu className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          패널
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          data-panel-id="activityBar"
          checked={panels.activityBar}
          onCheckedChange={() => togglePanel("activityBar")}
        >
          Activity bar
          <DropdownMenuShortcut>⌘⇧A</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          data-panel-id="sidebar"
          checked={panels.sidebar}
          onCheckedChange={() => togglePanel("sidebar")}
        >
          Sidebar
          <DropdownMenuShortcut>⌘⇧F</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          data-panel-id="detailBar"
          checked={panels.detailBar}
          onCheckedChange={() => togglePanel("detailBar")}
        >
          Detail bar
          <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          data-panel-id="aiPanel"
          checked={panels.aiPanel}
          onCheckedChange={() => togglePanel("aiPanel")}
        >
          AI panel
          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => showAllPanels()}>
          패널 모두 표시
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => hideAllPanels()}>
          패널 모두 숨김
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
