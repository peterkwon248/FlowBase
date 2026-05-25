// FlowBase V2 — Outlier detection (A5, code-only)
// z-score 기반 — value가 평균에서 표준편차 N배 떨어지면 outlier.
// 사용처: insights (Outliers in Price), Sheet 마커 (후속).
//
// LOCK:
//   - 기본 threshold = 2σ (일반 통계 룰. 3σ는 너무 엄격, 1σ는 과민).
//   - 최소 row 5개 필요 (그 미만은 σ 의미 ❌).
//   - null/non-numeric은 자동 skip.
//   - IQR 방식은 후속 (skew된 분포에 강함). Phase 1은 z-score만.

import type { ColumnDef, TableRow } from "@/types/flowbase"

export interface OutlierResult {
  col: string // column name
  rowIds: string[]
  mean: number
  stdDev: number
  threshold: number // |z| > threshold이면 outlier
}

const DEFAULT_THRESHOLD = 2
const MIN_SAMPLES = 5

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

function meanAndStdDev(values: ReadonlyArray<number>): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
  return { mean, stdDev: Math.sqrt(variance) }
}

// 단일 컬럼 outlier 감지. stdDev=0이면 모든 값 동일 → outlier ❌.
export function detectOutliers(
  rows: ReadonlyArray<TableRow>,
  col: string,
  threshold = DEFAULT_THRESHOLD,
): OutlierResult | null {
  const samples: { id: string; value: number }[] = []
  for (const r of rows) {
    const n = toNumber(r[col])
    if (n === null) continue
    samples.push({ id: r.id, value: n })
  }
  if (samples.length < MIN_SAMPLES) return null
  const { mean, stdDev } = meanAndStdDev(samples.map((s) => s.value))
  if (stdDev === 0) return null
  const rowIds = samples
    .filter((s) => Math.abs((s.value - mean) / stdDev) > threshold)
    .map((s) => s.id)
  return { col, rowIds, mean, stdDev, threshold }
}

// 모든 numeric 컬럼 outlier 한 번에 — 각 컬럼별 OutlierResult (outlier 0개여도 null 반환).
export function computeAllOutliers(
  columns: ReadonlyArray<ColumnDef>,
  rows: ReadonlyArray<TableRow>,
  threshold = DEFAULT_THRESHOLD,
): OutlierResult[] {
  const result: OutlierResult[] = []
  for (const c of columns) {
    if (c.type !== "num") continue
    const r = detectOutliers(rows, c.name, threshold)
    if (r && r.rowIds.length > 0) result.push(r)
  }
  return result
}
