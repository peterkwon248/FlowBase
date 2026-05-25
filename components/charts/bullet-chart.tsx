// FlowBase V2 — Bullet chart (G7-A1)
// KPI 강화 변형 — 가로 막대 + goal 마커 + 선택 reference. 의존성 0 SVG.
// 사용처: 매출 vs 목표 vs 이전 분기, 평균 점수 vs goal vs 팀 평균.

"use client"

import { cn } from "@/lib/utils"

interface BulletChartProps {
  value: number
  goal?: number
  reference?: number
  // 표시 format (A3 formatValue helper의 결과)
  display?: string
  goalLabel?: string
  referenceLabel?: string
  className?: string
}

export function BulletChart({
  value,
  goal,
  reference,
  display,
  goalLabel,
  referenceLabel,
  className,
}: BulletChartProps) {
  // axis 최대값 — value/goal/reference 중 가장 큰 값의 110%
  const candidates = [value, goal, reference].filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n),
  )
  if (candidates.length === 0) {
    return (
      <div className="flex h-[80px] items-center justify-center text-[11.5px] text-muted-foreground">
        No data
      </div>
    )
  }
  const maxVal = Math.max(...candidates) * 1.1 || 1
  const valuePct = Math.min(100, (value / maxVal) * 100)
  const goalPct = goal != null ? Math.min(100, (goal / maxVal) * 100) : null
  const refPct =
    reference != null ? Math.min(100, (reference / maxVal) * 100) : null

  const reached = goal != null && value >= goal
  const fillColor = reached
    ? "bg-emerald-500 dark:bg-emerald-400"
    : "bg-amber-500 dark:bg-amber-400"

  return (
    <div className={cn("py-2", className)}>
      {/* value text */}
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">
          {display ?? value.toLocaleString()}
        </span>
        {goal != null && (
          <span className="text-[11px] text-muted-foreground">
            of {goal.toLocaleString()} {goalLabel ?? "goal"}
            {goal > 0 && (
              <span className="ml-1 font-semibold tabular-nums">
                ({((value / goal) * 100).toFixed(0)}%)
              </span>
            )}
          </span>
        )}
      </div>
      {/* bar */}
      <div className="relative h-3 overflow-visible rounded bg-muted">
        {/* value bar */}
        <div
          className={cn("h-full rounded transition-all", fillColor)}
          style={{ width: `${valuePct}%` }}
          data-bullet-value
        />
        {/* goal marker — 세로 두꺼운 선 */}
        {goalPct != null && (
          <div
            aria-label="Goal"
            className="absolute top-[-2px] h-[calc(100%+4px)] w-[2px] bg-foreground/80"
            style={{ left: `${goalPct}%` }}
            data-bullet-goal
          />
        )}
        {/* reference marker — 점선 또는 다이아 */}
        {refPct != null && (
          <div
            aria-label="Reference"
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-foreground/60 bg-card"
            style={{ left: `${refPct}%` }}
            data-bullet-reference
            title={`${referenceLabel ?? "Reference"}: ${reference?.toLocaleString()}`}
          />
        )}
      </div>
      {/* legend */}
      {(goal != null || reference != null) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className={cn("inline-block size-2 rounded-sm", fillColor)} />
            Actual
          </span>
          {goal != null && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-[2px] bg-foreground/80" />
              {goalLabel ?? "Goal"}
            </span>
          )}
          {reference != null && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2 rotate-45 border border-foreground/60 bg-card" />
              {referenceLabel ?? "Reference"}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
