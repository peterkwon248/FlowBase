// FlowBase V2 — lib/chart-aggregate.ts 테스트 (D1 — Aggregate functions)

import { describe, expect, it } from "vitest"
import { aggregateBy, aggLabel, AGG_FN_LABELS } from "@/lib/chart-aggregate"
import type { TableRow } from "@/types/flowbase"

const rows: TableRow[] = [
  { id: "1", status: "미처리", price: 100, dept: "Sales" },
  { id: "2", status: "미처리", price: 200, dept: "Sales" },
  { id: "3", status: "진행중", price: 300, dept: "Eng" },
  { id: "4", status: "완료", price: 400, dept: "Eng" },
  { id: "5", status: "완료", price: 500, dept: "Eng" },
  { id: "6", status: "완료", price: null, dept: "Eng" }, // price null → 통계 제외
]

describe("aggregateBy — 단일 결과 (groupCol=null, KPI 용)", () => {
  it("count = row 수 (valueCol 무관)", () => {
    expect(aggregateBy(rows, null, "count")).toEqual([
      { label: "total", value: 6, count: 6 },
    ])
  })
  it("sum = valueCol 합 (null skip)", () => {
    const r = aggregateBy(rows, null, "sum", "price")[0]
    expect(r.value).toBe(100 + 200 + 300 + 400 + 500)
  })
  it("avg = valueCol 평균 (null skip → 분모 5)", () => {
    const r = aggregateBy(rows, null, "avg", "price")[0]
    expect(r.value).toBe((100 + 200 + 300 + 400 + 500) / 5)
  })
  it("min/max = valueCol 최소/최대 (null skip)", () => {
    expect(aggregateBy(rows, null, "min", "price")[0].value).toBe(100)
    expect(aggregateBy(rows, null, "max", "price")[0].value).toBe(500)
  })
  it("median = valueCol 중앙값 (홀수 5개 → 가운데 = 300)", () => {
    expect(aggregateBy(rows, null, "median", "price")[0].value).toBe(300)
  })
  it("median 짝수 (4개 → 두 가운데 평균)", () => {
    const r = aggregateBy(rows.slice(0, 4), null, "median", "price")[0]
    expect(r.value).toBe((200 + 300) / 2)
  })
  it("string numeric도 Number 변환", () => {
    const stringRows: TableRow[] = [
      { id: "1", price: "100" },
      { id: "2", price: "200" },
    ]
    expect(aggregateBy(stringRows, null, "sum", "price")[0].value).toBe(300)
  })
  it("valueCol 미설정 + aggFn !== count → value 0", () => {
    expect(aggregateBy(rows, null, "sum")[0].value).toBe(0)
  })
})

describe("aggregateBy — 그룹 (Bar/Donut 용)", () => {
  it("groupCol=status + count → 그룹별 row 수", () => {
    const result = aggregateBy(rows, "status", "count")
    const map = Object.fromEntries(result.map((r) => [r.label, r.value]))
    expect(map["미처리"]).toBe(2)
    expect(map["진행중"]).toBe(1)
    expect(map["완료"]).toBe(3)
  })
  it("groupCol=status + sum of price → null skip", () => {
    const result = aggregateBy(rows, "status", "sum", "price")
    const map = Object.fromEntries(result.map((r) => [r.label, r.value]))
    expect(map["미처리"]).toBe(300) // 100+200
    expect(map["진행중"]).toBe(300)
    expect(map["완료"]).toBe(900) // 400+500 (null skip)
  })
  it("groupCol + avg → 그룹별 평균", () => {
    const result = aggregateBy(rows, "status", "avg", "price")
    const map = Object.fromEntries(result.map((r) => [r.label, r.value]))
    expect(map["미처리"]).toBe(150) // (100+200)/2
    expect(map["완료"]).toBe(450) // (400+500)/2 — null skip → 분모 2
  })
  it("정렬 = value desc", () => {
    const result = aggregateBy(rows, "status", "count")
    expect(result[0].value).toBeGreaterThanOrEqual(result[result.length - 1].value)
  })
  it("빈 그룹 cell (null/공백)은 skip", () => {
    const rs: TableRow[] = [
      { id: "1", dept: "A" },
      { id: "2", dept: "" },
      { id: "3", dept: null },
      { id: "4", dept: "A" },
    ]
    const result = aggregateBy(rs, "dept", "count")
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("A")
    expect(result[0].value).toBe(2)
  })
  it("multiSelect cell — 배열 unpack해서 각 값에 row 카운트 (Notion 패턴)", () => {
    const rs: TableRow[] = [
      { id: "1", tags: ["urgent", "design"], price: 100 },
      { id: "2", tags: ["urgent"], price: 200 },
      { id: "3", tags: ["design"], price: 300 },
    ]
    const result = aggregateBy(rs, "tags", "count")
    const map = Object.fromEntries(result.map((r) => [r.label, r.value]))
    expect(map["urgent"]).toBe(2) // row 1, 2
    expect(map["design"]).toBe(2) // row 1, 3
    // 합계가 rows.length(3) 초과 가능 — design + urgent = 4
  })
  it("multiSelect + sum — 같은 row 값이 여러 그룹에 분배", () => {
    const rs: TableRow[] = [
      { id: "1", tags: ["a", "b"], price: 100 },
      { id: "2", tags: ["a"], price: 50 },
    ]
    const result = aggregateBy(rs, "tags", "sum", "price")
    const map = Object.fromEntries(result.map((r) => [r.label, r.value]))
    expect(map["a"]).toBe(150) // row 1(100) + row 2(50)
    expect(map["b"]).toBe(100) // row 1만
  })
})

describe("aggLabel / AGG_FN_LABELS", () => {
  it("count → 'Count'", () => {
    expect(aggLabel("count")).toBe("Count")
  })
  it("sum + valueCol → 'Sum of price'", () => {
    expect(aggLabel("sum", "price")).toBe("Sum of price")
  })
  it("avg without valueCol → 'Avg'", () => {
    expect(aggLabel("avg")).toBe("Avg")
  })
  it("AGG_FN_LABELS 전체 매핑", () => {
    expect(AGG_FN_LABELS.count).toBe("Count")
    expect(AGG_FN_LABELS.sum).toBe("Sum")
    expect(AGG_FN_LABELS.avg).toBe("Average")
    expect(AGG_FN_LABELS.min).toBe("Min")
    expect(AGG_FN_LABELS.max).toBe("Max")
    expect(AGG_FN_LABELS.median).toBe("Median")
  })
})
