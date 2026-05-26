// FlowBase V2 — Formula function set + coercion helpers (G7-C C-F2)
// 의존성 0. 순수 함수.
//
// LOCK:
//   - 결과 타입 = string | number | boolean | null
//   - 산술 연산자(+,-,*,/): 숫자 강제 (cannot coerce → FormulaError)
//   - 비교 연산자(==,!=): strict equality (no implicit coerce)
//   - 비교 연산자(<,>,<=,>=): 두 값이 모두 숫자면 숫자 비교, 아니면 문자열 lex 비교
//   - 논리 연산자(&&,||,!): truthy/falsy 변환 (length>0 또는 !=0 또는 boolean)
//   - prop("col") — row 참조. multiSelect/array → ", " join (1차 default)
//   - div by 0 → FormulaError ("#DIV/0")
//   - format/today — 단순 구현

export type FormulaValue = string | number | boolean | null

export interface FormulaContext {
  row: Record<string, unknown>
  today: string // ISO YYYY-MM-DD. 테스트 주입 가능.
}

export class FormulaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FormulaError"
  }
}

// ─── Coercion helpers ───

export function coerceToString(v: FormulaValue): string {
  if (v === null) return ""
  if (typeof v === "boolean") return v ? "true" : "false"
  if (typeof v === "number") return Number.isNaN(v) ? "" : String(v)
  return v
}

export function coerceToNumber(v: FormulaValue, ctx: string): number {
  if (typeof v === "number") {
    if (Number.isNaN(v)) throw new FormulaError(`${ctx}: NaN value`)
    return v
  }
  if (typeof v === "string") {
    if (v.trim() === "") throw new FormulaError(`${ctx}: empty string is not a number`)
    const n = Number(v)
    if (Number.isNaN(n))
      throw new FormulaError(`${ctx}: cannot convert "${v}" to number`)
    return n
  }
  if (typeof v === "boolean") return v ? 1 : 0
  if (v === null) throw new FormulaError(`${ctx}: null is not a number`)
  throw new FormulaError(`${ctx}: cannot convert to number`)
}

export function coerceToBool(v: FormulaValue): boolean {
  if (v === null) return false
  if (typeof v === "boolean") return v
  if (typeof v === "string") return v.length > 0
  if (typeof v === "number") return v !== 0 && !Number.isNaN(v)
  return Boolean(v)
}

// row 값을 FormulaValue로 정규화. multiSelect(array) → ", " join.
// LOCK: array/object 외 다른 타입은 String 강제.
export function coerceRowValue(v: unknown): FormulaValue {
  if (v === null || v === undefined) return null
  if (typeof v === "string") return v
  if (typeof v === "number") return v
  if (typeof v === "boolean") return v
  if (Array.isArray(v)) {
    return v
      .map((item) => {
        if (item === null || item === undefined) return ""
        if (typeof item === "string") return item
        return String(item)
      })
      .filter((s) => s.length > 0)
      .join(", ")
  }
  return String(v)
}

// ─── Function table ───

interface FunctionDef {
  // arity check (inclusive). max = Infinity for variadic.
  arity: { min: number; max: number }
  fn: (args: FormulaValue[], ctx: FormulaContext) => FormulaValue
}

export const FN_TABLE: Record<string, FunctionDef> = {
  // 문자열
  concat: {
    arity: { min: 1, max: Infinity },
    fn: (args) => args.map(coerceToString).join(""),
  },
  lower: {
    arity: { min: 1, max: 1 },
    fn: (args) => coerceToString(args[0]!).toLowerCase(),
  },
  upper: {
    arity: { min: 1, max: 1 },
    fn: (args) => coerceToString(args[0]!).toUpperCase(),
  },
  length: {
    arity: { min: 1, max: 1 },
    fn: (args) => coerceToString(args[0]!).length,
  },

  // 산술 (연산자도 같은 의미 — 함수형 alias)
  add: {
    arity: { min: 2, max: 2 },
    fn: (args) =>
      coerceToNumber(args[0]!, "add") + coerceToNumber(args[1]!, "add"),
  },
  sub: {
    arity: { min: 2, max: 2 },
    fn: (args) =>
      coerceToNumber(args[0]!, "sub") - coerceToNumber(args[1]!, "sub"),
  },
  mul: {
    arity: { min: 2, max: 2 },
    fn: (args) =>
      coerceToNumber(args[0]!, "mul") * coerceToNumber(args[1]!, "mul"),
  },
  div: {
    arity: { min: 2, max: 2 },
    fn: (args) => {
      const denom = coerceToNumber(args[1]!, "div")
      if (denom === 0) throw new FormulaError("#DIV/0")
      return coerceToNumber(args[0]!, "div") / denom
    },
  },
  round: {
    arity: { min: 1, max: 2 },
    fn: (args) => {
      const n = coerceToNumber(args[0]!, "round")
      const d = args[1] !== undefined ? coerceToNumber(args[1], "round") : 0
      const factor = Math.pow(10, d)
      return Math.round(n * factor) / factor
    },
  },

  // 조건
  if: {
    arity: { min: 3, max: 3 },
    fn: (args) => (coerceToBool(args[0]!) ? args[1]! : args[2]!),
  },

  // 날짜
  today: {
    arity: { min: 0, max: 0 },
    fn: (_args, ctx) => ctx.today,
  },
  // format(value, digits) — 숫자 toFixed. 문자열/null은 그대로.
  format: {
    arity: { min: 2, max: 2 },
    fn: (args) => {
      const v = args[0]!
      const d = coerceToNumber(args[1]!, "format")
      if (typeof v === "number") return v.toFixed(d)
      if (typeof v === "string") {
        const n = Number(v)
        if (!Number.isNaN(n)) return n.toFixed(d)
      }
      return coerceToString(v)
    },
  },

  // 컬럼 참조
  prop: {
    arity: { min: 1, max: 1 },
    fn: (args, ctx) => {
      const name = coerceToString(args[0]!)
      const raw = ctx.row[name]
      return coerceRowValue(raw)
    },
  },
}
