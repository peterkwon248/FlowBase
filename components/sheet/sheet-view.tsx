// FlowBase V2 — 시트 뷰 (편집 가능 그리드)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §6·9
// 출처: design-ref/prototype/prototype.jsx InteractiveSheet
//
// 스토어 구독 → selectVisibleRows. 셀 인라인 편집 · 키보드 네비 · 복붙 · 행 선택.
// editingCell은 로컬 state, focusedCell은 스토어 (design D3).

"use client"

import { useMemo, useRef, useState } from "react"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import type { ColumnDef, SortDir } from "@/types/flowbase"
import { cn } from "@/lib/utils"
import { AddColumnMenu } from "./add-column-menu"
import { ColumnResizer } from "./column-resizer"
import { EditableCell } from "./editable-cell"
import { HeaderCell } from "./header-cell"
import { NewRowStub } from "./new-row-stub"
import { RowContextMenu } from "./row-context-menu"
import { useSheetClipboard } from "./use-sheet-clipboard"
import { type EditingCell, useSheetKeyboard } from "./use-sheet-keyboard"

export function SheetView() {
  const board = useFlowBase(selectActiveBoard)
  // selectVisibleRows는 새 배열을 반환 → 직접 구독 ❌. 의존 슬라이스 구독 후 useMemo.
  const search = useFlowBase((s) => s.search)
  const filter = useFlowBase((s) => s.filter)
  const sort = useFlowBase((s) => s.sort)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const rows = useMemo(
    () => selectVisibleRows(useFlowBase.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, search, filter, sort, columnFilters],
  )

  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const focusedCell = useFlowBase((s) => s.focusedCell)
  const setSort = useFlowBase((s) => s.setSort)
  const setSelected = useFlowBase((s) => s.setSelected)
  const setFocused = useFlowBase((s) => s.setFocused)
  const updateRow = useFlowBase((s) => s.updateRow)
  const addRow = useFlowBase((s) => s.addRow)
  const commitAiCell = useFlowBase((s) => s.commitAiCell)
  const dismissAiCell = useFlowBase((s) => s.dismissAiCell)

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Display 옵션 — hiddenColumns 적용. id 컬럼은 항상 표시.
  // 셀렉터는 raw value 반환 (new array 매번 ❌). 컴포넌트에서 default 처리.
  const hiddenColumns = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.sheet?.hiddenColumns,
  )
  // 사용자가 drag/auto-fit으로 조정한 컬럼 width. ColumnDef.width fallback.
  const columnWidths = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.sheet?.columnWidths,
  )
  const columns: ColumnDef[] = useMemo(() => {
    const all = board?.columns ?? []
    if (!hiddenColumns || hiddenColumns.length === 0) return all
    const hide = new Set(hiddenColumns)
    return all.filter((c) => c.name === "id" || !hide.has(c.name))
  }, [board, hiddenColumns])

  const widthOf = (c: ColumnDef) => columnWidths?.[c.name] ?? c.width ?? 140
  const tableRef = useRef<HTMLTableElement>(null)

  const stopEdit = () => {
    setEditingCell(null)
    containerRef.current?.focus()
  }

  useSheetKeyboard({
    enabled: !!board,
    columns,
    rows,
    editingCell,
    focusedCell,
    setEditingCell,
    setFocusedCell: setFocused,
    onCellCommit: (rowId, colName, value) =>
      updateRow(rowId, { [colName]: value }),
    containerRef,
  })

  useSheetClipboard({
    enabled: !!board,
    columns,
    rows,
    focusedCell,
    editingCell,
    onCellCommit: (rowId, colName, value) =>
      updateRow(rowId, { [colName]: value }),
    containerRef,
  })

  if (!board) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        활성 보드가 없습니다.
      </div>
    )
  }

  const allSelected =
    rows.length > 0 && selectedRowIds.length === rows.length

  // 정렬 토글: 다른 컬럼 → asc 시작 / 같은 컬럼 → asc↔desc
  const handleSort = (colName: string) => {
    if (sort?.key === colName) {
      setSort({ key: colName, dir: sort.dir === "asc" ? "desc" : "asc" })
    } else {
      setSort({ key: colName, dir: "asc" })
    }
  }

  const handleButtonAction = (col: ColumnDef) => {
    // Phase 1 — 실 동작 없음. reclassify 등은 Phase 2 (AI 패널)에서 연결.
    console.info(`[sheet-view] button action "${col.buttonAction}" — Phase 2`)
  }

  const totalWidth = columns.reduce((acc, c) => acc + widthOf(c), 0) + 120

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="min-h-0 min-w-0 flex-1 overflow-auto bg-background outline-none"
    >
      <table
        ref={tableRef}
        className="border-separate border-spacing-0 table-fixed"
        style={{ width: `max(100%, ${totalWidth}px)` }}
      >
        <colgroup>
          <col style={{ width: 40 }} />
          <col style={{ width: 36 }} />
          {columns.map((c) => (
            <col key={c.name} style={{ width: widthOf(c) }} />
          ))}
          <col style={{ width: 44 }} />
        </colgroup>

        <thead>
          <tr>
            <th className="sticky top-0 z-10 border-b border-border bg-surface px-2.5 py-2 text-center">
              <input
                type="checkbox"
                className="block mx-auto size-3.5"
                checked={allSelected}
                onChange={(e) =>
                  setSelected(e.target.checked ? rows.map((r) => r.id) : [])
                }
                aria-label="전체 선택"
              />
            </th>
            <th className="sticky top-0 z-10 border-b border-border bg-surface px-2.5 py-2 text-right">
              <span className="text-[11px] tabular-nums text-muted-foreground">
                #
              </span>
            </th>
            {columns.map((c) => (
              <th
                key={c.name}
                data-column={c.name}
                className="sticky top-0 z-10 border-b border-r border-border bg-surface px-2.5 py-2 relative"
              >
                <HeaderCell
                  col={c}
                  sortDir={
                    (sort?.key === c.name ? sort.dir : null) as SortDir | null
                  }
                  onSort={() => handleSort(c.name)}
                />
                <ColumnResizer colName={c.name} tableRef={tableRef} />
              </th>
            ))}
            <th className="sticky top-0 z-10 border-b border-border bg-surface p-0">
              <AddColumnMenu />
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => {
            const isSelected = selectedRowIds.includes(row.id)
            return (
              <RowContextMenu key={row.id} rowId={row.id}>
              <tr
                className={cn("h-12", isSelected && "bg-primary/[0.07]")}
              >
                <td className="border-b border-border-subtle px-2.5 py-2 text-center">
                  <input
                    type="checkbox"
                    className="block mx-auto size-3.5"
                    checked={isSelected}
                    onChange={() =>
                      setSelected(
                        isSelected
                          ? selectedRowIds.filter((id) => id !== row.id)
                          : [...selectedRowIds, row.id],
                      )
                    }
                    aria-label={`${row.id} 선택`}
                  />
                </td>
                <td className="border-b border-border-subtle px-2.5 py-2 text-right font-mono text-[11px] text-muted-foreground">
                  {idx + 1}
                </td>
                {columns.map((c) => {
                  const isFocused =
                    focusedCell?.row === row.id && focusedCell.col === c.name
                  const isEditing =
                    editingCell?.row === row.id && editingCell.col === c.name
                  return (
                    <td
                      key={c.name}
                      data-column={c.name}
                      onClick={() => {
                        setFocused({ row: row.id, col: c.name })
                        containerRef.current?.focus()
                      }}
                      className={cn(
                        "relative border-b border-r border-border-subtle px-2.5 py-2 align-middle",
                        isFocused && "z-[1] ring-2 ring-inset ring-primary",
                      )}
                    >
                      <EditableCell
                        col={c}
                        row={row}
                        editing={isEditing}
                        initialDraft={
                          isEditing ? editingCell?.initialDraft : undefined
                        }
                        onStartEdit={() =>
                          setEditingCell({ row: row.id, col: c.name })
                        }
                        onStopEdit={stopEdit}
                        onUpdate={(patch) => updateRow(row.id, patch)}
                        onCommitAi={(aiCol, value) =>
                          commitAiCell(row.id, aiCol, value)
                        }
                        onDismissAi={(aiCol) => dismissAiCell(row.id, aiCol)}
                        onButtonAction={handleButtonAction}
                      />
                    </td>
                  )
                })}
                <td className="border-b border-border-subtle" />
              </tr>
              </RowContextMenu>
            )
          })}

          {rows.length > 0 ? (
            <NewRowStub colSpan={columns.length + 3} onAdd={() => addRow()} />
          ) : (
            <tr>
              <td
                colSpan={columns.length + 3}
                className="px-4 py-10 text-center text-[12.5px] text-muted-foreground"
              >
                {search || filter.length > 0
                  ? "조건에 맞는 행이 없습니다."
                  : "아직 행이 없습니다."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
