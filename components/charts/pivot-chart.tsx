// FlowBase V2 — Pivot table (G1-1)
// rowField × colField 교차 cell에 aggFn(valueCol) 표시. Excel pivot 답습.
// 의존성 0 — 단순 HTML table.
//
// 시각:
//   - sticky header (row 1) + sticky first column
//   - cell intensity = 값/max 비율 (heatmap 식 amber tone)
//   - row/col totals (마지막 row/col)
//
// LOCK:
//   - cell click drill-down은 G1-2에서 핸들러 prop.

"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export interface PivotData {
  rowLabels: string[]
  colLabels: string[]
  cells: number[][] // cells[rowIdx][colIdx]
}

interface PivotChartProps {
  data: PivotData
  // 값 표시 format (KPI 식 — A3 valueFormat 호환).
  formatValue?: (v: number) => string
  // cell click — G1-2 drill-down용 (현 phase는 미사용)
  onCellClick?: (rowLabel: string, colLabel: string, value: number) => void
  className?: string
}

export function PivotChart({
  data,
  formatValue,
  onCellClick,
  className,
}: PivotChartProps) {
  const { rowTotals, colTotals, grandTotal, max } = useMemo(() => {
    const rowTotals = data.cells.map((row) => row.reduce((a, b) => a + b, 0))
    const colTotals = data.colLabels.map((_, ci) =>
      data.cells.reduce((acc, row) => acc + (row[ci] ?? 0), 0),
    )
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0)
    const flat = data.cells.flat()
    const max = flat.length > 0 ? Math.max(...flat, 1) : 1
    return { rowTotals, colTotals, grandTotal, max }
  }, [data])

  const fmt = (n: number): string => {
    if (!Number.isFinite(n)) return "—"
    if (formatValue) return formatValue(n)
    if (Math.abs(n) >= 10_000)
      return `${(n / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
  }

  if (data.rowLabels.length === 0 || data.colLabels.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center text-[11.5px] text-muted-foreground">
        No data
      </div>
    )
  }

  return (
    <div className={cn("overflow-auto", className)}>
      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-10 bg-card px-2 py-1.5 text-left text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground" />
            {data.colLabels.map((c) => (
              <th
                key={c}
                className="sticky top-0 bg-card px-2 py-1.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
              >
                {c}
              </th>
            ))}
            <th className="sticky right-0 top-0 bg-muted/50 px-2 py-1.5 text-right text-[10.5px] font-bold uppercase tracking-[0.06em] text-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rowLabels.map((rowLabel, ri) => (
            <tr key={rowLabel} className="border-t border-border-subtle">
              <th
                scope="row"
                className="sticky left-0 bg-card px-2 py-1.5 text-left text-[11.5px] font-medium"
              >
                {rowLabel}
              </th>
              {data.colLabels.map((colLabel, ci) => {
                const v = data.cells[ri]?.[ci] ?? 0
                const intensity = max > 0 ? v / max : 0
                const cellBg =
                  v > 0
                    ? `rgba(var(--chart-1-rgb, 124 58 237), ${0.05 + intensity * 0.35})`
                    : "transparent"
                return (
                  <td
                    key={colLabel}
                    onClick={
                      onCellClick && v > 0
                        ? () => onCellClick(rowLabel, colLabel, v)
                        : undefined
                    }
                    className={cn(
                      "px-2 py-1.5 text-right tabular-nums",
                      onCellClick && v > 0 && "cursor-pointer hover:bg-foreground/[0.06]",
                    )}
                    style={{ background: cellBg }}
                    data-pivot-cell={`${rowLabel}::${colLabel}`}
                  >
                    {v > 0 ? fmt(v) : <span className="text-muted-foreground/50">—</span>}
                  </td>
                )
              })}
              <td className="bg-muted/50 px-2 py-1.5 text-right font-bold tabular-nums">
                {fmt(rowTotals[ri])}
              </td>
            </tr>
          ))}
          {/* col totals row */}
          <tr className="border-t-2 border-border bg-muted/50">
            <th
              scope="row"
              className="sticky left-0 bg-muted/50 px-2 py-1.5 text-left text-[10.5px] font-bold uppercase tracking-[0.06em] text-foreground"
            >
              Total
            </th>
            {data.colLabels.map((c, ci) => (
              <td key={c} className="px-2 py-1.5 text-right font-bold tabular-nums">
                {fmt(colTotals[ci])}
              </td>
            ))}
            <td className="bg-muted px-2 py-1.5 text-right font-bold tabular-nums">
              {fmt(grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
