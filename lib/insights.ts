// FlowBase V2 — Insights 자동 생성 (A4, code-only)
// 보드 column + rows 분석 → 1-line 인사이트 카드.
// 사용처: Dashboard 상단 "Highlights" 영역 — toolbar 바로 아래, custom charts 위.
//
// 인사이트 종류:
//   - period_change: 지난 [week] 대비 +N% (date + numeric 또는 row count)
//   - top_categories: Top 3 [status/select] (count 기준)
//   - outliers: numeric 컬럼 z-score 2σ 초과 row 수 (A5)
//
// LOCK:
//   - AI ❌. 모든 계산은 통계.
//   - 인사이트 0개 가능 — 보드가 너무 작거나 categorical/date/numeric 없으면.
//   - 한 보드 최대 4개 인사이트 (시각 혼잡 회피).

import { computeAllOutliers } from "@/lib/outlier"
import type { ColumnDef, TableRow } from "@/types/flowbase"

export interface PeriodChangeInsight {
  kind: "period_change"
  label: string // "vs last week"
  current: number
  previous: number
  deltaPct: number // (cur-prev)/prev * 100, prev=0이면 cur>0이면 ∞ → 100
  tone: "positive" | "negative" | "neutral"
}

export interface TopCategoriesInsight {
  kind: "top_categories"
  label: string // "Top by Status"
  items: { name: string; count: number }[] // up to 3
}

export interface OutlierInsight {
  kind: "outliers"
  label: string // "Outliers in Price"
  count: number
  col: string
}

export type Insight =
  | PeriodChangeInsight
  | TopCategoriesInsight
  | OutlierInsight

const INSIGHTS_MAX = 4

// 지난 N일 vs 그 이전 N일 row count 비교. dateField 필수.
// N=7 (week) 기본.
function periodChange(
  rows: ReadonlyArray<TableRow>,
  dateField: string,
  windowDays = 7,
): PeriodChangeInsight | null {
  const tss: number[] = []
  for (const r of rows) {
    const v = r[dateField]
    if (typeof v !== "string") continue
    const t = new Date(v).getTime()
    if (Number.isFinite(t)) tss.push(t)
  }
  if (tss.length === 0) return null
  const maxTs = Math.max(...tss)
  const windowMs = windowDays * 86_400_000
  const currentStart = maxTs - windowMs
  const previousStart = currentStart - windowMs
  const current = tss.filter((t) => t > currentStart && t <= maxTs).length
  const previous = tss.filter((t) => t > previousStart && t <= currentStart).length
  if (current === 0 && previous === 0) return null
  const deltaPct =
    previous === 0
      ? current > 0
        ? 100
        : 0
      : ((current - previous) / previous) * 100
  const tone: "positive" | "negative" | "neutral" =
    Math.abs(deltaPct) < 1 ? "neutral" : deltaPct > 0 ? "positive" : "negative"
  return {
    kind: "period_change",
    label: `vs last ${windowDays === 7 ? "week" : `${windowDays}d`}`,
    current,
    previous,
    deltaPct,
    tone,
  }
}

// 첫 status/select 컬럼의 top 3 카운트.
function topCategories(
  rows: ReadonlyArray<TableRow>,
  col: ColumnDef,
): TopCategoriesInsight | null {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const raw = r[col.name]
    if (raw == null || raw === "") continue
    const keys: string[] = Array.isArray(raw)
      ? raw.map((x) => (x == null ? "" : String(x).trim())).filter((s) => s.length > 0)
      : [String(raw)]
    for (const k of keys) {
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  }
  if (counts.size === 0) return null
  const items = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
  return {
    kind: "top_categories",
    label: `Top by ${col.label || col.name}`,
    items,
  }
}

// 메인 entry — 보드 분석 → 최대 N개 인사이트.
export function computeInsights(
  columns: ReadonlyArray<ColumnDef>,
  rows: ReadonlyArray<TableRow>,
): Insight[] {
  const result: Insight[] = []
  if (rows.length === 0) return result

  // 1. period_change — 첫 date 컬럼 + 7일 window
  const dateCol = columns.find((c) => c.type === "date")
  if (dateCol) {
    const ins = periodChange(rows, dateCol.name)
    if (ins) result.push(ins)
  }

  // 2. top_categories — status 우선, 없으면 첫 select/multiSelect
  const catCol =
    columns.find((c) => c.type === "status") ??
    columns.find((c) => c.type === "select" && c.name !== "id") ??
    columns.find((c) => c.type === "multiSelect")
  if (catCol) {
    const ins = topCategories(rows, catCol)
    if (ins) result.push(ins)
  }

  // 3. outliers — numeric 컬럼 z-score 2σ 초과 (A5).
  //   각 컬럼별 카드 1개. 첫 outlier 컬럼만 (시각 혼잡 회피 — 후속 phase에서 dropdown).
  const outliers = computeAllOutliers(columns, rows)
  if (outliers.length > 0) {
    const first = outliers[0]
    const colLabel =
      columns.find((c) => c.name === first.col)?.label || first.col
    result.push({
      kind: "outliers",
      label: `outlier${first.rowIds.length === 1 ? "" : "s"} in ${colLabel}`,
      count: first.rowIds.length,
      col: first.col,
    })
  }

  return result.slice(0, INSIGHTS_MAX)
}
