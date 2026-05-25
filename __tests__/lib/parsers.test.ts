// FlowBase V2 — lib/parsers.ts 테스트 (Phase 3)
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §3·12
// 출처: design-ref/handoff/IMPORT-SPEC.md §1 (테스트 픽스처)

import { describe, expect, it } from "vitest"
import {
  boardToTable,
  detectFormat,
  inferType,
  normalizeHeader,
  parseAny,
  parseDelimited,
  parseMarkdownTable,
  stringifyDelimited,
  stringifyMarkdownTable,
} from "@/lib/parsers"
import type { Board } from "@/types/flowbase"

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

describe("stringifyDelimited", () => {
  it("기본 CSV 출력", () => {
    const out = stringifyDelimited(
      { headers: ["id", "name"], rows: [["1", "Lee"], ["2", "Mira"]] },
      ",",
    )
    expect(out).toBe("id,name\n1,Lee\n2,Mira")
  })
  it("delim/quote/newline 포함 셀은 따옴표로 감싸고 \" → \"\" 이스케이프", () => {
    const out = stringifyDelimited(
      {
        headers: ["a", "b"],
        rows: [["he said \"hi\"", "with, comma"], ["line\nbreak", "ok"]],
      },
      ",",
    )
    expect(out).toBe(
      'a,b\n"he said ""hi""","with, comma"\n"line\nbreak",ok',
    )
  })
  it("CSV round-trip — parse → stringify → parse 동치", () => {
    const original = `id,name,quote\nINT-101,Lee,"가격이 부담, 무료 플랜?"\nINT-102,Mira,새 컬럼`
    const parsed = parseDelimited(original, ",")
    const [headers, ...rows] = parsed
    const re = stringifyDelimited({ headers, rows }, ",")
    expect(parseDelimited(re, ",")).toEqual(parsed)
  })
  it("TSV — \\t delim도 동작한다", () => {
    const out = stringifyDelimited(
      { headers: ["a", "b"], rows: [["1", "2"]] },
      "\t",
    )
    expect(out).toBe("a\tb\n1\t2")
  })
})

describe("stringifyMarkdownTable", () => {
  it("기본 pipe table 출력 (separator 포함)", () => {
    const out = stringifyMarkdownTable({
      headers: ["id", "name"],
      rows: [["1", "Lee"], ["2", "Mira"]],
    })
    expect(out).toBe(
      "| id | name |\n| --- | --- |\n| 1 | Lee |\n| 2 | Mira |",
    )
  })
  it("| escape · newline → space · 빈 셀은 공백 1개", () => {
    const out = stringifyMarkdownTable({
      headers: ["a", "b"],
      rows: [["with|pipe", ""], ["line\nbreak", "x"]],
    })
    expect(out).toContain("with\\|pipe")
    expect(out).toContain("line break")
    expect(out).toContain("|   |") // 빈 셀
  })
  it("MD round-trip — stringify → parse 헤더+rows 보존", () => {
    const orig = { headers: ["id", "name"], rows: [["1", "Lee"], ["2", "Mira"]] }
    const md = stringifyMarkdownTable(orig)
    const parsed = parseMarkdownTable(md)
    expect(parsed?.[0]).toEqual(orig.headers)
    expect(parsed?.slice(1)).toEqual(orig.rows)
  })
})

describe("boardToTable", () => {
  it("Board → SerializableTable — status 키 raw 그대로 (한국어 유지)", () => {
    const b: Board = {
      id: "b1",
      label: "Test",
      columns: [
        { name: "id", label: "ID", type: "text" },
        { name: "title", label: "Title", type: "text" },
        { name: "status", label: "Status", type: "status" },
      ],
      rows: [
        { id: "INT-101", title: "A", status: "미처리" },
        { id: "INT-102", title: "B", status: "완료" },
      ],
      aiHistory: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    }
    const t = boardToTable(b)
    expect(t.headers).toEqual(["ID", "Title", "Status"])
    expect(t.rows[0]).toEqual(["INT-101", "A", "미처리"])
    expect(t.rows[1]).toEqual(["INT-102", "B", "완료"])
  })
  it("null/undefined 셀은 빈 문자열, object는 JSON.stringify", () => {
    const b: Board = {
      id: "b2",
      label: "T",
      columns: [
        { name: "id", label: "ID", type: "text" },
        { name: "votes", label: "Votes", type: "reaction" },
        { name: "note", label: "Note", type: "text" },
      ],
      rows: [
        { id: "1", votes: { positive: 3, mixed: 0, negative: 1 }, note: undefined },
      ],
      aiHistory: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    }
    const t = boardToTable(b)
    expect(t.rows[0][0]).toBe("1")
    expect(t.rows[0][1]).toBe('{"positive":3,"mixed":0,"negative":1}')
    expect(t.rows[0][2]).toBe("")
  })
  it("multiSelect 배열은 ', ' join (round-trip 호환)", () => {
    const b: Board = {
      id: "b3",
      label: "T",
      columns: [
        { name: "id", label: "ID", type: "text" },
        { name: "tags", label: "Tags", type: "multiSelect", options: ["a", "b"] },
      ],
      rows: [
        { id: "1", tags: ["a", "b"] },
        { id: "2", tags: [] },
        { id: "3", tags: ["urgent", "design", "backend"] },
        { id: "4" }, // tags 키 없음 → 빈 문자열
      ],
      aiHistory: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    }
    const t = boardToTable(b)
    expect(t.rows[0][1]).toBe("a, b")
    expect(t.rows[1][1]).toBe("")
    expect(t.rows[2][1]).toBe("urgent, design, backend")
    expect(t.rows[3][1]).toBe("")
  })
})
