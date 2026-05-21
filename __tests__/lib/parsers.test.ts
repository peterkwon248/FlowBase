// FlowBase V2 — lib/parsers.ts 테스트 (Phase 3)
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §3·12
// 출처: design-ref/handoff/IMPORT-SPEC.md §1 (테스트 픽스처)

import { describe, expect, it } from "vitest"
import {
  detectFormat,
  inferType,
  normalizeHeader,
  parseAny,
  parseDelimited,
  parseMarkdownTable,
} from "@/lib/parsers"

const CSV = `id,name,date,quote
INT-101,Lee Junho,2026-05-18,"가격이 부담, 무료 플랜?"
INT-102,Mira Tan,2026-05-17,새 컬럼 안 보여요`

const TSV = "id\tname\tdate\nINT-101\tLee\t2026-05-18"

const MD = `| id | name | quote |
|---|---|---|
| INT-101 | Lee | 비싸요 |
| INT-102 | Mira | 좋아요 |`

describe("detectFormat", () => {
  it("CSV / TSV / MD / null을 감지한다", () => {
    expect(detectFormat(CSV)).toBe("csv")
    expect(detectFormat(TSV)).toBe("tsv")
    expect(detectFormat(MD)).toBe("md")
    expect(detectFormat("")).toBeNull()
    expect(detectFormat("just one word")).toBeNull()
  })
})

describe("parseDelimited", () => {
  it("quote 안의 콤마를 한 셀로 처리한다", () => {
    const rows = parseDelimited(CSV, ",")
    expect(rows[1]).toEqual([
      "INT-101",
      "Lee Junho",
      "2026-05-18",
      "가격이 부담, 무료 플랜?",
    ])
  })
  it('이스케이프된 따옴표("")를 처리한다', () => {
    const rows = parseDelimited('a,"he said ""hi"""', ",")
    expect(rows[0]).toEqual(["a", 'he said "hi"'])
  })
})

describe("parseMarkdownTable", () => {
  it("구분선(---) 행을 제외하고 파싱한다", () => {
    const rows = parseMarkdownTable(MD)
    expect(rows).not.toBeNull()
    expect(rows?.length).toBe(3) // 헤더 + 데이터 2
    expect(rows?.[0]).toEqual(["id", "name", "quote"])
    expect(rows?.[2]).toEqual(["INT-102", "Mira", "좋아요"])
  })
  it("2행 미만이면 null을 반환한다", () => {
    expect(parseMarkdownTable("| only one |")).toBeNull()
  })
})

describe("parseAny", () => {
  it("포맷을 자동 분기한다", () => {
    expect(parseAny(CSV).format).toBe("csv")
    expect(parseAny(MD).format).toBe("md")
    expect(parseAny("no delimiters here").format).toBeNull()
  })
})

describe("inferType", () => {
  it("date / email / num / select / text를 추론한다", () => {
    expect(inferType(["2026-05-18", "2026-01-01"])).toBe("date")
    expect(inferType(["a@b.com", "c@d.io"])).toBe("email")
    expect(inferType(["12", "3.5", "-7"])).toBe("num")
    expect(inferType(["A", "A", "B", "B"])).toBe("select")
    // 8개 전부 distinct → select 임계 초과 → text
    expect(
      inferType(["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"]),
    ).toBe("text")
    expect(inferType([])).toBe("text")
  })
})

describe("normalizeHeader", () => {
  it("snake_case로 변환하고 빈 값은 col_N으로 fallback한다", () => {
    expect(normalizeHeader("Customer Name", 0)).toBe("customer_name")
    expect(normalizeHeader("", 2)).toBe("col_3")
    expect(normalizeHeader("   ", 4)).toBe("col_5")
  })
})
