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
import { Check, Filter as FilterIcon, Plus, X } from "lucide-react"
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
    col.type === "multiSelect" ||
    col.type === "num" ||
    col.type === "date" ||
    col.type === "text" ||
    col.type === "email" ||
    col.type === "formula"
  )
}

// Q3: formula 컬럼의 widget kind 매핑 — resultType 기준.
// text/date → contains · number → range · boolean → in.
function formulaWidgetKind(
  col: ColumnDef,
): "text" | "num" | "date" | "in" {
  if (col.type !== "formula") return "in"
  switch (col.formulaResultType) {
    case "number":
      return "num"
    case "date":
      return "date"
    case "boolean":
      return "in" // 사실상 true/false 두 값
    case "text":
    default:
      return "text"
  }
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
  // multiSelect cell — 배열 unpack해서 각 값 추가. 그 외 string.
  const isMulti = col.type === "multiSelect"
  for (const r of rows) {
    const v = r[col.name]
    if (isMulti && Array.isArray(v)) {
      for (const item of v) {
        if (item == null) continue
        const s = String(item).trim()
        if (s) set.add(s)
      }
    } else if (typeof v === "string" && v) {
      set.add(v)
    }
  }
  return Array.from(set).map((v) => ({
    id: v,
    label: v,
    count: rows.filter((r) => {
      const cell = r[col.name]
      if (isMulti && Array.isArray(cell)) {
        return cell.some((x) => String(x ?? "") === v)
      }
      return cell === v
    }).length,
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
        col.type === "status" ||
        col.type === "select" ||
        col.type === "multiSelect"
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
// 컬럼당 multiple condition (AND) — 첫 cond는 기본 widget, 두 번째 cond는 옵션(반대 kind 추가).
// num/date는 single cond로 충분(range/date-range가 양끝 표현). status/select/text/email은 두 번째 cond 의미 있음.
//
// column type별 "두 번째 cond" 기본 kind:
//   - status/select: not_in (반대 — 의미: A & B이지만 C는 아님)
//   - text/email: not_contains
//   - num/date: 추가 ❌ (단일 cond로 충분)
function defaultSecondCondForType(
  colType: ColumnDef["type"],
): FilterCondition | null {
  if (colType === "status" || colType === "select" || colType === "multiSelect") {
    return { kind: "not_in", values: [] }
  }
  if (colType === "text" || colType === "email") {
    return { kind: "not_contains", text: "" }
  }
  return null
}

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
  const addColumnCondition = useFlowBase((s) => s.addColumnCondition)
  const removeColumnCondition = useFlowBase((s) => s.removeColumnCondition)
  // 첫 cond — 기본 widget이 편집
  const cond = conds?.[0]
  // 두 번째 이후 cond — sub menu 안에 array loop으로 표시 (Exclude #N / Match #N).
  // chip 외에 sub menu에서 직접 편집/제거 가능 (RecentFilter restore 시 자동 채워진 3+ cond UI).
  const extraConds = conds && conds.length > 1 ? conds.slice(1) : []
  const supportsSecond = defaultSecondCondForType(option.col.type) !== null
  // "+Add another" 진입점 — 직전 cond와 반대 kind를 자동 default (or 같은 type이면 그룹 추가).
  const lastCond = conds && conds.length > 0 ? conds[conds.length - 1] : undefined
  const canAddAnother = supportsSecond && activeCount > 0

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

        {/* range (num) — formula(number 결과)도 같은 widget */}
        {(option.col.type === "num" ||
          (option.col.type === "formula" &&
            formulaWidgetKind(option.col) === "num")) && (
          <RangeWidget cond={cond} onSet={(c) => setColumnCondition(option.col.name, c)} />
        )}

        {/* date-range — formula(date 결과)도 같은 widget */}
        {(option.col.type === "date" ||
          (option.col.type === "formula" &&
            formulaWidgetKind(option.col) === "date")) && (
          <DateRangeWidget
            cond={cond}
            onSet={(c) => setColumnCondition(option.col.name, c)}
          />
        )}

        {/* contains (text/email) — formula(text 결과)도 같은 widget */}
        {(option.col.type === "text" ||
          option.col.type === "email" ||
          (option.col.type === "formula" &&
            formulaWidgetKind(option.col) === "text")) && (
          <ContainsWidget
            cond={cond}
            onSet={(c) => setColumnCondition(option.col.name, c)}
          />
        )}

        {/* boolean formula — true/false 두 값 in widget */}
        {option.col.type === "formula" &&
          formulaWidgetKind(option.col) === "in" && (
            <BooleanFilterWidget
              cond={cond}
              onSet={(c) => setColumnCondition(option.col.name, c)}
            />
          )}

        {/* 두 번째 이후 cond — array loop으로 모두 표시 (Exclude #N / Match #N). */}
        {extraConds.map((c, i) => {
          const condIdx = i + 1
          // 같은 kind family 이전 카운트 → #N 표시 (kind family 첫 등장은 #1, 두 번째는 #2…)
          const isExclude = c.kind === "not_in" || c.kind === "not_contains"
          const family = isExclude ? "exclude" : "match"
          const sameFamilyBefore = (conds ?? [])
            .slice(0, condIdx)
            .filter((p) => {
              const pIsExclude = p.kind === "not_in" || p.kind === "not_contains"
              const pFamily = pIsExclude ? "exclude" : "match"
              return pFamily === family
            }).length
          const headerLabel = isExclude ? "Exclude" : "Match"
          const headerSuffix = sameFamilyBefore > 0 ? ` #${sameFamilyBefore + 1}` : ""
          return (
            <ExtraCondBlock
              key={condIdx}
              option={option}
              cond={c}
              condIdx={condIdx}
              header={`${headerLabel}${headerSuffix}`}
              onChange={(next) =>
                setColumnCondition(option.col.name, next, condIdx)
              }
              onRemove={() =>
                removeColumnCondition(option.col.name, condIdx)
              }
            />
          )
        })}

        {/* "+ Add another condition" — 직전 cond와 반대 kind 기본 (의미: in + not_in 결합).
            이미 같은 kind family가 있으면 같은 family 추가도 가능 (사용자 명시 의도). */}
        {canAddAnother && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                // 직전 cond가 in/contains이면 not_*, not_*이면 in/contains로 전환 추가.
                // num/date(supportsSecond=false)는 진입점 자체 ❌라 여기 도달 ❌.
                const baseDef = defaultSecondCondForType(option.col.type)
                if (!baseDef) return
                let nextDef: FilterCondition = baseDef
                if (lastCond) {
                  if (lastCond.kind === "not_in") {
                    nextDef = { kind: "in", values: [] }
                  } else if (lastCond.kind === "not_contains") {
                    nextDef = { kind: "contains", text: "" }
                  }
                  // in/contains이면 baseDef(not_*) 그대로
                }
                addColumnCondition(option.col.name, nextDef)
              }}
              className="gap-2 text-[12px] text-muted-foreground"
              data-add-condition={option.col.name}
            >
              <Plus className="size-3.5" strokeWidth={2} />
              {extraConds.length === 0
                ? option.col.type === "status" ||
                  option.col.type === "select" ||
                  option.col.type === "multiSelect"
                  ? "Add exclude values"
                  : "Add exclude text"
                : "Add another condition"}
            </DropdownMenuItem>
          </>
        )}

        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                // 모든 cond 제거 — splice 후 shift되므로 index=0로 N번 호출
                const total = conds?.length ?? 0
                for (let i = 0; i < total; i++) {
                  setColumnCondition(option.col.name, null, 0)
                }
              }}
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

// ─── Boolean filter widget (formula resultType="boolean") — true/false 두 값 in ────
function BooleanFilterWidget({
  cond,
  onSet,
}: {
  cond: FilterCondition | undefined
  onSet: (c: FilterCondition) => void
}) {
  const values =
    cond?.kind === "in" || cond?.kind === "not_in" ? cond.values : []
  const isNot = cond?.kind === "not_in"
  const toggle = (v: string) => {
    const next = values.includes(v)
      ? values.filter((x) => x !== v)
      : [...values, v]
    onSet({ kind: isNot ? "not_in" : "in", values: next })
  }
  return (
    <div className="space-y-1.5 px-2 pb-1.5 pt-1">
      <MatchToggle
        kind={isNot ? "exclude" : "include"}
        onChange={(k) => {
          if (values.length === 0) return
          onSet({ kind: k === "exclude" ? "not_in" : "in", values })
        }}
      />
      {["true", "false"].map((v) => {
        const checked = values.includes(v)
        return (
          <button
            key={v}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggle(v)
            }}
            className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-[12px] hover:bg-foreground/[0.04]"
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
            <span className="flex-1">
              {v === "true" ? "✓ Yes" : "— No"}
            </span>
          </button>
        )
      })}
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

// ─── ExtraCondBlock — cond[1+] sub-menu 표시 (3+ cond UI 편집 진입점) ───
// cond.kind에 따라 위젯 분기 — in/not_in 체크박스 리스트, contains/not_contains text input.
// header에 "Exclude"/"Match" + 인덱스 #N 표시. 우측 X 버튼 (cond 제거).
// range/date-range는 도달 ❌ (supportsSecond 진입점이 status/select/multi/text/email만 허용).
function ExtraCondBlock({
  option,
  cond,
  condIdx,
  header,
  onChange,
  onRemove,
}: {
  option: ColumnOption
  cond: FilterCondition
  condIdx: number
  header: string
  onChange: (next: FilterCondition) => void
  onRemove: () => void
}) {
  const isExclude = cond.kind === "not_in" || cond.kind === "not_contains"
  const accentBox = isExclude
    ? "border-rose-500 bg-rose-500 text-white"
    : "border-primary bg-primary text-primary-foreground"
  return (
    <>
      <DropdownMenuSeparator />
      <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-1.5">
        <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          {header}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          className="flex size-4 items-center justify-center rounded text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
          title={`Remove ${header.toLowerCase()} condition`}
          data-remove-cond={`${option.col.name}-${condIdx}`}
        >
          <X className="size-2.5" strokeWidth={2.5} />
        </button>
      </div>
      {option.values && (cond.kind === "in" || cond.kind === "not_in") && (
        <div className="max-h-44 overflow-y-auto">
          {option.values.map((v) => {
            const checked = cond.values.includes(v.id)
            return (
              <DropdownMenuItem
                key={`${condIdx}-${v.id}`}
                onSelect={(e) => {
                  e.preventDefault()
                  const cur = cond.values
                  const next = checked
                    ? cur.filter((x) => x !== v.id)
                    : [...cur, v.id]
                  onChange({ kind: cond.kind, values: next })
                }}
                className="gap-2"
                data-filter-extra-value={`${condIdx}-${v.id}`}
              >
                <span
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded border",
                    checked ? accentBox : "border-border",
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
      )}
      {(option.col.type === "text" || option.col.type === "email") &&
        (cond.kind === "contains" || cond.kind === "not_contains") && (
          <div className="px-2 pb-1.5 pt-1">
            <Input
              type="text"
              placeholder={isExclude ? "Excludes…" : "Contains…"}
              value={cond.text}
              onChange={(e) => onChange({ kind: cond.kind, text: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              data-filter-extra-text={`${option.col.name}-${condIdx}`}
              className="h-7 text-[12px]"
            />
          </div>
        )}
    </>
  )
}
