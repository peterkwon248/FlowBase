// FlowBase V2 — 행 우클릭 컨텍스트 메뉴
// 출처 컨셉: design-ref/prototype/context-menu.jsx
//
// 어떤 행에서 우클릭하든: 그 행을 선택 상태로 만들고(이미 선택돼 있으면 유지)
// 메뉴 노출. 액션: Open in detail bar · Duplicate · Copy ID · Delete.

"use client"

import type { ReactNode } from "react"
import { Copy, Eye, FilePlus2, Sparkles, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { selectActiveBoard, selectIsViewer, useFlowBase } from "@/lib/flowbase-store"
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
  const isViewer = useFlowBase(selectIsViewer)
  const board = useFlowBase(selectActiveBoard)
  const updateRow = useFlowBase((s) => s.updateRow)

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

  // G6-1: AI cell suggest — 행의 첫 빈 cell 찾아 AI 호출 → toast Apply.
  // text/select/multiSelect/email/date/num만 대상 (avatar/reaction/button/fk skip).
  const handleAiSuggest = async () => {
    if (!board) return
    const row = board.rows.find((r) => r.id === rowId)
    if (!row) return
    const eligibleTypes = ["text", "select", "multiSelect", "email", "date", "num"]
    const emptyCol = board.columns.find((c) => {
      if (!eligibleTypes.includes(c.type)) return false
      if (c.name === "id") return false
      const v = row[c.name]
      if (v == null || v === "") return true
      if (Array.isArray(v) && v.length === 0) return true
      return false
    })
    if (!emptyCol) {
      toast.info("No empty cell to fill in this row")
      return
    }
    const tid = toast.loading(`Suggesting value for ${emptyCol.label || emptyCol.name}…`)
    try {
      // column sample (다른 row의 같은 col 값)
      const colSamples: string[] = []
      for (const r of board.rows.slice(0, 30)) {
        if (r.id === rowId) continue
        const v = r[emptyCol.name]
        if (v == null || v === "") continue
        const s = Array.isArray(v) ? v.join(", ") : String(v)
        if (s) colSamples.push(s)
        if (colSamples.length >= 10) break
      }
      // row context (id 외 다른 cell value)
      const rowContext: Record<string, unknown> = {}
      for (const c of board.columns) {
        if (c.name === emptyCol.name || c.name === "id") continue
        const v = row[c.name]
        if (v != null && v !== "") rowContext[c.name] = v
      }
      const res = await fetch("/api/ai/suggest-cell-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardLabel: board.label,
          columnName: emptyCol.name,
          columnLabel: emptyCol.label,
          columnType: emptyCol.type,
          columnOptions: emptyCol.options,
          rowContext,
          columnSamples: colSamples,
        }),
      })
      const data = (await res.json()) as { value?: string; error?: string }
      toast.dismiss(tid)
      if (!res.ok || !data.value) {
        toast.error(data.error || "AI suggestion failed")
        return
      }
      // multiSelect는 splitMultiValue 패턴 (lib/multi-select), select/text/date/num/email은 raw string
      toast(`Suggested: "${data.value}"`, {
        description: `For ${emptyCol.label || emptyCol.name} (${emptyCol.type})`,
        duration: 12000,
        action: {
          label: "Apply",
          onClick: () => {
            if (emptyCol.type === "multiSelect") {
              const arr = data.value!
                .split(/[,;|]/)
                .map((s) => s.trim())
                .filter(Boolean)
              updateRow(rowId, { [emptyCol.name]: arr })
            } else {
              updateRow(rowId, { [emptyCol.name]: data.value })
            }
            toast.success(`Filled ${emptyCol.label || emptyCol.name}`)
          },
        },
      })
    } catch (err) {
      toast.dismiss(tid)
      toast.error(err instanceof Error ? err.message : "AI call failed")
    }
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
        <ContextMenuItem
          onSelect={handleDuplicate}
          disabled={isViewer}
          className="gap-2"
        >
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
        <ContextMenuItem
          onSelect={handleAiSuggest}
          disabled={isViewer}
          className="gap-2"
          data-action="row-ai-suggest"
        >
          <Sparkles className="size-3.5 text-primary" strokeWidth={1.75} />
          <span>Suggest empty value (AI)</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={handleDelete}
          disabled={isViewer}
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
