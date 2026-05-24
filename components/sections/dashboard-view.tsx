// FlowBase V2 — Dashboard 뷰 (제네릭 집계)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §4 (D3 — 제네릭)
// 출처: design-ref/prototype/chart-dashboard.jsx GenericDashboard
//
// board의 categorical(status/select)·numeric 컬럼을 집계. selectVisibleRows를
// 써서 필터/검색을 추종한다. 1·2번째 categorical은 hero 차트, 나머지는 막대.

"use client"

import { useMemo } from "react"
import { LayoutDashboard } from "lucide-react"
import { BarChart } from "@/components/charts/bar-chart"
import { CategoryBar, type CategoryBarItem } from "@/components/charts/category-bar"
import { ChartCard } from "@/components/charts/chart-card"
import { DonutChart } from "@/components/charts/donut-chart"
import { KpiTile } from "@/components/charts/kpi-tile"
import { LineChart, type LinePoint } from "@/components/charts/line-chart"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import type { ColumnDef, TableRow } from "@/types/flowbase"

// status는 LOCK 색 (blue/amber/violet/emerald), 그 외는 chart 팔레트.
const STATUS_BAR: Record<string, string> = {
  미처리: "bg-blue-600 dark:bg-blue-500",
  진행중: "bg-amber-600 dark:bg-amber-400",
  대기: "bg-violet-600 dark:bg-violet-400",
  완료: "bg-emerald-600 dark:bg-emerald-400",
}
const CHART_BAR = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
]
const CHART_ACCENT = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface Agg {
  label: string
  count: number
}

function aggregate(rows: TableRow[], field: string): Agg[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const v = r[field]
    if (v == null || v === "") continue
    const k = String(v)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function toBarItems(agg: Agg[], col: ColumnDef): CategoryBarItem[] {
  return agg.map((a, i) => ({
    label: a.label,
    count: a.count,
    colorClass:
      col.type === "status"
        ? (STATUS_BAR[a.label] ?? CHART_BAR[i % CHART_BAR.length])
        : CHART_BAR[i % CHART_BAR.length],
  }))
}

function colTitle(col: ColumnDef): string {
  return col.label?.trim() || col.name
}

// 날짜 컬럼 row를 주별로 버킷팅 → 최근 8주 기준.
function buildWeeklyTrend(rows: TableRow[], dateField: string): LinePoint[] {
  const valid: { ts: number; iso: string }[] = []
  for (const r of rows) {
    const v = r[dateField]
    if (typeof v !== "string") continue
    const t = new Date(v).getTime()
    if (!Number.isFinite(t)) continue
    valid.push({ ts: t, iso: v })
  }
  if (valid.length === 0) return []
  const maxTs = Math.max(...valid.map((v) => v.ts))
  const weeks: LinePoint[] = []
  for (let i = 7; i >= 0; i--) {
    const end = maxTs - i * 7 * 86_400_000
    const start = end - 7 * 86_400_000
    const count = valid.filter((v) => v.ts > start && v.ts <= end).length
    const dt = new Date(end)
    const label = `${dt.getMonth() + 1}/${dt.getDate()}`
    weeks.push({ label, value: count })
  }
  return weeks
}

export function DashboardView() {
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

  if (!board) return null

  const categorical = board.columns.filter(
    (c) => (c.type === "status" || c.type === "select") && c.name !== "id",
  )
  const numeric = board.columns.filter((c) => c.type === "num")
  const dateCol = board.columns.find((c) => c.type === "date")
  const trend = useMemo(
    () => (dateCol ? buildWeeklyTrend(rows, dateCol.name) : []),
    [rows, dateCol],
  )

  if (categorical.length === 0 && numeric.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background p-10">
        <div className="max-w-sm rounded-lg border border-border-subtle bg-card p-7 text-center">
          <LayoutDashboard
            className="mx-auto mb-3 size-8 text-muted-foreground"
            strokeWidth={1.5}
          />
          <div className="mb-1 text-sm font-semibold">
            No columns to aggregate
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Dashboard needs at least one Select/Status category or Number column.
          </p>
        </div>
      </div>
    )
  }

  const aggs = categorical.map((c) => ({ col: c, agg: aggregate(rows, c.name) }))
  const hero = aggs.slice(0, 2)
  const rest = aggs.slice(2)

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto bg-background p-5">
      {/* KPI 타일 */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <KpiTile label="Total rows" value={rows.length} />
        {aggs.slice(0, 3).map(({ col, agg }) => (
          <KpiTile
            key={col.name}
            label={`${colTitle(col)} · distinct`}
            value={agg.length}
          />
        ))}
      </div>

      {/* hero 차트 — 1·2번째 categorical */}
      {hero.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {hero[0] && (
            <ChartCard
              title={colTitle(hero[0].col)}
              subtitle="Distribution"
              accent={CHART_ACCENT[0]}
            >
              <DonutChart
                data={hero[0].agg.map((a) => ({
                  label: a.label,
                  value: a.count,
                }))}
              />
            </ChartCard>
          )}
          {hero[1] && (
            <ChartCard
              title={colTitle(hero[1].col)}
              subtitle="Distribution"
              accent={CHART_ACCENT[1]}
            >
              <BarChart
                data={hero[1].agg.map((a) => ({
                  label: a.label,
                  value: a.count,
                }))}
              />
            </ChartCard>
          )}
        </div>
      )}

      {/* Trend (date 컬럼 있을 때) — 최근 8주 row 카운트 */}
      {trend.length > 0 && (
        <ChartCard
          title={`${colTitle(dateCol!)} trend`}
          subtitle="Rows per week, last 8 weeks"
          accent={CHART_ACCENT[2]}
        >
          <LineChart data={trend} area />
        </ChartCard>
      )}

      {/* 나머지 categorical 컬럼별 막대 */}
      {rest.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {rest.map(({ col, agg }, i) => (
            <ChartCard
              key={col.name}
              title={`By ${colTitle(col)}`}
              subtitle={`${agg.length} values`}
              accent={CHART_ACCENT[(i + 2) % CHART_ACCENT.length]}
            >
              <CategoryBar items={toBarItems(agg, col)} total={rows.length} />
            </ChartCard>
          ))}
        </div>
      )}

      {/* numeric 요약 */}
      {numeric.length > 0 && (
        <ChartCard title="Number summary" accent={CHART_ACCENT[2]}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            {numeric.map((col) => {
              const vals = rows
                .map((r) => Number(r[col.name]))
                .filter((v) => !Number.isNaN(v))
              const sum = vals.reduce((a, b) => a + b, 0)
              const avg = vals.length > 0 ? sum / vals.length : 0
              return (
                <div key={col.name} className="rounded-md bg-muted p-2.5">
                  <div className="mb-1 text-[11.5px] text-muted-foreground">
                    {colTitle(col)}
                  </div>
                  <div className="text-lg font-bold tabular-nums">
                    {sum.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    avg {avg.toFixed(1)} · {vals.length} values
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>
      )}
    </div>
  )
}
