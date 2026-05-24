// FlowBase V2 — Heatmap chart (categoryField × groupField cross-tab grid)
// 출처 컨셉: design-ref/prototype/echarts-bridge.jsx Heatmap
//
// 2D grid: rows = catField values, cols = groupField values, cell color
// intensity ∝ count/max. 단일 hue (var(--chart-1))에 opacity로 농담.
// 외부 lib 의존성 0 (echarts ❌). stacked-bar-chart 패턴 답습.

"use client"

import { useMemo } from "react"
import type { TableRow } from "@/types/flowbase"
import { cn } from "@/lib/utils"

interface HeatmapData {
  categories: string[] // Y축 (rows) — total 내림차순
  groups: string[] // X축 (cols) — total 내림차순
  cells: Map<string, number> // key = `${cat}|${grp}` → count
  max: number
}

function buildData(
  rows: TableRow[],
  catField: string,
  groupField: string,
): HeatmapData {
  const cells = new Map<string, number>()
  const catTotals = new Map<string, number>()
  const groupTotals = new Map<string, number>()
  for (const r of rows) {
    const c = String(r[catField] ?? "")
    const g = String(r[groupField] ?? "")
    if (!c || !g) continue
    const key = `${c}|${g}`
    cells.set(key, (cells.get(key) ?? 0) + 1)
    catTotals.set(c, (catTotals.get(c) ?? 0) + 1)
    groupTotals.set(g, (groupTotals.get(g) ?? 0) + 1)
  }
  const categories = Array.from(catTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
  const groups = Array.from(groupTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
  const max = Math.max(1, ...cells.values())
  return { categories, groups, cells, max }
}

// 0~max → 0.08 ~ 1.0 opacity. 0은 빈 셀.
function intensity(count: number, max: number): number {
  if (count === 0) return 0
  const t = count / max
  // floor 0.18로 작은 값도 보이게, 1로 클램프
  return Math.max(0.18, Math.min(1, t))
}

export function HeatmapChart({
  rows,
  categoryField,
  groupField,
  className,
}: {
  rows: TableRow[]
  categoryField: string
  groupField: string
  className?: string
}) {
  const data = useMemo(
    () => buildData(rows, categoryField, groupField),
    [rows, categoryField, groupField],
  )

  if (data.categories.length === 0 || data.groups.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-[11.5px] text-muted-foreground">
        No data
      </div>
    )
  }

  // CSS grid: 첫 컬럼 = row label, 그 다음 = group columns
  const gridTemplate = `minmax(70px, 1fr) repeat(${data.groups.length}, minmax(28px, 1fr))`

  return (
    <div className={cn("space-y-1.5 overflow-x-auto", className)}>
      <div
        className="grid gap-[2px] text-[10.5px]"
        style={{ gridTemplateColumns: gridTemplate }}
        data-heatmap-grid
      >
        {/* Header row */}
        <div />
        {data.groups.map((g) => (
          <div
            key={`h-${g}`}
            className="truncate px-1 py-0.5 text-center text-muted-foreground"
            title={g}
          >
            {g}
          </div>
        ))}
        {/* Data rows */}
        {data.categories.map((c) => (
          <Row
            key={c}
            category={c}
            groups={data.groups}
            cells={data.cells}
            max={data.max}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>0</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-sm">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                background: "var(--chart-1)",
                opacity: 0.18 + (i / 9) * 0.82,
              }}
            />
          ))}
        </div>
        <span className="tabular-nums">{data.max}</span>
      </div>
    </div>
  )
}

function Row({
  category,
  groups,
  cells,
  max,
}: {
  category: string
  groups: string[]
  cells: Map<string, number>
  max: number
}) {
  return (
    <>
      <div
        className="truncate px-1 py-1 text-foreground"
        title={category}
      >
        {category}
      </div>
      {groups.map((g) => {
        const v = cells.get(`${category}|${g}`) ?? 0
        const op = intensity(v, max)
        return (
          <div
            key={`${category}-${g}`}
            title={`${category} × ${g}: ${v}`}
            className={cn(
              "flex h-7 items-center justify-center rounded-sm font-mono tabular-nums transition-colors",
              v > 0
                ? "text-foreground"
                : "text-muted-foreground/40",
            )}
            style={{
              background:
                v > 0 ? "var(--chart-1)" : "var(--muted)",
              opacity: v > 0 ? op : 0.4,
            }}
          >
            {v > 0 ? v : ""}
          </div>
        )
      })}
    </>
  )
}
