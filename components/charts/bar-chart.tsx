// FlowBase V2 — 세로 막대 차트 (recharts, hero 차트)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §5 (Q1=a)

"use client"

import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
} from "recharts"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export interface BarDatum {
  label: string
  value: number
}

export function BarChart({
  data,
  onBarClick,
}: {
  data: BarDatum[]
  // G1-2 drill-down — bar click 시 label 반환
  onBarClick?: (label: string) => void
}) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <XAxis
            dataKey="label"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Bar
            dataKey="value"
            radius={[3, 3, 0, 0]}
            maxBarSize={64}
            isAnimationActive={false}
            onClick={
              onBarClick
                ? (entry: { label: string }) => onBarClick(entry.label)
                : undefined
            }
            cursor={onBarClick ? "pointer" : "default"}
          >
            {data.map((d, i) => (
              <Cell key={d.label} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
