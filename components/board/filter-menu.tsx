// FlowBase V2 — 다중 필드 Filter 팝오버 (Linear 스타일)
// 출처: design-ref/prototype/view-controls.jsx FilterMenu
//
// Filter 아이콘 버튼 + 활성 카운트 배지 → DropdownMenu Sub로 필드 선택
// → 체크박스 값 리스트. status / select / status-key 컬럼만 필터 후보.

"use client"

import { useMemo, useState } from "react"
import { Check, Filter as FilterIcon, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, type ColumnDef, type TableRow } from "@/types/flowbase"

interface ColumnOption {
  col: ColumnDef
  values: { id: string; label: string; count: number }[]
}

function isFilterable(col: ColumnDef): boolean {
  return col.type === "status" || col.type === "select"
}

// 컬럼 + 보드 행에서 unique values 추출 (status는 STATUS_LABELS, select는 col.options 또는 derived).
function buildFieldOptions(col: ColumnDef, rows: TableRow[]): ColumnOption["values"] {
  if (col.type === "status") {
    const keys = ["미처리", "진행중", "대기", "완료"] as const
    return keys.map((k) => ({
      id: k,
      label: STATUS_LABELS[k],
      count: rows.filter((r) => r[col.name] === k).length,
    }))
  }
  // select — col.options 또는 데이터에서 unique values 추출
  const defined = col.options ?? []
  const set = new Set<string>(defined)
  for (const r of rows) {
    const v = r[col.name]
    if (typeof v === "string" && v) set.add(v)
  }
  return Array.from(set).map((v) => ({
    id: v,
    label: v,
    count: rows.filter((r) => r[col.name] === v).length,
  }))
}

export function FilterMenu() {
  const board = useFlowBase(selectActiveBoard)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const toggleColumnFilter = useFlowBase((s) => s.toggleColumnFilter)
  const clearAllFilters = useFlowBase((s) => s.clearAllFilters)
  const setFilter = useFlowBase((s) => s.setFilter)

  const [open, setOpen] = useState(false)

  const filterableCols = useMemo<ColumnOption[]>(() => {
    if (!board) return []
    return board.columns
      .filter(isFilterable)
      .map((col) => ({ col, values: buildFieldOptions(col, board.rows) }))
      .filter((c) => c.values.length > 0)
  }, [board])

  const totalActive = useMemo(() => {
    return Object.values(columnFilters).reduce((n, v) => n + v.length, 0)
  }, [columnFilters])

  if (!board) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Filter"
          data-action="filter-menu"
          className={cn(
            "relative inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[12px] transition-colors",
            totalActive > 0 || open
              ? "border-border bg-foreground/[0.06] text-foreground"
              : "border-border-subtle text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
          )}
        >
          <FilterIcon className="size-3.5" strokeWidth={1.75} />
          <span>Filter</span>
          {totalActive > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-semibold text-primary-foreground tabular-nums">
              {totalActive}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          Add filter…
        </DropdownMenuLabel>
        {filterableCols.length === 0 ? (
          <div className="px-2 py-2 text-[12px] text-muted-foreground">
            No filterable columns on this table.
          </div>
        ) : (
          filterableCols.map(({ col, values }) => {
            const Icon = TYPE_ICON[col.type]
            const activeOnCol = columnFilters[col.name]?.length ?? 0
            return (
              <DropdownMenuSub key={col.name}>
                <DropdownMenuSubTrigger className="gap-2">
                  <Icon
                    className="size-3.5 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <span className="flex-1">{col.label || col.name}</span>
                  {activeOnCol > 0 && (
                    <span className="rounded bg-primary/15 px-1 py-0 text-[9.5px] font-semibold text-primary tabular-nums">
                      {activeOnCol}
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52" data-filter-col={col.name}>
                  <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    {col.label || col.name}
                  </DropdownMenuLabel>
                  {values.map((v) => {
                    const checked = columnFilters[col.name]?.includes(v.id) ?? false
                    return (
                      <DropdownMenuItem
                        key={v.id}
                        // 자체 체크 토글로 사용 — selection 후 메뉴 안 닫힘
                        onSelect={(e) => {
                          e.preventDefault()
                          toggleColumnFilter(col.name, v.id)
                        }}
                        className="gap-2"
                        data-filter-value={v.id}
                      >
                        <span
                          className={cn(
                            "flex size-3.5 shrink-0 items-center justify-center rounded border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border",
                          )}
                        >
                          {checked && (
                            <Check className="size-2.5" strokeWidth={3} />
                          )}
                        </span>
                        <span className="flex-1 truncate">{v.label}</span>
                        <span className="text-[10.5px] tabular-nums text-muted-foreground">
                          {v.count}
                        </span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )
          })
        )}
        {totalActive > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                clearAllFilters()
                setFilter([])
              }}
              className="gap-2 text-muted-foreground"
            >
              <X className="size-3.5" />
              Clear all filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 활성 필터 칩 바 — tables-mode에서 FilterMenu 옆에 함께 렌더 권장.
export function ActiveFilterChips() {
  const board = useFlowBase(selectActiveBoard)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const toggleColumnFilter = useFlowBase((s) => s.toggleColumnFilter)

  if (!board) return null

  const colByName = (n: string) => board.columns.find((c) => c.name === n)

  const entries = Object.entries(columnFilters).filter(([, v]) => v.length > 0)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.flatMap(([col, vals]) =>
        vals.map((v) => {
          const c = colByName(col)
          const label = c?.type === "status"
            ? STATUS_LABELS[v as keyof typeof STATUS_LABELS] ?? v
            : v
          return (
            <span
              key={`${col}:${v}`}
              data-active-filter={`${col}:${v}`}
              className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-card px-2 py-0.5 text-[11.5px]"
            >
              <span className="text-muted-foreground">
                {c?.label || col}:
              </span>
              <span className="font-medium">{label}</span>
              <button
                type="button"
                onClick={() => toggleColumnFilter(col, v)}
                className="-mr-0.5 ml-0.5 flex size-3.5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
                title="Remove filter"
              >
                <X className="size-2.5" strokeWidth={2.5} />
              </button>
            </span>
          )
        }),
      )}
    </div>
  )
}
