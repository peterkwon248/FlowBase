// FlowBase V2 — 다중 필드 Filter (Linear-style cascade hover)
// 출처 컨셉: Linear filter — DropdownMenu Sub로 hover 시 자동 cascade.
//
// 1st level: 필터 가능 컬럼 리스트 (status/select/num/date) — type icon + 컬럼 hue dot + 라벨 + active count
// 2nd level (Sub): kind별 widget
//   - status/select: 값 체크박스 리스트 (FilterCondition kind='in')
//   - num:           min/max numeric inputs (kind='range')
//   - date:          from/to date inputs (kind='date-range')
// 컬럼 hue dot으로 select끼리 시각 구분.
// DropdownMenuSubContent z-[60] + sideOffset 6 + cursor-pointer (dropdown-menu.tsx 공통 적용).

"use client"

import type React from "react"
import { useMemo } from "react"
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
import { Input } from "@/components/ui/input"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import {
  STATUS_LABELS,
  type ColumnDef,
  type FilterCondition,
  type TableRow,
} from "@/types/flowbase"

const COLUMN_HUES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function isFilterable(col: ColumnDef): boolean {
  return (
    col.type === "status" ||
    col.type === "select" ||
    col.type === "num" ||
    col.type === "date" ||
    col.type === "text" ||
    col.type === "email"
  )
}

interface ColumnOption {
  col: ColumnDef
  hue: string
  values?: { id: string; label: string; count: number }[]
}

function buildInValues(
  col: ColumnDef,
  rows: TableRow[],
): { id: string; label: string; count: number }[] {
  if (col.type === "status") {
    const keys = ["미처리", "진행중", "대기", "완료"] as const
    return keys.map((k) => ({
      id: k,
      label: STATUS_LABELS[k],
      count: rows.filter((r) => r[col.name] === k).length,
    }))
  }
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

function activeCountOfSingle(cond: FilterCondition | undefined): number {
  if (!cond) return 0
  if (cond.kind === "in" || cond.kind === "not_in") return cond.values.length
  if (cond.kind === "range")
    return (cond.min !== undefined ? 1 : 0) + (cond.max !== undefined ? 1 : 0)
  if (cond.kind === "contains" || cond.kind === "not_contains")
    return cond.text.trim() ? 1 : 0
  return (cond.from ? 1 : 0) + (cond.to ? 1 : 0)
}

// 컬럼당 multiple condition (AND) — 모든 cond의 count 합
function activeCountOf(conds: FilterCondition[] | undefined): number {
  if (!conds || conds.length === 0) return 0
  return conds.reduce((n, c) => n + activeCountOfSingle(c), 0)
}

export function FilterMenu() {
  const board = useFlowBase(selectActiveBoard)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const clearAllFilters = useFlowBase((s) => s.clearAllFilters)
  const setFilter = useFlowBase((s) => s.setFilter)
  // B1-1: Recent filters — 활성 보드의 최근 snapshot 5개
  const recentFilters = useFlowBase(
    (s) => s.workspaceMemory.recentFilters,
  )
  const setColumnCondition = useFlowBase((s) => s.setColumnCondition)
  const activeRecentFilters = useMemo(() => {
    if (!board) return []
    return recentFilters
      .filter((r) => r.boardId === board.id)
      .slice(0, 5)
  }, [recentFilters, board])

  const applyRecentFilter = (snapshot: { conditions: Record<string, FilterCondition[]> }) => {
    // 현재 모두 clear 후 snapshot 적용 — 각 컬럼의 cond array를 순차로 set (index별)
    clearAllFilters()
    Object.entries(snapshot.conditions).forEach(([col, conds]) => {
      conds.forEach((cond, i) => {
        setColumnCondition(col, cond, i)
      })
    })
  }

  const filterableCols = useMemo<ColumnOption[]>(() => {
    if (!board) return []
    return board.columns.filter(isFilterable).map((col) => {
      const idx = board.columns
        .filter((c) => c.name !== "id")
        .findIndex((c) => c.name === col.name)
      const hue = COLUMN_HUES[Math.max(0, idx) % COLUMN_HUES.length]
      const values =
        col.type === "status" || col.type === "select"
          ? buildInValues(col, board.rows)
          : undefined
      return { col, hue, values }
    })
  }, [board])

  const totalActive = useMemo(
    () =>
      Object.values(columnFilters).reduce((n, c) => n + activeCountOf(c), 0),
    [columnFilters],
  )

  if (!board) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Filter"
          data-action="filter-menu"
          className={cn(
            "relative inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[12px] transition-colors",
            totalActive > 0
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
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-48"
        data-filter-popover
      >
        <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          Add filter…
        </DropdownMenuLabel>
        {filterableCols.length === 0 ? (
          <div className="px-2 py-2 text-[12px] text-muted-foreground">
            No filterable columns on this table.
          </div>
        ) : (
          filterableCols.map((option) => (
            <FilterColSub
              key={option.col.name}
              option={option}
              conds={columnFilters[option.col.name]}
            />
          ))
        )}

        {/* B1-1: Recent filters — 활성 보드 최근 snapshot 재적용 진입점 */}
        {activeRecentFilters.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
              Recent
            </DropdownMenuLabel>
            {activeRecentFilters.map((r) => {
              const condCount = Object.keys(r.conditions).length
              const ageMin = Math.max(
                1,
                Math.round((Date.now() - r.ts) / 60000),
              )
              const ageLabel =
                ageMin < 60
                  ? `${ageMin}m`
                  : ageMin < 1440
                    ? `${Math.round(ageMin / 60)}h`
                    : `${Math.round(ageMin / 1440)}d`
              return (
                <DropdownMenuItem
                  key={r.ts}
                  onSelect={() => applyRecentFilter(r)}
                  className="gap-2"
                  data-recent-filter={r.ts}
                >
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {condCount}
                  </span>
                  <span className="flex-1 truncate text-[12px]">
                    {Object.keys(r.conditions).join(", ")}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground/70">
                    {ageLabel}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </>
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

// ─── Sub per column ───────────────────────────────────────
// 컬럼당 multiple condition array — UI는 첫 element만 (minimum). 추가 cond는 ActiveFilterChips에서 표시.
function FilterColSub({
  option,
  conds,
}: {
  option: ColumnOption
  conds: FilterCondition[] | undefined
}) {
  const Icon = TYPE_ICON[option.col.type]
  const activeCount = activeCountOf(conds)
  const toggleColumnInValue = useFlowBase((s) => s.toggleColumnInValue)
  const setColumnCondition = useFlowBase((s) => s.setColumnCondition)
  // UI에서는 첫 cond만 처리 — 첫 in/not_in 또는 첫 cond
  const cond = conds?.[0]

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2" data-filter-col={option.col.name}>
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: option.hue }}
          aria-hidden="true"
        />
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <span className="flex-1 truncate">{option.col.label || option.col.name}</span>
        {activeCount > 0 && (
          <span className="rounded bg-primary/15 px-1 py-px text-[9.5px] font-semibold tabular-nums text-primary">
            {activeCount}
          </span>
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        className="w-52"
        data-filter-col-values={option.col.name}
      >
        <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          {option.col.label || option.col.name}
        </DropdownMenuLabel>

        {/* in/not_in (status/select) — Match/Exclude toggle + 체크박스 리스트 */}
        {option.values && (
          <>
            <div className="px-2 py-1.5">
              <MatchToggle
                kind={cond?.kind === "not_in" ? "exclude" : "include"}
                onChange={(k) => {
                  // 현재 values 보존, kind만 전환. 빈값이면 cleared.
                  const curValues =
                    cond?.kind === "in" || cond?.kind === "not_in"
                      ? cond.values
                      : []
                  if (curValues.length === 0) return
                  setColumnCondition(option.col.name, {
                    kind: k === "exclude" ? "not_in" : "in",
                    values: curValues,
                  })
                }}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {option.values.map((v) => {
                const checked =
                  cond?.kind === "in" || cond?.kind === "not_in"
                    ? cond.values.includes(v.id)
                    : false
                return (
                  <DropdownMenuItem
                    key={v.id}
                    onSelect={(e) => {
                      e.preventDefault() // sub 안 닫음
                      toggleColumnInValue(option.col.name, v.id)
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
                      {checked && <Check className="size-2.5" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 truncate">{v.label}</span>
                    <span className="text-[10.5px] tabular-nums text-muted-foreground">
                      {v.count}
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </div>
          </>
        )}

        {/* range (num) */}
        {option.col.type === "num" && (
          <RangeWidget cond={cond} onSet={(c) => setColumnCondition(option.col.name, c)} />
        )}

        {/* date-range */}
        {option.col.type === "date" && (
          <DateRangeWidget
            cond={cond}
            onSet={(c) => setColumnCondition(option.col.name, c)}
          />
        )}

        {/* contains (text/email) */}
        {(option.col.type === "text" || option.col.type === "email") && (
          <ContainsWidget
            cond={cond}
            onSet={(c) => setColumnCondition(option.col.name, c)}
          />
        )}

        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setColumnCondition(option.col.name, null)}
              className="gap-2 text-muted-foreground"
            >
              <X className="size-3.5" />
              Clear this filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

// ─── num — min/max ──────────────────────────────────────
function RangeWidget({
  cond,
  onSet,
}: {
  cond: FilterCondition | undefined
  onSet: (c: FilterCondition) => void
}) {
  const min = cond?.kind === "range" ? cond.min : undefined
  const max = cond?.kind === "range" ? cond.max : undefined
  return (
    <div className="space-y-2 px-2 pb-1.5 pt-1">
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          placeholder="Min"
          value={min ?? ""}
          onChange={(e) => {
            const v = e.target.value
            const n = v === "" ? undefined : Number(v)
            onSet({
              kind: "range",
              min: Number.isFinite(n as number) ? (n as number) : undefined,
              max,
            })
          }}
          onClick={(e) => e.stopPropagation()}
          data-filter-min
          className="h-7 text-[12px]"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="Max"
          value={max ?? ""}
          onChange={(e) => {
            const v = e.target.value
            const n = v === "" ? undefined : Number(v)
            onSet({
              kind: "range",
              min,
              max: Number.isFinite(n as number) ? (n as number) : undefined,
            })
          }}
          onClick={(e) => e.stopPropagation()}
          data-filter-max
          className="h-7 text-[12px]"
        />
      </div>
    </div>
  )
}

// ─── text — contains/not_contains (case-insensitive) + Match/Exclude toggle ────────────────
function ContainsWidget({
  cond,
  onSet,
}: {
  cond: FilterCondition | undefined
  onSet: (c: FilterCondition) => void
}) {
  const isNot = cond?.kind === "not_contains"
  const text =
    cond?.kind === "contains" || cond?.kind === "not_contains" ? cond.text : ""
  return (
    <div className="space-y-2 px-2 pb-1.5 pt-1">
      <MatchToggle
        kind={isNot ? "exclude" : "include"}
        onChange={(k) => {
          if (!text.trim()) return
          onSet({
            kind: k === "exclude" ? "not_contains" : "contains",
            text,
          })
        }}
      />
      <Input
        type="text"
        placeholder={isNot ? "Excludes…" : "Contains…"}
        value={text}
        onChange={(e) =>
          onSet({
            kind: isNot ? "not_contains" : "contains",
            text: e.target.value,
          })
        }
        onClick={(e) => e.stopPropagation()}
        data-filter-contains
        className="h-7 text-[12px]"
      />
    </div>
  )
}

// ─── Match/Exclude segmented toggle (in↔not_in, contains↔not_contains) ────
function MatchToggle({
  kind,
  onChange,
}: {
  kind: "include" | "exclude"
  onChange: (k: "include" | "exclude") => void
}) {
  return (
    <div className="inline-flex rounded-md border border-border-subtle p-0.5 text-[10.5px]">
      {(["include", "exclude"] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onChange(k)
          }}
          data-filter-match={k}
          className={cn(
            "rounded-sm px-2 py-0.5 transition-colors",
            kind === k
              ? "bg-primary/15 font-semibold text-primary"
              : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          {k === "include" ? "Match" : "Exclude"}
        </button>
      ))}
    </div>
  )
}

// ─── date — from/to ─────────────────────────────────────
function DateRangeWidget({
  cond,
  onSet,
}: {
  cond: FilterCondition | undefined
  onSet: (c: FilterCondition) => void
}) {
  const from = cond?.kind === "date-range" ? cond.from : undefined
  const to = cond?.kind === "date-range" ? cond.to : undefined
  return (
    <div className="space-y-1.5 px-2 pb-1.5 pt-1">
      <div className="space-y-1">
        <label className="text-[10.5px] text-muted-foreground">From</label>
        <Input
          type="date"
          value={from ?? ""}
          onChange={(e) =>
            onSet({ kind: "date-range", from: e.target.value || undefined, to })
          }
          onClick={(e) => e.stopPropagation()}
          data-filter-from
          className="h-7 text-[12px]"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10.5px] text-muted-foreground">To</label>
        <Input
          type="date"
          value={to ?? ""}
          onChange={(e) =>
            onSet({
              kind: "date-range",
              from,
              to: e.target.value || undefined,
            })
          }
          onClick={(e) => e.stopPropagation()}
          data-filter-to
          className="h-7 text-[12px]"
        />
      </div>
    </div>
  )
}

// ─── 활성 필터 칩 바 — 컬럼당 multiple condition AND, kind별 라벨 ──────
export function ActiveFilterChips() {
  const board = useFlowBase(selectActiveBoard)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const setColumnCondition = useFlowBase((s) => s.setColumnCondition)
  const toggleColumnInValue = useFlowBase((s) => s.toggleColumnInValue)
  const removeColumnCondition = useFlowBase((s) => s.removeColumnCondition)

  if (!board) return null

  const colByName = (n: string) => board.columns.find((c) => c.name === n)

  const entries = Object.entries(columnFilters).filter(
    ([, conds]) => activeCountOf(conds) > 0,
  )
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.flatMap(([col, conds]) => {
        const c = colByName(col)
        const colLabel = c?.label || col
        // 각 cond를 별도 chip(s)으로 렌더 — index 추적해서 remove 시 그 cond만 제거
        return conds.flatMap((cond, condIdx) => renderCondChips(
          col,
          colLabel,
          c?.type,
          cond,
          condIdx,
          conds.length,
          toggleColumnInValue,
          removeColumnCondition,
          setColumnCondition,
        ))
      })}
    </div>
  )
}

function renderCondChips(
  col: string,
  colLabel: string,
  colType: string | undefined,
  cond: FilterCondition,
  condIdx: number,
  totalConds: number,
  toggleColumnInValue: (col: string, value: string) => void,
  removeColumnCondition: (col: string, index: number) => void,
  setColumnCondition: (col: string, cond: FilterCondition | null, index?: number) => void,
): React.ReactNode[] {
  // 단일 cond 제거 helper — totalConds=1이면 컬럼 전체 clear, 아니면 그 cond만
  const removeThis = () => {
    if (totalConds === 1) setColumnCondition(col, null, 0)
    else removeColumnCondition(col, condIdx)
  }

  if (cond.kind === "in" || cond.kind === "not_in") {
    const prefix = cond.kind === "not_in" ? "≠ " : ""
    return cond.values.map((v) => {
      const label =
        colType === "status"
          ? (STATUS_LABELS[v as keyof typeof STATUS_LABELS] ?? v)
          : v
      return (
        <Chip
          key={`${col}:${condIdx}:${cond.kind}:${v}`}
          colLabel={colLabel}
          valueLabel={`${prefix}${label}`}
          onRemove={() => toggleColumnInValue(col, v)}
          dataAttr={`${col}:${v}`}
        />
      )
    })
  }
  if (cond.kind === "range") {
    const text =
      cond.min !== undefined && cond.max !== undefined
        ? `${cond.min}–${cond.max}`
        : cond.min !== undefined
          ? `≥ ${cond.min}`
          : `≤ ${cond.max ?? "?"}`
    return [
      <Chip
        key={`${col}:${condIdx}:range`}
        colLabel={colLabel}
        valueLabel={text}
        onRemove={removeThis}
        dataAttr={`${col}:range`}
      />,
    ]
  }
  if (cond.kind === "contains" || cond.kind === "not_contains") {
    const prefix = cond.kind === "not_contains" ? "≠ " : ""
    return [
      <Chip
        key={`${col}:${condIdx}:${cond.kind}`}
        colLabel={colLabel}
        valueLabel={`${prefix}"${cond.text}"`}
        onRemove={removeThis}
        dataAttr={`${col}:${cond.kind}`}
      />,
    ]
  }
  // date-range
  const text =
    cond.from && cond.to
      ? `${cond.from} ~ ${cond.to}`
      : cond.from
        ? `from ${cond.from}`
        : `to ${cond.to ?? "?"}`
  return [
    <Chip
      key={`${col}:${condIdx}:date-range`}
      colLabel={colLabel}
      valueLabel={text}
      onRemove={removeThis}
      dataAttr={`${col}:date-range`}
    />,
  ]
}

function Chip({
  colLabel,
  valueLabel,
  onRemove,
  dataAttr,
}: {
  colLabel: string
  valueLabel: string
  onRemove: () => void
  dataAttr: string
}) {
  return (
    <span
      data-active-filter={dataAttr}
      className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-card px-2 py-0.5 text-[11.5px]"
    >
      <span className="text-muted-foreground">{colLabel}:</span>
      <span className="font-medium">{valueLabel}</span>
      <button
        type="button"
        onClick={onRemove}
        className="-mr-0.5 ml-0.5 flex size-3.5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
        title="Remove filter"
      >
        <X className="size-2.5" strokeWidth={2.5} />
      </button>
    </span>
  )
}
