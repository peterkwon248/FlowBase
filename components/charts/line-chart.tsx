// FlowBase V2 — Line/Area 차트 (시계열)
// 출처 컨셉: design-ref/prototype/echarts-bridge.jsx LineChart
//
// 단순 SVG path. x축 = 시간 버킷, y축 = 카운트. Area는 path 아래 fill 추가.

"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export interface LinePoint {
  label: string // x축 라벨 (예: "May 12")
  value: number
}

export function LineChart({
  data,
  area = false,
  className,
}: {
  data: LinePoint[]
  area?: boolean
  className?: string
}) {
  const dims = { w: 320, h: 140, padX: 12, padY: 16 }
  const { points, path, areaPath, max } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], path: "", areaPath: "", max: 0 }
    }
    const max = Math.max(...data.map((d) => d.value), 1)
    const innerW = dims.w - dims.padX * 2
    const innerH = dims.h - dims.padY * 2
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0
    const points = data.map((d, i) => ({
      x: dims.padX + i * stepX,
      y: dims.padY + innerH - (d.value / max) * innerH,
      ...d,
    }))
    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ")
    const areaPath =
      points.length > 0
        ? `${path} L${points[points.length - 1].x.toFixed(1)},${(dims.padY + innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(dims.padY + innerH).toFixed(1)} Z`
        : ""
    return { points, path, areaPath, max }
  }, [data])

  if (data.length === 0) {
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
        {area && (
          <path d={areaPath} fill="var(--chart-1)" fillOpacity={0.14} />
        )}
        <path
          d={path}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.5}
            fill="var(--chart-1)"
            stroke="var(--background)"
            strokeWidth={1.5}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        {data.length > 2 && (
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
        )}
        <span className="tabular-nums">
          max {max}
        </span>
      </div>
    </div>
  )
}
