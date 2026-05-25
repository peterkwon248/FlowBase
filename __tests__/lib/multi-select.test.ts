// FlowBase V2 — lib/multi-select.ts 테스트 (Multi-select column type Phase C1)

import { describe, expect, it } from "vitest"
import {
  coerceMultiValue,
  joinMultiValue,
  multiFirst,
  multiIncludes,
  multiToSingle,
  singleToMulti,
  splitMultiValue,
} from "@/lib/multi-select"

describe("coerceMultiValue", () => {
  it("null/undefined → 빈 배열", () => {
    expect(coerceMultiValue(null)).toEqual([])
    expect(coerceMultiValue(undefined)).toEqual([])
  })
  it("string[] 그대로 trim + 빈값 제거", () => {
    expect(coerceMultiValue(["a", " b ", "", "c"])).toEqual(["a", "b", "c"])
  })
  it("string 콤마/세미콜론/파이프 split", () => {
    expect(coerceMultiValue("a, b, c")).toEqual(["a", "b", "c"])
    expect(coerceMultiValue("a;b;c")).toEqual(["a", "b", "c"])
    expect(coerceMultiValue("a|b|c")).toEqual(["a", "b", "c"])
    expect(coerceMultiValue("a, b; c | d")).toEqual(["a", "b", "c", "d"])
  })
  it("dedupe=true면 중복 제거 (순서 유지)", () => {
    expect(coerceMultiValue("a, b, a, c", true)).toEqual(["a", "b", "c"])
    expect(coerceMultiValue(["x", "y", "x"], true)).toEqual(["x", "y"])
  })
  it("number → 단일 원소 배열 (String 변환)", () => {
    expect(coerceMultiValue(42)).toEqual(["42"])
  })
  it("배열 안에 빈 문자열/null/공백 섞여있어도 제거", () => {
    expect(coerceMultiValue(["a", "", null as unknown as string, "  ", "b"])).toEqual(
      ["a", "b"],
    )
  })
})

describe("splitMultiValue (alias of coerceMultiValue with dedupe)", () => {
  it("CSV cell 표준 케이스", () => {
    expect(splitMultiValue("urgent, design, backend")).toEqual([
      "urgent",
      "design",
      "backend",
    ])
  })
  it("중복은 제거", () => {
    expect(splitMultiValue("a, b, a")).toEqual(["a", "b"])
  })
  it("빈 문자열 → []", () => {
    expect(splitMultiValue("")).toEqual([])
  })
})

describe("joinMultiValue", () => {
  it("string[] → 콤마+공백 join", () => {
    expect(joinMultiValue(["a", "b", "c"])).toBe("a, b, c")
  })
  it("빈 배열 → 빈 문자열", () => {
    expect(joinMultiValue([])).toBe("")
  })
  it("round-trip (split → join → split)", () => {
    const s = "tag1, tag2, tag3"
    expect(joinMultiValue(splitMultiValue(s))).toBe(s)
  })
})

describe("multiIncludes", () => {
  it("array cell ANY-match", () => {
    expect(multiIncludes(["urgent", "design"], "design")).toBe(true)
    expect(multiIncludes(["urgent", "design"], "qa")).toBe(false)
  })
  it("string cell도 split해서 match (legacy single value migration)", () => {
    expect(multiIncludes("urgent, design", "design")).toBe(true)
  })
  it("null/undefined → false", () => {
    expect(multiIncludes(null, "x")).toBe(false)
    expect(multiIncludes(undefined, "x")).toBe(false)
  })
})

describe("multiFirst / singleToMulti / multiToSingle", () => {
  it("multiFirst: 배열 첫 값 (빈 값 skip)", () => {
    expect(multiFirst(["", " ", "a", "b"])).toBe("a")
    expect(multiFirst([])).toBe("")
  })
  it("multiFirst: string은 split 후 첫 값", () => {
    expect(multiFirst("urgent, design")).toBe("urgent")
  })
  it("singleToMulti: select → multiSelect 마이그레이션 패턴", () => {
    expect(singleToMulti("urgent")).toEqual(["urgent"])
    expect(singleToMulti("")).toEqual([])
    expect(singleToMulti(null)).toEqual([])
  })
  it("multiToSingle: multiSelect → select 마이그레이션 (첫 값만)", () => {
    expect(multiToSingle(["a", "b"])).toBe("a")
    expect(multiToSingle([])).toBe("")
    expect(multiToSingle("c, d")).toBe("c")
  })
})
