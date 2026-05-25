// FlowBase V2 — 도넛 차트 (recharts, hero 차트)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §5 (Q1=a)

"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export interface DonutDatum {
  label: string
  value: number
}

export function DonutChart({
  data,
  onSliceClick,
}: {
  data: DonutDatum[]
  // G1-2 drill-down — slice click 시 label 반환
  onSliceClick?: (label: string) => void
}) {
  const items = data.filter((d) => d.value > 0)
  const total = items.reduce((s, d) => s + d.value, 0)

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              nameKey="label"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
              onClick={
                onSliceClick
                  ? (entry: { label: string }) => onSliceClick(entry.label)
                  : undefined
              }
              cursor={onSliceClick ? "pointer" : "default"}
            >
              {items.map((d, i) => (
                <Cell key={d.label} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums">{total}</span>
          <span className="text-[11px] text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-1.5">
        {items.map((d, i) => (
          <li
            key={d.label}
            className={cn(
              "flex items-center gap-2 text-xs",
              onSliceClick && "cursor-pointer hover:bg-foreground/[0.04] rounded px-1",
            )}
            onClick={onSliceClick ? () => onSliceClick(d.label) : undefined}
          >
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="flex-1 truncate">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
