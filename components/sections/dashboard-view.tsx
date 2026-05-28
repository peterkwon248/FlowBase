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
  Printer,
  Sparkles,
  Target,
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
import { BulletChart } from "@/components/charts/bullet-chart"
import { CategoryBar, type CategoryBarItem } from "@/components/charts/category-bar"
import { ChartCard } from "@/components/charts/chart-card"
import { DonutChart } from "@/components/charts/donut-chart"
import { FunnelChart } from "@/components/charts/funnel-chart"
import { HeatmapChart } from "@/components/charts/heatmap-chart"
import { HistogramChart } from "@/components/charts/histogram-chart"
import { KpiTile } from "@/components/charts/kpi-tile"
import { LineChart, type LinePoint, type LineSeries } from "@/components/charts/line-chart"
import { PivotChart, type PivotData } from "@/components/charts/pivot-chart"
import { ScatterChart } from "@/components/charts/scatter-chart"
import { StackedBarChart } from "@/components/charts/stacked-bar-chart"
import { toast } from "sonner"
import { AddChartDialog } from "@/components/sections/add-chart-dialog"
import { aggregateBy, aggLabel } from "@/lib/chart-aggregate"
import { downloadChartPng } from "@/lib/chart-export"
import {
  filterUnseenRecommendations,
  recommendCharts,
} from "@/lib/dashboard-recommend"
import { DOMAIN_LABELS, inferDomain } from "@/lib/domain-infer"
import { computeInsights, type Insight } from "@/lib/insights"
import { formatValue, inferValueFormat } from "@/lib/value-format"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import type {
  AggFn,
  Board,
  ChartConfig,
  ChartWidth,
  ColumnDef,
  TableRow,
  TimeScale,
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

// 날짜 컬럼 row를 시간 bucket으로 trend. scale에 따라 bucket 크기/개수/라벨 다름.
// aggFn/valueCol 지정 시 그 bucket 안의 row valueCol aggregate. default count.
//
// F2: day/week는 등간격 ms (기존). month/quarter/year는 calendar boundary (정확 회계 단위).
const MONTH_LABEL = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]
const SCALE_COUNT: Record<TimeScale, number> = {
  day: 14,
  week: 8,
  month: 6,
  quarter: 4,
  year: 3,
}

interface BucketRange {
  startTs: number  // inclusive
  endTs: number    // exclusive
  label: string
}

// calendar-aware bucket 경계. anchor = 가장 최근 row의 date. count = SCALE_COUNT[scale].
// day/week는 등간격 (anchor에서 거꾸로). month/quarter/year는 정확 calendar boundary.
function calcBuckets(scale: TimeScale, anchor: Date, count: number): BucketRange[] {
  const buckets: BucketRange[] = []
  if (scale === "day" || scale === "week") {
    const days = scale === "day" ? 1 : 7
    const bucketMs = days * 86_400_000
    const anchorTs = anchor.getTime()
    for (let i = count - 1; i >= 0; i--) {
      const endTs = anchorTs - i * bucketMs
      const startTs = endTs - bucketMs
      const labelDate = new Date(endTs)
      buckets.push({
        startTs,
        endTs: endTs + 1, // ms tie-breaker — endTs 자체 포함
        label: `${labelDate.getMonth() + 1}/${labelDate.getDate()}`,
      })
    }
    return buckets
  }
  if (scale === "month") {
    const y = anchor.getFullYear()
    const m = anchor.getMonth()
    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(y, m - i, 1).getTime()
      const end = new Date(y, m - i + 1, 1).getTime()
      const d = new Date(start)
      buckets.push({
        startTs: start,
        endTs: end,
        label: `${MONTH_LABEL[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      })
    }
    return buckets
  }
  if (scale === "quarter") {
    const y = anchor.getFullYear()
    const q = Math.floor(anchor.getMonth() / 3)
    for (let i = count - 1; i >= 0; i--) {
      const startMonth = (q - i) * 3
      const start = new Date(y, startMonth, 1).getTime()
      const end = new Date(y, startMonth + 3, 1).getTime()
      const d = new Date(start)
      buckets.push({
        startTs: start,
        endTs: end,
        label: `Q${Math.floor(d.getMonth() / 3) + 1} ${String(d.getFullYear()).slice(2)}`,
      })
    }
    return buckets
  }
  // year
  const yAnchor = anchor.getFullYear()
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(yAnchor - i, 0, 1).getTime()
    const end = new Date(yAnchor - i + 1, 0, 1).getTime()
    buckets.push({ startTs: start, endTs: end, label: String(yAnchor - i) })
  }
  return buckets
}

function buildTrend(
  rows: TableRow[],
  dateField: string,
  scale: TimeScale = "week",
  aggFn: AggFn = "count",
  valueCol?: string,
): LinePoint[] {
  const valid: { ts: number; row: TableRow }[] = []
  for (const r of rows) {
    const v = r[dateField]
    if (typeof v !== "string") continue
    const t = new Date(v).getTime()
    if (!Number.isFinite(t)) continue
    valid.push({ ts: t, row: r })
  }
  if (valid.length === 0) return []
  const maxTs = Math.max(...valid.map((v) => v.ts))
  const buckets = calcBuckets(scale, new Date(maxTs), SCALE_COUNT[scale])
  const points: LinePoint[] = []
  for (const b of buckets) {
    const bucketRows = valid
      .filter((v) => v.ts >= b.startTs && v.ts < b.endTs)
      .map((v) => v.row)
    const agg = aggregateBy(bucketRows, null, aggFn, valueCol)[0]
    // G5-2: drill-down rangeStart/rangeEnd ISO (YYYY-MM-DD).
    // endTs는 exclusive boundary — to ISO는 endTs-1ms 기준 (마지막 포함되는 날짜)
    points.push({
      label: b.label,
      value: agg.value,
      rangeStart: new Date(b.startTs).toISOString().slice(0, 10),
      rangeEnd: new Date(b.endTs - 1).toISOString().slice(0, 10),
    })
  }
  return points
}

// G1-1: 2D pivot — row × col aggregate. multiSelect cell은 Notion 패턴 (배열 unpack).
function computePivot(
  rows: TableRow[],
  rowField: string,
  colField: string,
  aggFn: AggFn = "count",
  valueCol?: string,
): PivotData {
  const rowSet = new Set<string>()
  const colSet = new Set<string>()
  const groupMap = new Map<string, TableRow[]>()
  for (const r of rows) {
    const rRaw = r[rowField]
    const cRaw = r[colField]
    if (rRaw == null || rRaw === "") continue
    if (cRaw == null || cRaw === "") continue
    const rKeys = Array.isArray(rRaw)
      ? rRaw.map((x) => (x == null ? "" : String(x).trim())).filter((s) => s.length > 0)
      : [String(rRaw)]
    const cKeys = Array.isArray(cRaw)
      ? cRaw.map((x) => (x == null ? "" : String(x).trim())).filter((s) => s.length > 0)
      : [String(cRaw)]
    for (const rk of rKeys) {
      rowSet.add(rk)
      for (const ck of cKeys) {
        colSet.add(ck)
        const key = `${rk}::${ck}`
        const list = groupMap.get(key) ?? []
        list.push(r)
        groupMap.set(key, list)
      }
    }
  }
  const rowLabels = Array.from(rowSet).sort()
  const colLabels = Array.from(colSet).sort()
  const cells = rowLabels.map((rk) =>
    colLabels.map((ck) => {
      const groupRows = groupMap.get(`${rk}::${ck}`) ?? []
      return aggregateBy(groupRows, null, aggFn, valueCol)[0]?.value ?? 0
    }),
  )
  return { rowLabels, colLabels, cells }
}

// F1: multi-series trend — groupByCol에 따라 row 분할 → 각 group별 buildTrend.
// 같은 bucket 라벨 공유 (buckets는 한 번 계산 후 모든 group에 적용).
function buildSeries(
  rows: TableRow[],
  dateField: string,
  groupByCol: string,
  scale: TimeScale = "week",
  aggFn: AggFn = "count",
  valueCol?: string,
): LineSeries[] {
  // valid rows + bucket boundary
  const valid: { ts: number; row: TableRow }[] = []
  for (const r of rows) {
    const v = r[dateField]
    if (typeof v !== "string") continue
    const t = new Date(v).getTime()
    if (!Number.isFinite(t)) continue
    valid.push({ ts: t, row: r })
  }
  if (valid.length === 0) return []
  const maxTs = Math.max(...valid.map((v) => v.ts))
  const buckets = calcBuckets(scale, new Date(maxTs), SCALE_COUNT[scale])

  // 그룹 분류 — multiSelect는 row가 여러 그룹에 속함 (Notion 패턴).
  const groupedRows = new Map<string, TableRow[]>()
  for (const r of rows) {
    const raw = r[groupByCol]
    if (raw == null || raw === "") continue
    const keys: string[] = Array.isArray(raw)
      ? raw.map((x) => (x == null ? "" : String(x).trim())).filter((s) => s.length > 0)
      : [String(raw)]
    for (const k of keys) {
      const list = groupedRows.get(k) ?? []
      list.push(r)
      groupedRows.set(k, list)
    }
  }
  if (groupedRows.size === 0) return []

  // 각 그룹별 series. 정렬: total count desc (legend 의미 큰 series 먼저).
  const series: { name: string; total: number; points: LinePoint[] }[] = []
  for (const [name, groupRows] of groupedRows) {
    const groupValid = valid.filter((v) => groupRows.includes(v.row))
    const points: LinePoint[] = buckets.map((b) => {
      const bucketRows = groupValid
        .filter((v) => v.ts >= b.startTs && v.ts < b.endTs)
        .map((v) => v.row)
      const agg = aggregateBy(bucketRows, null, aggFn, valueCol)[0]
      return {
        label: b.label,
        value: agg.value,
        rangeStart: new Date(b.startTs).toISOString().slice(0, 10),
        rangeEnd: new Date(b.endTs - 1).toISOString().slice(0, 10),
      }
    })
    const total = points.reduce((acc, p) => acc + p.value, 0)
    series.push({ name, total, points })
  }
  series.sort((a, b) => b.total - a.total)
  // 너무 많은 series는 시각 혼잡 — 상위 6 + 나머지 묶기. minimum: 상위 8까지만 노출.
  const SERIES_MAX = 8
  return series
    .slice(0, SERIES_MAX)
    .map(({ name, points }) => ({ name, points }))
}

const WIDTH_CLASS: Record<ChartWidth, string> = {
  quarter: "md:col-span-3",
  half: "md:col-span-6",
  "two-thirds": "md:col-span-8",
  full: "md:col-span-12",
}

// Outer — board guard만. Inner가 모든 hook 보유 (rules-of-hooks 준수).
// 패턴: early return 후 hook 호출 ❌ — board 있을 때만 Inner 렌더.
export function DashboardView() {
  const board = useFlowBase(selectActiveBoard)
  if (!board) return null
  return <DashboardViewInner board={board} />
}

function DashboardViewInner({ board }: { board: Board }) {
  // selectVisibleRows는 새 배열을 반환 → 직접 구독 ❌. 의존 슬라이스 구독 후 useMemo.
  const search = useFlowBase((s) => s.search)
  const filter = useFlowBase((s) => s.filter)
  const sort = useFlowBase((s) => s.sort)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const removeChart = useFlowBase((s) => s.removeChart)
  const moveChart = useFlowBase((s) => s.moveChart)
  const updateChart = useFlowBase((s) => s.updateChart)
  const clearCustomCharts = useFlowBase((s) => s.clearCustomCharts)
  const addChart = useFlowBase((s) => s.addChart)
  const rows = useMemo(
    () => selectVisibleRows(useFlowBase.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, search, filter, sort, columnFilters],
  )

  const [addOpen, setAddOpen] = useState(false)
  // B2: AI 자연어 요약 — 사용자 click 시만, 결과는 별 카드. 자동 호출 ❌.
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)

  // customCharts logical expression은 매 렌더 새 array (board.charts ?? []) → useMemo 안정.
  const customCharts = useMemo(() => board.charts ?? [], [board.charts])
  const hasCustomCharts = customCharts.length > 0

  // A1: 도메인 추론 (header 표시 + recommend priority).
  const domain = useMemo(
    () => inferDomain(board.columns, board.label),
    [board.columns, board.label],
  )

  // D5 + A2: 컬럼 분석 → 추천 차트. 도메인 알면 priority 조정.
  const recommendations = useMemo(
    () => recommendCharts(board.columns, { domain, boardLabel: board.label }),
    [board.columns, board.label, domain],
  )

  // A4: 자동 인사이트 (period change · top categories). 보드/필터/검색 변경 시 재계산.
  const insights = useMemo(
    () => computeInsights(board.columns, rows),
    [board.columns, rows],
  )
  const unseenRecommendations = useMemo(
    () => filterUnseenRecommendations(recommendations, customCharts),
    [recommendations, customCharts],
  )

  const applyRecommendations = (specs: typeof recommendations) => {
    for (const spec of specs) addChart(spec)
  }

  // B2: insights hint를 인사이트 카드에서 추출 → AI에 전달 (코드 분석 결과 활용).
  const insightHints = insights.map((ins) => {
    if (ins.kind === "period_change")
      return `${ins.deltaPct.toFixed(1)}% change vs last week (current ${ins.current}, previous ${ins.previous})`
    if (ins.kind === "top_categories")
      return `Top by ${ins.label}: ${ins.items.map((i) => `${i.name}=${i.count}`).join(", ")}`
    if (ins.kind === "outliers")
      return `${ins.count} outlier(s) in ${ins.col}`
    return ""
  }).filter(Boolean)

  const handleSummarize = async () => {
    if (!board || summarizing) return
    setSummarizing(true)
    const toastId = toast.loading("Summarizing…")
    try {
      const res = await fetch("/api/ai/summarize-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardLabel: board.label,
          domain,
          rowCount: rows.length,
          columns: board.columns.map((c) => ({
            name: c.name,
            label: c.label,
            type: c.type,
          })),
          insightsHint: insightHints,
          sampleRows: rows.slice(0, 10),
        }),
      })
      const data = (await res.json()) as { summary?: string; error?: string }
      toast.dismiss(toastId)
      if (!res.ok || !data.summary) {
        toast.error(data.error || "AI summary failed")
        return
      }
      setAiSummary(data.summary)
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(err instanceof Error ? err.message : "AI call failed")
    } finally {
      setSummarizing(false)
    }
  }

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
    () => (dateCol ? buildTrend(rows, dateCol.name, "week") : []),
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
            {recommendations.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyRecommendations(recommendations)}
                className="mt-4 gap-1.5"
                data-action="dashboard-apply-recommendations-empty"
              >
                Apply recommended ({recommendations.length})
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              className="ml-2 mt-4 gap-1.5"
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
          {domain !== "general" && (
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-px text-[9.5px] text-primary">
              {DOMAIN_LABELS[domain]}
            </span>
          )}
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
          {/* D5: 추천 차트 진입점. custom 없으면 "Apply recommended", 있으면 "Suggest more (unseen)" */}
          {!hasCustomCharts && recommendations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyRecommendations(recommendations)}
              className="h-7 gap-1.5 px-2 text-[11.5px] text-muted-foreground"
              data-action="dashboard-apply-recommendations"
            >
              Apply recommended ({recommendations.length})
            </Button>
          )}
          {hasCustomCharts && unseenRecommendations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyRecommendations(unseenRecommendations)}
              className="h-7 gap-1.5 px-2 text-[11.5px] text-muted-foreground"
              data-action="dashboard-suggest-more"
            >
              Suggest more ({unseenRecommendations.length})
            </Button>
          )}
          {/* G7-B2: Print / Save as PDF */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="h-7 gap-1.5 px-2 text-[11.5px] text-muted-foreground"
            title="Print / Save as PDF (⌘P)"
            data-action="dashboard-print"
          >
            <Printer className="size-3" strokeWidth={1.75} />
            Print
          </Button>
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

      {/* A4: Insights 카드 row — toolbar 바로 아래 */}
      {insights.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" data-insights-row>
          {insights.map((ins, i) => (
            <InsightCard key={i} insight={ins} />
          ))}
          {/* B2: AI 요약 진입점 */}
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarizing}
            data-action="dashboard-summarize-ai"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/[0.05] px-2.5 py-1.5 text-[11.5px] text-primary transition-colors hover:border-primary/50 hover:bg-primary/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="size-3" strokeWidth={2} />
            {summarizing ? "Summarizing…" : "Summarize with AI"}
          </button>
        </div>
      )}

      {/* B2: AI 요약 결과 카드 */}
      {aiSummary && (
        <div
          data-ai-summary-card
          className="relative rounded-md border border-primary/20 bg-primary/[0.04] p-3 text-[12.5px] leading-relaxed text-foreground"
        >
          <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-primary">
            <Sparkles className="size-3" />
            AI summary
          </div>
          <div>{aiSummary}</div>
          <button
            type="button"
            onClick={() => setAiSummary(null)}
            title="Dismiss"
            className="absolute right-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

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
  const valueCol = chart.valueCol
    ? board.columns.find((c) => c.name === chart.valueCol)
    : null
  // 부제: "Sum of price · by status" / "Avg of score × department" 등 — 도메인 의도 명확화.
  // KPI는 단일 값이라 "by sourceCol" 중복 안 표시 (sourceCol === valueCol 또는 그룹 의미 없음).
  // scatter는 "x vs y" 형식, histogram은 단순 컬럼 라벨.
  const aggFn = chart.aggFn ?? "count"
  const aggHint =
    aggFn === "count"
      ? sourceCol?.label || sourceCol?.name || ""
      : aggLabel(aggFn, valueCol?.label || valueCol?.name)
  const subtitle = (() => {
    if (!sourceCol) return ""
    if (chart.type === "kpi") {
      return aggFn === "count"
        ? `${sourceCol.label || sourceCol.name} · ${chart.valueCol ? aggLabel(aggFn) : "distinct values"}`
        : aggHint
    }
    if (chart.type === "scatter" && valueCol) {
      return `${sourceCol.label || sourceCol.name} × ${valueCol.label || valueCol.name}`
    }
    if (chart.type === "histogram") {
      return `Distribution of ${sourceCol.label || sourceCol.name}`
    }
    return aggFn === "count"
      ? `${aggHint}${groupCol ? ` × ${groupCol.label || groupCol.name}` : ""}`
      : `${aggHint} · by ${sourceCol.label || sourceCol.name}${
          groupCol ? ` × ${groupCol.label || groupCol.name}` : ""
        }`
  })()

  const [renameOpen, setRenameOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState(chart.title)
  // P-4: Bullet "as KPI" preset — goal 설정 Dialog (KPI → Bullet 변환 또는 Bullet goal 편집).
  const [goalOpen, setGoalOpen] = useState(false)
  const [draftGoal, setDraftGoal] = useState(
    chart.goal !== undefined ? String(chart.goal) : "",
  )
  const [draftGoalLabel, setDraftGoalLabel] = useState(chart.goalLabel ?? "")

  // 외부 변경 (다른 머신 sync) 시 draft 동기화
  useEffect(() => {
    setDraftTitle(chart.title)
  }, [chart.title])

  // goal Dialog 열릴 때 fresh value로 init
  useEffect(() => {
    if (goalOpen) {
      setDraftGoal(chart.goal !== undefined ? String(chart.goal) : "")
      setDraftGoalLabel(chart.goalLabel ?? "")
    }
  }, [goalOpen, chart.goal, chart.goalLabel])

  const saveRename = () => {
    const t = draftTitle.trim()
    if (t && t !== chart.title) onUpdate({ title: t })
    setRenameOpen(false)
  }

  const saveGoal = (convertTo?: "bullet") => {
    const trimmed = draftGoal.trim()
    const n = trimmed ? Number(trimmed) : NaN
    const validGoal = Number.isFinite(n)
    const patch: Partial<ChartConfig> = {
      goal: validGoal ? n : undefined,
      goalLabel: draftGoalLabel.trim() || undefined,
    }
    if (convertTo === "bullet" && chart.type !== "bullet") {
      patch.type = "bullet"
    }
    onUpdate(patch)
    setGoalOpen(false)
    if (convertTo === "bullet") {
      toast.success(
        validGoal
          ? `Converted to Bullet — goal ${n}`
          : "Converted to Bullet (no goal set)",
      )
    }
  }

  const convertBulletToKpi = () => {
    onUpdate({
      type: "kpi",
      goal: undefined,
      goalLabel: undefined,
      referenceValue: undefined,
      referenceLabel: undefined,
    })
    toast.success("Converted to KPI")
  }

  // G1-2: drill-down — chart cell click 시 sourceCol에 filter + sheet 전환.
  const setColumnCondition = useFlowBase((s) => s.setColumnCondition)
  const setView = useFlowBase((s) => s.setView)
  const clearAllFilters = useFlowBase((s) => s.clearAllFilters)
  const setColumnConditionPivot = setColumnCondition // alias 가독성

  const handleDrillDown = (value: string, colName?: string) => {
    const targetCol = colName || chart.sourceCol
    setColumnCondition(targetCol, { kind: "in", values: [value] })
    setView("sheet")
    toast.success(`Filtered: ${targetCol} = ${value}`, {
      description: "Switched to Sheet view",
      action: {
        label: "Clear",
        onClick: () => clearAllFilters(),
      },
    })
  }

  // G5-1: histogram bin click → numeric range filter
  const handleRangeDrillDown = (from: number, to: number) => {
    setColumnCondition(chart.sourceCol, { kind: "range", min: from, max: to })
    setView("sheet")
    toast.success(`Filtered: ${chart.sourceCol} ∈ [${from.toFixed(2)}, ${to.toFixed(2)}]`, {
      description: "Switched to Sheet view",
      action: {
        label: "Clear",
        onClick: () => clearAllFilters(),
      },
    })
  }

  // G5-2: line bucket click → date-range filter
  const handleLineBucketClick = (rangeStart: string, rangeEnd: string, label: string) => {
    setColumnCondition(chart.sourceCol, {
      kind: "date-range",
      from: rangeStart,
      to: rangeEnd,
    })
    setView("sheet")
    toast.success(`Filtered: ${chart.sourceCol} = ${label}`, {
      description: `${rangeStart} → ${rangeEnd}`,
      action: {
        label: "Clear",
        onClick: () => clearAllFilters(),
      },
    })
  }

  const handlePivotCellClick = (rowLabel: string, colLabel: string) => {
    if (!chart.groupByCol) return
    // 두 컬럼 동시 filter — 두 cond array에 각각 in [value]
    setColumnConditionPivot(chart.sourceCol, { kind: "in", values: [rowLabel] })
    setColumnConditionPivot(chart.groupByCol, { kind: "in", values: [colLabel] })
    setView("sheet")
    toast.success(`Filtered: ${chart.sourceCol}=${rowLabel}, ${chart.groupByCol}=${colLabel}`, {
      description: "Switched to Sheet view",
      action: {
        label: "Clear",
        onClick: () => clearAllFilters(),
      },
    })
  }

  return (
    <>
      <div className="group relative h-full">
        <ChartCard title={chart.title} subtitle={subtitle} accent={accent}>
          {renderChartBody(
            chart,
            rows,
            sourceCol,
            handleDrillDown,
            handlePivotCellClick,
            handleRangeDrillDown,
            handleLineBucketClick,
          )}
        </ChartCard>
        <div
          // 데스크탑: group-hover로 fade. 터치(hover:none): 항상 visible.
          // 키보드: 내부 버튼 focus 시 focus-within으로 노출(탭 접근성).
          className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-card/80 px-0.5 py-0.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"
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
              {chart.type === "kpi" && (
                <DropdownMenuItem
                  onSelect={() => setGoalOpen(true)}
                  data-chart-convert-bullet={chart.id}
                >
                  <Target className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                  Convert to Bullet…
                </DropdownMenuItem>
              )}
              {chart.type === "bullet" && (
                <>
                  <DropdownMenuItem
                    onSelect={() => setGoalOpen(true)}
                    data-chart-set-goal={chart.id}
                  >
                    <Target className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                    Set goal…
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => convertBulletToKpi()}
                    data-chart-convert-kpi={chart.id}
                  >
                    Convert to KPI
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  const csv = chartToCsv(chart, rows, board.columns)
                  if (!csv) {
                    toast.info("Nothing to export for this chart type yet")
                    return
                  }
                  navigator.clipboard
                    .writeText(csv)
                    .then(() => toast.success("Chart data copied (CSV)"))
                    .catch(() => toast.error("Clipboard copy failed"))
                }}
                data-chart-export-csv={chart.id}
              >
                Copy data (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  // G7-B1: chart card root element 찾기 → SVG → PNG
                  const cardEl = document.querySelector(
                    `[data-chart-card="${chart.id}"]`,
                  ) as HTMLElement | null
                  if (!cardEl) {
                    toast.error("Chart element not found")
                    return
                  }
                  downloadChartPng(cardEl, chart.title)
                    .then(() => toast.success("PNG downloaded"))
                    .catch((err) =>
                      toast.error(
                        err instanceof Error ? err.message : "PNG export failed",
                      ),
                    )
                }}
                data-chart-export-png={chart.id}
              >
                Export as PNG
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

      {/* P-4: Bullet goal Dialog — KPI→Bullet 변환 또는 Bullet goal 편집 */}
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="size-4 text-muted-foreground" strokeWidth={1.75} />
              {chart.type === "kpi"
                ? "Convert to Bullet chart"
                : "Set Bullet goal"}
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              {chart.type === "kpi"
                ? "Bullet shows the current value as a progress bar toward a goal. Leave goal blank to convert without a target (you can add one later)."
                : "Bullet shows progress toward this goal. Leave blank to remove the goal."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="chart-goal-value" className="text-[12px]">
                Goal value (number)
              </Label>
              <Input
                id="chart-goal-value"
                type="number"
                autoFocus
                value={draftGoal}
                onChange={(e) => setDraftGoal(e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chart-goal-label" className="text-[12px]">
                Goal label (optional)
              </Label>
              <Input
                id="chart-goal-label"
                value={draftGoalLabel}
                onChange={(e) => setDraftGoalLabel(e.target.value)}
                placeholder="e.g. Q1 quota"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGoalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                saveGoal(chart.type === "kpi" ? "bullet" : undefined)
              }
            >
              {chart.type === "kpi" ? "Convert" : "Save"}
            </Button>
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
  // G1-2: chart cell click 시 호출. drill-down으로 sheet filter 자동 적용.
  // value = clicked label, colName = sourceCol 기본 (Pivot은 row + col 둘 다 필요해 별 prop).
  onDrillDown?: (value: string, colName?: string) => void,
  onPivotCellClick?: (rowLabel: string, colLabel: string) => void,
  // G5-1: histogram numeric range drill-down (별 시그니처).
  onRangeDrillDown?: (from: number, to: number) => void,
  // G5-2: line time bucket drill-down — LinePoint rangeStart/rangeEnd ISO.
  onLineBucketClick?: (rangeStart: string, rangeEnd: string, label: string) => void,
) {
  if (!sourceCol) {
    return (
      <div className="py-6 text-center text-[11.5px] text-muted-foreground">
        Source column missing.
      </div>
    )
  }

  const aggFn: AggFn = chart.aggFn ?? "count"
  const valueCol = chart.valueCol

  if (chart.type === "kpi") {
    // count + valueCol 없음: 기존 호환 — distinct values 표시.
    // 그 외: aggregateBy(rows, null, aggFn, valueCol)으로 단일 값.
    if (aggFn === "count" && !valueCol) {
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
    const result = aggregateBy(rows, null, aggFn, valueCol)[0]
    // sum/avg/min/max/median은 valueCol이 필수 — 미설정이면 안내.
    if (aggFn !== "count" && !valueCol) {
      return (
        <div className="py-3 text-center text-[11.5px] text-muted-foreground">
          Pick a numeric column for {aggFn}.
        </div>
      )
    }
    // A3: valueCol(또는 sourceCol)의 inferValueFormat으로 currency/percent/time/number format.
    // sample rows 첫 5개로 currency 기호 보강.
    const formatTarget = valueCol
      ? (sourceCol.name === valueCol ? sourceCol : { name: valueCol, label: valueCol, type: "num" as const })
      : sourceCol
    const hint = inferValueFormat(formatTarget, rows.slice(0, 5))
    const fraction = aggFn === "avg" || aggFn === "median" ? 2 : 0
    const display = formatValue(result.value, hint, { fractionDigits: fraction })
    const subHint = aggFn === "count" ? "rows" : aggFn
    // G1-3: goal 있으면 progress bar + 달성률 표시.
    const goal = chart.goal
    const hasGoal = typeof goal === "number" && goal > 0
    const progress = hasGoal ? Math.min(100, (result.value / goal) * 100) : 0
    const goalReached = hasGoal && result.value >= goal
    return (
      <div className="py-3 text-center">
        <div className="text-3xl font-bold tabular-nums">{display}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{subHint}</div>
        {hasGoal && (
          <div className="mx-auto mt-2 max-w-[180px]">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              data-kpi-progress
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  goalReached
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-amber-500 dark:bg-amber-400",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-[10.5px] text-muted-foreground">
              {progress.toFixed(0)}% of {formatValue(goal!, hint, { fractionDigits: fraction })}{" "}
              {chart.goalLabel ?? "goal"}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (chart.type === "bar" || chart.type === "donut") {
    const agg = aggregateBy(rows, sourceCol.name, aggFn, valueCol)
    const data = agg.map((a) => ({ label: a.label, value: a.value }))
    return chart.type === "bar" ? (
      <BarChart data={data} onBarClick={onDrillDown} />
    ) : (
      <DonutChart data={data} onSliceClick={onDrillDown} />
    )
  }

  if (chart.type === "line") {
    // F1: groupByCol 있으면 multi-series (색 분리 line + legend), 없으면 single area.
    if (chart.groupByCol) {
      const series = buildSeries(
        rows,
        sourceCol.name,
        chart.groupByCol,
        chart.timeScale ?? "week",
        aggFn,
        valueCol,
      )
      return <LineChart series={series} onPointClick={onLineBucketClick} />
    }
    const trend = buildTrend(
      rows,
      sourceCol.name,
      chart.timeScale ?? "week",
      aggFn,
      valueCol,
    )
    return <LineChart data={trend} area onPointClick={onLineBucketClick} />
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

  // D2 Scatter — sourceCol = xCol (numeric), valueCol = yCol (numeric)
  if (chart.type === "scatter") {
    if (!valueCol) {
      return (
        <div className="py-6 text-center text-[11.5px] text-muted-foreground">
          Pick a numeric Y column.
        </div>
      )
    }
    const points: { x: number; y: number }[] = []
    for (const r of rows) {
      const xv = r[sourceCol.name]
      const yv = r[valueCol]
      const xn = typeof xv === "number" ? xv : Number(xv)
      const yn = typeof yv === "number" ? yv : Number(yv)
      if (Number.isFinite(xn) && Number.isFinite(yn)) {
        points.push({ x: xn, y: yn })
      }
    }
    return (
      <ScatterChart
        data={points}
        xLabel={sourceCol.label || sourceCol.name}
        yLabel={valueCol}
      />
    )
  }

  // G1-1 Pivot — sourceCol = rowField, groupByCol = colField, valueCol = aggregate target.
  if (chart.type === "pivot") {
    if (!chart.groupByCol) {
      return (
        <div className="py-6 text-center text-[11.5px] text-muted-foreground">
          Pick a column to group rows × cols.
        </div>
      )
    }
    const pivot = computePivot(rows, sourceCol.name, chart.groupByCol, aggFn, valueCol)
    return <PivotChart data={pivot} onCellClick={onPivotCellClick} />
  }

  // G7-A1 Bullet — aggFn(valueCol or sourceCol) vs goal + reference. KPI 강화.
  if (chart.type === "bullet") {
    const result = aggregateBy(rows, null, aggFn, valueCol ?? sourceCol.name)[0]
    const target = valueCol
      ? sourceCol.name === valueCol
        ? sourceCol
        : { name: valueCol, label: valueCol, type: "num" as const }
      : sourceCol
    const hint = inferValueFormat(target, rows.slice(0, 5))
    const fraction = aggFn === "avg" || aggFn === "median" ? 2 : 0
    const display = formatValue(result.value, hint, { fractionDigits: fraction })
    return (
      <BulletChart
        value={result.value}
        goal={chart.goal}
        reference={chart.referenceValue}
        display={display}
        goalLabel={chart.goalLabel}
        referenceLabel={chart.referenceLabel}
      />
    )
  }

  // G7-A2 Funnel — sourceCol(status/select) 카운트 stage drop-off.
  if (chart.type === "funnel") {
    // 순서: status는 STATUS LOCK 순서, select는 col.options 순서, 둘 다 없으면 aggregate 결과 desc.
    const agg = aggregateBy(rows, sourceCol.name, "count")
    const aggMap = new Map(agg.map((a) => [a.label, a.value]))
    let stages: { label: string; value: number }[] = []
    if (sourceCol.type === "status") {
      const order = ["미처리", "진행중", "대기", "완료"]
      stages = order
        .filter((s) => aggMap.has(s))
        .map((s) => ({ label: s, value: aggMap.get(s) ?? 0 }))
    } else if (sourceCol.options && sourceCol.options.length > 0) {
      stages = sourceCol.options
        .filter((o) => aggMap.has(o))
        .map((o) => ({ label: o, value: aggMap.get(o) ?? 0 }))
    } else {
      stages = agg.map((a) => ({ label: a.label, value: a.value }))
    }
    return <FunnelChart stages={stages} />
  }

  // D3 Histogram — sourceCol = numeric (auto bin)
  if (chart.type === "histogram") {
    const values: number[] = []
    for (const r of rows) {
      const v = r[sourceCol.name]
      const n = typeof v === "number" ? v : Number(v)
      if (Number.isFinite(n)) values.push(n)
    }
    return (
      <HistogramChart
        values={values}
        xLabel={sourceCol.label || sourceCol.name}
        onBinClick={onRangeDrillDown}
      />
    )
  }

  return null
}

// ─── G5-3: chart → CSV string (clipboard용) ─────────────────
// chart type별 적절한 데이터 export. minimum scope — Bar/Donut/Line/Histogram/Pivot/Scatter.
// KPI/Stacked/Heatmap은 후속 (단일 값 또는 cross-table).
function chartToCsv(
  chart: ChartConfig,
  rows: TableRow[],
  columns: ColumnDef[],
): string | null {
  const sourceCol = columns.find((c) => c.name === chart.sourceCol)
  if (!sourceCol) return null
  const aggFn = chart.aggFn ?? "count"
  const valueCol = chart.valueCol

  const escape = (s: string) =>
    /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s

  if (chart.type === "bar" || chart.type === "donut") {
    const agg = aggregateBy(rows, sourceCol.name, aggFn, valueCol)
    return [
      ["label", "value"].map(escape).join(","),
      ...agg.map((a) => [escape(a.label), String(a.value)].join(",")),
    ].join("\n")
  }

  if (chart.type === "line") {
    if (chart.groupByCol) {
      const series = buildSeries(
        rows,
        sourceCol.name,
        chart.groupByCol,
        chart.timeScale ?? "week",
        aggFn,
        valueCol,
      )
      if (series.length === 0) return null
      const labels = series[0].points.map((p) => p.label)
      const header = ["bucket", ...series.map((s) => s.name)].map(escape).join(",")
      const rows_ = labels.map((label, i) =>
        [escape(label), ...series.map((s) => String(s.points[i]?.value ?? 0))].join(","),
      )
      return [header, ...rows_].join("\n")
    }
    const trend = buildTrend(
      rows,
      sourceCol.name,
      chart.timeScale ?? "week",
      aggFn,
      valueCol,
    )
    return [
      ["bucket", "value"].map(escape).join(","),
      ...trend.map((p) => [escape(p.label), String(p.value)].join(",")),
    ].join("\n")
  }

  if (chart.type === "histogram") {
    const values: number[] = []
    for (const r of rows) {
      const v = r[sourceCol.name]
      const n = typeof v === "number" ? v : Number(v)
      if (Number.isFinite(n)) values.push(n)
    }
    // computeBins은 histogram-chart.tsx에 있음 — 별 import 필요. minimum: 직접 raw values dump.
    return [
      [sourceCol.label || sourceCol.name].map(escape).join(","),
      ...values.map((v) => String(v)),
    ].join("\n")
  }

  if (chart.type === "scatter" && valueCol) {
    const yCol = columns.find((c) => c.name === valueCol)
    const xLabel = sourceCol.label || sourceCol.name
    const yLabel = yCol?.label || valueCol
    const lines = [
      [xLabel, yLabel].map(escape).join(","),
    ]
    for (const r of rows) {
      const xv = r[sourceCol.name]
      const yv = r[valueCol]
      const xn = typeof xv === "number" ? xv : Number(xv)
      const yn = typeof yv === "number" ? yv : Number(yv)
      if (Number.isFinite(xn) && Number.isFinite(yn)) {
        lines.push(`${xn},${yn}`)
      }
    }
    return lines.join("\n")
  }

  if (chart.type === "pivot" && chart.groupByCol) {
    const pivot = computePivot(rows, sourceCol.name, chart.groupByCol, aggFn, valueCol)
    const header = ["", ...pivot.colLabels].map(escape).join(",")
    const lines = [header]
    pivot.rowLabels.forEach((rl, ri) => {
      lines.push(
        [escape(rl), ...pivot.cells[ri].map((c) => String(c))].join(","),
      )
    })
    return lines.join("\n")
  }

  return null
}

// ─── InsightCard — A4 자동 인사이트 표시 ────────────────────────
// chip 식 compact 카드. tone에 따라 색 분기 (positive=emerald, negative=rose).
function InsightCard({ insight }: { insight: Insight }) {
  if (insight.kind === "period_change") {
    const sign = insight.deltaPct > 0 ? "+" : ""
    const toneCls =
      insight.tone === "positive"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : insight.tone === "negative"
          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
          : "bg-muted text-muted-foreground"
    return (
      <div
        data-insight-kind="period_change"
        className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-card px-2.5 py-1.5 text-[11.5px]"
      >
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums whitespace-nowrap",
            toneCls,
          )}
        >
          {sign}
          {insight.deltaPct.toFixed(1)}%
        </span>
        <span className="text-muted-foreground">{insight.label}</span>
        <span className="tabular-nums text-muted-foreground">
          ({insight.current} / {insight.previous})
        </span>
      </div>
    )
  }

  if (insight.kind === "top_categories") {
    return (
      <div
        data-insight-kind="top_categories"
        className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-card px-2.5 py-1.5 text-[11.5px]"
      >
        <span className="text-muted-foreground">{insight.label}:</span>
        <span className="flex flex-wrap items-center gap-1.5">
          {insight.items.map((it) => (
            <span
              key={it.name}
              className="inline-flex items-center whitespace-nowrap rounded bg-muted px-1.5 py-0.5 font-medium"
            >
              {it.name}{" "}
              <span className="ml-1 tabular-nums text-muted-foreground">
                {it.count}
              </span>
            </span>
          ))}
        </span>
      </div>
    )
  }

  if (insight.kind === "outliers") {
    return (
      <div
        data-insight-kind="outliers"
        className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11.5px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
      >
        <span className="font-semibold tabular-nums">{insight.count}</span>
        <span>{insight.label}</span>
      </div>
    )
  }

  return null
}
