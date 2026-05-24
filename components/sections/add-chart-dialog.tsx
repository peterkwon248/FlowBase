// FlowBase V2 — Add chart 다이얼로그 (대시보드 빌더)
// 출처 컨셉: design-ref/prototype/dashboard-builder.jsx
//
// 사용자가 차트 종류 + 소스 컬럼 + 옵션 groupBy + width를 골라 board.charts에 push.

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  CircleDot,
  Layers,
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
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { ChartType, ChartWidth, ColumnDef } from "@/types/flowbase"

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
    sourceAccept: ["status", "select", "num", "text", "date"],
    defaultWidth: "quarter",
  },
  {
    type: "bar",
    label: "Bar chart",
    desc: "Vertical bars — categorical distribution",
    Icon: BarChart3,
    sourceAccept: ["status", "select"],
    defaultWidth: "half",
  },
  {
    type: "donut",
    label: "Donut chart",
    desc: "Ring slices — categorical share",
    Icon: CircleDot,
    sourceAccept: ["status", "select"],
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
    sourceAccept: ["status", "select"],
    needsGroupBy: true,
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
        (c.type === "status" || c.type === "select"),
    )
  }, [board, sourceCol])

  // 다이얼로그 열릴 때마다 적절한 default 다시 계산
  useEffect(() => {
    if (open) {
      setType("bar")
      setWidth("half")
      setTitle("")
      setGroupCol("")
      const firstSource = board?.columns.find(
        (c) =>
          c.name !== "id" && (c.type === "status" || c.type === "select"),
      )
      setSourceCol(firstSource?.name ?? "")
    }
  }, [open, board])

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
    sourceCol !== "" && (!meta.needsGroupBy || groupCol !== "")

  const create = () => {
    if (!canCreate) return
    const finalTitle = title.trim() || `${meta.label}: ${sourceLabel(sourceCol)}`
    addChart({
      type,
      title: finalTitle,
      sourceCol,
      groupByCol: meta.needsGroupBy ? groupCol : undefined,
      width,
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
