// FlowBase V2 — lib/line-diff.ts 테스트 (LCS 기반 line diff)

import { describe, expect, it } from "vitest"
import { diffLines, type DiffLine } from "@/lib/line-diff"

function kinds(d: DiffLine[]): string {
  return d
    .map((l) =>
      l.kind === "same" ? "=" : l.kind === "added" ? "+" : "-",
    )
    .join("")
}

describe("diffLines", () => {
  it("동일 텍스트는 모두 same", () => {
    const d = diffLines("a\nb\nc", "a\nb\nc")
    expect(kinds(d)).toBe("===")
    expect(d.every((l) => l.kind === "same")).toBe(true)
  })

  it("중간 라인 삽입 — 삽입된 라인만 added, 나머지 same", () => {
    const d = diffLines("a\nc", "a\nb\nc")
    expect(kinds(d)).toBe("=+=")
    expect(d[1]).toEqual({ kind: "added", text: "b" })
  })

  it("중간 라인 삭제 — 삭제된 라인만 removed, 나머지 same", () => {
    const d = diffLines("a\nb\nc", "a\nc")
    expect(kinds(d)).toBe("=-=")
    expect(d[1]).toEqual({ kind: "removed", text: "b" })
  })

  it("맨 앞 라인 삽입은 이후 라인을 어긋나게 하지 않음 (naive 결함 회귀)", () => {
    // naive 위치 비교라면 모든 라인이 removed+added 로 잡혔을 케이스
    const d = diffLines("a\nb\nc", "x\na\nb\nc")
    expect(kinds(d)).toBe("+===")
    expect(d[0]).toEqual({ kind: "added", text: "x" })
    expect(d.filter((l) => l.kind === "same")).toHaveLength(3)
  })

  it("라인 치환 — removed 후 added", () => {
    const d = diffLines("a\nb\nc", "a\nB\nc")
    expect(d.filter((l) => l.kind === "same")).toHaveLength(2)
    expect(d.some((l) => l.kind === "removed" && l.text === "b")).toBe(true)
    expect(d.some((l) => l.kind === "added" && l.text === "B")).toBe(true)
  })

  it("prev 빈 문자열 → 모두 added (단, 빈 한 줄 표현 주의)", () => {
    const d = diffLines("", "a\nb")
    // "".split("\n") === [""] → 빈 라인 1개가 다르면 removed+added 가 될 수 있으므로
    // added 가 최소 2개(a, b) 존재하는지 확인
    expect(d.filter((l) => l.kind === "added").map((l) => l.text)).toEqual([
      "a",
      "b",
    ])
  })

  it("next 빈 문자열 → 모두 removed", () => {
    const d = diffLines("a\nb", "")
    expect(d.filter((l) => l.kind === "removed").map((l) => l.text)).toEqual([
      "a",
      "b",
    ])
  })

  it("둘 다 빈 문자열 → 단일 same", () => {
    const d = diffLines("", "")
    expect(d).toEqual([{ kind: "same", text: "" }])
  })

  it("전면 교체 — 공통 라인 없음", () => {
    const d = diffLines("a\nb", "x\ny")
    expect(d.some((l) => l.kind === "same")).toBe(false)
    expect(d.filter((l) => l.kind === "removed")).toHaveLength(2)
    expect(d.filter((l) => l.kind === "added")).toHaveLength(2)
  })

  it("순서는 prev/next 를 모두 복원할 수 있어야 함", () => {
    const prev = "intro\nalpha\nbeta\ngamma\nend"
    const next = "intro\nbeta\ngamma\ndelta\nend"
    const d = diffLines(prev, next)
    // removed+same 를 이으면 prev, added+same 를 이으면 next
    const reconstructedPrev = d
      .filter((l) => l.kind !== "added")
      .map((l) => l.text)
      .join("\n")
    const reconstructedNext = d
      .filter((l) => l.kind !== "removed")
      .map((l) => l.text)
      .join("\n")
    expect(reconstructedPrev).toBe(prev)
    expect(reconstructedNext).toBe(next)
  })
})
