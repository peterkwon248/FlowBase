// FlowBase V2 — 시트 뷰 (편집 가능 그리드)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §6·9
// 출처: design-ref/prototype/prototype.jsx InteractiveSheet
//
// 스토어 구독 → selectVisibleRows. 셀 인라인 편집 · 키보드 네비 · 복붙 · 행 선택.
// editingCell은 로컬 state, focusedCell은 스토어 (design D3).

"use client"

import { Fragment, useDeferredValue, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import type { ColumnDef, SortDir, TableRow } from "@/types/flowbase"
import { STATUS_LABELS, type TicketStatus } from "@/types/flowbase"
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
  // Sheet 다중 sort + groupBy — viewSettings.sheet에서 raw 구독
  const sheetSorts = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.sheet?.sorts,
  )
  const sheetGroupBy = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.sheet?.groupBy,
  )

  // Perf: useDeferredValue로 search/filter/sort 적용 — typing 즉시 응답 + 큰 board 재계산은 background.
  // 1000+행 board에서 reconciliation freeze 완화. React가 우선순위 자동 분리.
  // search input 자체는 store에 즉시 commit (board-header) → 이 컴포넌트만 deferred 렌더.
  const deferredSearch = useDeferredValue(search)
  const deferredColumnFilters = useDeferredValue(columnFilters)
  const deferredSort = useDeferredValue(sort)
  const deferredSheetSorts = useDeferredValue(sheetSorts)

  const rows = useMemo(
    () => selectVisibleRows(useFlowBase.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, deferredSearch, filter, deferredSort, deferredColumnFilters, deferredSheetSorts],
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
  // virtualizer는 ref가 null이면 measure 못 함 — useState로 trigger re-render after mount.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el
    setScrollEl(el)
  }

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

  // Virtual scrolling — 100행 이상 + groupBy 없을 때만 활성.
  // groupBy 모드는 group header가 row 사이 끼어서 flat virtualization 어려움 → 기존 렌더 유지.
  // h-12 = 48px (rowHeight). overscan 12 → 위아래 추가 12행 미리 렌더(부드러운 스크롤).
  const ROW_HEIGHT_PX = 48
  const VIRTUAL_THRESHOLD = 100
  const useVirtual = !sheetGroupBy && rows.length >= VIRTUAL_THRESHOLD
  const virtualizer = useVirtualizer({
    count: useVirtual ? rows.length : 0,
    getScrollElement: () => scrollEl,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 12,
  })

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
        No active board.
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
      ref={setContainerRef}
      tabIndex={0}
      data-sheet-virtual={String(useVirtual)}
      data-sheet-rows={rows.length}
      data-sheet-group={sheetGroupBy ?? ""}
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
                aria-label="Select all"
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
          {(() => {
            // groupBy 있을 때만 grouped render. row index는 전체에서 일관(1, 2, ...).
            // virtual 활성 시 동일 renderRow를 virtualItems 인덱스로 호출.
            const renderRow = (row: TableRow, idx: number) => {
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
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                    <td className="border-b border-border-subtle px-2.5 py-2 text-right font-mono text-[11px] text-muted-foreground">
                      {idx + 1}
                    </td>
                    {columns.map((c) => {
                      const isFocused =
                        focusedCell?.row === row.id &&
                        focusedCell.col === c.name
                      const isEditing =
                        editingCell?.row === row.id &&
                        editingCell.col === c.name
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
                            isFocused &&
                              "z-[1] ring-2 ring-inset ring-primary",
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
                            onDismissAi={(aiCol) =>
                              dismissAiCell(row.id, aiCol)
                            }
                            onButtonAction={handleButtonAction}
                          />
                        </td>
                      )
                    })}
                    <td className="border-b border-border-subtle" />
                  </tr>
                </RowContextMenu>
              )
            }

            if (sheetGroupBy) {
              // groupBy 적용 — rows 이미 sort된 상태 유지. 같은 값끼리 묶음.
              // virtual 비활성 (group header가 row 사이 끼어서 flat virtualization 어려움).
              const groups = new Map<string, { rows: TableRow[]; start: number }>()
              rows.forEach((r, idx) => {
                const raw = r[sheetGroupBy]
                const key = raw == null || raw === "" ? "—" : String(raw)
                const entry = groups.get(key) ?? { rows: [], start: idx }
                entry.rows.push(r)
                groups.set(key, entry)
              })
              const colSpan = columns.length + 3
              return Array.from(groups.entries()).map(([key, entry]) => {
                // status 컬럼이면 한→영 매핑(STATUS_LABELS), 그 외는 원본 키
                const isStatus = sheetGroupBy === "status"
                const label = isStatus
                  ? STATUS_LABELS[key as TicketStatus] ?? key
                  : key
                return (
                  <Fragment key={`group-${key}`}>
                    <tr
                      className="bg-foreground/[0.03]"
                      data-group-header={key}
                    >
                      <td
                        colSpan={colSpan}
                        className="border-b border-border-subtle px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-muted-foreground"
                      >
                        {label}{" "}
                        <span className="ml-1 font-normal text-muted-foreground/70 tabular-nums">
                          {entry.rows.length}
                        </span>
                      </td>
                    </tr>
                    {entry.rows.map((row, i) => renderRow(row, entry.start + i))}
                  </Fragment>
                )
              })
            }

            // Virtual scrolling — 100+ 행에서만 활성. tbody 위/아래 spacer tr로 scroll position 유지.
            if (useVirtual) {
              const virtualItems = virtualizer.getVirtualItems()
              const totalSize = virtualizer.getTotalSize()
              const startPad = virtualItems[0]?.start ?? 0
              const endPad =
                totalSize -
                (virtualItems[virtualItems.length - 1]?.end ?? 0)
              const colSpan = columns.length + 3
              return (
                <Fragment>
                  {startPad > 0 && (
                    <tr aria-hidden style={{ height: `${startPad}px` }}>
                      <td colSpan={colSpan} className="p-0" />
                    </tr>
                  )}
                  {virtualItems.map((vRow) =>
                    renderRow(rows[vRow.index], vRow.index),
                  )}
                  {endPad > 0 && (
                    <tr aria-hidden style={{ height: `${endPad}px` }}>
                      <td colSpan={colSpan} className="p-0" />
                    </tr>
                  )}
                </Fragment>
              )
            }

            return rows.map((row, idx) => renderRow(row, idx))
          })()}

          {rows.length > 0 ? (
            <NewRowStub colSpan={columns.length + 3} onAdd={() => addRow()} />
          ) : (
            <tr>
              <td
                colSpan={columns.length + 3}
                className="px-4 py-10 text-center text-[12.5px] text-muted-foreground"
              >
                {search || filter.length > 0
                  ? "No rows match the filter."
                  : "No rows yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
