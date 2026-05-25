// FlowBase V2 — Funnel chart (G7-A2)
// 단계별 drop-off 시각화 — Sales pipeline · CS ticket flow · marketing conversion.
// 사다리꼴 SVG (각 stage 카운트 + 전환율). 의존성 0.
//
// 데이터:
//   data = [{ label: "Lead", value: 500 }, { label: "Closed", value: 80 }]
//   순서는 caller가 정렬 (status LOCK 순서 또는 select option 순서).

"use client"

import { cn } from "@/lib/utils"

export interface FunnelStage {
  label: string
  value: number
}

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function FunnelChart({
  stages,
  className,
}: {
  stages: FunnelStage[]
  className?: string
}) {
  const data = stages.filter((s) => s.value > 0)
  if (data.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-[11.5px] text-muted-foreground">
        No data
      </div>
    )
  }

  const max = Math.max(...data.map((s) => s.value), 1)
  const dims = { w: 320, stageH: 36, gap: 4, padX: 8 }
  const totalH = data.length * dims.stageH + (data.length - 1) * dims.gap

  // 각 stage trapezoid — 위 너비 = 직전 단계 비율, 아래 너비 = 현 단계 비율
  // 단순화: 각 stage는 단독 사다리꼴 (top=prev, bottom=current)
  const innerW = dims.w - dims.padX * 2

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${dims.w} ${totalH}`}
        className="block w-full"
        role="img"
        aria-label="Funnel chart"
      >
        {data.map((stage, i) => {
          const y = i * (dims.stageH + dims.gap)
          const topWidth =
            (i === 0 ? 1 : data[i - 1].value / max) * innerW
          const botWidth = (stage.value / max) * innerW
          const topX = dims.padX + (innerW - topWidth) / 2
          const botX = dims.padX + (innerW - botWidth) / 2
          const points = [
            [topX, y],
            [topX + topWidth, y],
            [botX + botWidth, y + dims.stageH],
            [botX, y + dims.stageH],
          ]
            .map((p) => p.join(","))
            .join(" ")
          const color = PALETTE[i % PALETTE.length]
          return (
            <g key={stage.label}>
              <polygon
                points={points}
                fill={color}
                fillOpacity={0.7}
                stroke={color}
                strokeWidth={1}
                data-funnel-stage={stage.label}
              />
              <text
                x={dims.w / 2}
                y={y + dims.stageH / 2 + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="var(--foreground)"
                style={{ pointerEvents: "none" }}
              >
                {stage.label} · {stage.value.toLocaleString()}
              </text>
            </g>
          )
        })}
      </svg>
      {/* legend — 단계 전환율 */}
      <div className="mt-2 space-y-0.5 text-[10.5px]">
        {data.map((stage, i) => {
          if (i === 0) {
            return (
              <div
                key={stage.label}
                className="flex items-center justify-between text-muted-foreground"
              >
                <span>{stage.label}</span>
                <span className="tabular-nums font-medium text-foreground">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            )
          }
          const prev = data[i - 1].value
          const pct = prev > 0 ? (stage.value / prev) * 100 : 0
          const drop = prev - stage.value
          return (
            <div
              key={stage.label}
              className="flex items-center justify-between text-muted-foreground"
            >
              <span>
                → {stage.label}{" "}
                <span className="tabular-nums">({pct.toFixed(0)}%)</span>
              </span>
              <span className="tabular-nums">
                <span className="font-medium text-foreground">
                  {stage.value.toLocaleString()}
                </span>
                <span className="ml-1 text-rose-500 dark:text-rose-400">
                  −{drop.toLocaleString()}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
