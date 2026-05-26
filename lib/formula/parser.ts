// FlowBase V2 — Formula parser (G7-C C-F1)
// Recursive descent parser. Tokens → AST.
//
// Grammar (precedence low → high):
//   expr        = logical_or
//   logical_or  = logical_and ("||" logical_and)*
//   logical_and = equality ("&&" equality)*
//   equality    = comparison (("==" | "!=") comparison)*
//   comparison  = additive (("<" | ">" | "<=" | ">=") additive)*
//   additive    = multiplicative (("+" | "-") multiplicative)*
//   multiplicative = unary (("*" | "/") unary)*
//   unary       = ("!" | "-") unary | primary
//   primary     = NUM | STR | IDENT ("(" args ")")? | "(" expr ")"
//   args        = (expr ("," expr)*)?
//
// LOCK: bare identifier (e.g., `true`, `false`, `null`, `Status`)는 Identifier 노드.
//       evaluator가 true/false/null만 boolean/null로 의미 부여. column 참조는 `prop("colName")` 명시.

import { TokenizeError, tokenize, type Token } from "./tokens"

export type Expr =
  | { type: "Literal"; value: string | number | boolean | null }
  | { type: "Identifier"; name: string }
  | { type: "UnaryOp"; op: "!" | "-"; operand: Expr }
  | { type: "BinOp"; op: BinaryOp; left: Expr; right: Expr }
  | { type: "Call"; name: string; args: Expr[] }

export type BinaryOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "<"
  | ">"
  | "<="
  | ">="
  | "=="
  | "!="
  | "&&"
  | "||"

export class ParseError extends Error {
  constructor(
    message: string,
    public pos: number,
  ) {
    super(`Parse error at ${pos}: ${message}`)
    this.name = "ParseError"
  }
}

// Re-export so callers can catch one type
export { TokenizeError }

class Parser {
  private i = 0

  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token {
    return this.tokens[this.i + offset]!
  }

  private advance(): Token {
    return this.tokens[this.i++]!
  }

  private matchOp(...ops: string[]): boolean {
    const t = this.peek()
    return t.kind === "OP" && ops.includes(t.value)
  }

  private expect(kind: Token["kind"], value?: string): Token {
    const t = this.peek()
    if (t.kind !== kind || (value !== undefined && t.value !== value)) {
      const expected = value !== undefined ? `${kind}("${value}")` : kind
      throw new ParseError(
        `Expected ${expected}, got ${t.kind}("${t.value}")`,
        t.pos,
      )
    }
    return this.advance()
  }

  parse(): Expr {
    if (this.peek().kind === "EOF") {
      throw new ParseError("Empty expression", 0)
    }
    const expr = this.parseExpr()
    if (this.peek().kind !== "EOF") {
      const t = this.peek()
      throw new ParseError(`Unexpected token "${t.value}"`, t.pos)
    }
    return expr
  }

  private parseExpr(): Expr {
    return this.parseLogicalOr()
  }

  private parseLogicalOr(): Expr {
    let left = this.parseLogicalAnd()
    while (this.matchOp("||")) {
      this.advance()
      const right = this.parseLogicalAnd()
      left = { type: "BinOp", op: "||", left, right }
    }
    return left
  }

  private parseLogicalAnd(): Expr {
    let left = this.parseEquality()
    while (this.matchOp("&&")) {
      this.advance()
      const right = this.parseEquality()
      left = { type: "BinOp", op: "&&", left, right }
    }
    return left
  }

  private parseEquality(): Expr {
    let left = this.parseComparison()
    while (this.matchOp("==", "!=")) {
      const op = this.advance().value as "==" | "!="
      const right = this.parseComparison()
      left = { type: "BinOp", op, left, right }
    }
    return left
  }

  private parseComparison(): Expr {
    let left = this.parseAdditive()
    while (this.matchOp("<", ">", "<=", ">=")) {
      const op = this.advance().value as "<" | ">" | "<=" | ">="
      const right = this.parseAdditive()
      left = { type: "BinOp", op, left, right }
    }
    return left
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative()
    while (this.matchOp("+", "-")) {
      const op = this.advance().value as "+" | "-"
      const right = this.parseMultiplicative()
      left = { type: "BinOp", op, left, right }
    }
    return left
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary()
    while (this.matchOp("*", "/")) {
      const op = this.advance().value as "*" | "/"
      const right = this.parseUnary()
      left = { type: "BinOp", op, left, right }
    }
    return left
  }

  private parseUnary(): Expr {
    if (this.matchOp("!", "-")) {
      const op = this.advance().value as "!" | "-"
      const operand = this.parseUnary()
      return { type: "UnaryOp", op, operand }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): Expr {
    const t = this.peek()

    if (t.kind === "NUM") {
      this.advance()
      return { type: "Literal", value: Number(t.value) }
    }
    if (t.kind === "STR") {
      this.advance()
      return { type: "Literal", value: t.value }
    }
    if (t.kind === "LPAREN") {
      this.advance()
      const expr = this.parseExpr()
      this.expect("RPAREN")
      return expr
    }
    if (t.kind === "IDENT") {
      this.advance()
      const name = t.value
      // function call?
      if (this.peek().kind === "LPAREN") {
        this.advance()
        const args: Expr[] = []
        if (this.peek().kind !== "RPAREN") {
          args.push(this.parseExpr())
          while (this.peek().kind === "COMMA") {
            this.advance()
            args.push(this.parseExpr())
          }
        }
        this.expect("RPAREN")
        return { type: "Call", name, args }
      }
      // bare identifier — true/false/null special, otherwise Identifier
      if (name === "true") return { type: "Literal", value: true }
      if (name === "false") return { type: "Literal", value: false }
      if (name === "null") return { type: "Literal", value: null }
      return { type: "Identifier", name }
    }

    throw new ParseError(`Unexpected token "${t.value}"`, t.pos)
  }
}

export function parseFormula(src: string): Expr {
  const tokens = tokenize(src)
  return new Parser(tokens).parse()
}

// AST walker — `prop("colName")` 호출의 colName을 모두 수집.
// formula 컬럼의 dependsOn 자동 추출에 사용 (C-F3).
export function extractDeps(expr: Expr): string[] {
  const found = new Set<string>()
  walk(expr, (node) => {
    if (
      node.type === "Call" &&
      node.name === "prop" &&
      node.args.length >= 1 &&
      node.args[0].type === "Literal" &&
      typeof node.args[0].value === "string"
    ) {
      found.add(node.args[0].value)
    }
  })
  return Array.from(found)
}

function walk(expr: Expr, visit: (node: Expr) => void): void {
  visit(expr)
  if (expr.type === "UnaryOp") walk(expr.operand, visit)
  else if (expr.type === "BinOp") {
    walk(expr.left, visit)
    walk(expr.right, visit)
  } else if (expr.type === "Call") {
    for (const a of expr.args) walk(a, visit)
  }
  // Literal / Identifier — leaf
}
