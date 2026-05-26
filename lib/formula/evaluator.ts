// FlowBase V2 — Formula evaluator (G7-C C-F2)
// AST + row → FormulaValue. throw on error (FormulaError).

import type { Expr, BinaryOp } from "./parser"
import {
  FN_TABLE,
  FormulaError,
  coerceToBool,
  coerceToNumber,
  coerceToString,
  type FormulaContext,
  type FormulaValue,
} from "./functions"

export { FormulaError }
export type { FormulaContext, FormulaValue }

export function evaluate(expr: Expr, ctx: FormulaContext): FormulaValue {
  switch (expr.type) {
    case "Literal":
      return expr.value
    case "Identifier":
      // bare identifier — column name으로 자동 해석 ❌ (prop("name") 명시 강제).
      throw new FormulaError(
        `Unknown identifier "${expr.name}". Use prop("${expr.name}") to reference a column.`,
      )
    case "UnaryOp": {
      const v = evaluate(expr.operand, ctx)
      if (expr.op === "!") return !coerceToBool(v)
      // unary -
      return -coerceToNumber(v, "unary -")
    }
    case "BinOp":
      return evalBinOp(expr.op, expr.left, expr.right, ctx)
    case "Call":
      return evalCall(expr.name, expr.args, ctx)
  }
}

function evalBinOp(
  op: BinaryOp,
  leftExpr: Expr,
  rightExpr: Expr,
  ctx: FormulaContext,
): FormulaValue {
  // short-circuit for && ||
  if (op === "&&") {
    const left = evaluate(leftExpr, ctx)
    if (!coerceToBool(left)) return false
    return coerceToBool(evaluate(rightExpr, ctx))
  }
  if (op === "||") {
    const left = evaluate(leftExpr, ctx)
    if (coerceToBool(left)) return true
    return coerceToBool(evaluate(rightExpr, ctx))
  }

  const left = evaluate(leftExpr, ctx)
  const right = evaluate(rightExpr, ctx)

  switch (op) {
    case "+":
      return coerceToNumber(left, "+") + coerceToNumber(right, "+")
    case "-":
      return coerceToNumber(left, "-") - coerceToNumber(right, "-")
    case "*":
      return coerceToNumber(left, "*") * coerceToNumber(right, "*")
    case "/": {
      const denom = coerceToNumber(right, "/")
      if (denom === 0) throw new FormulaError("#DIV/0")
      return coerceToNumber(left, "/") / denom
    }
    case "==":
      return strictEqual(left, right)
    case "!=":
      return !strictEqual(left, right)
    case "<":
      return compareValues(left, right) < 0
    case ">":
      return compareValues(left, right) > 0
    case "<=":
      return compareValues(left, right) <= 0
    case ">=":
      return compareValues(left, right) >= 0
  }
}

function strictEqual(a: FormulaValue, b: FormulaValue): boolean {
  // null == null
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return a === b
}

function compareValues(a: FormulaValue, b: FormulaValue): number {
  // 둘 다 숫자면 숫자 비교. 아니면 string lex.
  if (typeof a === "number" && typeof b === "number") {
    return a < b ? -1 : a > b ? 1 : 0
  }
  const sa = coerceToString(a)
  const sb = coerceToString(b)
  return sa < sb ? -1 : sa > sb ? 1 : 0
}

function evalCall(
  name: string,
  args: Expr[],
  ctx: FormulaContext,
): FormulaValue {
  const def = FN_TABLE[name]
  if (!def) throw new FormulaError(`Unknown function "${name}"`)
  if (args.length < def.arity.min || args.length > def.arity.max) {
    const range =
      def.arity.min === def.arity.max
        ? `${def.arity.min}`
        : def.arity.max === Infinity
          ? `≥${def.arity.min}`
          : `${def.arity.min}-${def.arity.max}`
    throw new FormulaError(
      `${name}: expected ${range} args, got ${args.length}`,
    )
  }
  const evaluated = args.map((a) => evaluate(a, ctx))
  return def.fn(evaluated, ctx)
}
