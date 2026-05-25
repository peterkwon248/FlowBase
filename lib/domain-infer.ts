// FlowBase V2 — Domain inference (A1, code-only, AI ❌)
// 보드 컬럼 + 라벨에서 도메인 키워드 매칭 → Domain 추정.
// 사용처: A2 도메인별 차트 우선순위 · 인사이트 카드 우선순위 · 사용자에게 도메인 라벨 표시.
//
// LOCK (사용자 메모리):
//   - 자동 추론 OK (코드 룰, 결정은 cell value 변경 ❌, 사용자가 결과 본 후 다른 동작 ❌).
//   - AI 호출 ❌. Phase B에서 별 진입점으로 추가 가능.
//   - 최소 2 키워드 매치 시만 도메인 확정 (false positive 회피). 미달은 "general".
//
// 매칭 방식:
//   - 컬럼 라벨 + name + 보드 라벨을 lowercase 합쳐서 substring 검색.
//   - 도메인별 키워드 집합과 매치 count. 가장 점수 높은 도메인 (≥2점).
//   - 단어 경계 ❌ (substring) — "marketingChannel" 같은 camelCase도 hit.
//
// 후속:
//   - score tie breaker (현재는 first match — 우선순위 = Object.entries 순서)
//   - 도메인 confidence 점수 노출 (UI에서 "CS · high confidence")
//   - 사용자 override (Settings에서 도메인 수동 설정)

import type { ColumnDef } from "@/types/flowbase"

export type Domain =
  | "cs"
  | "hr"
  | "marketing"
  | "sales"
  | "finance"
  | "stock"
  | "general"

export const DOMAIN_LABELS: Record<Domain, string> = {
  cs: "Customer Support",
  hr: "HR",
  marketing: "Marketing",
  sales: "Sales",
  finance: "Finance",
  stock: "Stock / Portfolio",
  general: "General",
}

// 도메인별 핵심 키워드 — lowercase substring 매치.
// 충돌 키워드 (예: "account"가 finance/sales/cs 모두) 의도: 점수 누적, 가장 많은 키워드 매치 도메인 wins.
const DOMAIN_KEYWORDS: Record<Exclude<Domain, "general">, string[]> = {
  cs: [
    "ticket",
    "case",
    "agent",
    "customer",
    "sentiment",
    "sla",
    "queue",
    "csat",
    "complaint",
    "support",
    "resolve",
    "inquiry",
    "회사", // 한국어 — 회사 컬럼 흔히 CS
    "고객",
    "문의",
    "처리",
  ],
  hr: [
    "employee",
    "department",
    "dept",
    "salary",
    "position",
    "hire",
    "performance",
    "role",
    "title",
    "manager",
    "team",
    "tenure",
    "직원",
    "부서",
    "연봉",
    "직책",
    "입사",
  ],
  marketing: [
    "campaign",
    "channel",
    "spend",
    "conversion",
    "lead",
    "roi",
    "roas",
    "ctr",
    "click",
    "impression",
    "audience",
    "creative",
    "캠페인",
    "광고",
    "전환",
  ],
  sales: [
    "deal",
    "opportunity",
    "stage",
    "pipeline",
    "revenue",
    "quota",
    "close",
    "prospect",
    "account",
    "won",
    "lost",
    "거래",
    "매출",
    "계약",
    "고객사",
  ],
  finance: [
    "debit",
    "credit",
    "balance",
    "invoice",
    "expense",
    "ledger",
    "tax",
    "pnl",
    "profit",
    "loss",
    "asset",
    "liability",
    "지출",
    "수익",
    "잔액",
    "세금",
  ],
  stock: [
    "ticker",
    "symbol",
    "price",
    "volume",
    "yield",
    "dividend",
    "portfolio",
    "share",
    "shares",
    "market cap",
    "marketcap",
    "pe ratio",
    "주식",
    "종목",
    "수익률",
    "배당",
  ],
}

const MIN_SCORE = 2 // false positive 회피 — 최소 2 키워드 매치 필요

export interface DomainScore {
  domain: Domain
  score: number
  matched: string[]
}

// 모든 도메인 점수 — 디버깅/UI 표시 용 (어떤 키워드가 hit했나).
export function scoreDomains(
  columns: ReadonlyArray<ColumnDef>,
  boardLabel?: string,
): DomainScore[] {
  const text = [boardLabel || "", ...columns.map((c) => c.label || c.name)]
    .join(" ")
    .toLowerCase()
  const result: DomainScore[] = []
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [
    Exclude<Domain, "general">,
    string[],
  ][]) {
    const matched: string[] = []
    for (const kw of keywords) {
      if (text.includes(kw)) matched.push(kw)
    }
    result.push({ domain, score: matched.length, matched })
  }
  // score desc + (tie) 도메인 enum 순서 보존
  result.sort((a, b) => b.score - a.score)
  return result
}

// 최상위 도메인. score < MIN_SCORE면 "general".
export function inferDomain(
  columns: ReadonlyArray<ColumnDef>,
  boardLabel?: string,
): Domain {
  const scores = scoreDomains(columns, boardLabel)
  const top = scores[0]
  if (!top || top.score < MIN_SCORE) return "general"
  return top.domain
}
