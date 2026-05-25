// FlowBase V2 — lib/value-format.ts 테스트 (A3)

import { describe, expect, it } from "vitest"
import { formatValue, inferValueFormat } from "@/lib/value-format"
import type { ColumnDef } from "@/types/flowbase"

const col = (name: string, label?: string): ColumnDef => ({
  name,
  label: label ?? name,
  type: "num",
})

describe("inferValueFormat", () => {
  it("currency 키워드 — price/revenue/salary", () => {
    expect(inferValueFormat(col("price")).format).toBe("currency")
    expect(inferValueFormat(col("revenue", "Revenue")).format).toBe("currency")
    expect(inferValueFormat(col("salary")).format).toBe("currency")
    expect(inferValueFormat(col("balance")).format).toBe("currency")
  })
  it("currency 기호 컬럼명 — $/₩/원/¥/€", () => {
    expect(inferValueFormat(col("amount_usd", "Amount ($)"))).toEqual({
      format: "currency",
      currency: "USD",
    })
    expect(inferValueFormat(col("money", "월급 (원)"))).toEqual({
      format: "currency",
      currency: "KRW",
    })
    expect(inferValueFormat(col("yen", "Cost (¥)"))).toEqual({
      format: "currency",
      currency: "JPY",
    })
  })
  it("percent 키워드 — rate/ratio/yield/ROI/conversion", () => {
    expect(inferValueFormat(col("rate")).format).toBe("percent")
    expect(inferValueFormat(col("yield")).format).toBe("percent")
    expect(inferValueFormat(col("roi", "ROI")).format).toBe("percent")
    expect(inferValueFormat(col("conversion_rate")).format).toBe("percent")
  })
  it("time 키워드 — hour/duration/latency", () => {
    expect(inferValueFormat(col("hours_worked")).format).toBe("time")
    expect(inferValueFormat(col("duration_h", "Duration")).format).toBe("time")
    expect(inferValueFormat(col("latency_ms")).format).toBe("time")
  })
  it("그 외 → number", () => {
    expect(inferValueFormat(col("count")).format).toBe("number")
    expect(inferValueFormat(col("votes")).format).toBe("number")
  })
  it("sample 셀에 currency 기호 있으면 fallback 감지", () => {
    const result = inferValueFormat(col("misc", "Misc"), [
      { id: "1", misc: "$100" },
      { id: "2", misc: "$200" },
    ])
    expect(result.format).toBe("currency")
    expect(result.currency).toBe("USD")
  })
  it("한국어 키워드 매치", () => {
    expect(inferValueFormat(col("price", "월매출")).format).toBe("currency")
    expect(inferValueFormat(col("ratio", "전환율")).format).toBe("percent")
  })
})

describe("formatValue", () => {
  it("currency USD — $1,234", () => {
    const out = formatValue(1234, { format: "currency", currency: "USD" })
    expect(out).toContain("1,234")
    expect(out).toMatch(/\$/)
  })
  it("currency KRW — ₩1,234", () => {
    const out = formatValue(1234, { format: "currency", currency: "KRW" })
    expect(out).toContain("1,234")
    expect(out).toMatch(/₩/)
  })
  it("percent — 0~1 ratio → ×100", () => {
    expect(formatValue(0.125, { format: "percent" })).toContain("12.5")
    expect(formatValue(0.125, { format: "percent" })).toContain("%")
  })
  it("percent — 1 초과면 그대로", () => {
    expect(formatValue(25, { format: "percent" })).toContain("25")
    expect(formatValue(25, { format: "percent" })).toContain("%")
  })
  it("time — 1h 이상은 h, 미만은 m", () => {
    expect(formatValue(2.5, { format: "time" })).toBe("2.5h")
    expect(formatValue(0.5, { format: "time" })).toBe("30m")
  })
  it("number 큰 값 abbreviation — M/K", () => {
    expect(formatValue(1_500_000, { format: "number" })).toBe("1.5M")
    expect(formatValue(12_500, { format: "number" })).toBe("12.5K")
    expect(formatValue(999, { format: "number" })).toBe("999")
  })
  it("fractionDigits 옵션 — number 소수점", () => {
    expect(
      formatValue(123.456, { format: "number" }, { fractionDigits: 2 }),
    ).toBe("123.46")
  })
  it("non-finite — '—'", () => {
    expect(formatValue(NaN, { format: "number" })).toBe("—")
    expect(formatValue(Infinity, { format: "number" })).toBe("—")
  })
})
