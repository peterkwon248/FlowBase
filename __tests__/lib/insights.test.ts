// FlowBase V2 — lib/insights.ts 테스트 (A4)

import { describe, expect, it } from "vitest"
import { computeInsights } from "@/lib/insights"
import type { ColumnDef, TableRow } from "@/types/flowbase"

const dateCol: ColumnDef = { name: "due", label: "Due", type: "date" }
const statusCol: ColumnDef = { name: "status", label: "Status", type: "status" }
const selectCol: ColumnDef = { name: "dept", label: "Dept", type: "select" }
const multiCol: ColumnDef = { name: "tags", label: "Tags", type: "multiSelect" }

// 14일치 가짜 row — current week 5개, previous week 3개
const today = new Date()
const dayStr = (offsetDays: number) =>
  new Date(today.getTime() - offsetDays * 86_400_000).toISOString().slice(0, 10)

const rows: TableRow[] = [
  // current week (last 7 days)
  { id: "1", due: dayStr(0), status: "미처리" },
  { id: "2", due: dayStr(1), status: "미처리" },
  { id: "3", due: dayStr(2), status: "진행중" },
  { id: "4", due: dayStr(5), status: "완료" },
  { id: "5", due: dayStr(6), status: "완료" },
  // previous week (7~14 days ago)
  { id: "6", due: dayStr(8), status: "미처리" },
  { id: "7", due: dayStr(10), status: "완료" },
  { id: "8", due: dayStr(13), status: "완료" },
]

describe("computeInsights", () => {
  it("date 있으면 period_change 생성 (지난 주 대비)", () => {
    const result = computeInsights([dateCol, statusCol], rows)
    const periodChange = result.find((i) => i.kind === "period_change")
    expect(periodChange).toBeDefined()
    if (periodChange?.kind === "period_change") {
      expect(periodChange.current).toBe(5)
      expect(periodChange.previous).toBe(3)
      expect(periodChange.deltaPct).toBeCloseTo(((5 - 3) / 3) * 100, 1)
      expect(periodChange.tone).toBe("positive")
    }
  })
  it("status 컬럼 → top_categories", () => {
    const result = computeInsights([dateCol, statusCol], rows)
    const top = result.find((i) => i.kind === "top_categories")
    expect(top).toBeDefined()
    if (top?.kind === "top_categories") {
      expect(top.items.length).toBeLessThanOrEqual(3)
      // 완료 가장 많음 (4) → 첫
      expect(top.items[0].name).toBe("완료")
      expect(top.items[0].count).toBe(4)
    }
  })
  it("status 없으면 select fallback", () => {
    const noStatusRows: TableRow[] = [
      { id: "1", dept: "Sales" },
      { id: "2", dept: "Sales" },
      { id: "3", dept: "Eng" },
    ]
    const result = computeInsights([selectCol], noStatusRows)
    const top = result.find((i) => i.kind === "top_categories")
    if (top?.kind === "top_categories") {
      expect(top.items[0].name).toBe("Sales")
      expect(top.items[0].count).toBe(2)
    }
  })
  it("multiSelect cell — 배열 unpack 카운트", () => {
    const tagRows: TableRow[] = [
      { id: "1", tags: ["urgent", "design"] },
      { id: "2", tags: ["urgent"] },
      { id: "3", tags: ["design"] },
    ]
    const result = computeInsights([multiCol], tagRows)
    const top = result.find((i) => i.kind === "top_categories")
    if (top?.kind === "top_categories") {
      // urgent 2, design 2
      expect(top.items[0].count).toBe(2)
    }
  })
  it("date/categorical 둘 다 없음 → 빈 배열", () => {
    const result = computeInsights(
      [{ name: "name", label: "Name", type: "text" }],
      [{ id: "1", name: "A" }],
    )
    expect(result).toEqual([])
  })
  it("rows 빈 → 빈 배열", () => {
    expect(computeInsights([dateCol, statusCol], [])).toEqual([])
  })
  it("최대 4개 — INSIGHTS_MAX cap", () => {
    const result = computeInsights([dateCol, statusCol], rows)
    expect(result.length).toBeLessThanOrEqual(4)
  })
  it("previous=0 + current>0 → deltaPct = 100 (∞ 회피)", () => {
    const onlyCurrent: TableRow[] = [
      { id: "1", due: dayStr(0) },
      { id: "2", due: dayStr(3) },
    ]
    const result = computeInsights([dateCol], onlyCurrent)
    const pc = result.find((i) => i.kind === "period_change")
    if (pc?.kind === "period_change") {
      expect(pc.deltaPct).toBe(100)
      expect(pc.tone).toBe("positive")
    }
  })
})
