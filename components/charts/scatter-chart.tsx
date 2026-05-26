// FlowBase V2 — Scatter plot (numeric × numeric 상관)
// D2 — 도메인 무관 fit: ROI vs spend, 매출 vs 비용, 평가 점수 vs 근속년수 등.
// 단순 SVG dot plot. x/y 범위 자동, 점 = row.

"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export interface ScatterPoint {
  x: number
  y: number
  label?: string // tooltip 용 (현 phase는 미사용)
}

// 차트 dims — module scope (매 렌더 새 객체 ❌ → useMemo deps 안정)
const SCATTER_DIMS = { w: 320, h: 200, padL: 28, padR: 8, padT: 8, padB: 22 }

export function ScatterChart({
  data,
  xLabel,
  yLabel,
  className,
}: {
  data: ScatterPoint[]
  xLabel?: string
  yLabel?: string
  className?: string
}) {
  const dims = SCATTER_DIMS
  const { points, xMin, xMax, yMin, yMax } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], xMin: 0, xMax: 1, yMin: 0, yMax: 1 }
    }
    const xs = data.map((d) => d.x)
    const ys = data.map((d) => d.y)
    let xMin = Math.min(...xs)
    let xMax = Math.max(...xs)
    let yMin = Math.min(...ys)
    let yMax = Math.max(...ys)
    // padding — 동일 값 case 회피
    if (xMin === xMax) {
      xMin -= 1
      xMax += 1
    }
    if (yMin === yMax) {
      yMin -= 1
      yMax += 1
    }
    const innerW = dims.w - dims.padL - dims.padR
    const innerH = dims.h - dims.padT - dims.padB
    const points = data.map((d) => ({
      ...d,
      px: dims.padL + ((d.x - xMin) / (xMax - xMin)) * innerW,
      py: dims.padT + innerH - ((d.y - yMin) / (yMax - yMin)) * innerH,
    }))
    return { points, xMin, xMax, yMin, yMax }
    // dims는 module scope const (안정 ref) — deps에서 안전하게 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-[11.5px] text-muted-foreground">
        No data
      </div>
    )
  }

  const fmt = (n: number) =>
    Math.abs(n) >= 1000
      ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : n.toLocaleString(undefined, { maximumFractionDigits: 2 })

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        className="block w-full"
        role="img"
        aria-label={`Scatter ${xLabel || "x"} vs ${yLabel || "y"}`}
      >
        {/* y grid + tick labels (5 step) */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = dims.padT + (dims.h - dims.padT - dims.padB) * (1 - t)
          const val = yMin + t * (yMax - yMin)
          return (
            <g key={`y-${t}`}>
              <line
                x1={dims.padL}
                x2={dims.w - dims.padR}
                y1={y}
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray={t === 0 ? "0" : "2 4"}
              />
              <text
                x={dims.padL - 4}
                y={y + 3}
                fontSize={8}
                fill="var(--muted-foreground)"
                textAnchor="end"
              >
                {fmt(val)}
              </text>
            </g>
          )
        })}
        {/* x axis tick labels (min/mid/max) */}
        {[0, 0.5, 1].map((t) => {
          const innerW = dims.w - dims.padL - dims.padR
          const x = dims.padL + innerW * t
          const val = xMin + t * (xMax - xMin)
          return (
            <text
              key={`x-${t}`}
              x={x}
              y={dims.h - dims.padB + 12}
              fontSize={8}
              fill="var(--muted-foreground)"
              textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"}
            >
              {fmt(val)}
            </text>
          )
        })}
        {/* dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.px}
            cy={p.py}
            r={2.5}
            fill="var(--chart-1)"
            fillOpacity={0.7}
            stroke="var(--background)"
            strokeWidth={0.5}
          />
        ))}
      </svg>
      {(xLabel || yLabel) && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{xLabel ? `x: ${xLabel}` : ""}</span>
          <span className="tabular-nums">{data.length} points</span>
          <span>{yLabel ? `y: ${yLabel}` : ""}</span>
        </div>
      )}
    </div>
  )
}
