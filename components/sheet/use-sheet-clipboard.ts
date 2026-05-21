// FlowBase V2 — 시트 복사/붙여넣기 (M5 이식)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §9
// 출처: components/sections/sheet/useSheetClipboard.ts — Field → ColumnDef · 제네릭 row 어댑트
//
// 단일 셀 ⌘C / 시작 셀부터 TSV 매트릭스 ⌘V. 다중 범위 선택은 후속.
// 가드: id·reaction·button 셀 건너뜀 · coerce 실패 셀 건너뜀 + console.warn · 범위 초과 무시.

"use client"

import { useEffect, type RefObject } from "react"
import type { CellCoord, ColumnDef, TableRow } from "@/types/flowbase"
import type { EditingCell } from "./use-sheet-keyboard"
import { isEditableColumn } from "./use-sheet-keyboard"

interface UseSheetClipboardOptions {
  enabled: boolean
  columns: ColumnDef[]
  rows: TableRow[]
  focusedCell: CellCoord | null
  editingCell: EditingCell | null
  containerRef: RefObject<HTMLElement | null>
  onCellCommit: (rowId: string, colName: string, value: unknown) => void
}

export function useSheetClipboard(opts: UseSheetClipboardOptions): void {
  const {
    enabled,
    columns,
    rows,
    focusedCell,
    editingCell,
    containerRef,
    onCellCommit,
  } = opts

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

    const handleKey = async (e: KeyboardEvent) => {
      if (editingCell) return // 편집 모드는 native Ctrl+C/V
      if (!focusedCell) return
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.shiftKey || e.altKey) return

      if (e.key === "c" || e.key === "C") {
        e.preventDefault()
        await handleCopy()
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault()
        await handlePaste()
      }
    }

    const handleCopy = async () => {
      if (!focusedCell) return
      const row = rows.find((r) => r.id === focusedCell.row)
      if (!row) return
      const v = row[focusedCell.col]
      try {
        await navigator.clipboard.writeText(formatForClipboard(v))
      } catch (err) {
        console.warn("[sheet-view] clipboard.writeText 실패:", err)
      }
    }

    const handlePaste = async () => {
      if (!focusedCell) return
      let text: string
      try {
        text = await navigator.clipboard.readText()
      } catch (err) {
        console.warn("[sheet-view] clipboard.readText 실패:", err)
        return
      }
      const matrix = parseClipboardTSV(text)
      if (matrix.length === 0) return

      const startRowIdx = rows.findIndex((r) => r.id === focusedCell.row)
      const startColIdx = columns.findIndex((c) => c.name === focusedCell.col)
      if (startRowIdx < 0 || startColIdx < 0) return

      matrix.forEach((rowCells, rOff) => {
        const targetRowIdx = startRowIdx + rOff
        if (targetRowIdx >= rows.length) return
        rowCells.forEach((cellText, cOff) => {
          const targetColIdx = startColIdx + cOff
          if (targetColIdx >= columns.length) return
          const targetCol = columns[targetColIdx]
          if (!isEditableColumn(targetCol)) return
          const coerced = coerceForPaste(cellText, targetCol.type)
          if (coerced === COERCE_FAILED) {
            console.warn(
              `[sheet-view] paste skip — ${targetCol.name} (${targetCol.type}) coerce 실패: "${cellText}"`,
            )
            return
          }
          onCellCommit(rows[targetRowIdx].id, targetCol.name, coerced)
        })
      })
    }

    el.addEventListener("keydown", handleKey)
    return () => el.removeEventListener("keydown", handleKey)
  }, [enabled, columns, rows, focusedCell, editingCell, containerRef, onCellCommit])
}

function formatForClipboard(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function parseClipboardTSV(text: string): string[][] {
  if (!text) return []
  const trimmed = text.replace(/\r?\n$/, "")
  return trimmed.split(/\r?\n/).map((line) => line.split("\t"))
}

const COERCE_FAILED = Symbol("coerce-failed") as unknown as never

function coerceForPaste(text: string, colType: string): unknown {
  const trimmed = text.trim()
  if (trimmed === "") return null
  switch (colType) {
    case "num": {
      const n = Number(trimmed)
      if (Number.isNaN(n)) return COERCE_FAILED
      return n
    }
    // reaction/button은 isEditableColumn에서 이미 걸러짐 — text/date/select/status/avatar/email은 문자열 그대로
    default:
      return trimmed
  }
}
