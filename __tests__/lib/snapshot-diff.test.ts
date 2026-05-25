// FlowBase V2 — lib/snapshot-diff.ts 테스트

import { describe, expect, it } from "vitest"
import { diffSnapshotStates, summarizeDiff } from "@/lib/snapshot-diff"
import type { SnapshotState } from "@/types/flowbase"

function makeState(over: Partial<SnapshotState> = {}): SnapshotState {
  const base: SnapshotState = {
    boards: {},
    library: {
      optionLists: [],
      fields: [],
      templates: [],
      functions: [],
      dashboards: [],
    },
    wikiPages: [],
    automations: [],
    suggestedAutomations: [],
    trashedBoards: [],
    trashedRows: [],
    trashedWikiPages: [],
    settings: {
      workspaceLabel: "test",
      workspaceInitial: "T",
      members: [],
    },
    schemaPositions: {},
    viewSettings: {},
  }
  return { ...base, ...over }
}

function makeBoard(id: string, rows: { id: string; v?: string }[] = []) {
  return {
    id,
    label: `Board ${id}`,
    columns: [{ name: "id", label: "ID", type: "text" as const }],
    rows: rows.map((r) => ({ id: r.id, v: r.v ?? "" })),
    aiHistory: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  }
}

describe("diffSnapshotStates", () => {
  it("동일 state → identical=true", () => {
    const s = makeState({ boards: { b1: makeBoard("b1", [{ id: "r1" }]) } })
    const d = diffSnapshotStates(s, s)
    expect(d.identical).toBe(true)
    expect(d.boards.unchanged).toContain("b1")
  })

  it("board 추가/삭제/수정 detect", () => {
    const a = makeState({
      boards: {
        b1: makeBoard("b1", [{ id: "r1", v: "old" }]),
        b2: makeBoard("b2"),
      },
    })
    const b = makeState({
      boards: {
        b1: makeBoard("b1", [{ id: "r1", v: "new" }]),
        b3: makeBoard("b3"),
      },
    })
    const d = diffSnapshotStates(a, b)
    expect(d.boards.added).toContain("b2")
    expect(d.boards.removed).toContain("b3")
    expect(d.boards.modified).toContain("b1")
    expect(d.identical).toBe(false)
  })

  it("modified board의 row 단위 sub stats", () => {
    const a = makeState({
      boards: {
        b1: makeBoard("b1", [
          { id: "r1", v: "A" },
          { id: "r2", v: "A" },
          { id: "r3", v: "A" },
        ]),
      },
    })
    const b = makeState({
      boards: {
        b1: makeBoard("b1", [
          { id: "r1", v: "A" },
          { id: "r2", v: "B" },
          { id: "r4", v: "A" },
        ]),
      },
    })
    const d = diffSnapshotStates(a, b)
    expect(d.boards.modified).toContain("b1")
    const mod = d.boardModifications.find((m) => m.boardId === "b1")
    expect(mod).toBeDefined()
    expect(mod?.rowsAdded).toBe(1)
    expect(mod?.rowsRemoved).toBe(1)
    expect(mod?.rowsModified).toBe(1)
  })

  it("wiki + automations 변경 detect", () => {
    const a = makeState({
      wikiPages: [
        {
          id: "w1",
          title: "A",
          category: "C",
          owner: "o",
          verified: true,
          verifiedAt: null,
          expiresAt: null,
          updatedAt: "2026-01-01",
          body: "old body",
        },
      ],
      automations: [
        {
          id: "auto1",
          name: "Test",
          when: { event: "x", value: "y" },
          then: [],
          status: "active",
          runsThisWeek: 0,
          lastRun: "never",
        },
      ],
    })
    const b = makeState({
      wikiPages: [
        {
          id: "w1",
          title: "A",
          category: "C",
          owner: "o",
          verified: true,
          verifiedAt: null,
          expiresAt: null,
          updatedAt: "2026-01-02",
          body: "new body",
        },
      ],
      automations: [],
    })
    const d = diffSnapshotStates(a, b)
    expect(d.wikiPages.modified).toContain("w1")
    expect(d.automations.added).toContain("auto1")
  })

  it("settings 변경 → settingsChanged=true", () => {
    const a = makeState({
      settings: { workspaceLabel: "A", workspaceInitial: "A", members: [] },
    })
    const b = makeState({
      settings: { workspaceLabel: "B", workspaceInitial: "B", members: [] },
    })
    const d = diffSnapshotStates(a, b)
    expect(d.settingsChanged).toBe(true)
    expect(d.identical).toBe(false)
  })
})

describe("summarizeDiff", () => {
  it("identical 시 'No changes' 메시지", () => {
    const s = makeState()
    expect(summarizeDiff(diffSnapshotStates(s, s))).toBe(
      "No changes — identical to current state.",
    )
  })

  it("복합 카테고리 — 'X boards, Y rows, Z wiki pages...' 요약", () => {
    const a = makeState({
      boards: {
        b1: makeBoard("b1", [{ id: "r1", v: "X" }, { id: "r2", v: "X" }]),
        b2: makeBoard("b2"),
      },
      wikiPages: [
        {
          id: "w1",
          title: "T",
          category: "C",
          owner: "o",
          verified: false,
          verifiedAt: null,
          expiresAt: null,
          updatedAt: "2026-01-01",
          body: "A",
        },
      ],
    })
    const b = makeState({
      boards: {
        b1: makeBoard("b1", [{ id: "r1", v: "Y" }]),
      },
    })
    const d = diffSnapshotStates(a, b)
    const sum = summarizeDiff(d)
    expect(sum).toMatch(/board/)
    expect(sum).toMatch(/row/)
    expect(sum).toMatch(/wiki page/)
  })
})
