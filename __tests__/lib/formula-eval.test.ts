// FlowBase V2 — lib/formula evaluator + functions 테스트 (G7-C C-F2)

import { describe, expect, it } from "vitest"
import { parseFormula } from "@/lib/formula/parser"
import { evaluate, FormulaError } from "@/lib/formula/evaluator"
import type { FormulaContext } from "@/lib/formula/functions"
import { evaluateFormula } from "@/lib/formula"

function ctx(
  row: Record<string, unknown> = {},
  today = "2026-05-26",
): FormulaContext {
  return { row, today }
}

function evalSrc(src: string, row: Record<string, unknown> = {}): unknown {
  return evaluate(parseFormula(src), ctx(row))
}

describe("evaluator — literals", () => {
  it("number", () => expect(evalSrc("42")).toBe(42))
  it("string", () => expect(evalSrc('"hi"')).toBe("hi"))
  it("true/false/null", () => {
    expect(evalSrc("true")).toBe(true)
    expect(evalSrc("false")).toBe(false)
    expect(evalSrc("null")).toBe(null)
  })
})

describe("evaluator — 산술", () => {
  it("1 + 2 * 3 = 7", () => expect(evalSrc("1 + 2 * 3")).toBe(7))
  it("(1 + 2) * 3 = 9", () => expect(evalSrc("(1 + 2) * 3")).toBe(9))
  it("좌결합 sub", () => expect(evalSrc("10 - 3 - 2")).toBe(5))
  it("unary minus", () => expect(evalSrc("-5 + 3")).toBe(-2))
  it("div by 0 → FormulaError", () => {
    expect(() => evalSrc("1 / 0")).toThrow(FormulaError)
  })
  it("문자열 + 숫자 — 문자열이 숫자 변환 가능하면 OK", () => {
    expect(evalSrc('"3" + 2')).toBe(5)
  })
  it("문자열 + 숫자 — 변환 불가 → FormulaError", () => {
    expect(() => evalSrc('"abc" + 2')).toThrow(FormulaError)
  })
})

describe("evaluator — 비교/논리", () => {
  it("strict equal: 1 == 1", () => expect(evalSrc("1 == 1")).toBe(true))
  it("strict equal: 1 == \"1\" → false (no coerce)", () => {
    expect(evalSrc('1 == "1"')).toBe(false)
  })
  it("null == null → true", () => expect(evalSrc("null == null")).toBe(true))
  it("null != \"\" → true", () => expect(evalSrc('null != ""')).toBe(true))
  it("숫자 비교 1 < 2", () => expect(evalSrc("1 < 2")).toBe(true))
  it("문자열 lex 비교", () => expect(evalSrc('"abc" < "abd"')).toBe(true))
  it("&& short-circuit", () => {
    // div by 0이 evaluate 안 됨
    expect(evalSrc('false && (1/0 == 0)')).toBe(false)
  })
  it("|| short-circuit", () => {
    expect(evalSrc('true || (1/0 == 0)')).toBe(true)
  })
  it("!true = false", () => expect(evalSrc("!true")).toBe(false))
})

describe("evaluator — 문자열 함수", () => {
  it("concat", () =>
    expect(evalSrc('concat("a", "b", "c")')).toBe("abc"))
  it("concat — null skip", () =>
    expect(evalSrc('concat("a", null, "b")')).toBe("ab"))
  it("concat — number coerce", () =>
    expect(evalSrc('concat("v", 42)')).toBe("v42"))
  it("concat — true → 'true'", () =>
    expect(evalSrc('concat(true, "!")')).toBe("true!"))
  it("upper/lower", () => {
    expect(evalSrc('upper("hi")')).toBe("HI")
    expect(evalSrc('lower("HI")')).toBe("hi")
  })
  it("length", () => {
    expect(evalSrc('length("hello")')).toBe(5)
    expect(evalSrc("length(null)")).toBe(0)
  })
})

describe("evaluator — 산술 함수", () => {
  it("add/sub/mul/div", () => {
    expect(evalSrc("add(2, 3)")).toBe(5)
    expect(evalSrc("sub(10, 4)")).toBe(6)
    expect(evalSrc("mul(3, 4)")).toBe(12)
    expect(evalSrc("div(10, 2)")).toBe(5)
  })
  it("div(_, 0) → FormulaError", () => {
    expect(() => evalSrc("div(10, 0)")).toThrow(FormulaError)
  })
  it("round(3.14159, 2) = 3.14", () =>
    expect(evalSrc("round(3.14159, 2)")).toBe(3.14))
  it("round(3.5) = 4 (default 0 digits)", () =>
    expect(evalSrc("round(3.5)")).toBe(4))
})

describe("evaluator — if", () => {
  it("true → a", () =>
    expect(evalSrc('if(true, "yes", "no")')).toBe("yes"))
  it("false → b", () =>
    expect(evalSrc('if(false, "yes", "no")')).toBe("no"))
  it("non-bool truthy", () => {
    expect(evalSrc('if("x", "y", "n")')).toBe("y")
    expect(evalSrc('if(0, "y", "n")')).toBe("n") // 0 falsy
  })
})

describe("evaluator — today/format", () => {
  it("today() = ctx.today", () => {
    const ast = parseFormula("today()")
    expect(evaluate(ast, ctx({}, "2026-05-26"))).toBe("2026-05-26")
  })
  it("format(3.14159, 2) = '3.14'", () =>
    expect(evalSrc("format(3.14159, 2)")).toBe("3.14"))
  it("format(\"3.14\", 1) = '3.1' (string coerce)", () =>
    expect(evalSrc('format("3.14", 1)')).toBe("3.1"))
})

describe("evaluator — prop (row 참조)", () => {
  it("prop existing", () =>
    expect(evalSrc('prop("name")', { name: "Alice" })).toBe("Alice"))
  it("prop missing → null", () =>
    expect(evalSrc('prop("missing")', { name: "Alice" })).toBe(null))
  it("prop multiSelect (array) → join", () =>
    expect(
      evalSrc('prop("tags")', { tags: ["alpha", "beta", "gamma"] }),
    ).toBe("alpha, beta, gamma"))
  it("prop number — number 그대로", () =>
    expect(evalSrc('prop("count")', { count: 42 })).toBe(42))
  it("prop boolean — boolean 그대로", () =>
    expect(evalSrc('prop("active")', { active: true })).toBe(true))
})

describe("evaluator — Q7-B4 추가 함수들", () => {
  it("contains", () => {
    expect(evalSrc('contains("hello world", "world")')).toBe(true)
    expect(evalSrc('contains("hello", "xyz")')).toBe(false)
  })
  it("replace — 모든 occurrence", () =>
    expect(evalSrc('replace("aaa-bbb-aaa", "aaa", "X")')).toBe("X-bbb-X"))
  it("startsWith/endsWith", () => {
    expect(evalSrc('startsWith("FlowBase", "Flow")')).toBe(true)
    expect(evalSrc('endsWith("FlowBase", "Base")')).toBe(true)
  })
  it("trim", () =>
    expect(evalSrc('trim("  hi  ")')).toBe("hi"))
  it("abs", () => {
    expect(evalSrc("abs(-7)")).toBe(7)
    expect(evalSrc("abs(3.5)")).toBe(3.5)
  })
  it("mod", () => {
    expect(evalSrc("mod(10, 3)")).toBe(1)
    expect(() => evalSrc("mod(5, 0)")).toThrow(FormulaError)
  })
  it("floor/ceil", () => {
    expect(evalSrc("floor(3.9)")).toBe(3)
    expect(evalSrc("ceil(3.1)")).toBe(4)
  })
  it("dateAdd — 7일 후", () =>
    expect(evalSrc('dateAdd("2026-05-26", 7)')).toBe("2026-06-02"))
  it("dateAdd — 음수 (days 빼기)", () =>
    expect(evalSrc('dateAdd("2026-05-26", -5)')).toBe("2026-05-21"))
  it("dateAdd — invalid date → error", () => {
    expect(() => evalSrc('dateAdd("not-a-date", 1)')).toThrow(FormulaError)
  })
  it("weekOfYear — ISO 8601", () => {
    // 2026-01-05 = ISO week 2 (월요일 시작 ISO 표준)
    expect(evalSrc('weekOfYear("2026-01-05")')).toBe(2)
    // 2026-05-26 = ISO week 22
    expect(evalSrc('weekOfYear("2026-05-26")')).toBe(22)
  })
})

describe("evaluator — joinProp (Q5-B2)", () => {
  it("array — 명시 sep", () =>
    expect(
      evalSrc('joinProp("tags", " · ")', { tags: ["alpha", "beta"] }),
    ).toBe("alpha · beta"))
  it("array — 빈 sep", () =>
    expect(
      evalSrc('joinProp("tags", "")', { tags: ["a", "b", "c"] }),
    ).toBe("abc"))
  it("array — null/empty 원소 skip", () =>
    expect(
      evalSrc('joinProp("tags", "-")', {
        tags: ["a", null, "", "b", "  "],
      }),
    ).toBe("a-b"))
  it("non-array — toString", () =>
    expect(evalSrc('joinProp("name", ", ")', { name: "Alice" })).toBe("Alice"))
  it("missing column → empty string", () =>
    expect(evalSrc('joinProp("missing", ", ")', {})).toBe(""))
  it("number column → toString", () =>
    expect(evalSrc('joinProp("count", ", ")', { count: 42 })).toBe("42"))
})

describe("evaluator — 통합", () => {
  it("concat + prop + if", () => {
    const src =
      'concat(prop("name"), " · ", if(prop("priority") == "Urgent", "🚨", "🆗"))'
    expect(evalSrc(src, { name: "Alice", priority: "Urgent" })).toBe(
      "Alice · 🚨",
    )
    expect(evalSrc(src, { name: "Bob", priority: "Low" })).toBe("Bob · 🆗")
  })
  it("산술 + prop", () => {
    expect(
      evalSrc('add(prop("a"), prop("b"))', { a: 10, b: 20 }),
    ).toBe(30)
  })
})

describe("evaluator — 에러", () => {
  it("bare identifier (non-true/false/null) → error", () => {
    expect(() => evalSrc("status")).toThrow(FormulaError)
  })
  it("unknown function → error", () => {
    expect(() => evalSrc("foo(1)")).toThrow(FormulaError)
  })
  it("arity mismatch → error", () => {
    expect(() => evalSrc("if(true, 1)")).toThrow(FormulaError)
    expect(() => evalSrc("upper()")).toThrow(FormulaError)
  })
})

describe("evaluateFormula (helper)", () => {
  it("parse + eval 한 번에", () => {
    const result = evaluateFormula('concat("x", prop("v"))', {
      row: { v: 42 },
      today: "2026-05-26",
    })
    expect(result).toBe("x42")
  })
})
