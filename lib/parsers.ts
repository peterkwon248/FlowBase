// FlowBase V2 — CSV / TSV / Markdown 표 파서 (순수 함수)
// 출처: design-ref/prototype/import-modal.jsx, design-ref/handoff/IMPORT-SPEC.md §1
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §6
// Phase 3(Import 모달)에서 사용. 의존성 없는 순수 함수 — 테스트 용이.

import type { Board, ColumnType } from "@/types/flowbase"

export type ImportFormat = "csv" | "tsv" | "md"

export interface ParsedTable {
  format: ImportFormat | null
  rows: string[][]
}

// stringifyDelimited/stringifyMarkdownTable의 입력. headers 별도라 import wizard도 재사용 가능.
export interface SerializableTable {
  headers: string[]
  rows: string[][]
}

// CSV(',') 또는 TSV('\t') — quote("") 이스케이프 처리 포함
export function parseDelimited(text: string, delim: string): string[][] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((l) => l.length > 0)
  return lines.map((line) => {
    const cells: string[] = []
    let cur = ""
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (inQuote) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"'
          i++
        } else if (c === '"') {
          inQuote = false
        } else {
          cur += c
        }
      } else {
        if (c === '"') {
          inQuote = true
        } else if (c === delim) {
          cells.push(cur)
          cur = ""
        } else {
          cur += c
        }
      }
    }
    cells.push(cur)
    return cells.map((s) => s.trim())
  })
}

// | a | b | c | 형식 — 구분선(---) 행 제외. 2행 미만이면 null.
export function parseMarkdownTable(text: string): string[][] | null {
  const lines = text.split("\n").filter((l) => l.trim().startsWith("|"))
  if (lines.length < 2) return null
  const splitCells = (line: string): string[] =>
    line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((s) => s.trim())
  return lines
    .filter((l) => !/^\|?[\s|:-]+\|?$/.test(l))
    .map(splitCells)
}

// 텍스트 포맷 자동 감지
export function detectFormat(text: string): ImportFormat | null {
  const t = text.trim()
  if (!t) return null
  if (/^\|.+\|/m.test(t) && /[-:]+/.test(t)) return "md"
  const firstLine = t.split("\n")[0]
  const tabs = (firstLine.match(/\t/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  if (tabs > 0 && tabs >= commas) return "tsv"
  if (commas > 0) return "csv"
  return null
}

// 포맷 감지 후 자동 파싱
export function parseAny(text: string): ParsedTable {
  const format = detectFormat(text)
  if (format === "md") return { format, rows: parseMarkdownTable(text) ?? [] }
  if (format === "tsv") return { format, rows: parseDelimited(text, "\t") }
  if (format === "csv") return { format, rows: parseDelimited(text, ",") }
  return { format: null, rows: [] }
}

// 컬럼 샘플값들로 ColumnType 정적 추론 ("status"는 추론 ❌ — 수동 지정)
export function inferType(
  samples: ReadonlyArray<string | null | undefined>,
): ColumnType {
  const vals = samples.filter((s): s is string => s != null && s !== "")
  if (vals.length === 0) return "text"
  if (vals.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v))) return "date"
  if (vals.every((v) => /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(v))) return "email"
  if (vals.every((v) => /^-?\d+(\.\d+)?$/.test(v))) return "num"
  if (new Set(vals).size <= Math.max(5, vals.length / 4)) return "select"
  return "text"
}

// 헤더 문자열 → snake_case key (DB-safe). 빈 값이면 col_N.
export function normalizeHeader(s: string, idx: number): string {
  const fallback = `col_${idx + 1}`
  if (!s || !s.trim()) return fallback
  const normalized = s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40)
  return normalized || fallback
}

// ─── Serializers (export 반대 방향) ───
// CSV/TSV: RFC 4180 호환 — delim/quote/newline 포함 셀은 따옴표로 감싸고 " → "" 이스케이프.
// MD: pipe table — | escape · newline → space · 빈 셀은 공백 1개 (구문 보존).

function escapeDelimitedCell(cell: string, delim: string): string {
  if (
    cell.includes(delim) ||
    cell.includes('"') ||
    cell.includes("\n") ||
    cell.includes("\r")
  ) {
    return `"${cell.replace(/"/g, '""')}"`
  }
  return cell
}

export function stringifyDelimited(
  table: SerializableTable,
  delim: string,
): string {
  const lines: string[] = []
  lines.push(table.headers.map((h) => escapeDelimitedCell(h, delim)).join(delim))
  for (const row of table.rows) {
    lines.push(row.map((c) => escapeDelimitedCell(c, delim)).join(delim))
  }
  return lines.join("\n")
}

function escapeMarkdownCell(cell: string): string {
  // | escape · newline → space · 양끝 trim. 빈 문자열은 공백 1개로 (셀 표시 유지).
  const safe = cell.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim()
  return safe || " "
}

export function stringifyMarkdownTable(table: SerializableTable): string {
  const headers = table.headers.map(escapeMarkdownCell)
  if (headers.length === 0) return ""
  const lines: string[] = []
  lines.push(`| ${headers.join(" | ")} |`)
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`)
  for (const row of table.rows) {
    // 헤더 수에 맞게 padding (짧으면 빈 셀 채움 / 길면 truncate 안 함 — round-trip 정확도 우선)
    const padded = [...row]
    while (padded.length < headers.length) padded.push("")
    lines.push(`| ${padded.map(escapeMarkdownCell).join(" | ")} |`)
  }
  return lines.join("\n")
}

// Board → SerializableTable — Export 시 columns/rows를 2D string 그리드로.
// status/select 값은 raw 그대로 (import 시 round-trip 정확도 우선).
// 예: status="미처리" → 셀 "미처리" (영어 라벨 "Todo" 변환 ❌)
//     reaction object → JSON.stringify (간단 fallback)
export function boardToTable(board: Board): SerializableTable {
  const headers = board.columns.map((c) => c.label || c.name)
  const rows = board.rows.map((row) =>
    board.columns.map((col) => {
      const v = row[col.name]
      if (v == null) return ""
      if (typeof v === "object") {
        try {
          return JSON.stringify(v)
        } catch {
          return ""
        }
      }
      return String(v)
    }),
  )
  return { headers, rows }
}
