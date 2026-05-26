// FlowBase V2 — lib/formula/cycles 테스트 (G7-C C-F5)

import { describe, expect, it } from "vitest"
import { detectCycle, wouldCreateCycle } from "@/lib/formula/cycles"
import type { ColumnDef } from "@/types/flowbase"

function formula(name: string, deps: string[]): ColumnDef {
  return {
    name,
    label: name,
    type: "formula",
    formula: deps.map((d) => `prop("${d}")`).join(" + "),
    formulaDeps: deps,
    formulaResultType: "text",
  }
}

function text(name: string): ColumnDef {
  return { name, label: name, type: "text" }
}

describe("detectCycle", () => {
  it("순환 없음 → null", () => {
    const cols: ColumnDef[] = [
      text("a"),
      text("b"),
      formula("c", ["a", "b"]),
    ]
    expect(detectCycle(cols)).toBeNull()
  })

  it("자가 참조 (A → A) → cycle", () => {
    const cols: ColumnDef[] = [formula("a", ["a"])]
    const r = detectCycle(cols)
    expect(r).not.toBeNull()
    expect(r!.cycle).toEqual(["a", "a"])
  })

  it("간단 순환 (A → B → A) → cycle", () => {
    const cols: ColumnDef[] = [formula("a", ["b"]), formula("b", ["a"])]
    const r = detectCycle(cols)
    expect(r).not.toBeNull()
    expect(r!.cycle).toContain("a")
    expect(r!.cycle).toContain("b")
  })

  it("긴 chain (A → B → C → D) → null", () => {
    const cols: ColumnDef[] = [
      formula("a", ["b"]),
      formula("b", ["c"]),
      formula("c", ["d"]),
      text("d"),
    ]
    expect(detectCycle(cols)).toBeNull()
  })

  it("긴 cycle (A → B → C → A) → cycle", () => {
    const cols: ColumnDef[] = [
      formula("a", ["b"]),
      formula("b", ["c"]),
      formula("c", ["a"]),
    ]
    const r = detectCycle(cols)
    expect(r).not.toBeNull()
    expect(r!.cycle.length).toBeGreaterThanOrEqual(4)
  })

  it("non-formula 컬럼 dep은 cycle 아님", () => {
    // A: formula 참조 text col "x" — text col은 leaf, cycle 불가
    const cols: ColumnDef[] = [text("x"), formula("a", ["x"])]
    expect(detectCycle(cols)).toBeNull()
  })

  it("다중 component — 한 곳에 cycle이면 발견", () => {
    const cols: ColumnDef[] = [
      // component 1: 정상
      text("u"),
      formula("v", ["u"]),
      // component 2: cycle
      formula("a", ["b"]),
      formula("b", ["a"]),
    ]
    expect(detectCycle(cols)).not.toBeNull()
  })

  it("formulaDeps 비어있는 컬럼 → cycle 없음", () => {
    const cols: ColumnDef[] = [formula("a", []), formula("b", [])]
    expect(detectCycle(cols)).toBeNull()
  })

  it("formula 컬럼 0개 → null", () => {
    expect(detectCycle([text("a"), text("b")])).toBeNull()
  })
})

describe("wouldCreateCycle", () => {
  const baseCols: ColumnDef[] = [
    text("name"),
    formula("greeting", ["name"]),
  ]

  it("add 새 formula — cycle 아님", () => {
    const r = wouldCreateCycle(baseCols, {
      kind: "add",
      col: formula("upper_greeting", ["greeting"]),
    })
    expect(r).toBeNull()
  })

  it("add 새 formula — 기존 formula와 cycle 형성", () => {
    // 기존 greeting depends on name. 새 col이 greeting depends on
    // newCol AND newCol depends on greeting → cycle
    // 직접 add는 newCol → greeting. cycle 아님.
    // 단 기존 greeting의 deps에 newCol 추가하면 cycle. 시뮬레이션:
    const cols: ColumnDef[] = [
      text("name"),
      formula("greeting", ["upper_greeting"]), // 가짜로 deps 만들기
    ]
    const r = wouldCreateCycle(cols, {
      kind: "add",
      col: formula("upper_greeting", ["greeting"]),
    })
    expect(r).not.toBeNull()
  })

  it("update — formula 변경 후 cycle", () => {
    // greeting.formulaDeps를 [self_ref]로 변경 → cycle
    const r = wouldCreateCycle(baseCols, {
      kind: "update",
      name: "greeting",
      patch: { formulaDeps: ["greeting"] },
    })
    expect(r).not.toBeNull()
  })

  it("update — 정상 변경 → null", () => {
    const r = wouldCreateCycle(baseCols, {
      kind: "update",
      name: "greeting",
      patch: { formulaDeps: ["name"] },
    })
    expect(r).toBeNull()
  })
})
