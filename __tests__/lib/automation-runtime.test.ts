// FlowBase V2 — automation-runtime 룰 매칭/파싱 단위 테스트
// 시드 룰(AUT-001~005)이 의도한 ChangeEvent에 발화하는지 검증.

import { describe, expect, it } from "vitest"
import {
  matches,
  parseRowDetail,
} from "@/lib/automation-runtime"
import { SEED_AUTOMATIONS } from "@/lib/flowbase-workspace-seed"
import type { AutomationRule, ChangeEvent, TableRow } from "@/types/flowbase"

const ts = 1_000_000

function mkChange(
  kind: "row_added" | "row_updated",
  boardId: string,
  next: TableRow,
  prev?: TableRow,
): ChangeEvent {
  return {
    kind,
    boardId,
    rowId: next.id,
    prev,
    next,
    timestamp: ts,
  }
}

function findRule(id: string): AutomationRule {
  const r = SEED_AUTOMATIONS.find((x) => x.id === id)
  if (!r) throw new Error(`Seed rule ${id} not found`)
  return r
}

describe("automation-runtime · matches", () => {
  const interviewsLabel = "Customer Interviews"

  describe("AUT-001 — Negative interviews → urgent task", () => {
    const rule = findRule("AUT-001")

    it("fires on row_added when sentiment=Negative", () => {
      const change = mkChange("row_added", "interviews", {
        id: "INT-100",
        sentiment: "Negative",
      })
      expect(matches(rule, change, interviewsLabel)).toBe(true)
    })

    it("does NOT fire on row_added when sentiment is Positive", () => {
      const change = mkChange("row_added", "interviews", {
        id: "INT-100",
        sentiment: "Positive",
      })
      expect(matches(rule, change, interviewsLabel)).toBe(false)
    })

    it("fires on row_updated when sentiment transitions to Negative", () => {
      const change = mkChange(
        "row_updated",
        "interviews",
        { id: "INT-100", sentiment: "Negative" },
        { id: "INT-100", sentiment: "Mixed" },
      )
      expect(matches(rule, change, interviewsLabel)).toBe(true)
    })

    it("does NOT fire on sentiment unchanged Negative→Negative", () => {
      const change = mkChange(
        "row_updated",
        "interviews",
        { id: "INT-100", sentiment: "Negative" },
        { id: "INT-100", sentiment: "Negative" },
      )
      expect(matches(rule, change, interviewsLabel)).toBe(false)
    })

    it("does NOT fire on a different table", () => {
      const change = mkChange("row_added", "tasks", {
        id: "TASK-100",
        sentiment: "Negative",
      })
      expect(matches(rule, change, "Tasks")).toBe(false)
    })

    it("does NOT fire when rule is paused", () => {
      const paused: AutomationRule = { ...rule, status: "paused" }
      const change = mkChange("row_added", "interviews", {
        id: "INT-100",
        sentiment: "Negative",
      })
      expect(matches(paused, change, interviewsLabel)).toBe(false)
    })
  })

  describe("AUT-002 — Theme=Pricing → assign to sales", () => {
    const rule = findRule("AUT-002")

    it("fires when themeConfirmed transitions false→true and theme matches", () => {
      // mkChange(kind, boardId, next, prev) — next는 변경 후, prev는 변경 전
      const change = mkChange(
        "row_updated",
        "interviews",
        { id: "INT-100", theme: "Pricing pushback", themeConfirmed: true },
        { id: "INT-100", theme: "Pricing pushback", themeConfirmed: false },
      )
      expect(matches(rule, change, interviewsLabel)).toBe(true)
    })

    it("does NOT fire when theme differs", () => {
      const change = mkChange(
        "row_updated",
        "interviews",
        { id: "INT-100", theme: "Onboarding friction", themeConfirmed: true },
        { id: "INT-100", theme: "Onboarding friction", themeConfirmed: false },
      )
      expect(matches(rule, change, interviewsLabel)).toBe(false)
    })

    it("does NOT fire when confirmed was already true", () => {
      const change = mkChange(
        "row_updated",
        "interviews",
        { id: "INT-100", theme: "Pricing pushback", themeConfirmed: true },
        { id: "INT-100", theme: "Pricing pushback", themeConfirmed: true },
      )
      expect(matches(rule, change, interviewsLabel)).toBe(false)
    })
  })

  describe("table-based triggers", () => {
    it("time-based trigger (table='—') never fires on row events", () => {
      const dailySummary = findRule("AUT-003")
      const change = mkChange("row_added", "interviews", { id: "INT-100" })
      expect(matches(dailySummary, change, interviewsLabel)).toBe(false)
    })
  })
})

describe("automation-runtime · parseRowDetail", () => {
  const sourceRow: TableRow = {
    id: "INT-001",
    name: "Sarah Lim",
    company: "Northbeam",
  }

  it("parses simple key:value pairs", () => {
    const out = parseRowDetail("title: Follow up, priority: Urgent", sourceRow)
    expect(out).toEqual({ title: "Follow up", priority: "Urgent" })
  })

  it("strips surrounding quotes", () => {
    const out = parseRowDetail(
      'title: "Follow up with team", priority: High',
      sourceRow,
    )
    expect(out.title).toBe("Follow up with team")
  })

  it("substitutes {name} tokens from source row", () => {
    const out = parseRowDetail(
      'title: "Follow up with {name}"',
      sourceRow,
    )
    expect(out.title).toBe("Follow up with Sarah Lim")
  })

  it("replaces unknown tokens with empty string", () => {
    const out = parseRowDetail(
      'title: "{missing} is empty"',
      sourceRow,
    )
    expect(out.title).toBe(" is empty")
  })

  it("returns empty object for empty detail", () => {
    expect(parseRowDetail("", sourceRow)).toEqual({})
  })
})
