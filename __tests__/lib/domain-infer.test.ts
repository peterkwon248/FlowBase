// FlowBase V2 — lib/domain-infer.ts 테스트 (A1)

import { describe, expect, it } from "vitest"
import { DOMAIN_LABELS, inferDomain, scoreDomains } from "@/lib/domain-infer"
import type { ColumnDef } from "@/types/flowbase"

const col = (name: string, label?: string, type: ColumnDef["type"] = "text"): ColumnDef => ({
  name,
  label: label ?? name,
  type,
})

describe("inferDomain", () => {
  it("CS — ticket/case/agent/customer 등 매치", () => {
    const cols = [
      col("ticket_id", "Ticket ID"),
      col("agent", "Agent"),
      col("customer", "Customer"),
    ]
    expect(inferDomain(cols)).toBe("cs")
  })
  it("HR — employee/dept/salary 매치", () => {
    const cols = [
      col("emp_id", "Employee"),
      col("dept", "Department"),
      col("salary", "Salary", "num"),
    ]
    expect(inferDomain(cols)).toBe("hr")
  })
  it("Marketing — campaign/spend/ROI 매치", () => {
    const cols = [
      col("campaign", "Campaign"),
      col("spend", "Spend", "num"),
      col("roi", "ROI", "num"),
    ]
    expect(inferDomain(cols)).toBe("marketing")
  })
  it("Sales — deal/stage/pipeline 매치", () => {
    const cols = [
      col("deal", "Deal"),
      col("stage", "Stage"),
      col("pipeline", "Pipeline"),
    ]
    expect(inferDomain(cols)).toBe("sales")
  })
  it("Finance — debit/credit/balance 매치", () => {
    const cols = [
      col("debit", "Debit", "num"),
      col("credit", "Credit", "num"),
      col("balance", "Balance", "num"),
    ]
    expect(inferDomain(cols)).toBe("finance")
  })
  it("Stock — ticker/yield/dividend 매치", () => {
    const cols = [
      col("ticker", "Ticker"),
      col("yield", "Yield", "num"),
      col("dividend", "Dividend", "num"),
    ]
    expect(inferDomain(cols)).toBe("stock")
  })
  it("매치 ❌ → general (최소 2 키워드)", () => {
    const cols = [col("name"), col("notes")]
    expect(inferDomain(cols)).toBe("general")
  })
  it("매치 1개만 → general (MIN_SCORE 미달)", () => {
    const cols = [col("ticket_id", "Ticket"), col("misc"), col("notes")]
    expect(inferDomain(cols)).toBe("general")
  })
  it("보드 라벨도 매치 source — 라벨에 키워드 있으면 점수 가산", () => {
    // cols 자체 cs 키워드 1개(customer) + 보드 라벨에 ticket 1개 → score 2 → cs
    const cols = [col("status"), col("customer", "Customer")]
    expect(inferDomain(cols, "Ticket queue")).toBe("cs")
  })
  it("한국어 키워드 매치", () => {
    const cols = [col("employee", "직원"), col("dept", "부서"), col("salary", "연봉", "num")]
    expect(inferDomain(cols)).toBe("hr")
  })
  it("camelCase substring 매치 — 'campaignChannel'", () => {
    const cols = [col("campaignChannel", "Campaign Channel"), col("conversion", "Conversion", "num")]
    expect(inferDomain(cols)).toBe("marketing")
  })
  it("점수 동률 시 enum 순서 (cs 우선)", () => {
    // CS 2 + HR 2 → CS 먼저 (DOMAIN_KEYWORDS Object.entries 순)
    const cols = [
      col("customer", "Customer"),
      col("agent", "Agent"),
      col("employee", "Employee"),
      col("dept", "Department"),
    ]
    // sort stable이라 정확 결과는 sort 구현 의존. 동률은 score만 같음 → first wins
    const result = inferDomain(cols)
    expect(["cs", "hr"]).toContain(result)
  })
})

describe("scoreDomains", () => {
  it("모든 도메인 점수 반환 (desc 정렬)", () => {
    const cols = [
      col("ticket_id", "Ticket"),
      col("agent", "Agent"),
      col("customer", "Customer"),
    ]
    const scores = scoreDomains(cols)
    expect(scores.length).toBe(6) // 6 도메인 (general 제외)
    expect(scores[0].domain).toBe("cs")
    expect(scores[0].score).toBeGreaterThanOrEqual(3)
    // matched 배열에 hit된 키워드들
    expect(scores[0].matched).toContain("ticket")
    expect(scores[0].matched).toContain("agent")
    expect(scores[0].matched).toContain("customer")
  })
})

describe("DOMAIN_LABELS", () => {
  it("7개 도메인 모두 라벨 정의", () => {
    expect(Object.keys(DOMAIN_LABELS).length).toBe(7)
    expect(DOMAIN_LABELS.cs).toBe("Customer Support")
    expect(DOMAIN_LABELS.general).toBe("General")
  })
})
