"use client"

// FlowBase V2 — zustand 스토어 (보드·행·시트 UI 상태 + localStorage persist)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §4
// 출처: design-ref/prototype/prototype-app.jsx
// 데이터 모델: 제네릭 컬럼 구동 (types/flowbase.ts). theme은 next-themes 소유.

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
  ActiveWorkspaceItem,
  ActivityMode,
  AIHistoryEntry,
  Board,
  ColumnDef,
  FlowBaseState,
  LibraryCategoryId,
  SortDir,
  TableRow,
  TicketStatus,
  ViewMode,
  WikiPage,
} from "@/types/flowbase"
import { createSeedLibrary } from "@/lib/flowbase-library-seed"
import { createSeedBoard } from "@/lib/flowbase-seed"
import { createSeedTasksBoard } from "@/lib/flowbase-tasks-seed"
import { createSeedWikiPages } from "@/lib/flowbase-wiki-seed"
import {
  SEED_AUTOMATIONS,
  SEED_SUGGESTED_AUTOMATIONS,
} from "@/lib/flowbase-workspace-seed"
import { undoStack } from "@/lib/undo-stack"

const STORE_KEY = "flowbase-state-v4"
const STORE_VERSION = 6 // v6: Wiki 페이지 시드 추가

function nowIso(): string {
  return new Date().toISOString()
}

// 보드별 새 행 id — idPrefix + (기존 최대 번호 + 1). 프로토타입 INT-NNN 방식.
function nextRowId(board: Board): string {
  const prefix = board.idPrefix ?? "ROW-"
  let max = 0
  for (const r of board.rows) {
    if (r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10)
      if (!Number.isNaN(n) && n > max) max = n
    }
  }
  return `${prefix}${String(max > 0 ? max + 1 : 100).padStart(3, "0")}`
}

// ── 액션 인터페이스 (STATE-SHAPES §5 + prototype-app.jsx) ──
export interface FlowBaseActions {
  switchBoard: (boardId: string) => void
  // rows 인자 — Import(Phase 3)가 행과 함께 보드를 1회 생성 (per-row undo ❌)
  createBoard: (
    label: string,
    columns?: ColumnDef[],
    rows?: TableRow[],
  ) => string
  deleteBoard: (boardId: string) => void
  renameBoard: (boardId: string, label: string) => void

  // Rows — active board 대상. 변경 전 undo 스냅샷 push.
  addRow: (row?: Partial<TableRow>) => string
  updateRow: (rowId: string, patch: Partial<TableRow>) => void
  deleteRows: (rowIds: string[]) => void
  commitAiCell: (rowId: string, col: "theme" | "sentiment", value: string) => void
  dismissAiCell: (rowId: string, col: "theme" | "sentiment") => void
  // AI 배치 — Phase 2 (Claude infer-batch 결과 일괄 반영)
  acceptAllAi: (
    col: "theme" | "sentiment",
    results: { id: string; value: string }[],
  ) => void
  dismissAllAi: (col: "theme" | "sentiment") => void
  pushAi: (entry: Omit<AIHistoryEntry, "id" | "time">) => void

  undo: () => void
  redo: () => void

  setView: (v: ViewMode) => void
  setActivityMode: (m: ActivityMode) => void
  setLibCategory: (c: LibraryCategoryId) => void
  setLibAsset: (id: string | null) => void
  setLibView: (v: "cards" | "sheet") => void
  selectAsset: (c: LibraryCategoryId, id: string) => void
  setActiveWorkspaceItem: (item: ActiveWorkspaceItem) => void
  setWikiPage: (id: string | null) => void
  updateWikiPage: (id: string, patch: Partial<WikiPage>) => void
  setSearch: (s: string) => void
  setFilter: (f: TicketStatus[]) => void
  setSort: (s: FlowBaseState["sort"]) => void
  setSelected: (ids: string[]) => void
  setFocused: (cell: FlowBaseState["focusedCell"]) => void
  togglePanel: (k: keyof FlowBaseState["panels"]) => void
  showAllPanels: () => void
  hideAllPanels: () => void
}

export type FlowBaseStore = FlowBaseState & FlowBaseActions

function createInitialState(): FlowBaseState {
  const interviews = createSeedBoard()
  const tasks = createSeedTasksBoard()
  const wikiPages = createSeedWikiPages()
  return {
    boards: { [interviews.id]: interviews, [tasks.id]: tasks },
    activeBoardId: interviews.id,
    library: createSeedLibrary(),
    automations: SEED_AUTOMATIONS,
    suggestedAutomations: SEED_SUGGESTED_AUTOMATIONS,
    wikiPages,
    wikiSelectedId: wikiPages[0]?.id ?? null,
    panels: { activityBar: true, sidebar: true, aiPanel: true, detailBar: false },
    viewByBoardId: { [interviews.id]: "sheet", [tasks.id]: "sheet" },
    activityMode: "tables",
    activeWorkspaceItem: "schema",
    libCategory: "optionLists",
    libAssetId: null,
    libView: "cards",
    search: "",
    filter: [],
    sort: { key: "date", dir: "desc" },
    selectedRowIds: [],
    focusedCell: null,
  }
}

export const useFlowBase = create<FlowBaseStore>()(
  persist(
    (set, get) => {
      const activeBoard = (): Board | undefined => {
        const s = get()
        return s.boards[s.activeBoardId]
      }

      // 변경 직전 active board rows 스냅샷을 undo 스택에
      const pushUndo = (): void => {
        const b = activeBoard()
        if (b) undoStack.push({ boardId: b.id, rows: [...b.rows] })
      }

      // active board의 rows 교체 (immutable) + updatedAt 갱신
      const setRows = (rows: TableRow[]): void => {
        const s = get()
        const b = s.boards[s.activeBoardId]
        if (!b) return
        set({
          boards: { ...s.boards, [b.id]: { ...b, rows, updatedAt: nowIso() } },
        })
      }

      const restoreRows = (boardId: string, rows: TableRow[]): void => {
        const s = get()
        const target = s.boards[boardId]
        if (!target) return
        set({
          boards: {
            ...s.boards,
            [boardId]: { ...target, rows, updatedAt: nowIso() },
          },
        })
      }

      return {
        ...createInitialState(),

        switchBoard: (boardId) => {
          if (!get().boards[boardId]) return
          undoStack.clear()
          set({
            activeBoardId: boardId,
            search: "",
            filter: [],
            sort: { key: "date", dir: "desc" },
            selectedRowIds: [],
            focusedCell: null,
          })
        },

        createBoard: (label, columns, rows) => {
          const id = `board-${Date.now().toString(36)}`
          const ts = nowIso()
          const board: Board = {
            id,
            label,
            idPrefix: "ROW-", // 생성 보드의 새 행 id 접두 (import 행 id와 일치)
            columns: columns ?? [
              { name: "id", label: "ID", type: "text", width: 86, mono: true },
            ],
            rows: rows ?? [],
            aiHistory: [],
            createdAt: ts,
            updatedAt: ts,
          }
          set((s) => ({
            boards: { ...s.boards, [id]: board },
            viewByBoardId: { ...s.viewByBoardId, [id]: "sheet" },
          }))
          return id
        },

        deleteBoard: (boardId) => {
          set((s) => {
            if (!s.boards[boardId]) return s
            const rest: Record<string, Board> = {}
            for (const [id, b] of Object.entries(s.boards)) {
              if (id !== boardId) rest[id] = b
            }
            const ids = Object.keys(rest)
            if (ids.length === 0) return s // 마지막 보드는 삭제 불가
            return {
              boards: rest,
              activeBoardId:
                s.activeBoardId === boardId ? ids[0] : s.activeBoardId,
            }
          })
        },

        renameBoard: (boardId, label) => {
          set((s) => {
            const b = s.boards[boardId]
            if (!b || !label.trim()) return s
            return {
              boards: {
                ...s.boards,
                [boardId]: { ...b, label: label.trim(), updatedAt: nowIso() },
              },
            }
          })
        },

        addRow: (row) => {
          const b = activeBoard()
          if (!b) return row?.id ?? "ROW-100"
          pushUndo()
          const ts = nowIso()
          const id = row?.id ?? nextRowId(b)
          const newRow: TableRow = {
            id,
            themeConfirmed: true,
            sentimentConfirmed: true,
            createdAt: ts,
            updatedAt: ts,
            ...row,
          }
          setRows([...b.rows, newRow])
          return id
        },

        updateRow: (rowId, patch) => {
          const b = activeBoard()
          if (!b) return
          pushUndo()
          setRows(
            b.rows.map((r) =>
              r.id === rowId ? { ...r, ...patch, updatedAt: nowIso() } : r,
            ),
          )
        },

        deleteRows: (rowIds) => {
          const b = activeBoard()
          if (!b || rowIds.length === 0) return
          pushUndo()
          const targets = new Set(rowIds)
          setRows(b.rows.filter((r) => !targets.has(r.id)))
          set((s) => ({
            selectedRowIds: s.selectedRowIds.filter((id) => !targets.has(id)),
          }))
        },

        // AI 추천 수용 — 값 설정 + confirmed=true
        commitAiCell: (rowId, col, value) => {
          const b = activeBoard()
          if (!b) return
          pushUndo()
          const confirmKey =
            col === "theme" ? "themeConfirmed" : "sentimentConfirmed"
          setRows(
            b.rows.map((r) =>
              r.id === rowId
                ? { ...r, [col]: value, [confirmKey]: true, updatedAt: nowIso() }
                : r,
            ),
          )
        },

        // AI 추천 거부 — 값은 그대로 두고 confirmed만 true (프로토타입 onDismissAi)
        dismissAiCell: (rowId, col) => {
          const b = activeBoard()
          if (!b) return
          pushUndo()
          const confirmKey =
            col === "theme" ? "themeConfirmed" : "sentimentConfirmed"
          setRows(
            b.rows.map((r) =>
              r.id === rowId ? { ...r, [confirmKey]: true, updatedAt: nowIso() } : r,
            ),
          )
        },

        // AI 배치 적용 — Claude 분류 결과를 active board에 일괄 반영 (1 undo 단위)
        acceptAllAi: (col, results) => {
          const b = activeBoard()
          if (!b || results.length === 0) return
          pushUndo()
          const confirmKey =
            col === "theme" ? "themeConfirmed" : "sentimentConfirmed"
          const byId = new Map(results.map((r) => [r.id, r.value]))
          setRows(
            b.rows.map((r) =>
              byId.has(r.id)
                ? {
                    ...r,
                    [col]: byId.get(r.id),
                    [confirmKey]: true,
                    updatedAt: nowIso(),
                  }
                : r,
            ),
          )
        },

        // AI 추천 일괄 거부 — pending 행 모두 confirmed=true, 값 유지
        dismissAllAi: (col) => {
          const b = activeBoard()
          if (!b) return
          const confirmKey =
            col === "theme" ? "themeConfirmed" : "sentimentConfirmed"
          if (!b.rows.some((r) => r[confirmKey] === false)) return
          pushUndo()
          setRows(
            b.rows.map((r) =>
              r[confirmKey] === false
                ? { ...r, [confirmKey]: true, updatedAt: nowIso() }
                : r,
            ),
          )
        },

        // aiHistory append — active board 대상 (append-only 로그, undo 비대상)
        pushAi: (entry) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          const full: AIHistoryEntry = {
            ...entry,
            id: `ai-${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,
            time: nowIso(),
          }
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                aiHistory: [...b.aiHistory, full],
                updatedAt: nowIso(),
              },
            },
          })
        },

        undo: () => {
          const b = activeBoard()
          if (!b) return
          const restored = undoStack.undo({ boardId: b.id, rows: [...b.rows] })
          if (restored) restoreRows(restored.boardId, restored.rows)
        },

        redo: () => {
          const b = activeBoard()
          if (!b) return
          const restored = undoStack.redo({ boardId: b.id, rows: [...b.rows] })
          if (restored) restoreRows(restored.boardId, restored.rows)
        },

        setView: (v) =>
          set((s) => ({
            viewByBoardId: { ...s.viewByBoardId, [s.activeBoardId]: v },
          })),
        setActivityMode: (activityMode) => set({ activityMode }),
        setActiveWorkspaceItem: (activeWorkspaceItem) =>
          set({ activeWorkspaceItem }),
        setWikiPage: (wikiSelectedId) => set({ wikiSelectedId }),
        updateWikiPage: (id, patch) =>
          set((s) => ({
            wikiPages: s.wikiPages.map((p) =>
              p.id === id ? { ...p, ...patch } : p,
            ),
          })),
        setLibCategory: (libCategory) =>
          set({ libCategory, libAssetId: null }),
        setLibAsset: (libAssetId) => set({ libAssetId }),
        setLibView: (libView) => set({ libView }),
        selectAsset: (libCategory, libAssetId) =>
          set({ libCategory, libAssetId }),
        setSearch: (search) => set({ search }),
        setFilter: (filter) => set({ filter }),
        setSort: (sort) => set({ sort }),
        setSelected: (selectedRowIds) => set({ selectedRowIds }),
        setFocused: (focusedCell) => set({ focusedCell }),
        togglePanel: (k) =>
          set((s) => ({ panels: { ...s.panels, [k]: !s.panels[k] } })),
        showAllPanels: () =>
          set({
            panels: {
              activityBar: true,
              sidebar: true,
              aiPanel: true,
              detailBar: true,
            },
          }),
        hideAllPanels: () =>
          set({
            panels: {
              activityBar: false,
              sidebar: false,
              aiPanel: false,
              detailBar: false,
            },
          }),
      }
    },
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // 마이그레이션 — 기존 persisted state에 새 시드/필드 주입.
      //   v4 → v5: Tasks 보드 시드
      //   v5 → v6: Wiki 페이지 시드
      migrate: (persistedState, version) => {
        const s = (persistedState ?? {}) as Partial<FlowBaseState>
        if (version < 5) {
          const tasks = createSeedTasksBoard()
          const boards = (s.boards ?? {}) as Record<string, Board>
          if (!boards[tasks.id]) {
            s.boards = { ...boards, [tasks.id]: tasks }
            s.viewByBoardId = {
              ...(s.viewByBoardId ?? {}),
              [tasks.id]: "sheet",
            }
          }
        }
        if (version < 6) {
          // Wiki 시드: 페이지가 없거나 비어 있으면 주입.
          const existing = (s.wikiPages ?? []) as WikiPage[]
          if (existing.length === 0) {
            const pages = createSeedWikiPages()
            s.wikiPages = pages
            s.wikiSelectedId = pages[0]?.id ?? null
          } else if (s.wikiSelectedId === undefined) {
            s.wikiSelectedId = existing[0]?.id ?? null
          }
        }
        return s as FlowBaseState
      },
      partialize: (s) => ({
        boards: s.boards,
        activeBoardId: s.activeBoardId,
        library: s.library,
        automations: s.automations,
        suggestedAutomations: s.suggestedAutomations,
        wikiPages: s.wikiPages,
        wikiSelectedId: s.wikiSelectedId,
        panels: s.panels,
        viewByBoardId: s.viewByBoardId,
        activityMode: s.activityMode,
        activeWorkspaceItem: s.activeWorkspaceItem,
        libCategory: s.libCategory,
        libAssetId: s.libAssetId,
        libView: s.libView,
      }),
    },
  ),
)

// ── 셀렉터 (STATE-SHAPES §7) ──────────────────────────────

const STATUS_RANK: Record<string, number> = {
  미처리: 0,
  진행중: 1,
  대기: 2,
  완료: 3,
}
const PRIORITY_RANK: Record<string, number> = {
  Urgent: 0,
  High: 1,
  Med: 2,
  Low: 3,
}

export function selectActiveBoard(state: FlowBaseState): Board | undefined {
  return state.boards[state.activeBoardId]
}

export function selectActiveView(state: FlowBaseState): ViewMode {
  return state.viewByBoardId[state.activeBoardId] ?? "sheet"
}

// status/priority는 의미 순서로, 그 외는 값 비교로 정렬.
function compareRows(a: TableRow, b: TableRow, key: string, dir: SortDir): number {
  let av: unknown = a[key]
  let bv: unknown = b[key]
  if (key === "status") {
    av = STATUS_RANK[String(av)] ?? 99
    bv = STATUS_RANK[String(bv)] ?? 99
  } else if (key === "priority") {
    av = PRIORITY_RANK[String(av)] ?? 99
    bv = PRIORITY_RANK[String(bv)] ?? 99
  }
  let cmp: number
  if (typeof av === "number" && typeof bv === "number") {
    cmp = av - bv
  } else {
    const as = String(av ?? "")
    const bs = String(bv ?? "")
    cmp = as < bs ? -1 : as > bs ? 1 : 0
  }
  return dir === "asc" ? cmp : -cmp
}

// 검색/필터/정렬을 적용한 가시 행 목록 (derived — 저장 ❌)
export function selectVisibleRows(state: FlowBaseState): TableRow[] {
  const board = state.boards[state.activeBoardId]
  if (!board) return []
  let rows = board.rows

  if (state.filter.length > 0) {
    const allowed = new Set<string>(state.filter)
    rows = rows.filter((r) => allowed.has(String(r.status ?? "")))
  }

  const q = state.search.trim().toLowerCase()
  if (q) {
    rows = rows.filter((r) =>
      board.columns.some((c) => {
        const v = r[c.name]
        return v != null && String(v).toLowerCase().includes(q)
      }),
    )
  }

  if (state.sort) {
    const { key, dir } = state.sort
    rows = [...rows].sort((a, b) => compareRows(a, b, key, dir))
  }

  return rows
}
