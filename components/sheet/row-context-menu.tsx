// FlowBase V2 — 행 우클릭 컨텍스트 메뉴
// 출처 컨셉: design-ref/prototype/context-menu.jsx
//
// 어떤 행에서 우클릭하든: 그 행을 선택 상태로 만들고(이미 선택돼 있으면 유지)
// 메뉴 노출. 액션: Open in detail bar · Duplicate · Copy ID · Delete.

"use client"

import type { ReactNode } from "react"
import { Copy, Eye, FilePlus2, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useFlowBase } from "@/lib/flowbase-store"
import { toast } from "sonner"

interface RowContextMenuProps {
  rowId: string
  children: ReactNode
}

export function RowContextMenu({ rowId, children }: RowContextMenuProps) {
  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const setSelected = useFlowBase((s) => s.setSelected)
  const deleteRows = useFlowBase((s) => s.deleteRows)
  const duplicateRow = useFlowBase((s) => s.duplicateRow)
  const togglePanel = useFlowBase((s) => s.togglePanel)
  const panels = useFlowBase((s) => s.panels)

  // 메뉴 열릴 때 호출 — 우클릭 행이 선택에 없으면 선택 교체, 있으면 유지.
  const ensureSelected = () => {
    if (!selectedRowIds.includes(rowId)) {
      setSelected([rowId])
    }
  }

  // 다중 선택일 때는 그 모두에 적용, 단일 우클릭이면 그 행만
  const targets = (): string[] => {
    if (selectedRowIds.includes(rowId) && selectedRowIds.length > 1) {
      return selectedRowIds
    }
    return [rowId]
  }

  const handleOpenDetail = () => {
    setSelected([rowId])
    if (!panels.detailBar) togglePanel("detailBar")
  }

  const handleDuplicate = () => {
    const t = targets()
    t.forEach((id) => duplicateRow(id))
    toast.success(`${t.length} row${t.length > 1 ? "s" : ""} duplicated`)
  }

  const handleCopyId = async () => {
    const t = targets()
    const text = t.join(", ")
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Copied ${text}`)
    } catch {
      toast.error("Clipboard write failed")
    }
  }

  const handleDelete = () => {
    const t = targets()
    deleteRows(t)
    toast.success(`${t.length} row${t.length > 1 ? "s" : ""} deleted (⌘Z to undo)`)
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (open) ensureSelected()
      }}
    >
      <ContextMenuTrigger asChild data-row-context-trigger={rowId}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onSelect={handleOpenDetail} className="gap-2">
          <Eye className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span>Open in detail bar</span>
          <ContextMenuShortcut>⌘I</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleDuplicate} className="gap-2">
          <FilePlus2
            className="size-3.5 text-muted-foreground"
            strokeWidth={1.75}
          />
          <span>Duplicate</span>
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleCopyId} className="gap-2">
          <Copy className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span>Copy ID</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={handleDelete}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          <span>Delete</span>
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
