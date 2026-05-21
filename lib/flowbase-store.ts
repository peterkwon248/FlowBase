"use client"

// FlowBase V2 — zustand 스토어 (보드·행·시트 UI 상태 + localStorage persist)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §4
// 출처: design-ref/handoff/STATE-SHAPES.md §2·§5·§7
// theme(light/dark)은 next-themes 소유 — 본 스토어 비포함.

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { nanoid } from "nanoid"
import type {
  Board,
  ColumnDef,
  FlowBaseState,
  Sentiment,
  TableRow,
  TicketStatus,
  ViewMode,
} from "@/types/flowbase"
import { createSeedBoard } from "@/lib/flowbase-seed"
import { undoStack } from "@/lib/undo-stack"

const STORE_KEY = "flowbase-state-v3"
const STORE_VERSION = 3

function nowIso(): string {
  return new Date().toISOString()
}

function todayIso(): string {
  return nowIso().slice(0, 10)
}

// ── 액션 인터페이스 (STATE-SHAPES §5) ─────────────────────
export interface FlowBaseActions {
  // Board
  switchBoard: (boardId: string) => void
  createBoard: (label: string, columns?: ColumnDef[]) => string
  deleteBoard: (boardId: string) => void

  // Rows — active board 대상. 변경 전 undo 스냅샷 push.
  addRow: (row?: Partial<TableRow>) => string
  updateRow: (rowId: string, patch: Partial<TableRow>) => void
  deleteRows: (rowIds: string[]) => void
  commitAiCell: (rowId: string, col: "theme" | "sentiment", value: string) => void
  dismissAiCell: (rowId: string, col: "theme" | "sentiment") => void

  // Undo / Redo
  undo: () => void
  redo: () => void

  // UI
  setView: (v: ViewMode) => void
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

// ── 초기 상태 ─────────────────────────────────────────────
function createInitialState(): FlowBaseState {
  const seed = createSeedBoard()
  return {
    boards: { [seed.id]: seed },
    activeBoardId: seed.id,
    panels: { activityBar: true, sidebar: true, aiPanel: true },
    viewByBoardId: { [seed.id]: "sheet" },
    search: "",
    filter: [],
    sort: null,
    selectedRowIds: [],
    focusedCell: null,
  }
}

// ── 스토어 ────────────────────────────────────────────────
export const useFlowBase = create<FlowBaseStore>()(
  persist(
    (set, get) => {
      const activeBoard = (): Board | undefined => {
        const s = get()
        return s.boards[s.activeBoardId]
      }

      // 변경 직전 active board rows 스냅샷을 undo 스택에 적재
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

      // 스냅샷의 보드 rows 복원 (undo/redo 공통)
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
            sort: null,
            selectedRowIds: [],
            focusedCell: null,
          })
        },

        createBoard: (label, columns) => {
          const id = `board-${nanoid(8)}`
          const ts = nowIso()
          const board: Board = {
            id,
            label,
            columns: columns ?? [],
            rows: [],
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

        addRow: (row) => {
          const b = activeBoard()
          const id = row?.id ?? nanoid(10)
          if (!b) return id
          pushUndo()
          const ts = nowIso()
          const newRow: TableRow = {
            id,
            name: "",
            company: "",
            date: todayIso(),
            theme: "Other",
            sentiment: "Mixed",
            status: "미처리",
            priority: "Med",
            quote: "",
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

        commitAiCell: (rowId, col, value) => {
          const b = activeBoard()
          if (!b) return
          pushUndo()
          setRows(
            b.rows.map((r) => {
              if (r.id !== rowId) return r
              const ts = nowIso()
              return col === "theme"
                ? { ...r, theme: value, themeConfirmed: true, updatedAt: ts }
                : {
                    ...r,
                    sentiment: value as Sentiment,
                    sentimentConfirmed: true,
                    updatedAt: ts,
                  }
            }),
          )
        },

        // AI 추천 거부 → 기본값 리셋 (design §15 Q1)
        dismissAiCell: (rowId, col) => {
          const b = activeBoard()
          if (!b) return
          pushUndo()
          setRows(
            b.rows.map((r) => {
              if (r.id !== rowId) return r
              const ts = nowIso()
              return col === "theme"
                ? { ...r, theme: "Other", themeConfirmed: true, updatedAt: ts }
                : {
                    ...r,
                    sentiment: "Mixed",
                    sentimentConfirmed: true,
                    updatedAt: ts,
                  }
            }),
          )
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
        setSearch: (search) => set({ search }),
        setFilter: (filter) => set({ filter }),
        setSort: (sort) => set({ sort }),
        setSelected: (selectedRowIds) => set({ selectedRowIds }),
        setFocused: (focusedCell) => set({ focusedCell }),
        togglePanel: (k) =>
          set((s) => ({ panels: { ...s.panels, [k]: !s.panels[k] } })),
        showAllPanels: () =>
          set({ panels: { activityBar: true, sidebar: true, aiPanel: true } }),
        hideAllPanels: () =>
          set({ panels: { activityBar: false, sidebar: false, aiPanel: false } }),
      }
    },
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        boards: s.boards,
        activeBoardId: s.activeBoardId,
        panels: s.panels,
        viewByBoardId: s.viewByBoardId,
      }),
    },
  ),
)

// ── 셀렉터 (STATE-SHAPES §7) ──────────────────────────────

export function selectActiveBoard(state: FlowBaseState): Board | undefined {
  return state.boards[state.activeBoardId]
}

export function selectActiveView(state: FlowBaseState): ViewMode {
  return state.viewByBoardId[state.activeBoardId] ?? "sheet"
}

// 검색/필터/정렬을 적용한 가시 행 목록 (derived — 저장 ❌)
export function selectVisibleRows(state: FlowBaseState): TableRow[] {
  const board = state.boards[state.activeBoardId]
  if (!board) return []
  let rows = board.rows

  if (state.filter.length > 0) {
    const allowed = new Set(state.filter)
    rows = rows.filter((r) => allowed.has(r.status))
  }

  const q = state.search.trim().toLowerCase()
  if (q) {
    rows = rows.filter((r) =>
      `${r.id}${r.name}${r.company}${r.theme}${r.quote}`
        .toLowerCase()
        .includes(q),
    )
  }

  if (state.sort) {
    const { key, dir } = state.sort
    rows = [...rows].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[key]
      const bv = (b as unknown as Record<string, unknown>)[key]
      const as = av == null ? "" : String(av)
      const bs = bv == null ? "" : String(bv)
      const cmp = as < bs ? -1 : as > bs ? 1 : 0
      return dir === "asc" ? cmp : -cmp
    })
  }

  return rows
}
