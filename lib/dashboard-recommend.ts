// FlowBase V2 — Dashboard 차트 자동 추천 (D5 + A2 도메인 priority)
// 도메인 무관 fit: 어떤 보드든 컬럼 모양만 보고 적절한 차트 묶음 자동 생성.
// 사용처:
//   - empty state ("Apply recommended charts" 버튼)
//   - custom dashboard 있을 때 "Suggest more" (이미 같은 sourceCol 차트 있으면 skip)
//
// 룰 (우선순위 — 상단에 가까울수록 default 표시):
//   1. KPI: Total rows (count of all rows). title은 도메인별 — "Total tickets/employees/deals…"
//   2. KPI: Sum of priority numeric (도메인 우선 컬럼 또는 첫 numeric)
//   3. KPI: Avg of priority numeric
//   4. Bar: status 분포 (status 있을 때) · CS면 "Ticket flow", Sales면 "Deal stage"
//   5. Donut: 첫 select 분포 (status 외)
//   6. Bar: tags 분포 (multiSelect 있을 때)
//   7. Line: weekly trend (date 컬럼 있을 때) · CS/Sales면 multi-series(by status/stage)
//   8. Histogram: priority numeric 분포 (HR면 score, Stock이면 price/yield)
//   9. Scatter: 첫 num × 두 번째 num 상관 (numeric ≥ 2)
//   10. Stacked bar: status × 첫 select
//
// 도메인 추론은 inferDomain 사용 (lib/domain-infer.ts). 도메인이 priorityCol 우선 + title 변형.
//
// LOCK: id 자동 생성은 caller(store.addChart)가 처리 — 추천 결과는 Omit<ChartConfig, "id">[].

import { inferDomain, type Domain } from "@/lib/domain-infer"
import type { ChartConfig, ColumnDef } from "@/types/flowbase"

export type ChartSpec = Omit<ChartConfig, "id">

interface ColumnSet {
  status: ColumnDef | null
  selects: ColumnDef[]      // status 외 select
  multiSelects: ColumnDef[]
  numerics: ColumnDef[]
  dates: ColumnDef[]
}

function classify(cols: ReadonlyArray<ColumnDef>): ColumnSet {
  const usable = cols.filter((c) => c.name !== "id")
  return {
    status: usable.find((c) => c.type === "status") ?? null,
    selects: usable.filter((c) => c.type === "select"),
    multiSelects: usable.filter((c) => c.type === "multiSelect"),
    numerics: usable.filter((c) => c.type === "num"),
    dates: usable.filter((c) => c.type === "date"),
  }
}

const colLabel = (c: ColumnDef) => c.label?.trim() || c.name

// 도메인별 priority 키워드 — 컬럼 라벨/name lowercase에 substring 매치.
// 매치되면 그 컬럼이 도메인 시각화의 핵심. 매치 ❌면 첫 numeric/categorical fallback.
const DOMAIN_PRIORITY_KEYWORDS: Record<Domain, string[]> = {
  cs: ["sla", "queue", "wait", "response", "resolve"],
  hr: ["score", "salary", "tenure", "performance"],
  marketing: ["roi", "roas", "conversion", "spend", "revenue"],
  sales: ["pipeline", "revenue", "deal", "value", "stage"],
  finance: ["balance", "amount", "revenue", "expense", "profit"],
  stock: ["price", "yield", "volume", "return"],
  general: [],
}

// 도메인별 "row 단위 명사" — KPI "Total ___" 표시 용.
const DOMAIN_ROW_NOUN: Record<Domain, string> = {
  cs: "tickets",
  hr: "employees",
  marketing: "campaigns",
  sales: "deals",
  finance: "transactions",
  stock: "holdings",
  general: "rows",
}

// priorityCol — 도메인 키워드 우선 순서로 검색. 키워드 first에 매치되는 컬럼이 우선.
// 매치 ❌면 첫 후보 column fallback.
function priorityCol(
  domain: Domain,
  candidates: ReadonlyArray<ColumnDef>,
): ColumnDef | null {
  if (candidates.length === 0) return null
  const kws = DOMAIN_PRIORITY_KEYWORDS[domain]
  for (const kw of kws) {
    const hit = candidates.find((c) =>
      `${c.name} ${c.label || ""}`.toLowerCase().includes(kw),
    )
    if (hit) return hit
  }
  return candidates[0]
}

export interface RecommendOptions {
  domain?: Domain
  boardLabel?: string
}

export function recommendCharts(
  columns: ReadonlyArray<ColumnDef>,
  opts: RecommendOptions = {},
): ChartSpec[] {
  const domain = opts.domain ?? inferDomain(columns, opts.boardLabel)
  const set = classify(columns)
  const result: ChartSpec[] = []

  // 1. KPI Total rows — 항상. title은 도메인 row noun.
  result.push({
    type: "kpi",
    title: `Total ${DOMAIN_ROW_NOUN[domain]}`,
    sourceCol: columns[0]?.name ?? "id",
    width: "quarter",
    aggFn: "count",
  })

  // 도메인 priority numeric — 도메인 키워드 매치 컬럼 우선
  const priNumeric = priorityCol(domain, set.numerics)

  // 2. KPI Sum of priority numeric
  if (priNumeric) {
    result.push({
      type: "kpi",
      title: `Total ${colLabel(priNumeric)}`,
      sourceCol: priNumeric.name,
      width: "quarter",
      aggFn: "sum",
      valueCol: priNumeric.name,
    })
  }

  // 3. KPI Avg of priority numeric
  if (priNumeric) {
    result.push({
      type: "kpi",
      title: `Avg ${colLabel(priNumeric)}`,
      sourceCol: priNumeric.name,
      width: "quarter",
      aggFn: "avg",
      valueCol: priNumeric.name,
    })
  }

  // 4. Bar of status — title 도메인 변형 (CS=Ticket flow, Sales=Deal pipeline 등)
  if (set.status) {
    const statusTitle =
      domain === "cs"
        ? "Ticket flow"
        : domain === "sales"
          ? "Deal stage"
          : `${colLabel(set.status)} distribution`
    result.push({
      type: "bar",
      title: statusTitle,
      sourceCol: set.status.name,
      width: "half",
      aggFn: "count",
    })
  }

  // 5. Donut of first select (status 외)
  if (set.selects.length > 0) {
    const c = set.selects[0]
    result.push({
      type: "donut",
      title: `${colLabel(c)} breakdown`,
      sourceCol: c.name,
      width: "quarter",
      aggFn: "count",
    })
  }

  // 6. Bar of first multiSelect (tags 식 분포 — Notion 패턴, count 합 > rows.length 가능)
  if (set.multiSelects.length > 0) {
    const c = set.multiSelects[0]
    result.push({
      type: "bar",
      title: `${colLabel(c)} usage`,
      sourceCol: c.name,
      width: "half",
      aggFn: "count",
    })
  }

  // 7. Line trend (date 있으면) — CS/Sales면 status로 multi-series 자동 (F1 활용).
  //    Finance/Stock은 monthly scale default.
  if (set.dates.length > 0) {
    const c = set.dates[0]
    const useSeries = (domain === "cs" || domain === "sales") && !!set.status
    const useMonthlyScale =
      domain === "finance" || domain === "stock" || domain === "sales"
    result.push({
      type: "line",
      title:
        domain === "stock"
          ? "Price over time"
          : domain === "finance"
            ? "Cash flow over time"
            : useSeries
              ? `Activity by ${colLabel(set.status!)}`
              : "Activity over time",
      sourceCol: c.name,
      ...(useSeries ? { groupByCol: set.status!.name } : {}),
      width: "two-thirds",
      aggFn: "count",
      timeScale: useMonthlyScale ? "month" : "week",
    })
  }

  // 8. Histogram of priority numeric (HR=score, Stock=price, Finance=amount)
  if (priNumeric) {
    result.push({
      type: "histogram",
      title: `${colLabel(priNumeric)} distribution`,
      sourceCol: priNumeric.name,
      width: "half",
    })
  }

  // 9. Scatter (2+ numeric)
  if (set.numerics.length >= 2) {
    const x = set.numerics[0]
    const y = set.numerics[1]
    result.push({
      type: "scatter",
      title: `${colLabel(x)} vs ${colLabel(y)}`,
      sourceCol: x.name,
      valueCol: y.name,
      width: "half",
    })
  }

  // 10. Stacked bar (status × first select)
  if (set.status && set.selects.length > 0) {
    const sel = set.selects[0]
    result.push({
      type: "stacked-bar",
      title: `${colLabel(set.status)} × ${colLabel(sel)}`,
      sourceCol: set.status.name,
      groupByCol: sel.name,
      width: "half",
    })
  }

  return result
}

// 기존 차트가 같은 (sourceCol + type + valueCol) 조합이면 추천에서 제외 — "Suggest more" 진입점 dedupe.
export function filterUnseenRecommendations(
  recommended: ChartSpec[],
  existing: ReadonlyArray<ChartConfig>,
): ChartSpec[] {
  const key = (c: { type: string; sourceCol: string; valueCol?: string; aggFn?: string }) =>
    `${c.type}::${c.sourceCol}::${c.valueCol ?? ""}::${c.aggFn ?? ""}`
  const seen = new Set(existing.map(key))
  return recommended.filter((c) => !seen.has(key(c)))
}
