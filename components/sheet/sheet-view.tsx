// FlowBase V2 — 시트 뷰 (편집 가능 그리드)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §6·9
// 출처: design-ref/prototype/prototype.jsx InteractiveSheet
//
// 스토어 구독 → selectVisibleRows. 셀 인라인 편집 · 키보드 네비 · 복붙 · 행 선택.
// editingCell은 로컬 state, focusedCell은 스토어 (design D3).

"use client"

import { Fragment, useDeferredValue, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Plus, Sparkles } from "lucide-react"
import { Kbd } from "@/components/ui/kbd"
import {
  selectActiveBoard,
  selectIsViewer,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import { FORMAT_TONE_BG, evalFormatRules } from "@/lib/conditional-format"
import { computeAllOutliers } from "@/lib/outlier"
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
  const isViewer = useFlowBase(selectIsViewer)
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

  // G1-4: numeric 컬럼 outlier (z-score 2σ). 알림 + "Show only" 진입점.
  // board 전체 rows 기준 (filter 적용 X) — outlier 자체는 객관적 통계.
  // Hook은 early return 전에 호출 — rules-of-hooks LOCK. board 미존재면 빈 결과.
  const outlierResults = useMemo(
    () => (board ? computeAllOutliers(board.columns, board.rows) : []),
    [board],
  )
  // G4-1: cell-level outlier mark — "rowId::colName" set. 모든 outlier 컬럼 통합.
  const outlierCellSet = useMemo(() => {
    const s = new Set<string>()
    for (const o of outlierResults) {
      for (const rid of o.rowIds) s.add(`${rid}::${o.col}`)
    }
    return s
  }, [outlierResults])

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

  // 첫 outlier 컬럼만 표시 (시각 혼잡 회피)
  const firstOutlier = outlierResults[0]

  return (
    <div
      ref={setContainerRef}
      tabIndex={0}
      data-sheet-virtual={String(useVirtual)}
      data-sheet-rows={rows.length}
      data-sheet-group={sheetGroupBy ?? ""}
      className="min-h-0 min-w-0 flex-1 overflow-auto bg-background outline-none"
    >
      {firstOutlier && (
        <div
          data-sheet-outlier-alert
          className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-amber-300/60 bg-amber-50 px-4 py-1.5 text-[11.5px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <span>
            <span className="font-semibold tabular-nums">{firstOutlier.rowIds.length}</span>{" "}
            outlier{firstOutlier.rowIds.length === 1 ? "" : "s"} in{" "}
            <span className="font-medium">
              {board?.columns.find((c) => c.name === firstOutlier.col)?.label ||
                firstOutlier.col}
            </span>{" "}
            <span className="text-amber-700/70 dark:text-amber-400/70">
              (z-score &gt; {firstOutlier.threshold}σ)
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(firstOutlier.rowIds)}
              className="rounded border border-amber-400 bg-white/60 px-2 py-0.5 text-[11px] font-medium hover:bg-white dark:bg-amber-900/20 dark:hover:bg-amber-900/40"
              data-action="select-outliers"
            >
              Select outliers
            </button>
            {selectedRowIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-[11px] underline opacity-70 hover:opacity-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
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
                      // G4-1: cell-level outlier dot — numeric만 + outlierCellSet 포함.
                      const isOutlier = outlierCellSet.has(`${row.id}::${c.name}`)
                      // G7-A3: conditional formatting tone
                      const formatTone = evalFormatRules(row[c.name], c.formatRules)
                      return (
                        <td
                          key={c.name}
                          data-column={c.name}
                          data-outlier={isOutlier ? "true" : undefined}
                          data-format-tone={formatTone ?? undefined}
                          onClick={() => {
                            setFocused({ row: row.id, col: c.name })
                            containerRef.current?.focus()
                          }}
                          className={cn(
                            "relative border-b border-r border-border-subtle px-2.5 py-2 align-middle",
                            formatTone && FORMAT_TONE_BG[formatTone],
                            isFocused &&
                              "z-[1] ring-2 ring-inset ring-primary",
                          )}
                        >
                          {isOutlier && (
                            <span
                              aria-label="Outlier"
                              title="Value is more than 2σ from mean"
                              className="pointer-events-none absolute right-1 top-1 inline-block size-1.5 rounded-full bg-amber-500 dark:bg-amber-400"
                            />
                          )}
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
                className="px-4 py-12 text-center"
              >
                {search || filter.length > 0 ? (
                  <span className="text-[12.5px] text-muted-foreground">
                    No rows match the filter.
                  </span>
                ) : (
                  // P1: onboarding hints — 빈 보드에 진입점들 (Add · Import · AI)
                  <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                    <div className="text-[13.5px] font-semibold">
                      Start adding data
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Type below, drop a CSV, or generate with AI
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => addRow()}
                        disabled={isViewer}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        data-action="onboarding-add-row"
                      >
                        <Plus className="size-3" strokeWidth={2.5} />
                        Add first row
                        <Kbd className="ml-1 text-[10px]">⌘N</Kbd>
                      </button>
                      <span className="text-[10.5px] text-muted-foreground">
                        or
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          (
                            document.querySelector(
                              '[data-action="open-generate-board"]',
                            ) as HTMLButtonElement | null
                          )?.click()
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/[0.05] px-3 py-1.5 text-[12px] text-primary hover:border-primary/50"
                      >
                        <Sparkles className="size-3" strokeWidth={2} />
                        Generate with AI
                      </button>
                    </div>
                    <div className="mt-1 text-[10.5px] text-muted-foreground/70">
                      Tip: drop a .csv/.xlsx into this window to import
                    </div>
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
