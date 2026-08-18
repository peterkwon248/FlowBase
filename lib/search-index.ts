import { DEFAULT_LANGUAGE, translate, type Language } from "@/lib/i18n"
// FlowBase V2 — 통합 검색 인덱스 + 스코어 필터
// 출처: design-ref/prototype/search-palette.jsx
//
// boards · library · wikiPages를 SearchItem[] 평면화 → query 매치 + 스코어 정렬.
// 사용처: SearchPalette(⌘K 모달) · SearchMode(activityMode==="search" 풀페이지).

import type {
  Board,
  Library,
  LibraryCategoryId,
  TableRow,
  WikiPage,
} from "@/types/flowbase"

export type SearchKind = "table" | "row" | "library" | "wiki"

export interface SearchItem {
  kind: SearchKind
  id: string // 글로벌 unique key
  title: string
  subtitle: string
  keywords: string // pre-joined lowercase 매치 대상
  // 페이로드 — 호출자가 액션 디스패치
  payload:
    | { kind: "table"; boardId: string }
    | { kind: "row"; boardId: string; rowId: string }
    | { kind: "library"; category: LibraryCategoryId; assetId: string }
    | { kind: "wiki"; pageId: string }
}

// row 제목 후보 — id 외 첫 비어있지 않은 string 컬럼.
function rowTitle(row: TableRow, board: Board): string {
  const candidate = board.columns.find(
    (c) => c.name !== "id" && typeof row[c.name] === "string" && row[c.name],
  )
  if (candidate) return String(row[candidate.name]).slice(0, 80)
  return row.id
}

function rowSearchable(row: TableRow, board: Board): string {
  return board.columns
    .map((c) => {
      const v = row[c.name]
      return v == null ? "" : String(v)
    })
    .join(" ")
}

const LIB_CATS: { key: LibraryCategoryId; label: string }[] = [
  { key: "optionLists", label: "Option List" },
  { key: "fields", label: "Field" },
  { key: "templates", label: "Template" },
  { key: "functions", label: "Function" },
  { key: "dashboards", label: "Dashboard" },
]

export function buildSearchIndex(
  boards: Record<string, Board>,
  library: Library,
  wikiPages: WikiPage[],
  // 표시 문자열을 번역해 담으므로 언어가 인덱스의 입력이다.
  // 전역 상태를 읽는 tt() 대신 명시적 인자 — 호출부 useMemo 의존성이 정직해진다.
  lang: Language = DEFAULT_LANGUAGE,
): SearchItem[] {
  const tt = (v: string, params?: Record<string, string | number>) =>
    translate(lang, v, params)
  const items: SearchItem[] = []

  // Tables + rows
  for (const board of Object.values(boards)) {
    items.push({
      kind: "table",
      id: `table-${board.id}`,
      title: tt(board.label),
      subtitle: tt("{rows} rows · {cols} columns", {
        rows: board.rows.length,
        cols: board.columns.length,
      }),
      keywords: `${board.label} ${board.id}`.toLowerCase(),
      payload: { kind: "table", boardId: board.id },
    })
    for (const row of board.rows) {
      const title = rowTitle(row, board)
      items.push({
        kind: "row",
        id: `row-${board.id}-${row.id}`,
        title,
        subtitle: `${tt(board.label)} · ${row.id}`,
        keywords: `${row.id} ${rowSearchable(row, board)}`.toLowerCase(),
        payload: { kind: "row", boardId: board.id, rowId: row.id },
      })
    }
  }

  // Library assets
  for (const { key, label } of LIB_CATS) {
    const assets = library[key] as { id: string; name: string; desc?: string }[]
    for (const a of assets) {
      items.push({
        kind: "library",
        id: `lib-${key}-${a.id}`,
        title: tt(a.name),
        subtitle: `${tt("Library")} · ${tt(label)}${a.desc ? " · " + tt(a.desc).slice(0, 60) : ""}`,
        keywords: `${a.name} ${a.desc ?? ""}`.toLowerCase(),
        payload: { kind: "library", category: key, assetId: a.id },
      })
    }
  }

  // Wiki pages
  for (const p of wikiPages) {
    items.push({
      kind: "wiki",
      id: `wiki-${p.id}`,
      title: tt(p.title),
      subtitle: `${tt("Wiki")} · ${tt(p.category)} · ${p.owner}`,
      keywords: `${p.title} ${p.category} ${p.body}`.toLowerCase(),
      payload: { kind: "wiki", pageId: p.id },
    })
  }

  return items
}

// query 없으면 상위 N — 텍스트 매치 시 prefix > contains(title) > contains(subtitle) > keywords 순.
export function filterSearch(
  items: SearchItem[],
  query: string,
  limit: number,
  kindFilter?: SearchKind,
): SearchItem[] {
  const pool = kindFilter
    ? items.filter((i) => i.kind === kindFilter)
    : items
  const q = query.trim().toLowerCase()
  if (!q) return pool.slice(0, limit)

  const scored: { item: SearchItem; score: number }[] = []
  for (const item of pool) {
    const titleLower = item.title.toLowerCase()
    const subLower = item.subtitle.toLowerCase()
    let score = 0
    if (titleLower.startsWith(q)) score = 100
    else if (titleLower.includes(q)) score = 50
    else if (subLower.includes(q)) score = 20
    else if (item.keywords.includes(q)) score = 10
    if (score > 0) scored.push({ item, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.item)
}

export function countByKind(items: SearchItem[]): Record<SearchKind, number> {
  const out: Record<SearchKind, number> = {
    table: 0,
    row: 0,
    library: 0,
    wiki: 0,
  }
  for (const it of items) out[it.kind] += 1
  return out
}
