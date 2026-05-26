// FlowBase V2 — Formula tokenizer (G7-C C-F1)
// 의존성 0. 순수 함수.
//
// 입력 = 수식 문자열 (e.g., `concat(prop("name"), " · ", prop("status"))`)
// 출력 = Token[] (위치 정보 포함, parser용)
//
// LOCK: ASCII identifier (`[A-Za-z_][A-Za-z0-9_]*`) · 숫자 literal (정수/소수)
//       문자열 literal (큰따옴표 + `\"` `\\` escape) · 연산자 (+-*/ == != < > <= >= && || !)
//       구두점 (, ()
// 키워드 ❌ — true/false/null은 identifier로 처리 (parser/evaluator가 의미 부여).

export type TokenKind =
  | "NUM"
  | "STR"
  | "IDENT"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "OP"
  | "EOF"

export interface Token {
  kind: TokenKind
  value: string // 원본 문자열 (NUM/IDENT/OP는 그대로, STR은 내용만 — escape 처리됨)
  pos: number // 입력에서의 시작 위치 (에러 메시지용)
}

export class TokenizeError extends Error {
  constructor(
    message: string,
    public pos: number,
  ) {
    super(`Tokenize error at ${pos}: ${message}`)
    this.name = "TokenizeError"
  }
}

// 2글자 연산자 우선 매칭. 1글자는 그 외.
const MULTI_OPS = ["==", "!=", "<=", ">=", "&&", "||"]
const SINGLE_OPS = ["+", "-", "*", "/", "<", ">", "!"]

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9"
}

function isIdentStart(ch: string): boolean {
  return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_"
}

function isIdentBody(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch)
}

export function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = src.length

  while (i < n) {
    const ch = src[i]

    // whitespace skip
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++
      continue
    }

    // string literal — 큰따옴표만 (단일따옴표 ❌, 일관성)
    if (ch === '"') {
      const start = i
      i++ // skip opening "
      let value = ""
      while (i < n && src[i] !== '"') {
        if (src[i] === "\\" && i + 1 < n) {
          const next = src[i + 1]
          if (next === '"') value += '"'
          else if (next === "\\") value += "\\"
          else if (next === "n") value += "\n"
          else if (next === "t") value += "\t"
          else throw new TokenizeError(`Invalid escape \\${next}`, i)
          i += 2
        } else {
          value += src[i]
          i++
        }
      }
      if (i >= n) throw new TokenizeError("Unterminated string", start)
      i++ // skip closing "
      tokens.push({ kind: "STR", value, pos: start })
      continue
    }

    // number literal (정수 또는 소수)
    if (isDigit(ch)) {
      const start = i
      while (i < n && isDigit(src[i])) i++
      if (src[i] === "." && isDigit(src[i + 1] ?? "")) {
        i++
        while (i < n && isDigit(src[i])) i++
      }
      tokens.push({ kind: "NUM", value: src.slice(start, i), pos: start })
      continue
    }

    // identifier (function name 또는 column reference fragment)
    if (isIdentStart(ch)) {
      const start = i
      while (i < n && isIdentBody(src[i])) i++
      tokens.push({ kind: "IDENT", value: src.slice(start, i), pos: start })
      continue
    }

    // punctuation
    if (ch === "(") {
      tokens.push({ kind: "LPAREN", value: "(", pos: i })
      i++
      continue
    }
    if (ch === ")") {
      tokens.push({ kind: "RPAREN", value: ")", pos: i })
      i++
      continue
    }
    if (ch === ",") {
      tokens.push({ kind: "COMMA", value: ",", pos: i })
      i++
      continue
    }

    // 2글자 연산자 우선 시도
    const two = src.slice(i, i + 2)
    if (MULTI_OPS.includes(two)) {
      tokens.push({ kind: "OP", value: two, pos: i })
      i += 2
      continue
    }

    // 1글자 연산자
    if (SINGLE_OPS.includes(ch)) {
      tokens.push({ kind: "OP", value: ch, pos: i })
      i++
      continue
    }

    throw new TokenizeError(`Unexpected character "${ch}"`, i)
  }

  tokens.push({ kind: "EOF", value: "", pos: n })
  return tokens
}
