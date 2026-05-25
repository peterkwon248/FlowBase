// FlowBase V2 — lib/outlier.ts 테스트 (A5)

import { describe, expect, it } from "vitest"
import { computeAllOutliers, detectOutliers } from "@/lib/outlier"
import type { ColumnDef, TableRow } from "@/types/flowbase"

describe("detectOutliers", () => {
  it("정상 분포 + 1 outlier — z > 2 detect", () => {
    // mean 10, stdDev ~0이면 안 됨 → 4, 6, 8, 10, 12, 14, 16, 500
    const rows: TableRow[] = [
      { id: "1", price: 4 },
      { id: "2", price: 6 },
      { id: "3", price: 8 },
      { id: "4", price: 10 },
      { id: "5", price: 12 },
      { id: "6", price: 14 },
      { id: "7", price: 16 },
      { id: "8", price: 500 },
    ]
    const r = detectOutliers(rows, "price")
    expect(r).not.toBeNull()
    expect(r!.rowIds).toContain("8")
  })
  it("샘플 < 5 → null", () => {
    const rows: TableRow[] = [
      { id: "1", price: 1 },
      { id: "2", price: 100 },
    ]
    expect(detectOutliers(rows, "price")).toBeNull()
  })
  it("모든 값 동일 (stdDev=0) → null", () => {
    const rows: TableRow[] = [
      { id: "1", price: 10 },
      { id: "2", price: 10 },
      { id: "3", price: 10 },
      { id: "4", price: 10 },
      { id: "5", price: 10 },
    ]
    expect(detectOutliers(rows, "price")).toBeNull()
  })
  it("null/non-numeric은 skip", () => {
    // valid 7개 (id 1,4,5,6,8,9 + id 10). outlier id 10 (z > 2 보장).
    const rows: TableRow[] = [
      { id: "1", price: 5 },
      { id: "2", price: null },
      { id: "3", price: "invalid" },
      { id: "4", price: 5 },
      { id: "5", price: 5 },
      { id: "6", price: 5 },
      { id: "8", price: 5 },
      { id: "9", price: 5 },
      { id: "10", price: 100 },
    ]
    const r = detectOutliers(rows, "price")
    expect(r).not.toBeNull()
    expect(r!.rowIds).toContain("10")
  })
  it("threshold 1 (덜 엄격)이면 더 많이 잡힘", () => {
    const rows: TableRow[] = [
      { id: "1", v: 1 },
      { id: "2", v: 2 },
      { id: "3", v: 3 },
      { id: "4", v: 4 },
      { id: "5", v: 5 },
      { id: "6", v: 100 },
    ]
    const r2 = detectOutliers(rows, "v", 2)
    const r1 = detectOutliers(rows, "v", 1)
    expect(r1!.rowIds.length).toBeGreaterThanOrEqual(r2!.rowIds.length)
  })
  it("string numeric도 Number 변환 후 분석", () => {
    const rows: TableRow[] = [
      { id: "1", v: "10" },
      { id: "2", v: "12" },
      { id: "3", v: "14" },
      { id: "4", v: "16" },
      { id: "5", v: "18" },
      { id: "6", v: "1000" },
    ]
    const r = detectOutliers(rows, "v")
    expect(r!.rowIds).toContain("6")
  })
})

describe("computeAllOutliers", () => {
  it("numeric 컬럼만 검사 (text/date skip)", () => {
    const cols: ColumnDef[] = [
      { name: "id", label: "ID", type: "text" },
      { name: "price", label: "Price", type: "num" },
      { name: "title", label: "Title", type: "text" },
      { name: "date", label: "Date", type: "date" },
    ]
    const rows: TableRow[] = [
      { id: "1", price: 10, title: "x", date: "2026-01-01" },
      { id: "2", price: 12, title: "y", date: "2026-01-02" },
      { id: "3", price: 14, title: "z", date: "2026-01-03" },
      { id: "4", price: 16, title: "w", date: "2026-01-04" },
      { id: "5", price: 18, title: "v", date: "2026-01-05" },
      { id: "6", price: 999, title: "u", date: "2026-01-06" },
    ]
    const all = computeAllOutliers(cols, rows)
    expect(all.length).toBe(1)
    expect(all[0].col).toBe("price")
  })
  it("outlier 0개 컬럼은 결과에 ❌", () => {
    const cols: ColumnDef[] = [{ name: "v", label: "V", type: "num" }]
    const rows: TableRow[] = [
      { id: "1", v: 10 },
      { id: "2", v: 11 },
      { id: "3", v: 12 },
      { id: "4", v: 13 },
      { id: "5", v: 14 },
    ]
    expect(computeAllOutliers(cols, rows)).toEqual([])
  })
})
