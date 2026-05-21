// FlowBase V2 — 시트 키보드 네비게이션 (M4 이식)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §9
// 출처: components/sections/sheet/useSheetKeyboardNav.ts — Field → ColumnDef · 제네릭 row 어댑트
//
// 비편집 모드:
//   ArrowUp/Down/Left/Right → focusedCell 이동
//   Tab / Shift+Tab          → 다음/이전 편집 가능 셀
//   Enter / F2 / Space       → 편집 시작 (편집 가능 컬럼)
//   Esc                      → focus 해제
//   Delete / Backspace       → 빈 값 commit
//   일반 문자 키              → 편집 시작 + initialDraft (text/avatar)
// 편집 모드는 입력기/Popover가 자체 처리.

"use client"

import { useEffect, type RefObject } from "react"
import type { CellCoord, ColumnDef, TableRow } from "@/types/flowbase"

export type EditingCell = { row: string; col: string; initialDraft?: string }

// 편집 가능 컬럼 — id(read-only)·reaction·button 제외
export function isEditableColumn(col: ColumnDef): boolean {
  if (col.name === "id") return false
  if (col.type === "reaction" || col.type === "button") return false
  return true
}

// 문자키로 즉시 편집 시작 가능한 텍스트 입력 계열
function isTextInputColumn(col: ColumnDef): boolean {
  return col.type === "text" || col.type === "avatar"
}

interface UseSheetKeyboardOptions {
  enabled: boolean
  columns: ColumnDef[]
  rows: TableRow[]
  editingCell: EditingCell | null
  focusedCell: CellCoord | null
  setEditingCell: (cell: EditingCell | null) => void
  setFocusedCell: (cell: CellCoord | null) => void
  onCellCommit: (rowId: string, colName: string, value: unknown) => void
  containerRef: RefObject<HTMLElement | null>
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

// Tab/Shift+Tab — 다음/이전 편집 가능 셀 (행 끝이면 다음 행 첫 컬럼)
export function nextEditableColumn(
  columns: ColumnDef[],
  colIdx: number,
  rowIdx: number,
  rowsLen: number,
  reverse: boolean,
): { rowIdx: number; colIdx: number } | null {
  const step = reverse ? -1 : 1
  let r = rowIdx
  let c = colIdx + step
  const maxIter = columns.length * rowsLen + 1
  let iter = 0

  while (iter < maxIter) {
    iter += 1
    if (c < 0) {
      r -= 1
      if (r < 0) return null
      c = columns.length - 1
    } else if (c >= columns.length) {
      r += 1
      if (r >= rowsLen) return null
      c = 0
    }
    if (isEditableColumn(columns[c])) return { rowIdx: r, colIdx: c }
    c += step
  }
  return null
}

export function useSheetKeyboard(opts: UseSheetKeyboardOptions): void {
  const {
    enabled,
    columns,
    rows,
    editingCell,
    focusedCell,
    setEditingCell,
    setFocusedCell,
    onCellCommit,
    containerRef,
  } = opts

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.isComposing) return
      if (editingCell) return // 편집 모드는 입력기/Popover가 처리
      if (rows.length === 0 || columns.length === 0) return

      // focus 부재 — 네비/편집 키 입력 시 첫 셀 진입
      if (!focusedCell) {
        const navKeys = new Set([
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
          "Enter",
          "F2",
          " ",
        ])
        if (navKeys.has(e.key)) {
          e.preventDefault()
          setFocusedCell({ row: rows[0].id, col: columns[0].name })
        }
        return
      }

      const rowIdx = rows.findIndex((r) => r.id === focusedCell.row)
      const colIdx = columns.findIndex((c) => c.name === focusedCell.col)
      // stale focus (필터/정렬 후 행/컬럼 사라짐)
      if (rowIdx < 0 || colIdx < 0) {
        setFocusedCell(null)
        return
      }
      const currentCol = columns[colIdx]

      const moveTo = (r: number, c: number) => {
        const rr = clamp(r, 0, rows.length - 1)
        const cc = clamp(c, 0, columns.length - 1)
        setFocusedCell({ row: rows[rr].id, col: columns[cc].name })
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          moveTo(rowIdx - 1, colIdx)
          break
        case "ArrowDown":
          e.preventDefault()
          moveTo(rowIdx + 1, colIdx)
          break
        case "ArrowLeft":
          e.preventDefault()
          moveTo(rowIdx, colIdx - 1)
          break
        case "ArrowRight":
          e.preventDefault()
          moveTo(rowIdx, colIdx + 1)
          break
        case "Tab": {
          e.preventDefault()
          const next = nextEditableColumn(
            columns,
            colIdx,
            rowIdx,
            rows.length,
            e.shiftKey,
          )
          if (next) {
            setFocusedCell({
              row: rows[next.rowIdx].id,
              col: columns[next.colIdx].name,
            })
          }
          break
        }
        case "Enter":
        case "F2":
        case " ":
          if (isEditableColumn(currentCol)) {
            e.preventDefault()
            setEditingCell({ row: focusedCell.row, col: focusedCell.col })
          }
          break
        case "Escape":
          e.preventDefault()
          setFocusedCell(null)
          break
        case "Delete":
        case "Backspace":
          if (isEditableColumn(currentCol)) {
            e.preventDefault()
            // 글로벌 단축키(선택 행 삭제)와 충돌 방지 — 셀 포커스 시 셀 비우기가 우선
            e.stopPropagation()
            onCellCommit(focusedCell.row, focusedCell.col, null)
          }
          break
        default: {
          // 일반 문자 키 → 편집 시작 + initialDraft (text/avatar만)
          if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            isEditableColumn(currentCol) &&
            isTextInputColumn(currentCol)
          ) {
            e.preventDefault()
            setEditingCell({
              row: focusedCell.row,
              col: focusedCell.col,
              initialDraft: e.key,
            })
          }
          break
        }
      }
    }

    el.addEventListener("keydown", handleKey)
    return () => el.removeEventListener("keydown", handleKey)
  }, [
    enabled,
    columns,
    rows,
    editingCell,
    focusedCell,
    setEditingCell,
    setFocusedCell,
    onCellCommit,
    containerRef,
  ])
}
