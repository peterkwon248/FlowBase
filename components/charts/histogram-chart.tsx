// FlowBase V2 — Histogram (numeric 분포)
// D3 — 도메인 무관 fit: 가격대 분포, 점수 분포, 응답 시간 분포 등.
// auto bin (sqrt rule, max 20 bins). bar 형태로 분포 시각화.

"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export interface HistogramBin {
  from: number
  to: number
  count: number
}

// values를 binCount 개 등간격 구간으로 나눠 카운트.
// binCount 미지정 시 sqrt rule (Math.ceil(sqrt(N))), max 20.
export function computeBins(
  values: ReadonlyArray<number>,
  binCount?: number,
): HistogramBin[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) {
    return [{ from: min, to: max, count: values.length }]
  }
  const n = binCount ?? Math.min(20, Math.max(5, Math.ceil(Math.sqrt(values.length))))
  const width = (max - min) / n
  const bins: HistogramBin[] = []
  for (let i = 0; i < n; i++) {
    bins.push({ from: min + i * width, to: min + (i + 1) * width, count: 0 })
  }
  for (const v of values) {
    // 마지막 bin은 to inclusive (max 값 포함)
    const idx = v === max ? n - 1 : Math.floor((v - min) / width)
    if (idx >= 0 && idx < n) bins[idx].count += 1
  }
  return bins
}

export function HistogramChart({
  values,
  xLabel,
  className,
  onBinClick,
}: {
  values: number[]
  xLabel?: string
  className?: string
  // G5-1 drill-down — bin click 시 range 반환 (caller가 sheet filter 적용)
  onBinClick?: (from: number, to: number) => void
}) {
  const bins = useMemo(() => computeBins(values), [values])
  const dims = { w: 320, h: 180, padL: 24, padR: 8, padT: 8, padB: 22 }

  if (bins.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-[11.5px] text-muted-foreground">
        No data
      </div>
    )
  }

  const maxCount = Math.max(...bins.map((b) => b.count), 1)
  const innerW = dims.w - dims.padL - dims.padR
  const innerH = dims.h - dims.padT - dims.padB
  const barW = innerW / bins.length

  const fmt = (n: number) =>
    Math.abs(n) >= 1000
      ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : n.toLocaleString(undefined, { maximumFractionDigits: 1 })

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        className="block w-full"
        role="img"
        aria-label={`Histogram${xLabel ? " of " + xLabel : ""}`}
      >
        {/* y grid */}
        {[0, 0.5, 1].map((t) => {
          const y = dims.padT + innerH * (1 - t)
          return (
            <line
              key={`g-${t}`}
              x1={dims.padL}
              x2={dims.w - dims.padR}
              y1={y}
              y2={y}
              stroke="var(--border-subtle)"
              strokeDasharray={t === 0 ? "0" : "2 4"}
            />
          )
        })}
        {/* y tick (max) */}
        <text
          x={dims.padL - 4}
          y={dims.padT + 6}
          fontSize={8}
          fill="var(--muted-foreground)"
          textAnchor="end"
        >
          {maxCount}
        </text>
        {/* bars */}
        {bins.map((b, i) => {
          const h = (b.count / maxCount) * innerH
          const x = dims.padL + i * barW
          const y = dims.padT + innerH - h
          return (
            <rect
              key={i}
              x={x + 0.5}
              y={y}
              width={Math.max(0, barW - 1)}
              height={h}
              fill="var(--chart-1)"
              fillOpacity={0.85}
              onClick={
                onBinClick && b.count > 0
                  ? () => onBinClick(b.from, b.to)
                  : undefined
              }
              style={{
                cursor: onBinClick && b.count > 0 ? "pointer" : "default",
              }}
              data-hist-bin={`${b.from.toFixed(2)}-${b.to.toFixed(2)}`}
            />
          )
        })}
        {/* x tick labels: first/middle/last bin edge */}
        {(() => {
          const positions =
            bins.length <= 3
              ? bins.map((_, i) => i)
              : [0, Math.floor(bins.length / 2), bins.length - 1]
          return positions.map((i) => {
            const b = bins[i]
            const x = dims.padL + (i + 0.5) * barW
            return (
              <text
                key={`x-${i}`}
                x={x}
                y={dims.h - dims.padB + 12}
                fontSize={8}
                fill="var(--muted-foreground)"
                textAnchor="middle"
              >
                {fmt(b.from)}
              </text>
            )
          })
        })()}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{xLabel ? `${xLabel}` : ""}</span>
        <span className="tabular-nums">
          {bins.length} bins · {values.length} values
        </span>
      </div>
    </div>
  )
}
