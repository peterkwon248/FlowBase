// FlowBase V2 — Add chart 다이얼로그 (대시보드 빌더)
// 출처 컨셉: design-ref/prototype/dashboard-builder.jsx
//
// 사용자가 차트 종류 + 소스 컬럼 + 옵션 groupBy + width를 골라 board.charts에 push.

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  BarChartHorizontal,
  CircleDot,
  Filter,
  Grid2x2,
  Layers,
  ScatterChart as ScatterIcon,
  Table,
  Target,
  TrendingUp,
  type LucideIcon,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AGG_FN_LABELS } from "@/lib/chart-aggregate"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { AggFn, ChartType, ChartWidth, ColumnDef, TimeScale } from "@/types/flowbase"

interface ChartTypeOption {
  type: ChartType
  label: string
  desc: string
  Icon: LucideIcon
  // 어떤 컬럼 타입을 sourceCol로 받는가
  sourceAccept: ColumnDef["type"][]
  needsGroupBy?: boolean
  defaultWidth: ChartWidth
}

const TYPE_OPTIONS: ChartTypeOption[] = [
  {
    type: "kpi",
    label: "KPI tile",
    desc: "Single number — distinct count of a column",
    Icon: Activity,
    sourceAccept: ["status", "select", "multiSelect", "num", "text", "date"],
    defaultWidth: "quarter",
  },
  {
    type: "bar",
    label: "Bar chart",
    desc: "Vertical bars — categorical distribution",
    Icon: BarChart3,
    sourceAccept: ["status", "select", "multiSelect"],
    defaultWidth: "half",
  },
  {
    type: "donut",
    label: "Donut chart",
    desc: "Ring slices — categorical share",
    Icon: CircleDot,
    sourceAccept: ["status", "select", "multiSelect"],
    defaultWidth: "one-third" as ChartWidth,
    // SAFETY: ChartWidth doesn't include 'one-third' — use 'quarter'
  },
  {
    type: "line",
    label: "Line / Area",
    desc: "Trend over time — rows per week from a date column",
    Icon: TrendingUp,
    sourceAccept: ["date"],
    defaultWidth: "two-thirds",
  },
  {
    type: "stacked-bar",
    label: "Stacked bar",
    desc: "Categories stacked by a second dimension",
    Icon: Layers,
    sourceAccept: ["status", "select", "multiSelect"],
    needsGroupBy: true,
    defaultWidth: "half",
  },
  {
    type: "heatmap",
    label: "Heatmap",
    desc: "Two-dimensional grid — count intensity per cell",
    Icon: Grid2x2,
    sourceAccept: ["status", "select", "multiSelect"],
    needsGroupBy: true,
    defaultWidth: "half",
  },
  {
    type: "scatter",
    label: "Scatter plot",
    desc: "Numeric × numeric — correlation (ROI vs spend, score vs hours)",
    Icon: ScatterIcon,
    sourceAccept: ["num"],
    defaultWidth: "half",
  },
  {
    type: "histogram",
    label: "Histogram",
    desc: "Numeric distribution — bins auto from data range",
    Icon: BarChartHorizontal,
    sourceAccept: ["num"],
    defaultWidth: "half",
  },
  {
    type: "pivot",
    label: "Pivot table",
    desc: "Two categoricals × aggregate (status × dept = Sum of price)",
    Icon: Table,
    sourceAccept: ["status", "select", "multiSelect"],
    needsGroupBy: true,
    defaultWidth: "full",
  },
  {
    type: "bullet",
    label: "Bullet",
    desc: "Single value + goal + optional reference (Q1 actual vs quota)",
    Icon: Target,
    sourceAccept: ["status", "select", "multiSelect", "num", "text", "date"],
    defaultWidth: "half",
  },
  {
    type: "funnel",
    label: "Funnel",
    desc: "Stage drop-off (Lead → Qualified → Demo → Closed)",
    Icon: Filter,
    sourceAccept: ["status", "select"],
    defaultWidth: "half",
  },
]

// 위 한 줄 SAFETY: donut의 width를 정정
TYPE_OPTIONS[2].defaultWidth = "quarter"

const WIDTH_OPTIONS: { value: ChartWidth; label: string }[] = [
  { value: "quarter", label: "1/4" },
  { value: "half", label: "1/2" },
  { value: "two-thirds", label: "2/3" },
  { value: "full", label: "Full" },
]

export function AddChartDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const board = useFlowBase(selectActiveBoard)
  const addChart = useFlowBase((s) => s.addChart)

  const [type, setType] = useState<ChartType>("bar")
  const [sourceCol, setSourceCol] = useState<string>("")
  const [groupCol, setGroupCol] = useState<string>("")
  const [title, setTitle] = useState<string>("")
  const [width, setWidth] = useState<ChartWidth>("half")
  // D1: 집계 함수 + 값 컬럼 (count 외 sum/avg/min/max/median 시 numeric valueCol 필수)
  const [aggFn, setAggFn] = useState<AggFn>("count")
  const [valueCol, setValueCol] = useState<string>("")
  // D4: time scale (line chart 한정 — day/week/month/quarter/year)
  const [timeScale, setTimeScale] = useState<TimeScale>("week")
  // G1-3: goal (KPI 한정 — progress bar 표시)
  const [goal, setGoal] = useState<string>("")
  const [goalLabel, setGoalLabel] = useState<string>("")

  const meta = useMemo(
    () => TYPE_OPTIONS.find((t) => t.type === type)!,
    [type],
  )

  const sourceOptions = useMemo(() => {
    if (!board) return []
    return board.columns.filter(
      (c) => c.name !== "id" && meta.sourceAccept.includes(c.type),
    )
  }, [board, meta])

  const groupOptions = useMemo(() => {
    if (!board) return []
    return board.columns.filter(
      (c) =>
        c.name !== "id" &&
        c.name !== sourceCol &&
        (c.type === "status" ||
          c.type === "select" ||
          c.type === "multiSelect"),
    )
  }, [board, sourceCol])

  // D1: numeric 컬럼 list (sum/avg/min/max/median 대상)
  const numericOptions = useMemo(() => {
    if (!board) return []
    return board.columns.filter((c) => c.name !== "id" && c.type === "num")
  }, [board])

  // aggFn 지원 chart type: kpi/bar/donut/line/pivot/bullet. stacked/heatmap/scatter/histogram/funnel은 count fixed.
  const supportsAggFn =
    type === "kpi" ||
    type === "bar" ||
    type === "donut" ||
    type === "line" ||
    type === "pivot" ||
    type === "bullet"
  // valueCol 필요: aggFn 외 + scatter(yCol numeric).
  const isScatter = type === "scatter"
  const needsValueCol = isScatter || (supportsAggFn && aggFn !== "count")

  // 다이얼로그 열릴 때마다 적절한 default 다시 계산
  useEffect(() => {
    if (open) {
      setType("bar")
      setWidth("half")
      setTitle("")
      setGroupCol("")
      setAggFn("count")
      setValueCol("")
      setTimeScale("week")
      setGoal("")
      setGoalLabel("")
      const firstSource = board?.columns.find(
        (c) =>
          c.name !== "id" &&
          (c.type === "status" || c.type === "select" || c.type === "multiSelect"),
      )
      setSourceCol(firstSource?.name ?? "")
    }
  }, [open, board])

  // aggFn 변경: count로 돌아가면 valueCol clear. count 외이고 valueCol 없으면 첫 numeric로 fill.
  useEffect(() => {
    if (aggFn === "count") {
      if (valueCol) setValueCol("")
      return
    }
    if (!valueCol && numericOptions.length > 0) {
      setValueCol(numericOptions[0].name)
    }
  }, [aggFn, valueCol, numericOptions])

  // type 변경 시 aggFn 지원 ❌ chart면 count로 reset.
  useEffect(() => {
    if (!supportsAggFn && aggFn !== "count") {
      setAggFn("count")
      setValueCol("")
    }
  }, [supportsAggFn, aggFn])

  // type 바뀔 때 sourceCol 초기화 (호환 불일치 시) + width 디폴트
  useEffect(() => {
    if (!board) return
    const sourceOk = board.columns.some(
      (c) => c.name === sourceCol && meta.sourceAccept.includes(c.type),
    )
    if (!sourceOk) {
      const next = board.columns.find(
        (c) => c.name !== "id" && meta.sourceAccept.includes(c.type),
      )
      setSourceCol(next?.name ?? "")
    }
    setWidth(meta.defaultWidth)
    if (!meta.needsGroupBy) setGroupCol("")
  }, [type, board, sourceCol, meta])

  if (!board) return null

  const sourceLabel = (n: string) =>
    board.columns.find((c) => c.name === n)?.label ?? n

  const canCreate =
    sourceCol !== "" &&
    (!meta.needsGroupBy || groupCol !== "") &&
    (!needsValueCol || valueCol !== "")

  const create = () => {
    if (!canCreate) return
    const finalTitle = title.trim() || `${meta.label}: ${sourceLabel(sourceCol)}`
    const goalNum = type === "kpi" && goal.trim() ? Number(goal) : undefined
    addChart({
      type,
      title: finalTitle,
      sourceCol,
      // F1: line type도 optional groupBy 허용 (multi-series).
      groupByCol:
        meta.needsGroupBy || (type === "line" && groupCol)
          ? groupCol || undefined
          : undefined,
      width,
      aggFn: supportsAggFn ? aggFn : undefined,
      valueCol: needsValueCol ? valueCol : undefined,
      timeScale: type === "line" ? timeScale : undefined,
      goal: goalNum && Number.isFinite(goalNum) && goalNum > 0 ? goalNum : undefined,
      goalLabel:
        type === "kpi" && goalLabel.trim() ? goalLabel.trim() : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add chart</DialogTitle>
          <DialogDescription className="text-[12px]">
            Pick a chart type, then choose a column to derive it from.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Chart type</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPE_OPTIONS.map((opt) => {
                const on = opt.type === type
                const Icon = opt.Icon
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setType(opt.type)}
                    data-chart-type={opt.type}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-md border p-2.5 text-left transition-colors",
                      on
                        ? "border-primary bg-primary/[0.06]"
                        : "border-border-subtle bg-card hover:border-border",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5",
                        on ? "text-primary" : "text-muted-foreground",
                      )}
                      strokeWidth={1.75}
                    />
                    <div>
                      <div className="text-[12.5px] font-semibold">
                        {opt.label}
                      </div>
                      <div className="line-clamp-2 text-[10.5px] text-muted-foreground">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="chart-source" className="text-[12px]">
              Source column
            </Label>
            <Select value={sourceCol} onValueChange={setSourceCol}>
              <SelectTrigger
                id="chart-source"
                data-add-chart-source
                className="h-8 text-[12.5px]"
              >
                <SelectValue
                  placeholder={
                    sourceOptions.length === 0
                      ? `No ${meta.sourceAccept.join("/")} columns`
                      : "Pick a column"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.label || c.name}
                    <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                      {c.type}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {meta.needsGroupBy && (
            <div className="space-y-1.5">
              <Label htmlFor="chart-group" className="text-[12px]">
                Group by
              </Label>
              <Select value={groupCol} onValueChange={setGroupCol}>
                <SelectTrigger
                  id="chart-group"
                  data-add-chart-group
                  className="h-8 text-[12.5px]"
                >
                  <SelectValue placeholder="Second dimension" />
                </SelectTrigger>
                <SelectContent>
                  {groupOptions.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.label || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* F1: line chart는 groupBy 선택적 (multi-series). "None"이면 single line. */}
          {type === "line" && !meta.needsGroupBy && groupOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="chart-line-group" className="text-[12px]">
                Series by (optional)
              </Label>
              <Select
                value={groupCol || "__none__"}
                onValueChange={(v) => setGroupCol(v === "__none__" ? "" : v)}
              >
                <SelectTrigger
                  id="chart-line-group"
                  data-add-chart-series
                  className="h-8 text-[12.5px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    None · single line
                  </SelectItem>
                  {groupOptions.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.label || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* D1: Aggregate function — KPI/Bar/Donut/Line만 노출. count default. */}
          {supportsAggFn && (
            <div className="space-y-1.5">
              <Label htmlFor="chart-agg" className="text-[12px]">
                Aggregate
              </Label>
              <Select
                value={aggFn}
                onValueChange={(v) => setAggFn(v as AggFn)}
              >
                <SelectTrigger
                  id="chart-agg"
                  data-add-chart-agg
                  className="h-8 text-[12.5px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["count", "sum", "avg", "min", "max", "median"] as AggFn[]).map(
                    (fn) => (
                      <SelectItem key={fn} value={fn}>
                        {AGG_FN_LABELS[fn]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* D4: line chart 시간 bucket scale */}
          {type === "line" && (
            <div className="space-y-1.5">
              <Label htmlFor="chart-scale" className="text-[12px]">
                Time scale
              </Label>
              <Select
                value={timeScale}
                onValueChange={(v) => setTimeScale(v as TimeScale)}
              >
                <SelectTrigger
                  id="chart-scale"
                  data-add-chart-scale
                  className="h-8 text-[12.5px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily · 14 days</SelectItem>
                  <SelectItem value="week">Weekly · 8 weeks</SelectItem>
                  <SelectItem value="month">Monthly · 6 months</SelectItem>
                  <SelectItem value="quarter">Quarterly · 4 quarters</SelectItem>
                  <SelectItem value="year">Yearly · 3 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* D1: aggFn !== count일 때 numeric valueCol 필수. D2 scatter는 yCol numeric. */}
          {needsValueCol && (
            <div className="space-y-1.5">
              <Label htmlFor="chart-value" className="text-[12px]">
                {isScatter ? "Y axis (numeric)" : "Value column (numeric)"}
              </Label>
              <Select value={valueCol} onValueChange={setValueCol}>
                <SelectTrigger
                  id="chart-value"
                  data-add-chart-value
                  className="h-8 text-[12.5px]"
                >
                  <SelectValue
                    placeholder={
                      numericOptions.length === 0
                        ? "No numeric columns"
                        : "Pick a numeric column"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {numericOptions.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.label || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* G1-3: KPI goal (progress bar) · G7-A1 Bullet도 goal 사용 */}
          {(type === "kpi" || type === "bullet") && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="chart-goal" className="text-[12px]">
                  Goal (optional)
                </Label>
                <Input
                  id="chart-goal"
                  type="number"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. 100000"
                  className="h-8 text-[12.5px]"
                  data-add-chart-goal
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chart-goal-label" className="text-[12px]">
                  Goal label
                </Label>
                <Input
                  id="chart-goal-label"
                  value={goalLabel}
                  onChange={(e) => setGoalLabel(e.target.value)}
                  placeholder="Q1 quota"
                  className="h-8 text-[12.5px]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="chart-title" className="text-[12px]">
              Title (optional)
            </Label>
            <Input
              id="chart-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                sourceCol
                  ? `${meta.label}: ${sourceLabel(sourceCol)}`
                  : "Chart title"
              }
              className="h-8 text-[12.5px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Width</Label>
            <div className="flex gap-1">
              {WIDTH_OPTIONS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setWidth(w.value)}
                  className={cn(
                    "rounded border px-2 py-1 text-[11.5px] transition-colors",
                    width === w.value
                      ? "border-primary bg-primary/[0.06] font-semibold"
                      : "border-border-subtle text-muted-foreground hover:border-border",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={create}
            disabled={!canCreate}
            data-add-chart-create
          >
            Add chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
