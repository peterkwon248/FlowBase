// FlowBase V2 — Dashboard 집계 helper (D1)
// 도메인 무관 fit: 어떤 데이터든(매출/평가/ROI/주식/CS) 동일한 aggregate 인터페이스.
//   count  = row 수
//   sum    = valueCol 값들의 합
//   avg    = 산술 평균
//   min/max = 최소/최대
//   median = 중앙값
//
// groupCol = null이면 단일 결과 (KPI 용). null 아니면 그룹별 결과 (bar/donut/line).
// rows의 valueCol이 Number()로 finite인 것만 포함 — null/공백/non-numeric 자동 skip.

import type { AggFn, TableRow } from "@/types/flowbase"

export interface AggregateItem {
  label: string
  value: number
  count: number // 해당 그룹의 row 수 (avg denominator 등 hint 용)
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const t = v.trim()
    if (!t) return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2
  return sorted[mid]
}

function applyFn(aggFn: AggFn, nums: number[], count: number): number {
  if (aggFn === "count") return count
  if (nums.length === 0) return 0
  if (aggFn === "sum") return nums.reduce((a, b) => a + b, 0)
  if (aggFn === "avg") return nums.reduce((a, b) => a + b, 0) / nums.length
  if (aggFn === "min") return Math.min(...nums)
  if (aggFn === "max") return Math.max(...nums)
  if (aggFn === "median") return median(nums)
  return count
}

// 그룹별 집계. groupCol=null이면 [{ label: "total", value: ..., count: rows.length }].
// multiSelect groupCol — 각 cell 배열의 원소마다 group에 row 카운트(Notion 패턴 — 합계가 rows.length 초과 가능).
export function aggregateBy(
  rows: ReadonlyArray<TableRow>,
  groupCol: string | null,
  aggFn: AggFn = "count",
  valueCol?: string,
): AggregateItem[] {
  // 단일 결과 (KPI)
  if (!groupCol) {
    const nums =
      aggFn === "count"
        ? []
        : (valueCol
            ? rows.map((r) => toNumber(r[valueCol])).filter((n): n is number => n !== null)
            : [])
    const value = applyFn(aggFn, nums, rows.length)
    return [{ label: "total", value, count: rows.length }]
  }

  // 그룹별
  const groups = new Map<string, { nums: number[]; count: number }>()
  for (const r of rows) {
    const raw = r[groupCol]
    if (raw == null || raw === "") continue
    // multiSelect cell — 배열 unpack
    const keys: string[] = Array.isArray(raw)
      ? raw.map((x) => (x == null ? "" : String(x).trim())).filter((s) => s.length > 0)
      : [String(raw)]
    if (keys.length === 0) continue
    const valNum =
      aggFn === "count" || !valueCol ? null : toNumber(r[valueCol])
    for (const k of keys) {
      let g = groups.get(k)
      if (!g) {
        g = { nums: [], count: 0 }
        groups.set(k, g)
      }
      g.count += 1
      if (valNum !== null) g.nums.push(valNum)
    }
  }

  return Array.from(groups.entries())
    .map(([label, g]) => ({
      label,
      value: applyFn(aggFn, g.nums, g.count),
      count: g.count,
    }))
    .sort((a, b) => b.value - a.value)
}

// hint label — 차트 부제/라벨 등에 표시. "count" / "sum of price" 등.
export function aggLabel(aggFn: AggFn, valueColLabel?: string): string {
  if (aggFn === "count") return "Count"
  const fnLabel: Record<Exclude<AggFn, "count">, string> = {
    sum: "Sum",
    avg: "Avg",
    min: "Min",
    max: "Max",
    median: "Median",
  }
  return valueColLabel ? `${fnLabel[aggFn]} of ${valueColLabel}` : fnLabel[aggFn]
}

export const AGG_FN_LABELS: Record<AggFn, string> = {
  count: "Count",
  sum: "Sum",
  avg: "Average",
  min: "Min",
  max: "Max",
  median: "Median",
}
