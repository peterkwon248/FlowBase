// FlowBase V2 — multiSelect column type 공통 유틸 (Phase 2026-05-25)
// LOCK (Key Design #19 후속, plan C1):
//   - cell value = string[]. null/undefined → []. 단일 string → [string] 호환.
//   - separator: `,` `;` `|` 셋 다 split (CSV import + 사용자 입력 호환).
//   - join은 ", " (round-trip 정확도, boardToTable이 이걸 사용).
//   - normalize: trim + 빈 값 제거 + dedupe (옵션). 순서는 입력 그대로 유지.
// status type은 단일 select 격리 LOCK — 이 유틸 적용 ❌.
//
// 사용처:
//   - import-normalizers: CSV cell "tag1, tag2" → ["tag1","tag2"] (Im-3 후속)
//   - parsers.boardToTable: cell array → "tag1, tag2"
//   - sheet MultiSelectCell: 사용자 입력 → splitMultiValue
//   - selectVisibleRows filter: in/not_in ANY-match
//   - kanban groupBy: 한 row가 여러 칸 노출

const MULTI_SPLIT_RE = /[,;|]/

// 셀 raw 값 → string[]로 정규화.
//   - null/undefined → []
//   - string[] → trim + 빈값 제거 (이미 배열이면 split ❌)
//   - string → MULTI_SPLIT_RE로 split + trim + 빈값 제거
//   - 그 외 (number 등) → [String(v)]
// dedupe = true면 중복 제거. 기본 false (순서 보존 + 사용자 입력 명시 유지).
export function coerceMultiValue(v: unknown, dedupe = false): string[] {
  if (v == null) return []
  let arr: string[]
  if (Array.isArray(v)) {
    arr = v.map((x) => (x == null ? "" : String(x)).trim()).filter((s) => s.length > 0)
  } else if (typeof v === "string") {
    arr = v.split(MULTI_SPLIT_RE).map((s) => s.trim()).filter((s) => s.length > 0)
  } else {
    const s = String(v).trim()
    arr = s ? [s] : []
  }
  if (!dedupe) return arr
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of arr) {
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

// CSV cell text → string[] (편의 alias, import 경로용).
export function splitMultiValue(raw: string): string[] {
  return coerceMultiValue(raw, true)
}

// string[] → "a, b, c" — boardToTable export + chip label 표시용.
export function joinMultiValue(values: ReadonlyArray<string>): string {
  return values.join(", ")
}

// multi cell이 어떤 값을 포함하는가 (filter ANY-match에 사용).
export function multiIncludes(v: unknown, value: string): boolean {
  if (Array.isArray(v)) {
    return v.some((x) => String(x ?? "") === value)
  }
  if (typeof v === "string") {
    return splitMultiValue(v).includes(value)
  }
  return false
}

// 첫 값 (정렬·timeline subtitle용). 빈 배열이면 "".
export function multiFirst(v: unknown): string {
  if (Array.isArray(v)) {
    const f = v.find((x) => x != null && String(x).trim().length > 0)
    return f == null ? "" : String(f).trim()
  }
  if (typeof v === "string") {
    return splitMultiValue(v)[0] ?? ""
  }
  return ""
}

// 단일값 → 배열 (select → multiSelect type 전환 시 cell 마이그레이션).
export function singleToMulti(v: unknown): string[] {
  if (v == null) return []
  const s = String(v).trim()
  return s ? [s] : []
}

// 배열 → 첫 값 (multiSelect → select type 전환 시. 데이터 손실 — caller에서 toast 안내).
export function multiToSingle(v: unknown): string {
  return multiFirst(v)
}
