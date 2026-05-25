// FlowBase V2 — lib/dashboard-recommend.ts 테스트 (D5)

import { describe, expect, it } from "vitest"
import {
  filterUnseenRecommendations,
  recommendCharts,
} from "@/lib/dashboard-recommend"
import type { ChartConfig, ColumnDef } from "@/types/flowbase"

const idCol: ColumnDef = { name: "id", label: "ID", type: "text" }
const statusCol: ColumnDef = { name: "status", label: "Status", type: "status" }
const selectCol: ColumnDef = {
  name: "dept",
  label: "Department",
  type: "select",
}
const multiCol: ColumnDef = { name: "tags", label: "Tags", type: "multiSelect" }
const priceCol: ColumnDef = { name: "price", label: "Price", type: "num" }
const scoreCol: ColumnDef = { name: "score", label: "Score", type: "num" }
const dateCol: ColumnDef = { name: "due", label: "Due date", type: "date" }

describe("recommendCharts", () => {
  it("id만 있어도 KPI Total rows 1개는 항상 추천", () => {
    const result = recommendCharts([idCol])
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].type).toBe("kpi")
    expect(result[0].aggFn).toBe("count")
    expect(result[0].title).toBe("Total rows")
  })
  it("numeric 1개 → Total + Avg KPI 추가", () => {
    const result = recommendCharts([idCol, priceCol])
    const kpis = result.filter((c) => c.type === "kpi")
    expect(kpis.length).toBe(3) // Total rows + Total Price + Avg Price
    const titles = kpis.map((k) => k.title)
    expect(titles).toContain("Total Price")
    expect(titles).toContain("Avg Price")
  })
  it("status → Bar of status", () => {
    const result = recommendCharts([idCol, statusCol])
    const bar = result.find((c) => c.type === "bar" && c.sourceCol === "status")
    expect(bar).toBeDefined()
    expect(bar?.title).toBe("Status distribution")
  })
  it("select (status 외) → Donut", () => {
    const result = recommendCharts([idCol, statusCol, selectCol])
    const donut = result.find((c) => c.type === "donut")
    expect(donut?.sourceCol).toBe("dept")
  })
  it("multiSelect → Bar usage", () => {
    const result = recommendCharts([idCol, multiCol])
    const bar = result.find(
      (c) => c.type === "bar" && c.sourceCol === "tags",
    )
    expect(bar?.title).toBe("Tags usage")
  })
  it("date → Line weekly trend", () => {
    const result = recommendCharts([idCol, dateCol])
    const line = result.find((c) => c.type === "line")
    expect(line?.sourceCol).toBe("due")
    expect(line?.timeScale).toBe("week")
  })
  it("numeric ≥ 2 → Scatter (x × y)", () => {
    const result = recommendCharts([idCol, priceCol, scoreCol])
    const scatter = result.find((c) => c.type === "scatter")
    expect(scatter?.sourceCol).toBe("price")
    expect(scatter?.valueCol).toBe("score")
  })
  it("numeric 있으면 Histogram도", () => {
    const result = recommendCharts([idCol, priceCol])
    const hist = result.find((c) => c.type === "histogram")
    expect(hist?.sourceCol).toBe("price")
  })
  it("status + select → Stacked bar", () => {
    const result = recommendCharts([idCol, statusCol, selectCol])
    const stacked = result.find((c) => c.type === "stacked-bar")
    expect(stacked?.sourceCol).toBe("status")
    expect(stacked?.groupByCol).toBe("dept")
  })
  it("full board (status + select + multi + 2 num + date)", () => {
    const cols = [idCol, statusCol, selectCol, multiCol, priceCol, scoreCol, dateCol]
    const result = recommendCharts(cols)
    const types = result.map((c) => c.type)
    expect(types).toContain("kpi")
    expect(types).toContain("bar")
    expect(types).toContain("donut")
    expect(types).toContain("line")
    expect(types).toContain("histogram")
    expect(types).toContain("scatter")
    expect(types).toContain("stacked-bar")
  })
})

describe("recommendCharts — 도메인 priority (A2)", () => {
  const customerCol: ColumnDef = { name: "customer", label: "Customer", type: "text" }
  const ticketCol: ColumnDef = { name: "ticket_id", label: "Ticket", type: "text" }
  const slaCol: ColumnDef = { name: "sla", label: "SLA hours", type: "num" }
  const deptColHR: ColumnDef = { name: "dept", label: "Department", type: "select" }
  const empCol: ColumnDef = { name: "employee", label: "Employee", type: "text" }
  const salaryCol: ColumnDef = { name: "salary", label: "Salary", type: "num" }
  const scoreCol: ColumnDef = { name: "score", label: "Performance score", type: "num" }
  const tickerCol: ColumnDef = { name: "ticker", label: "Ticker", type: "text" }
  const priceCol: ColumnDef = { name: "price", label: "Price", type: "num" }
  const yieldCol: ColumnDef = { name: "yield", label: "Yield", type: "num" }

  it("CS domain — KPI title 'Total tickets'", () => {
    const cols = [idCol, customerCol, ticketCol, statusCol, slaCol]
    const result = recommendCharts(cols)
    const totalRows = result.find((c) => c.type === "kpi" && c.aggFn === "count")
    expect(totalRows?.title).toBe("Total tickets")
    // SLA = priority numeric → Sum/Avg KPI에 사용
    const sumKpi = result.find((c) => c.type === "kpi" && c.aggFn === "sum")
    expect(sumKpi?.valueCol).toBe("sla")
  })
  it("CS — status Bar title 'Ticket flow'", () => {
    const cols = [idCol, customerCol, ticketCol, statusCol]
    const result = recommendCharts(cols)
    const bar = result.find((c) => c.type === "bar" && c.sourceCol === "status")
    expect(bar?.title).toBe("Ticket flow")
  })
  it("CS + date — Line multi-series by status", () => {
    const cols = [idCol, customerCol, ticketCol, statusCol, dateCol]
    const result = recommendCharts(cols)
    const line = result.find((c) => c.type === "line")
    expect(line?.groupByCol).toBe("status")
    expect(line?.title).toContain("Status")
  })
  it("HR domain — KPI 'Total employees' + score priority", () => {
    const cols = [idCol, empCol, deptColHR, salaryCol, scoreCol]
    const result = recommendCharts(cols)
    expect(result.find((c) => c.aggFn === "count")?.title).toBe("Total employees")
    // priority numeric = score (HR keyword)
    const sumKpi = result.find((c) => c.aggFn === "sum")
    expect(sumKpi?.valueCol).toBe("score")
  })
  it("Stock domain — line monthly + price 우선", () => {
    const cols = [
      idCol,
      tickerCol,
      priceCol,
      yieldCol,
      { name: "trade_date", label: "Trade date", type: "date" } as ColumnDef,
    ]
    const result = recommendCharts(cols)
    const line = result.find((c) => c.type === "line")
    expect(line?.title).toBe("Price over time")
    expect(line?.timeScale).toBe("month")
  })
  it("Sales domain — KPI 'Total deals' + status Bar 'Deal stage'", () => {
    const dealCol: ColumnDef = { name: "deal", label: "Deal name", type: "text" }
    const stageCol: ColumnDef = { name: "stage", label: "Stage", type: "select" }
    const cols = [idCol, dealCol, stageCol, statusCol, { name: "revenue", label: "Revenue", type: "num" } as ColumnDef]
    const result = recommendCharts(cols)
    expect(result.find((c) => c.aggFn === "count")?.title).toBe("Total deals")
    expect(
      result.find((c) => c.type === "bar" && c.sourceCol === "status")?.title,
    ).toBe("Deal stage")
  })
  it("도메인 명시 override 가능 (general 보드여도 cs로 강제)", () => {
    const result = recommendCharts([idCol, statusCol], { domain: "cs" })
    expect(result.find((c) => c.aggFn === "count")?.title).toBe("Total tickets")
  })
  it("general 도메인 (매치 ❌) → 기본 'Total rows'", () => {
    const result = recommendCharts([idCol, { name: "misc", label: "Notes", type: "text" } as ColumnDef])
    expect(result.find((c) => c.aggFn === "count")?.title).toBe("Total rows")
  })
})

describe("filterUnseenRecommendations", () => {
  it("기존 chart와 sourceCol/type/valueCol/aggFn 같은 추천은 dedupe", () => {
    const recommended = recommendCharts([idCol, statusCol, priceCol])
    const existing: ChartConfig[] = [
      {
        id: "x1",
        type: "kpi",
        title: "Total rows",
        sourceCol: "id",
        aggFn: "count",
        width: "quarter",
      },
    ]
    const filtered = filterUnseenRecommendations(recommended, existing)
    // recommended 첫 항목 (Total rows kpi count of id) 제외돼야
    expect(filtered.find((c) => c.title === "Total rows")).toBeUndefined()
    // 나머지는 유지
    expect(filtered.find((c) => c.type === "bar")).toBeDefined()
  })
  it("existing 빈 배열이면 모두 통과", () => {
    const recommended = recommendCharts([idCol, statusCol])
    expect(filterUnseenRecommendations(recommended, [])).toEqual(recommended)
  })
})
