// FlowBase V2 — Formula library public API (G7-C C-F1·F2)
// 단일 entry — column 등록 + cell 렌더 + 헤더 메뉴에서 사용.

export { parseFormula, extractDeps, ParseError } from "./parser"
export type { Expr, BinaryOp } from "./parser"
export { tokenize, TokenizeError } from "./tokens"
export type { Token, TokenKind } from "./tokens"
export {
  evaluate,
  FormulaError,
  type FormulaContext,
  type FormulaValue,
} from "./evaluator"
export { FN_TABLE, coerceToString, coerceToNumber, coerceRowValue } from "./functions"

// 편의 함수 — parse + eval 한 번에. column header preview 등에서 사용.
import { parseFormula as _parseFormula } from "./parser"
import { evaluate as _evaluate, FormulaError as _FormulaError } from "./evaluator"
import type { FormulaContext as _FormulaContext, FormulaValue as _FormulaValue } from "./functions"

export function evaluateFormula(
  src: string,
  ctx: _FormulaContext,
): _FormulaValue {
  const ast = _parseFormula(src)
  return _evaluate(ast, ctx)
}

// 오늘 날짜 (기본 ctx 헬퍼). 호출 시점 기준 ISO YYYY-MM-DD.
export function defaultToday(): string {
  return new Date().toISOString().slice(0, 10)
}

// row + columns에서 FormulaContext 생성 (column-aware 확장 여지 — 현재 row만 필요).
export function makeContext(row: Record<string, unknown>): _FormulaContext {
  return { row, today: defaultToday() }
}

// Re-export FormulaError for catch outside (Error subclass)
export { _FormulaError as FormulaErrorClass }
