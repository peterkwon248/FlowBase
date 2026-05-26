// FlowBase V2 — lib/formula/tokens + parser 테스트 (G7-C C-F1)

import { describe, expect, it } from "vitest"
import { tokenize, TokenizeError } from "@/lib/formula/tokens"
import { parseFormula, ParseError, extractDeps } from "@/lib/formula/parser"

describe("tokenize", () => {
  it("숫자 정수/소수", () => {
    const t = tokenize("42 3.14")
    expect(t.map((x) => x.value)).toEqual(["42", "3.14", ""])
    expect(t.map((x) => x.kind)).toEqual(["NUM", "NUM", "EOF"])
  })

  it("문자열 escape", () => {
    const t = tokenize('"hello\\nworld" "a\\"b"')
    expect(t[0]!.value).toBe("hello\nworld")
    expect(t[1]!.value).toBe('a"b')
  })

  it("Unterminated string → error", () => {
    expect(() => tokenize('"abc')).toThrow(TokenizeError)
  })

  it("2글자 연산자 우선 매칭", () => {
    const t = tokenize("== != <= >= && ||")
    expect(t.map((x) => x.value)).toEqual([
      "==",
      "!=",
      "<=",
      ">=",
      "&&",
      "||",
      "",
    ])
  })

  it("identifier + 함수 호출 토큰", () => {
    const t = tokenize('concat(prop("name"), " - ", 1)')
    const kinds = t.map((x) => x.kind)
    expect(kinds).toEqual([
      "IDENT",
      "LPAREN",
      "IDENT",
      "LPAREN",
      "STR",
      "RPAREN",
      "COMMA",
      "STR",
      "COMMA",
      "NUM",
      "RPAREN",
      "EOF",
    ])
  })

  it("Unknown char → error", () => {
    expect(() => tokenize("@")).toThrow(TokenizeError)
  })
})

describe("parseFormula — 산술 우선순위", () => {
  it("1 + 2 * 3 = BinOp(+, 1, BinOp(*, 2, 3))", () => {
    const ast = parseFormula("1 + 2 * 3")
    expect(ast).toEqual({
      type: "BinOp",
      op: "+",
      left: { type: "Literal", value: 1 },
      right: {
        type: "BinOp",
        op: "*",
        left: { type: "Literal", value: 2 },
        right: { type: "Literal", value: 3 },
      },
    })
  })

  it("(1 + 2) * 3 = BinOp(*, BinOp(+, 1, 2), 3)", () => {
    const ast = parseFormula("(1 + 2) * 3")
    expect(ast).toEqual({
      type: "BinOp",
      op: "*",
      left: {
        type: "BinOp",
        op: "+",
        left: { type: "Literal", value: 1 },
        right: { type: "Literal", value: 2 },
      },
      right: { type: "Literal", value: 3 },
    })
  })

  it("좌결합: 1 - 2 - 3 = BinOp(-, BinOp(-, 1, 2), 3)", () => {
    const ast = parseFormula("1 - 2 - 3")
    expect(ast).toEqual({
      type: "BinOp",
      op: "-",
      left: {
        type: "BinOp",
        op: "-",
        left: { type: "Literal", value: 1 },
        right: { type: "Literal", value: 2 },
      },
      right: { type: "Literal", value: 3 },
    })
  })
})

describe("parseFormula — 논리/비교 연산자", () => {
  it("a && b || c — &&가 ||보다 강결합", () => {
    const ast = parseFormula("true && false || true")
    // (true && false) || true
    expect(ast.type).toBe("BinOp")
    if (ast.type === "BinOp") {
      expect(ast.op).toBe("||")
      expect(ast.left.type).toBe("BinOp")
    }
  })

  it("비교 == 와 산술 +의 우선순위", () => {
    // 1 + 2 == 3 → (1+2) == 3
    const ast = parseFormula("1 + 2 == 3")
    expect(ast.type).toBe("BinOp")
    if (ast.type === "BinOp") {
      expect(ast.op).toBe("==")
      expect(ast.left.type).toBe("BinOp")
      if (ast.left.type === "BinOp") expect(ast.left.op).toBe("+")
    }
  })

  it("!a == b → UnaryOp 후 비교", () => {
    const ast = parseFormula("!true == false")
    expect(ast.type).toBe("BinOp")
    if (ast.type === "BinOp") {
      expect(ast.op).toBe("==")
      expect(ast.left.type).toBe("UnaryOp")
    }
  })
})

describe("parseFormula — 함수 호출", () => {
  it("nested call", () => {
    const ast = parseFormula('concat(upper("hi"), "!")')
    expect(ast).toEqual({
      type: "Call",
      name: "concat",
      args: [
        {
          type: "Call",
          name: "upper",
          args: [{ type: "Literal", value: "hi" }],
        },
        { type: "Literal", value: "!" },
      ],
    })
  })

  it("0 args", () => {
    const ast = parseFormula("today()")
    expect(ast).toEqual({ type: "Call", name: "today", args: [] })
  })

  it("if(cond, a, b) 3 args", () => {
    const ast = parseFormula('if(true, "y", "n")')
    expect(ast.type).toBe("Call")
    if (ast.type === "Call") {
      expect(ast.name).toBe("if")
      expect(ast.args).toHaveLength(3)
    }
  })
})

describe("parseFormula — 식별자 (true/false/null)", () => {
  it("true → Literal", () => {
    expect(parseFormula("true")).toEqual({ type: "Literal", value: true })
  })
  it("false → Literal", () => {
    expect(parseFormula("false")).toEqual({ type: "Literal", value: false })
  })
  it("null → Literal", () => {
    expect(parseFormula("null")).toEqual({ type: "Literal", value: null })
  })
  it("기타 identifier → Identifier 노드", () => {
    expect(parseFormula("status")).toEqual({
      type: "Identifier",
      name: "status",
    })
  })
})

describe("parseFormula — 에러", () => {
  it("Empty → error", () => {
    expect(() => parseFormula("")).toThrow(ParseError)
  })
  it("Unclosed paren → error", () => {
    expect(() => parseFormula("(1 + 2")).toThrow(ParseError)
  })
  it("Trailing token → error", () => {
    expect(() => parseFormula("1 2")).toThrow(ParseError)
  })
  it("Missing operand → error", () => {
    expect(() => parseFormula("1 +")).toThrow(ParseError)
  })
})

describe("extractDeps", () => {
  it("prop(\"name\") → ['name']", () => {
    const ast = parseFormula('prop("name")')
    expect(extractDeps(ast)).toEqual(["name"])
  })

  it("concat(prop(\"a\"), prop(\"b\"), prop(\"a\")) → 중복 제거", () => {
    const ast = parseFormula('concat(prop("a"), prop("b"), prop("a"))')
    expect(extractDeps(ast).sort()).toEqual(["a", "b"])
  })

  it("non-literal arg → 무시", () => {
    const ast = parseFormula('prop(upper("name"))') // prop의 arg가 literal 아님
    expect(extractDeps(ast)).toEqual([])
  })

  it("prop 외 함수 → 무시", () => {
    const ast = parseFormula('lookup("name")')
    expect(extractDeps(ast)).toEqual([])
  })

  it("중첩 안의 prop 도 캡처", () => {
    const ast = parseFormula(
      'if(prop("status") == "Done", prop("name"), "(none)")',
    )
    expect(extractDeps(ast).sort()).toEqual(["name", "status"])
  })
})
