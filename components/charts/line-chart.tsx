// FlowBase V2 — Line/Area 차트 (시계열, multi-series 지원)
// 출처 컨셉: design-ref/prototype/echarts-bridge.jsx LineChart
//
// 단순 SVG path. x축 = 시간 버킷, y축 = 값.
// F1: series prop으로 multi-line 지원 (status별/카테고리별 색 분리).
//   - data만 있고 series ❌: single line (호환)
//   - series 있음: multi-line + legend. data는 x축 라벨 source (모든 series 같은 label 가정).
// Area는 series 1개일 때만 (multi는 시각 혼잡).

"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export interface LinePoint {
  label: string // x축 라벨 (예: "May 12")
  value: number
  // G5-2: drill-down 용 bucket date range (ISO YYYY-MM-DD). 없으면 click 불가.
  rangeStart?: string
  rangeEnd?: string
}

export interface LineSeries {
  name: string
  color?: string // CSS color or var (--chart-N) — 없으면 SERIES_COLORS 자동 할당
  points: LinePoint[]
}

const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface LineChartProps {
  data?: LinePoint[] // single series 호환 path
  series?: LineSeries[] // multi-series. 있으면 data 무시.
  area?: boolean
  className?: string
  // G5-2: point click 시 bucket range 반환 (rangeStart/rangeEnd 있으면).
  onPointClick?: (rangeStart: string, rangeEnd: string, label: string) => void
}

export function LineChart({
  data,
  series,
  area = false,
  className,
  onPointClick,
}: LineChartProps) {
  // single → series 변환 (내부 통일)
  const normalizedSeries: LineSeries[] = useMemo(() => {
    if (series && series.length > 0) return series
    if (data && data.length > 0) {
      return [{ name: "value", color: SERIES_COLORS[0], points: data }]
    }
    return []
  }, [data, series])

  const isMulti = normalizedSeries.length > 1

  const dims = { w: 320, h: 140, padX: 12, padY: 16 }

  const { paths, max, xLabels } = useMemo(() => {
    if (normalizedSeries.length === 0) {
      return { paths: [], max: 0, xLabels: [] as string[] }
    }
    // 모든 series 합한 max — 같은 axis로 비교 가능
    const max = Math.max(
      1,
      ...normalizedSeries.flatMap((s) => s.points.map((p) => p.value)),
    )
    // x 라벨 = 첫 series 기준 (모든 series는 동일 bucket을 공유)
    const xLabels = normalizedSeries[0].points.map((p) => p.label)
    const innerW = dims.w - dims.padX * 2
    const innerH = dims.h - dims.padY * 2
    const stepX = xLabels.length > 1 ? innerW / (xLabels.length - 1) : 0
    const paths = normalizedSeries.map((s, idx) => {
      const color = s.color || SERIES_COLORS[idx % SERIES_COLORS.length]
      const pts = s.points.map((p, i) => ({
        x: dims.padX + i * stepX,
        y: dims.padY + innerH - (p.value / max) * innerH,
        rangeStart: p.rangeStart,
        rangeEnd: p.rangeEnd,
        label: p.label,
      }))
      const path = pts
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" ")
      const areaPath =
        pts.length > 0
          ? `${path} L${pts[pts.length - 1].x.toFixed(1)},${(dims.padY + innerH).toFixed(1)} L${pts[0].x.toFixed(1)},${(dims.padY + innerH).toFixed(1)} Z`
          : ""
      return { name: s.name, color, path, areaPath, pts }
    })
    return { paths, max, xLabels }
  }, [normalizedSeries])

  if (normalizedSeries.length === 0 || xLabels.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center text-[11.5px] text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        className="block w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend line"
      >
        {/* horizontal grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = dims.padY + (dims.h - dims.padY * 2) * (1 - t)
          return (
            <line
              key={t}
              x1={dims.padX}
              x2={dims.w - dims.padX}
              y1={y}
              y2={y}
              stroke="var(--border-subtle)"
              strokeDasharray={t === 0 ? "0" : "2 4"}
            />
          )
        })}
        {/* area — single series만 */}
        {area && !isMulti && paths[0] && (
          <path d={paths[0].areaPath} fill={paths[0].color} fillOpacity={0.14} />
        )}
        {/* paths */}
        {paths.map((p) => (
          <path
            key={`p-${p.name}`}
            d={p.path}
            fill="none"
            stroke={p.color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* dots — G5-2 onClick으로 drill-down */}
        {paths.map((p) =>
          p.pts.map((pt, i) => {
            const canClick =
              !!onPointClick && !!pt.rangeStart && !!pt.rangeEnd
            return (
              <circle
                key={`d-${p.name}-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={canClick ? 3.5 : 2.5}
                fill={p.color}
                stroke="var(--background)"
                strokeWidth={1.5}
                style={{ cursor: canClick ? "pointer" : "default" }}
                onClick={
                  canClick
                    ? () =>
                        onPointClick!(pt.rangeStart!, pt.rangeEnd!, pt.label)
                    : undefined
                }
                data-line-point={pt.label}
              />
            )
          }),
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{xLabels[0]}</span>
        {xLabels.length > 2 && (
          <span>{xLabels[Math.floor(xLabels.length / 2)]}</span>
        )}
        <span className="tabular-nums">max {max}</span>
      </div>
      {/* legend (multi-series만) */}
      {isMulti && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
          {paths.map((p) => (
            <span key={`l-${p.name}`} className="inline-flex items-center gap-1">
              <span
                aria-hidden
                className="inline-block size-2 rounded-sm"
                style={{ background: p.color }}
              />
              <span className="truncate max-w-[80px]">{p.name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
