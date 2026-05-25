// FlowBase V2 — SnapshotState diff 알고리즘
// 출처: Key Design #18 Snapshots 후속 — "Compare to current" 핵심.
//
// SnapshotState A vs B → SnapshotDiff. 카테고리별 added/removed/modified ids.
// 자체 구현 (의존성 0 LOCK).
//
// 비교 기준:
//   - boards: id 비교 + JSON.stringify로 modified 판정 (cell 단위 diff는 후속)
//   - wikiPages: id + (body, title, verified) 변경 시 modified
//   - automations: id + JSON.stringify로 modified
//   - library: 카테고리별 count diff (의미 있는 변화만)
//
// 사용처:
//   - SnapshotCompareDialog (snapshot 카드 ⋯ 메뉴)
//   - Restore 확인 다이얼로그 (변경 예고)

import type {
  AutomationRule,
  Board,
  SnapshotState,
  WikiPage,
} from "@/types/flowbase"

// ─── Category diff 공통 shape ───
export interface CategoryDiff {
  added: string[]      // id list — A에만
  removed: string[]    // id list — B에만
  modified: string[]   // id list — 양쪽에 있지만 다름
  unchanged: string[]  // id list — 양쪽에 있고 같음
}

// Board가 modified일 때 사용자가 알고 싶은 sub stats
export interface BoardModification {
  boardId: string
  label: string
  rowsAdded: number
  rowsRemoved: number
  rowsModified: number
  columnsChanged: boolean // ColumnDef 추가/삭제/타입 변경 여부
  labelChanged: boolean
}

export interface LibraryDiff {
  optionLists: { added: number; removed: number; modified: number }
  fields: { added: number; removed: number; modified: number }
  templates: { added: number; removed: number; modified: number }
  functions: { added: number; removed: number; modified: number }
  dashboards: { added: number; removed: number; modified: number }
}

export interface SnapshotDiff {
  boards: CategoryDiff
  boardModifications: BoardModification[] // boards.modified에 대한 sub stats
  wikiPages: CategoryDiff
  automations: CategoryDiff
  library: LibraryDiff
  settingsChanged: boolean
  // 빠른 판정: 모든 카테고리가 unchanged면 true (사용자에게 "동일" 표시)
  identical: boolean
}

// ─── Helpers ───

function indexById<T extends { id: string }>(arr: ReadonlyArray<T>): Map<string, T> {
  const m = new Map<string, T>()
  for (const item of arr) m.set(item.id, item)
  return m
}

function jsonEq(a: unknown, b: unknown): boolean {
  // 빠른 deep eq — stringify는 키 순서 의존이지만 immutable patch 패턴에서 일관됨.
  // 정확도가 필요한 케이스는 follow-up (e.g. structural deep eq lib).
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

function diffIds<T extends { id: string }>(
  a: ReadonlyArray<T>,
  b: ReadonlyArray<T>,
  eq: (x: T, y: T) => boolean = jsonEq,
): CategoryDiff {
  const aMap = indexById(a)
  const bMap = indexById(b)
  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []
  const unchanged: string[] = []
  for (const [id, av] of aMap) {
    const bv = bMap.get(id)
    if (bv === undefined) {
      added.push(id) // A에만 있음 (snapshot에는 있고 current에 없으면 = restore 시 added)
    } else if (eq(av, bv)) {
      unchanged.push(id)
    } else {
      modified.push(id)
    }
  }
  for (const [id] of bMap) {
    if (!aMap.has(id)) removed.push(id) // B에만 있음 (현재에만 있는 것 = restore 시 removed)
  }
  return { added, removed, modified, unchanged }
}

// ─── Board 비교 ───

function rowsIndex(b: Board): Map<string, unknown> {
  // 행별 JSON으로 인덱싱 (createdAt/updatedAt 제외하면 더 정확하지만 minimum: 그대로)
  const m = new Map<string, unknown>()
  for (const r of b.rows) m.set(r.id, r)
  return m
}

function compareBoardRows(a: Board, b: Board): {
  rowsAdded: number
  rowsRemoved: number
  rowsModified: number
} {
  const aRows = rowsIndex(a)
  const bRows = rowsIndex(b)
  let added = 0
  let removed = 0
  let modified = 0
  for (const [id, av] of aRows) {
    const bv = bRows.get(id)
    if (bv === undefined) added += 1
    else if (!jsonEq(av, bv)) modified += 1
  }
  for (const [id] of bRows) {
    if (!aRows.has(id)) removed += 1
  }
  return { rowsAdded: added, rowsRemoved: removed, rowsModified: modified }
}

function compareBoardModification(a: Board, b: Board): BoardModification {
  const colsEq = jsonEq(a.columns, b.columns)
  const rowDiff = compareBoardRows(a, b)
  return {
    boardId: a.id,
    label: a.label,
    ...rowDiff,
    columnsChanged: !colsEq,
    labelChanged: a.label !== b.label,
  }
}

// ─── 메인 diff ───

export function diffSnapshotStates(
  a: SnapshotState,
  b: SnapshotState,
): SnapshotDiff {
  // boards — Record → array
  const aBoards = Object.values(a.boards)
  const bBoards = Object.values(b.boards)
  const boardsDiff = diffIds(aBoards, bBoards, (x, y) =>
    jsonEq({ ...x, updatedAt: 0 }, { ...y, updatedAt: 0 }),
  )

  // modified boards의 sub stats
  const aBoardsMap = indexById(aBoards)
  const bBoardsMap = indexById(bBoards)
  const boardModifications: BoardModification[] = boardsDiff.modified
    .map((id) => {
      const av = aBoardsMap.get(id)
      const bv = bBoardsMap.get(id)
      if (!av || !bv) return null
      return compareBoardModification(av, bv)
    })
    .filter((x): x is BoardModification => x !== null)

  const wikiDiff = diffIds(
    a.wikiPages,
    b.wikiPages,
    (x: WikiPage, y: WikiPage) =>
      x.title === y.title &&
      x.body === y.body &&
      x.category === y.category &&
      x.verified === y.verified,
  )

  const automationsDiff = diffIds(
    a.automations,
    b.automations,
    (x: AutomationRule, y: AutomationRule) => jsonEq(x, y),
  )

  // Library — count diffs per category (id 매칭만)
  const libDiff = (a: ReadonlyArray<{ id: string }>, b: ReadonlyArray<{ id: string }>) => {
    const d = diffIds(a, b)
    return {
      added: d.added.length,
      removed: d.removed.length,
      modified: d.modified.length,
    }
  }
  const library: LibraryDiff = {
    optionLists: libDiff(a.library.optionLists, b.library.optionLists),
    fields: libDiff(a.library.fields, b.library.fields),
    templates: libDiff(a.library.templates, b.library.templates),
    functions: libDiff(a.library.functions, b.library.functions),
    dashboards: libDiff(a.library.dashboards, b.library.dashboards),
  }

  const settingsChanged = !jsonEq(a.settings, b.settings)

  const totalChanges =
    boardsDiff.added.length +
    boardsDiff.removed.length +
    boardsDiff.modified.length +
    wikiDiff.added.length +
    wikiDiff.removed.length +
    wikiDiff.modified.length +
    automationsDiff.added.length +
    automationsDiff.removed.length +
    automationsDiff.modified.length +
    library.optionLists.added +
    library.optionLists.removed +
    library.optionLists.modified +
    library.fields.added +
    library.fields.removed +
    library.fields.modified +
    library.templates.added +
    library.templates.removed +
    library.templates.modified +
    library.functions.added +
    library.functions.removed +
    library.functions.modified +
    library.dashboards.added +
    library.dashboards.removed +
    library.dashboards.modified +
    (settingsChanged ? 1 : 0)

  return {
    boards: boardsDiff,
    boardModifications,
    wikiPages: wikiDiff,
    automations: automationsDiff,
    library,
    settingsChanged,
    identical: totalChanges === 0,
  }
}

// 간단한 요약 라인 — Restore confirm 다이얼로그용.
// 예: "2 boards, 5 rows, 1 wiki, 3 automations will change."
export function summarizeDiff(d: SnapshotDiff): string {
  if (d.identical) return "No changes — identical to current state."
  const parts: string[] = []
  const boardChanges =
    d.boards.added.length + d.boards.removed.length + d.boards.modified.length
  if (boardChanges > 0) {
    parts.push(`${boardChanges} board${boardChanges === 1 ? "" : "s"}`)
  }
  const totalRowChanges = d.boardModifications.reduce(
    (acc, m) => acc + m.rowsAdded + m.rowsRemoved + m.rowsModified,
    0,
  )
  if (totalRowChanges > 0) {
    parts.push(`${totalRowChanges} row${totalRowChanges === 1 ? "" : "s"}`)
  }
  const wikiChanges =
    d.wikiPages.added.length +
    d.wikiPages.removed.length +
    d.wikiPages.modified.length
  if (wikiChanges > 0) {
    parts.push(`${wikiChanges} wiki page${wikiChanges === 1 ? "" : "s"}`)
  }
  const autoChanges =
    d.automations.added.length +
    d.automations.removed.length +
    d.automations.modified.length
  if (autoChanges > 0) {
    parts.push(`${autoChanges} automation${autoChanges === 1 ? "" : "s"}`)
  }
  return `${parts.join(", ")} will change.`
}
