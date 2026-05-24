// FlowBase V2 — Bulk edit 메뉴 (선택 행 값 일괄 설정)
// 출처 컨셉: design-ref/prototype/add-column.jsx BulkEditMenu
//
// 다중 선택 시 노출. status/select 컬럼 + 그 값 sub menu → 선택 행 모두 updateRow.

"use client"

import { useMemo } from "react"
import { Check, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { toast } from "sonner"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { STATUS_LABELS, type ColumnDef, type TableRow } from "@/types/flowbase"

function isEditableViaBulk(col: ColumnDef): boolean {
  return col.type === "status" || col.type === "select"
}

function valuesForCol(col: ColumnDef, rows: TableRow[]): string[] {
  if (col.type === "status") {
    return ["미처리", "진행중", "대기", "완료"]
  }
  const defined = col.options ?? []
  const set = new Set<string>(defined)
  for (const r of rows) {
    const v = r[col.name]
    if (typeof v === "string" && v) set.add(v)
  }
  return Array.from(set)
}

export function BulkEditMenu() {
  const board = useFlowBase(selectActiveBoard)
  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const updateRow = useFlowBase((s) => s.updateRow)

  const editableCols = useMemo(() => {
    if (!board) return []
    return board.columns.filter(isEditableViaBulk)
  }, [board])

  if (!board || selectedRowIds.length < 2 || editableCols.length === 0) {
    return null
  }

  const handleSet = (col: ColumnDef, value: string) => {
    for (const id of selectedRowIds) {
      updateRow(id, { [col.name]: value })
    }
    const label = col.type === "status"
      ? (STATUS_LABELS[value as keyof typeof STATUS_LABELS] ?? value)
      : value
    toast.success(
      `Set ${col.label || col.name} = ${label} on ${selectedRowIds.length} rows`,
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-action="bulk-edit"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
        >
          <Pencil className="size-3" strokeWidth={1.75} />
          Set…
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          Set on {selectedRowIds.length} rows
        </DropdownMenuLabel>
        {editableCols.map((col) => {
          const Icon = TYPE_ICON[col.type]
          const values = valuesForCol(col, board.rows)
          return (
            <DropdownMenuSub key={col.name}>
              <DropdownMenuSubTrigger className="gap-2">
                <Icon
                  className="size-3.5 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <span>{col.label || col.name}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                className="w-44"
                data-bulk-edit-col={col.name}
              >
                {values.map((v) => {
                  const label =
                    col.type === "status"
                      ? (STATUS_LABELS[v as keyof typeof STATUS_LABELS] ?? v)
                      : v
                  return (
                    <DropdownMenuItem
                      key={v}
                      onSelect={() => handleSet(col, v)}
                      className="gap-2"
                      data-bulk-edit-value={v}
                    >
                      <Check className="size-3 opacity-0" />
                      <span className="flex-1">{label}</span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
