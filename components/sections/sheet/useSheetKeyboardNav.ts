// design.md §5 키보드 인터랙션 매트릭스 — M4 (비편집 모드 핵심 키)
//
// 비편집 모드 active:
//   ArrowUp/Down/Left/Right → focusedCell 이동
//   Tab / Shift+Tab          → 다음/이전 *편집 가능* 셀
//   Enter / F2 / Space       → 편집 시작 (편집 가능일 때)
//   Esc                      → focus 해제
//   Delete / Backspace       → 빈 값 commit (편집 가능)
//
// 편집 모드는 입력기(InlineInput/Textarea/Select)가 자체 처리.
// 일반 문자 키 → 편집 시작 + initialDraft, 편집 모드 Tab/Enter 통합 이동은 M4b.

"use client"

import { useEffect, type RefObject } from "react"
import type { Field } from "@/lib/mock-data"
import { isEditableField } from "./SheetCell"

export type CellCoord = { rowId: string; fieldName: string; initialDraft?: string }

interface UseSheetKeyboardNavOptions {
  enabled: boolean
  fields: Field[]
  rows: Array<{ id: string }>
  editingCell: CellCoord | null
  focusedCell: CellCoord | null
  setEditingCell: (cell: CellCoord | null) => void
  setFocusedCell: (cell: CellCoord | null) => void
  onCellCommit: (rowId: string, fieldName: string, value: unknown) => void
  containerRef: RefObject<HTMLElement | null>
}

export function useSheetKeyboardNav(opts: UseSheetKeyboardNavOptions): void {
  const {
    enabled,
    fields,
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
      // IME (한글 등 조합 중) 무시 — 편집 진입을 막아야 첫 키가 한글 자모로 들어감
      if (e.isComposing) return
      // 편집 모드는 입력기가 자체 처리 (편집 모드 Tab/Enter는 SheetCell M4b에서 처리)
      if (editingCell) return
      if (rows.length === 0 || fields.length === 0) return

      // focus 부재 — 첫 키 입력 시 첫 셀로 진입
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
          setFocusedCell({ rowId: rows[0].id, fieldName: fields[0].name })
        }
        return
      }

      const rowIdx = rows.findIndex((r) => r.id === focusedCell.rowId)
      const fieldIdx = fields.findIndex((f) => f.name === focusedCell.fieldName)
      // stale focus (필터/정렬 후 행이 사라졌거나 컬럼 변경)
      if (rowIdx < 0 || fieldIdx < 0) {
        setFocusedCell(null)
        return
      }
      const currentField = fields[fieldIdx]

      const moveTo = (r: number, f: number) => {
        const rr = clamp(r, 0, rows.length - 1)
        const ff = clamp(f, 0, fields.length - 1)
        setFocusedCell({ rowId: rows[rr].id, fieldName: fields[ff].name })
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          moveTo(rowIdx - 1, fieldIdx)
          break
        case "ArrowDown":
          e.preventDefault()
          moveTo(rowIdx + 1, fieldIdx)
          break
        case "ArrowLeft":
          e.preventDefault()
          moveTo(rowIdx, fieldIdx - 1)
          break
        case "ArrowRight":
          e.preventDefault()
          moveTo(rowIdx, fieldIdx + 1)
          break
        case "Tab": {
          e.preventDefault()
          const next = nextEditableField(
            fields,
            fieldIdx,
            rowIdx,
            rows.length,
            e.shiftKey,
          )
          if (next) {
            setFocusedCell({
              rowId: rows[next.rowIdx].id,
              fieldName: fields[next.fieldIdx].name,
            })
          }
          break
        }
        case "Enter":
        case "F2":
        case " ": // Space
          if (isEditableField(currentField)) {
            e.preventDefault()
            setEditingCell(focusedCell)
          }
          break
        case "Escape":
          e.preventDefault()
          setFocusedCell(null)
          break
        case "Delete":
        case "Backspace":
          if (isEditableField(currentField)) {
            e.preventDefault()
            onCellCommit(focusedCell.rowId, focusedCell.fieldName, null)
          }
          break
        default: {
          // M4b: 일반 문자 키 → 편집 시작 + initialDraft (Excel 패턴)
          // text-based type만 (select/status는 Enter/F2/Space로만 — ChipSelect는 텍스트 입력 ❌)
          const isTextBased = TEXT_BASED_TYPES.has(currentField.type)
          if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            isEditableField(currentField) &&
            isTextBased
          ) {
            e.preventDefault()
            setEditingCell({ ...focusedCell, initialDraft: e.key })
          }
          break
        }
      }
    }

    el.addEventListener("keydown", handleKey)
    return () => el.removeEventListener("keydown", handleKey)
  }, [
    enabled,
    fields,
    rows,
    editingCell,
    focusedCell,
    setEditingCell,
    setFocusedCell,
    onCellCommit,
    containerRef,
  ])
}

// M4b 일반 문자키 편집 시작 — text-based 타입만
const TEXT_BASED_TYPES = new Set([
  "string",
  "email",
  "phone",
  "number",
  "text",
  "datetime",
])

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

// Tab/Shift+Tab으로 다음/이전 *편집 가능* 셀 찾기 (uuid/pk/fk 건너뜀, 행 끝이면 다음 행 첫 컬럼)
// M4b: data-section.tsx의 handleCellCommitAndAdvance에서 재사용
export function nextEditableField(
  fields: Field[],
  fieldIdx: number,
  rowIdx: number,
  rowsLen: number,
  reverse: boolean,
): { rowIdx: number; fieldIdx: number } | null {
  const step = reverse ? -1 : 1
  let r = rowIdx
  let f = fieldIdx + step
  // 무한 루프 가드 — 모든 셀이 read-only이면 stop
  const maxIter = fields.length * rowsLen + 1
  let iter = 0

  while (iter < maxIter) {
    iter += 1
    if (f < 0) {
      r -= 1
      if (r < 0) return null
      f = fields.length - 1
    } else if (f >= fields.length) {
      r += 1
      if (r >= rowsLen) return null
      f = 0
    }

    if (isEditableField(fields[f])) return { rowIdx: r, fieldIdx: f }
    f += step
  }
  return null
}
