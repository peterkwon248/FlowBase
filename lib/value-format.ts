// FlowBase V2 — Numeric value format (A3, code-only)
// 컬럼명 키워드 + sample 패턴으로 currency/time/percent/number 추론 → 표시 format.
// 사용처: KPI tile · Bar/Line label · Scatter/Histogram axis (후속).
//
// LOCK:
//   - AI ❌. 키워드 매핑만.
//   - locale은 컬럼명 통화 기호로 추론 ("$" → USD, "원/₩" → KRW, "¥" → JPY, "€" → EUR).
//   - sample 검사는 currency 기호 감지에 사용 (옵션, columns 없을 때 fallback).
//
// 후속:
//   - 사용자 명시 format override (column meta에 valueFormat? 추가)
//   - Number 큰 값 abbreviation (1.2M, 3.4K)

import type { ColumnDef, TableRow } from "@/types/flowbase"

export type ValueFormat = "currency" | "time" | "percent" | "number"

export type Currency = "USD" | "KRW" | "JPY" | "EUR" | "GBP" | "AUTO"

export interface FormatHint {
  format: ValueFormat
  currency?: Currency
}

const CURRENCY_KEYWORDS = [
  "price",
  "cost",
  "revenue",
  "amount",
  "spend",
  "salary",
  "balance",
  "expense",
  "profit",
  "income",
  "fee",
  "charge",
  "invoice",
  "budget",
  "매출",
  "비용",
  "수익",
  "연봉",
  "잔액",
  "지출",
]

const PERCENT_KEYWORDS = [
  "percent",
  "rate",
  "ratio",
  "yield",
  "roi",
  "roas",
  "ctr",
  "conversion",
  "margin",
  "share",
  "growth",
  "비율",
  "수익률",
  "전환율",
]

const TIME_KEYWORDS = [
  "hour",
  "minute",
  "second",
  "duration",
  "elapsed",
  "ms",
  "latency",
  "tenure",
  "age",
  "lifetime",
  "시간",
  "분",
  "초",
  "경과",
]

const CURRENCY_SYMBOL_MAP: Record<string, Currency> = {
  $: "USD",
  "₩": "KRW",
  원: "KRW",
  "¥": "JPY",
  "€": "EUR",
  "£": "GBP",
}

// word boundary 매치 (영어, plural -s/-es 허용). 한국어는 substring.
// _/- 를 공백 normalize — "conversion_rate" → "conversion rate"로 \brate\b 매치.
function hasKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.replace(/[_-]+/g, " ")
  for (const kw of keywords) {
    if (/[가-힣]/.test(kw)) {
      if (normalized.includes(kw)) return true
      continue
    }
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // 영어 — word boundary + plural -s/-es 허용
    if (new RegExp(`\\b${escaped}(?:s|es)?\\b`, "i").test(normalized)) {
      return true
    }
  }
  return false
}

// 컬럼명 + 옵션 sample row로 format 추론.
export function inferValueFormat(
  col: ColumnDef,
  sampleRows?: ReadonlyArray<TableRow>,
): FormatHint {
  const text = `${col.name} ${col.label || ""}`.toLowerCase()

  // currency symbol — 컬럼명에 직접 있으면 currency 확정 + locale.
  for (const sym of Object.keys(CURRENCY_SYMBOL_MAP)) {
    if (text.includes(sym)) {
      return { format: "currency", currency: CURRENCY_SYMBOL_MAP[sym] }
    }
  }

  // sample 검사 — sample 셀 값에 currency 기호. 첫 hit currency.
  if (sampleRows && sampleRows.length > 0) {
    for (const r of sampleRows.slice(0, 10)) {
      const v = r[col.name]
      if (typeof v !== "string") continue
      for (const sym of Object.keys(CURRENCY_SYMBOL_MAP)) {
        if (v.includes(sym)) {
          return { format: "currency", currency: CURRENCY_SYMBOL_MAP[sym] }
        }
      }
    }
  }

  // time 키워드 (percent 앞 — "duration"에 "ratio" sub 충돌 회피 + 영어 word boundary)
  if (hasKeyword(text, TIME_KEYWORDS)) {
    return { format: "time" }
  }

  // percent (rate/ratio/yield/ROI/ROAS/CTR)
  if (hasKeyword(text, PERCENT_KEYWORDS)) {
    return { format: "percent" }
  }

  // currency 키워드
  if (hasKeyword(text, CURRENCY_KEYWORDS)) {
    return { format: "currency", currency: "AUTO" }
  }

  return { format: "number" }
}

interface FormatOptions {
  // avg/median 등 소수 의미 있을 때만 maxFractionDigits 사용
  fractionDigits?: number
}

// FormatHint + raw 값 → 표시 문자열.
export function formatValue(
  value: number,
  hint: FormatHint,
  opts: FormatOptions = {},
): string {
  const { format, currency } = hint
  const fraction = opts.fractionDigits ?? 0
  if (!Number.isFinite(value)) return "—"

  if (format === "currency") {
    const cur = currency && currency !== "AUTO" ? currency : "USD"
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: cur,
        maximumFractionDigits: fraction,
      }).format(value)
    } catch {
      // currency code invalid — fallback
      return `${value.toLocaleString(undefined, { maximumFractionDigits: fraction })}`
    }
  }

  if (format === "percent") {
    // 0~100 가정 (사용자가 0.12 입력하면 12% 의도). 1.0 이하는 fraction로 해석.
    // minimum: 값이 0~1 사이면 ×100. 그 외는 그대로 + "%".
    const pct = Math.abs(value) <= 1 ? value * 100 : value
    return `${pct.toLocaleString(undefined, { maximumFractionDigits: Math.max(fraction, 1) })}%`
  }

  if (format === "time") {
    // value 단위 hour 가정 (단순화). 1 미만은 minutes로 변환.
    const abs = Math.abs(value)
    if (abs < 1) {
      return `${(value * 60).toLocaleString(undefined, { maximumFractionDigits: 0 })}m`
    }
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}h`
  }

  // number — 큰 값 abbreviation
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
  }
  if (abs >= 10_000) {
    return `${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: fraction })
}
