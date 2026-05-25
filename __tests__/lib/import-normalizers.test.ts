// FlowBase V2 — lib/import-normalizers.ts 테스트 (Im-3)

import { describe, expect, it } from "vitest"
import {
  detectImportSource,
  inferColumnTypeByHeader,
  mapStatus,
  normalizeImportHeaders,
  IMPORT_SOURCE_LABELS,
} from "@/lib/import-normalizers"

describe("detectImportSource", () => {
  it("Notion 마커(`Created time` lowercase)로 notion 추정", () => {
    expect(
      detectImportSource(["Name", "Tags", "Status", "Created time"]),
    ).toBe("notion")
  })
  it("Airtable 마커(`Created Time` titlecase)로 airtable 추정", () => {
    expect(
      detectImportSource(["Name", "Tags", "Status", "Created Time"]),
    ).toBe("airtable")
  })
  it("Last edited time / Last edited by도 Notion 추정", () => {
    expect(detectImportSource(["Title", "Last edited time"])).toBe("notion")
    expect(detectImportSource(["Title", "Last edited by"])).toBe("notion")
  })
  it("Last Modified Time / Last Modified By도 Airtable 추정", () => {
    expect(detectImportSource(["Title", "Last Modified Time"])).toBe("airtable")
    expect(detectImportSource(["Title", "Last Modified By"])).toBe("airtable")
  })
  it("마커 ❌ → generic", () => {
    expect(detectImportSource(["id", "name", "company", "date"])).toBe(
      "generic",
    )
  })
  it("Notion + Airtable 마커 동시 → Notion 우선 (case 차이로 충돌 ❌이긴 함)", () => {
    expect(
      detectImportSource(["Created time", "Last Modified Time"]),
    ).toBe("notion")
  })
})

describe("normalizeImportHeaders", () => {
  it("Notion 시스템 헤더 → 표준 라벨", () => {
    const out = normalizeImportHeaders(
      ["Name", "Created time", "Last edited time", "Status"],
      "notion",
    )
    expect(out).toEqual(["Name", "Created at", "Updated at", "Status"])
  })
  it("Airtable 시스템 헤더 → 표준 라벨", () => {
    const out = normalizeImportHeaders(
      ["Name", "Created Time", "Last Modified Time"],
      "airtable",
    )
    expect(out).toEqual(["Name", "Created at", "Updated at"])
  })
  it("매칭 ❌ 헤더는 원본 유지", () => {
    const out = normalizeImportHeaders(
      ["Custom field", "Created time"],
      "notion",
    )
    expect(out).toEqual(["Custom field", "Created at"])
  })
  it("source=generic → 모든 헤더 그대로 (copy 반환)", () => {
    const input = ["a", "b", "c"]
    const out = normalizeImportHeaders(input, "generic")
    expect(out).toEqual(input)
    expect(out).not.toBe(input) // 새 배열
  })
})

describe("IMPORT_SOURCE_LABELS", () => {
  it("UI 표시용 라벨", () => {
    expect(IMPORT_SOURCE_LABELS.notion).toBe("Notion")
    expect(IMPORT_SOURCE_LABELS.airtable).toBe("Airtable")
    expect(IMPORT_SOURCE_LABELS.generic).toBe("Generic CSV")
  })
})

describe("mapStatus", () => {
  it("완료 매핑 — done/complete/finish/closed/cancel 다양 표현", () => {
    expect(mapStatus("Done")).toBe("완료")
    expect(mapStatus("done")).toBe("완료")
    expect(mapStatus("Complete")).toBe("완료")
    expect(mapStatus("Completed")).toBe("완료")
    expect(mapStatus("Finished")).toBe("완료")
    expect(mapStatus("Closed")).toBe("완료")
    expect(mapStatus("Cancelled")).toBe("완료")
    expect(mapStatus("Canceled")).toBe("완료")
    expect(mapStatus("완료")).toBe("완료") // 한국어 직접
  })
  it("진행중 매핑 — progress/doing/active/wip", () => {
    expect(mapStatus("In progress")).toBe("진행중")
    expect(mapStatus("In Progress")).toBe("진행중")
    expect(mapStatus("Doing")).toBe("진행중")
    expect(mapStatus("Active")).toBe("진행중")
    expect(mapStatus("WIP")).toBe("진행중")
    expect(mapStatus("진행")).toBe("진행중")
  })
  it("대기 매핑 — wait/hold/block/review/paus", () => {
    expect(mapStatus("Waiting")).toBe("대기")
    expect(mapStatus("On hold")).toBe("대기")
    expect(mapStatus("Blocked")).toBe("대기")
    expect(mapStatus("In review")).toBe("대기")
    expect(mapStatus("Paused")).toBe("대기")
    expect(mapStatus("대기")).toBe("대기")
  })
  it("fallback 미처리 — todo/backlog/new/open/not started", () => {
    expect(mapStatus("To do")).toBe("미처리")
    expect(mapStatus("Todo")).toBe("미처리")
    expect(mapStatus("Not started")).toBe("미처리")
    expect(mapStatus("Backlog")).toBe("미처리")
    expect(mapStatus("New")).toBe("미처리")
    expect(mapStatus("Open")).toBe("미처리")
    expect(mapStatus("")).toBe("미처리")
    expect(mapStatus("Unknown random text")).toBe("미처리")
  })
})

describe("inferColumnTypeByHeader", () => {
  it("date 헤더 패턴 — 정확 매치", () => {
    expect(inferColumnTypeByHeader("Created at")).toBe("date")
    expect(inferColumnTypeByHeader("Updated at")).toBe("date")
    expect(inferColumnTypeByHeader("Due date")).toBe("date")
    expect(inferColumnTypeByHeader("Start date")).toBe("date")
    expect(inferColumnTypeByHeader("Last edited time")).toBe("date")
  })
  it("status 헤더 — 정확 매치 + 키워드 매치", () => {
    expect(inferColumnTypeByHeader("Status")).toBe("status")
    expect(inferColumnTypeByHeader("State")).toBe("status")
    expect(inferColumnTypeByHeader("Project Status")).toBe("status") // 키워드 포함
  })
  it("avatar 헤더 — Person/Assignee/Created by 등", () => {
    expect(inferColumnTypeByHeader("Person")).toBe("avatar")
    expect(inferColumnTypeByHeader("Assigned to")).toBe("avatar")
    expect(inferColumnTypeByHeader("Created by")).toBe("avatar")
    expect(inferColumnTypeByHeader("Owner")).toBe("avatar")
    expect(inferColumnTypeByHeader("Author")).toBe("avatar")
  })
  it("email 헤더", () => {
    expect(inferColumnTypeByHeader("Email")).toBe("email")
    expect(inferColumnTypeByHeader("Contact email")).toBe("email")
  })
  it("num 헤더", () => {
    expect(inferColumnTypeByHeader("Count")).toBe("num")
    expect(inferColumnTypeByHeader("Price")).toBe("num")
    expect(inferColumnTypeByHeader("Score")).toBe("num")
  })
  it("case-insensitive 매치", () => {
    expect(inferColumnTypeByHeader("STATUS")).toBe("status")
    expect(inferColumnTypeByHeader("created at")).toBe("date")
    expect(inferColumnTypeByHeader("  Status  ")).toBe("status") // trim
  })
  it("매칭 ❌ → null (caller가 sample inferType으로 fallback)", () => {
    expect(inferColumnTypeByHeader("Custom field")).toBe(null)
    expect(inferColumnTypeByHeader("Notes")).toBe(null)
    expect(inferColumnTypeByHeader("Quote")).toBe(null)
    expect(inferColumnTypeByHeader("")).toBe(null)
  })
  it("multiSelect 헤더 — Tags/Categories/Labels/Multi-select", () => {
    expect(inferColumnTypeByHeader("Tags")).toBe("multiSelect")
    expect(inferColumnTypeByHeader("Categories")).toBe("multiSelect")
    expect(inferColumnTypeByHeader("Labels")).toBe("multiSelect")
    expect(inferColumnTypeByHeader("Multi-select")).toBe("multiSelect")
    expect(inferColumnTypeByHeader("multiselect")).toBe("multiSelect")
  })
  it("Status 격리 LOCK — 'Status'는 다른 헤더와 충돌 ❌, multiSelect 추론 ❌", () => {
    // 'Status' 자체는 status, 다른 매핑 흡수 ❌
    expect(inferColumnTypeByHeader("Status")).toBe("status")
    expect(inferColumnTypeByHeader("Workflow status")).toBe("status")
    // status 키워드가 'tags' 등 multiSelect 헤더보다 우선 (HEADER_TYPE_EXACT 별)
    expect(inferColumnTypeByHeader("Tag status")).toBe("status") // 키워드 "status" hit
  })
})
