// FlowBase V2 — Stacked bar chart (category × group cross-tab)
// 출처 컨셉: design-ref/prototype/echarts-bridge.jsx StackedBar
//
// 단순 SVG 기반. 각 카테고리 막대를 groupByCol 값들로 stack.
// 외부 lib 의존성 0 (echarts ❌).

"use client"

import { useMemo } from "react"
import type { TableRow } from "@/types/flowbase"
import { cn } from "@/lib/utils"

const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface StackedBarData {
  category: string
  segments: { label: string; value: number; color: string }[]
  total: number
}

function buildData(
  rows: TableRow[],
  catField: string,
  groupField: string,
): StackedBarData[] {
  // category → groupLabel → count
  const buckets = new Map<string, Map<string, number>>()
  const allGroups = new Set<string>()
  for (const r of rows) {
    const cat = String(r[catField] ?? "")
    const grp = String(r[groupField] ?? "")
    if (!cat || !grp) continue
    allGroups.add(grp)
    if (!buckets.has(cat)) buckets.set(cat, new Map())
    const m = buckets.get(cat)!
    m.set(grp, (m.get(grp) ?? 0) + 1)
  }
  const groups = Array.from(allGroups)
  const colorByGroup = new Map<string, string>()
  groups.forEach((g, i) =>
    colorByGroup.set(g, CHART_PALETTE[i % CHART_PALETTE.length]),
  )
  return Array.from(buckets.entries())
    .map(([category, m]) => ({
      category,
      segments: groups
        .map((g) => ({
          label: g,
          value: m.get(g) ?? 0,
          color: colorByGroup.get(g)!,
        }))
        .filter((s) => s.value > 0),
      total: Array.from(m.values()).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total)
}

export function StackedBarChart({
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
  const max = useMemo(
    () => Math.max(1, ...data.map((d) => d.total)),
    [data],
  )

  // 범례 — 모든 그룹 unique
  const legend = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of data) {
      for (const s of d.segments) map.set(s.label, s.color)
    }
    return Array.from(map.entries()).map(([label, color]) => ({
      label,
      color,
    }))
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-[11.5px] text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.category} className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="truncate text-foreground">{d.category}</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {d.total}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded">
              {d.segments.map((s) => (
                <div
                  key={s.label}
                  title={`${s.label}: ${s.value}`}
                  style={{
                    width: `${(s.value / max) * 100}%`,
                    background: s.color,
                  }}
                />
              ))}
              <div
                className="bg-muted/40"
                style={{ width: `${((max - d.total) / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10.5px]">
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1">
            <span
              className="size-2 rounded-sm"
              style={{ background: l.color }}
            />
            <span className="text-muted-foreground">{l.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
