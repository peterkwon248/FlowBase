// FlowBase V2 — 다중 필드 Filter (2-step inline Popover, condition union)
// 출처 컨셉: Linear filter (cascade ❌, popover 안에서 step 전환)
//
// Step 1 (list): 필터 가능 컬럼 (status/select/num/date) — type icon + 컬럼 hue dot + 라벨 + active count
// Step 2 (values): ← Back + 선택 컬럼 + kind별 위젯 + Clear this filter
//   - status/select: 값 체크박스 리스트 (FilterCondition kind='in')
//   - num:           min/max numeric inputs (kind='range')
//   - date:          from/to date inputs (kind='date-range')
// 컬럼 hue dot으로 select끼리 시각 구분.

"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check, Filter as FilterIcon, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

// 필터 가능 type — status/select/num/date.
function isFilterable(col: ColumnDef): boolean {
  return (
    col.type === "status" ||
    col.type === "select" ||
    col.type === "num" ||
    col.type === "date"
  )
}

interface ColumnOption {
  col: ColumnDef
  hue: string
  // 'in' 컬럼만 사전 derive (체크박스용). num/date는 ValuesStep에서 input 사용.
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
  // select
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

function activeCountOf(cond: FilterCondition | undefined): number {
  if (!cond) return 0
  if (cond.kind === "in") return cond.values.length
  if (cond.kind === "range")
    return (cond.min !== undefined ? 1 : 0) + (cond.max !== undefined ? 1 : 0)
  return (cond.from ? 1 : 0) + (cond.to ? 1 : 0)
}

export function FilterMenu() {
  const board = useFlowBase(selectActiveBoard)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const toggleColumnInValue = useFlowBase((s) => s.toggleColumnInValue)
  const setColumnCondition = useFlowBase((s) => s.setColumnCondition)
  const clearAllFilters = useFlowBase((s) => s.clearAllFilters)
  const setFilter = useFlowBase((s) => s.setFilter)

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"list" | "values">("list")
  const [colName, setColName] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("list")
        setColName(null)
      }, 150)
      return () => clearTimeout(t)
    }
  }, [open])

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

  const selected = useMemo(
    () => filterableCols.find((c) => c.col.name === colName) ?? null,
    [filterableCols, colName],
  )

  if (!board) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-64 p-0"
        data-filter-popover
        data-filter-step={step}
      >
        {step === "list" ? (
          <ListStep
            columns={filterableCols}
            columnFilters={columnFilters}
            onPick={(name) => {
              setColName(name)
              setStep("values")
            }}
            totalActive={totalActive}
            onClearAll={() => {
              clearAllFilters()
              setFilter([])
            }}
          />
        ) : selected ? (
          <ValuesStep
            option={selected}
            cond={columnFilters[selected.col.name]}
            onBack={() => {
              setStep("list")
              setColName(null)
            }}
            onToggleIn={(v) => toggleColumnInValue(selected.col.name, v)}
            onSetCondition={(c) => setColumnCondition(selected.col.name, c)}
            onClearCol={() => setColumnCondition(selected.col.name, null)}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

// ─── Step 1: 필드 리스트 ──────────────────────────────────
function ListStep({
  columns,
  columnFilters,
  onPick,
  totalActive,
  onClearAll,
}: {
  columns: ColumnOption[]
  columnFilters: Record<string, FilterCondition>
  onPick: (colName: string) => void
  totalActive: number
  onClearAll: () => void
}) {
  return (
    <div className="space-y-0.5 py-1">
      <div className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Add filter…
      </div>
      {columns.length === 0 ? (
        <div className="px-3 py-2 text-[12px] text-muted-foreground">
          No filterable columns on this table.
        </div>
      ) : (
        <div className="px-1">
          {columns.map(({ col, hue }) => {
            const Icon = TYPE_ICON[col.type]
            const activeOnCol = activeCountOf(columnFilters[col.name])
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => onPick(col.name)}
                data-filter-col={col.name}
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: hue }}
                  aria-hidden="true"
                />
                <Icon
                  className="size-3.5 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <span className="flex-1 truncate text-[12.5px]">
                  {col.label || col.name}
                </span>
                {activeOnCol > 0 && (
                  <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-semibold tabular-nums text-primary">
                    {activeOnCol}
                  </span>
                )}
                <span className="text-muted-foreground/70">›</span>
              </button>
            )
          })}
        </div>
      )}
      {totalActive > 0 && (
        <>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={onClearAll}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="size-3.5" />
            Clear all filters
          </button>
        </>
      )}
    </div>
  )
}

// ─── Step 2: 값/범위 picker (kind 분기) ──────────────────
function ValuesStep({
  option,
  cond,
  onBack,
  onToggleIn,
  onSetCondition,
  onClearCol,
}: {
  option: ColumnOption
  cond: FilterCondition | undefined
  onBack: () => void
  onToggleIn: (value: string) => void
  onSetCondition: (c: FilterCondition) => void
  onClearCol: () => void
}) {
  const Icon = TYPE_ICON[option.col.type]
  const hasActive = activeCountOf(cond) > 0
  const isInKind = option.col.type === "status" || option.col.type === "select"
  const isNumKind = option.col.type === "num"
  const isDateKind = option.col.type === "date"

  return (
    <div className="space-y-0.5 py-1" data-filter-col-values={option.col.name}>
      <button
        type="button"
        onClick={onBack}
        data-filter-back
        className="flex w-full cursor-pointer items-center gap-1.5 px-3 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ArrowLeft className="size-3" strokeWidth={2} />
        <span>Back</span>
      </button>
      <div className="flex items-center gap-2 px-3 pb-1.5 pt-0.5">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: option.hue }}
          aria-hidden="true"
        />
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <span className="flex-1 text-[12.5px] font-semibold">
          {option.col.label || option.col.name}
        </span>
        {hasActive && (
          <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-semibold tabular-nums text-primary">
            {activeCountOf(cond)}
          </span>
        )}
      </div>

      {/* kind별 위젯 */}
      {isInKind && option.values && (
        <div className="max-h-64 overflow-y-auto px-1">
          {option.values.map((v) => {
            const checked =
              cond?.kind === "in" ? cond.values.includes(v.id) : false
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onToggleIn(v.id)}
                data-filter-value={v.id}
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
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
              </button>
            )
          })}
        </div>
      )}

      {isNumKind && (
        <RangeWidget cond={cond} onSet={onSetCondition} />
      )}
      {isDateKind && (
        <DateRangeWidget cond={cond} onSet={onSetCondition} />
      )}

      {hasActive && (
        <>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={onClearCol}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="size-3.5" />
            Clear this filter
          </button>
        </>
      )}
    </div>
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
    <div className="space-y-2 px-3 pb-1 pt-1">
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
          data-filter-max
          className="h-7 text-[12px]"
        />
      </div>
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
    <div className="space-y-1.5 px-3 pb-1 pt-1">
      <div className="space-y-1">
        <label className="text-[10.5px] text-muted-foreground">From</label>
        <Input
          type="date"
          value={from ?? ""}
          onChange={(e) =>
            onSet({ kind: "date-range", from: e.target.value || undefined, to })
          }
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
          data-filter-to
          className="h-7 text-[12px]"
        />
      </div>
    </div>
  )
}

// ─── 활성 필터 칩 바 — kind별 라벨 ──────────────────────
export function ActiveFilterChips() {
  const board = useFlowBase(selectActiveBoard)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const setColumnCondition = useFlowBase((s) => s.setColumnCondition)
  const toggleColumnInValue = useFlowBase((s) => s.toggleColumnInValue)

  if (!board) return null

  const colByName = (n: string) => board.columns.find((c) => c.name === n)

  const entries = Object.entries(columnFilters).filter(([, c]) => activeCountOf(c) > 0)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.flatMap(([col, cond]) => {
        const c = colByName(col)
        const colLabel = c?.label || col
        if (cond.kind === "in") {
          return cond.values.map((v) => {
            const label =
              c?.type === "status"
                ? (STATUS_LABELS[v as keyof typeof STATUS_LABELS] ?? v)
                : v
            return (
              <Chip
                key={`${col}:${v}`}
                colLabel={colLabel}
                valueLabel={label}
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
              key={`${col}:range`}
              colLabel={colLabel}
              valueLabel={text}
              onRemove={() => setColumnCondition(col, null)}
              dataAttr={`${col}:range`}
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
            key={`${col}:date-range`}
            colLabel={colLabel}
            valueLabel={text}
            onRemove={() => setColumnCondition(col, null)}
            dataAttr={`${col}:date-range`}
          />,
        ]
      })}
    </div>
  )
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
