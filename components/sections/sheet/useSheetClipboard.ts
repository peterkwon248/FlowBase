// design.md §6 useSheetClipboard — M5
// 단일 셀 복사/붙여넣기 + 클립보드 TSV 파싱 시 시작 셀부터 fields 순서대로 채움
// 다중 셀 범위 선택 (Shift+화살표/Click)은 후속 PR
//
// TSV 패턴 (Excel/Sheets 호환):
//   - 컬럼 구분: \t
//   - 행 구분: \n (또는 \r\n — readClipboard에서 normalize)
//   - 셀 안의 줄바꿈/탭은 escape ❌ (단순 TSV)
//
// 가드:
//   - uuid / pk / fk 셀은 건너뜀 (붙여넣기 시)
//   - type coerce 실패 셀도 건너뜀 + console.warn
//   - 범위 초과 (rows/fields 끝) 무시

"use client"

import { useEffect, type RefObject } from "react"
import type { Field } from "@/lib/mock-data"
import type { CellCoord } from "./useSheetKeyboardNav"
import { isEditableField } from "./SheetCell"

interface UseSheetClipboardOptions<TRow extends { id: string }> {
  enabled: boolean
  fields: Field[]
  rows: TRow[]
  focusedCell: CellCoord | null
  editingCell: CellCoord | null
  containerRef: RefObject<HTMLElement | null>
  rowValue: (row: TRow, fieldName: string) => unknown
  onCellCommit: (rowId: string, fieldName: string, value: unknown) => void
}

export function useSheetClipboard<TRow extends { id: string }>(
  opts: UseSheetClipboardOptions<TRow>,
): void {
  const {
    enabled,
    fields,
    rows,
    focusedCell,
    editingCell,
    containerRef,
    rowValue,
    onCellCommit,
  } = opts

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

    const handleKey = async (e: KeyboardEvent) => {
      // 편집 모드는 입력기가 자체 처리 (브라우저 native Ctrl+C/V)
      if (editingCell) return
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
      const row = rows.find((r) => r.id === focusedCell.rowId)
      if (!row) return
      const v = rowValue(row, focusedCell.fieldName)
      const tsv = formatForClipboard(v)
      try {
        await navigator.clipboard.writeText(tsv)
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

      const startRowIdx = rows.findIndex((r) => r.id === focusedCell.rowId)
      const startFieldIdx = fields.findIndex(
        (f) => f.name === focusedCell.fieldName,
      )
      if (startRowIdx < 0 || startFieldIdx < 0) return

      matrix.forEach((rowCells, rOff) => {
        const targetRowIdx = startRowIdx + rOff
        if (targetRowIdx >= rows.length) return
        rowCells.forEach((cellText, cOff) => {
          const targetFieldIdx = startFieldIdx + cOff
          if (targetFieldIdx >= fields.length) return
          const targetField = fields[targetFieldIdx]
          if (!isEditableField(targetField)) return
          const coerced = coerceForPaste(cellText, targetField.type)
          if (coerced === COERCE_FAILED) {
            console.warn(
              `[sheet-view] paste skip — ${targetField.name} (${targetField.type}) coerce 실패: "${cellText}"`,
            )
            return
          }
          const targetRow = rows[targetRowIdx]
          onCellCommit(targetRow.id, targetField.name, coerced)
        })
      })
    }

    el.addEventListener("keydown", handleKey)
    return () => el.removeEventListener("keydown", handleKey)
  }, [enabled, fields, rows, focusedCell, editingCell, containerRef, rowValue, onCellCommit])
}

// ─────────────────────────────────────────────────────────────────
// TSV serialization helpers
// ─────────────────────────────────────────────────────────────────

function formatForClipboard(value: unknown): string {
  if (value == null) return ""
  return String(value)
}

function parseClipboardTSV(text: string): string[][] {
  if (!text) return []
  // 끝 줄바꿈 trim
  const trimmed = text.replace(/\r?\n$/, "")
  return trimmed.split(/\r?\n/).map((line) => line.split("\t"))
}

const COERCE_FAILED = Symbol("coerce-failed") as unknown as never

function coerceForPaste(text: string, fieldType: string): unknown {
  const trimmed = text.trim()
  if (trimmed === "") return null
  switch (fieldType) {
    case "number": {
      const n = Number(trimmed)
      if (Number.isNaN(n)) return COERCE_FAILED
      return n
    }
    case "datetime": {
      const d = new Date(trimmed)
      if (isNaN(d.getTime())) return COERCE_FAILED
      return d.toISOString()
    }
    default:
      return trimmed
  }
}
