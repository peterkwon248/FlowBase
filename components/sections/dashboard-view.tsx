// FlowBase V2 — Dashboard 뷰 (제네릭 집계)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §4 (D3 — 제네릭)
// 출처: design-ref/prototype/chart-dashboard.jsx GenericDashboard
//
// board의 categorical(status/select)·numeric 컬럼을 집계. selectVisibleRows를
// 써서 필터/검색을 추종한다. 1·2번째 categorical은 hero 차트, 나머지는 막대.

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart } from "@/components/charts/bar-chart"
import { CategoryBar, type CategoryBarItem } from "@/components/charts/category-bar"
import { ChartCard } from "@/components/charts/chart-card"
import { DonutChart } from "@/components/charts/donut-chart"
import { HeatmapChart } from "@/components/charts/heatmap-chart"
import { KpiTile } from "@/components/charts/kpi-tile"
import { LineChart, type LinePoint } from "@/components/charts/line-chart"
import { StackedBarChart } from "@/components/charts/stacked-bar-chart"
import { AddChartDialog } from "@/components/sections/add-chart-dialog"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import type {
  ChartConfig,
  ChartWidth,
  ColumnDef,
  TableRow,
} from "@/types/flowbase"
import { cn } from "@/lib/utils"

const WIDTH_OPTIONS: { value: ChartWidth; label: string }[] = [
  { value: "quarter", label: "1/4" },
  { value: "half", label: "1/2" },
  { value: "two-thirds", label: "2/3" },
  { value: "full", label: "Full" },
]

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
    // multiSelect cell — 배열 원소 각각 +1 (Notion 패턴). 합계가 rows.length 초과 가능.
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item == null) continue
        const k = String(item).trim()
        if (!k) continue
        counts.set(k, (counts.get(k) ?? 0) + 1)
      }
      continue
    }
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

const WIDTH_CLASS: Record<ChartWidth, string> = {
  quarter: "md:col-span-3",
  half: "md:col-span-6",
  "two-thirds": "md:col-span-8",
  full: "md:col-span-12",
}

export function DashboardView() {
  const board = useFlowBase(selectActiveBoard)
  // selectVisibleRows는 새 배열을 반환 → 직접 구독 ❌. 의존 슬라이스 구독 후 useMemo.
  const search = useFlowBase((s) => s.search)
  const filter = useFlowBase((s) => s.filter)
  const sort = useFlowBase((s) => s.sort)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const removeChart = useFlowBase((s) => s.removeChart)
  const moveChart = useFlowBase((s) => s.moveChart)
  const updateChart = useFlowBase((s) => s.updateChart)
  const clearCustomCharts = useFlowBase((s) => s.clearCustomCharts)
  const rows = useMemo(
    () => selectVisibleRows(useFlowBase.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, search, filter, sort, columnFilters],
  )

  const [addOpen, setAddOpen] = useState(false)

  if (!board) return null

  const customCharts = board.charts ?? []
  const hasCustomCharts = customCharts.length > 0

  const categorical = board.columns.filter(
    (c) =>
      (c.type === "status" ||
        c.type === "select" ||
        c.type === "multiSelect") &&
      c.name !== "id",
  )
  const numeric = board.columns.filter((c) => c.type === "num")
  const dateCol = board.columns.find((c) => c.type === "date")
  const trend = useMemo(
    () => (dateCol ? buildWeeklyTrend(rows, dateCol.name) : []),
    [rows, dateCol],
  )

  if (categorical.length === 0 && numeric.length === 0 && !hasCustomCharts) {
    return (
      <>
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
              Add a Select/Status/Number/Date column, or click below to add a chart manually.
            </p>
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="mt-4 gap-1.5"
              data-action="dashboard-add-chart-empty"
            >
              <Plus className="size-3" /> Add chart
            </Button>
          </div>
        </div>
        <AddChartDialog open={addOpen} onOpenChange={setAddOpen} />
      </>
    )
  }

  const aggs = categorical.map((c) => ({ col: c, agg: aggregate(rows, c.name) }))
  const hero = aggs.slice(0, 2)
  const rest = aggs.slice(2)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto bg-background p-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {hasCustomCharts
            ? `Custom dashboard · ${customCharts.length} charts`
            : "Auto-generated"}
        </div>
        <div className="flex items-center gap-1.5">
          {hasCustomCharts && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearCustomCharts()}
              className="h-7 px-2 text-[11.5px] text-muted-foreground"
            >
              Reset to auto
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="h-7 gap-1.5 px-2.5 text-[11.5px]"
            data-action="dashboard-add-chart"
          >
            <Plus className="size-3" strokeWidth={2.5} /> Add chart
          </Button>
        </div>
      </div>

      {/* 사용자 정의 차트 (있으면 우선) */}
      {hasCustomCharts && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {customCharts.map((chart, i) => (
            <div
              key={chart.id}
              className={WIDTH_CLASS[chart.width]}
              data-chart-card={chart.id}
            >
              <CustomChartCard
                chart={chart}
                rows={rows}
                board={board}
                accent={CHART_ACCENT[i % CHART_ACCENT.length]}
                isFirst={i === 0}
                isLast={i === customCharts.length - 1}
                onRemove={() => removeChart(chart.id)}
                onMoveUp={() => moveChart(chart.id, "up")}
                onMoveDown={() => moveChart(chart.id, "down")}
                onUpdate={(patch) => updateChart(chart.id, patch)}
              />
            </div>
          ))}
        </div>
      )}

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

      <AddChartDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}

// ─── 사용자 정의 차트 카드 (호버 toolbar: ↑↓ reorder + ⋯ edit + X) ─────
function CustomChartCard({
  chart,
  rows,
  board,
  accent,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdate,
}: {
  chart: ChartConfig
  rows: TableRow[]
  board: { columns: ColumnDef[] }
  accent: string
  isFirst: boolean
  isLast: boolean
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onUpdate: (patch: Partial<ChartConfig>) => void
}) {
  const sourceCol = board.columns.find((c) => c.name === chart.sourceCol)
  const groupCol = chart.groupByCol
    ? board.columns.find((c) => c.name === chart.groupByCol)
    : null
  const subtitle = sourceCol
    ? `${sourceCol.label || sourceCol.name}${
        groupCol ? ` × ${groupCol.label || groupCol.name}` : ""
      }`
    : ""

  const [renameOpen, setRenameOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState(chart.title)

  // 외부 변경 (다른 머신 sync) 시 draft 동기화
  useEffect(() => {
    setDraftTitle(chart.title)
  }, [chart.title])

  const saveRename = () => {
    const t = draftTitle.trim()
    if (t && t !== chart.title) onUpdate({ title: t })
    setRenameOpen(false)
  }

  return (
    <>
      <div className="group relative h-full">
        <ChartCard title={chart.title} subtitle={subtitle} accent={accent}>
          {renderChartBody(chart, rows, sourceCol)}
        </ChartCard>
        <div
          // 데스크탑: group-hover로 fade. 터치 디바이스(hover:none): 항상 visible.
          className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-card/80 px-0.5 py-0.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          data-chart-toolbar={chart.id}
        >
          <ToolbarBtn
            title="Move up"
            disabled={isFirst}
            onClick={onMoveUp}
            data-chart-up={chart.id}
          >
            <ChevronUp className="size-3" strokeWidth={2.5} />
          </ToolbarBtn>
          <ToolbarBtn
            title="Move down"
            disabled={isLast}
            onClick={onMoveDown}
            data-chart-down={chart.id}
          >
            <ChevronDown className="size-3" strokeWidth={2.5} />
          </ToolbarBtn>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="More options"
                data-chart-menu={chart.id}
                className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground"
              >
                <MoreHorizontal className="size-3" strokeWidth={2.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onSelect={() => {
                  setDraftTitle(chart.title)
                  setRenameOpen(true)
                }}
                data-chart-rename={chart.id}
              >
                Rename…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                Width
              </DropdownMenuLabel>
              <div className="px-2 pb-1.5">
                <div className="flex gap-1">
                  {WIDTH_OPTIONS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => onUpdate({ width: w.value })}
                      data-chart-width={w.value}
                      className={cn(
                        "flex-1 rounded border px-1 py-0.5 text-[10.5px] transition-colors",
                        chart.width === w.value
                          ? "border-primary bg-primary/[0.08] font-semibold"
                          : "border-border-subtle text-muted-foreground hover:border-border",
                      )}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <ToolbarBtn
            title="Remove chart"
            onClick={onRemove}
            data-chart-remove={chart.id}
            destructive
          >
            <X className="size-3" strokeWidth={2.5} />
          </ToolbarBtn>
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename chart</DialogTitle>
            <DialogDescription className="text-[12px]">
              The chart ID and data stay the same.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="chart-rename" className="text-[12px]">
              Title
            </Label>
            <Input
              id="chart-rename"
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ToolbarBtn({
  children,
  onClick,
  title,
  disabled,
  destructive,
  ...props
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  disabled?: boolean
  destructive?: boolean
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground",
        disabled && "cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted-foreground",
        destructive && "hover:bg-destructive/15 hover:text-destructive",
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function renderChartBody(
  chart: ChartConfig,
  rows: TableRow[],
  sourceCol: ColumnDef | undefined,
) {
  if (!sourceCol) {
    return (
      <div className="py-6 text-center text-[11.5px] text-muted-foreground">
        Source column missing.
      </div>
    )
  }

  if (chart.type === "kpi") {
    const vals = rows
      .map((r) => r[sourceCol.name])
      .filter((v) => v != null && v !== "")
    const distinct = new Set(vals.map(String)).size
    return (
      <div className="py-3 text-center">
        <div className="text-3xl font-bold tabular-nums">{distinct}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          distinct values
        </div>
      </div>
    )
  }

  if (chart.type === "bar" || chart.type === "donut") {
    const agg = aggregate(rows, sourceCol.name)
    const data = agg.map((a) => ({ label: a.label, value: a.count }))
    return chart.type === "bar" ? <BarChart data={data} /> : <DonutChart data={data} />
  }

  if (chart.type === "line") {
    const trend = buildWeeklyTrend(rows, sourceCol.name)
    return <LineChart data={trend} area />
  }

  if (chart.type === "stacked-bar" && chart.groupByCol) {
    return (
      <StackedBarChart
        rows={rows}
        categoryField={sourceCol.name}
        groupField={chart.groupByCol}
      />
    )
  }

  if (chart.type === "heatmap" && chart.groupByCol) {
    return (
      <HeatmapChart
        rows={rows}
        categoryField={sourceCol.name}
        groupField={chart.groupByCol}
      />
    )
  }

  return null
}
