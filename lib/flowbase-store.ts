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
  ChangeEvent,
  ChartConfig,
  ColumnDef,
  FlowBaseState,
  LibraryCategoryId,
  NavEntry,
  SortDir,
  TableRow,
  TicketStatus,
  TrashedBoard,
  TrashedRow,
  ViewMode,
  WikiPage,
  WorkspaceSettings,
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
const STORE_VERSION = 9 // v9: trashedRows 추가 + 30일 만료 정책

const TRASH_EXPIRY_MS = 30 * 86_400_000 // 30 days

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

  // Trash — 복원/영구 삭제
  restoreBoard: (boardId: string) => void
  permanentDeleteBoard: (boardId: string) => void
  restoreRow: (rowId: string) => void
  permanentDeleteRow: (rowId: string) => void
  emptyTrash: () => void
  // 30일 만료 자동 정리 (mount 시 호출 권장)
  cleanupExpiredTrash: () => void

  // Settings
  updateSettings: (patch: Partial<WorkspaceSettings>) => void

  // Schema positions
  setSchemaPosition: (boardId: string, pos: { x: number; y: number }) => void
  resetSchemaPositions: () => void

  // Automations — rule 토글/삭제 + suggestion accept/dismiss + 테스트 실행
  toggleAutomationStatus: (id: string) => void
  deleteAutomation: (id: string) => void
  testRunAutomation: (id: string) => void
  acceptSuggestion: (id: string) => void
  dismissSuggestion: (id: string) => void

  // Columns — active board의 columns 편집. 행 값은 보존(필요 시 키 migrate).
  addColumn: (col: ColumnDef) => void
  deleteColumn: (colName: string) => void
  renameColumn: (colName: string, newName: string, newLabel?: string) => void
  updateColumn: (colName: string, patch: Partial<ColumnDef>) => void

  // Dashboard charts (active board)
  addChart: (chart: Omit<ChartConfig, "id">) => string
  removeChart: (chartId: string) => void
  updateChart: (chartId: string, patch: Partial<ChartConfig>) => void
  clearCustomCharts: () => void
  // Library promotion: 현재 active board의 컬럼을 LibraryField로 승격.
  promoteColumnToLibraryField: (colName: string) => string | null
  attachFunctionToColumn: (colName: string, functionId: string | null) => void

  // Rows — active board 대상. 변경 전 undo 스냅샷 push.
  addRow: (row?: Partial<TableRow>) => string
  // 명시 boardId 대상 — 자동화 런타임이 cross-board 행 추가 시 사용.
  addRowToBoard: (boardId: string, row?: Partial<TableRow>) => string | null
  duplicateRow: (rowId: string) => string | null
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
  addWikiPage: (init?: Partial<WikiPage>) => string
  deleteWikiPage: (id: string) => void

  // nav-history (인메모리)
  goBack: () => void
  goForward: () => void
  jumpToNavEntry: (index: number) => void
  setSearch: (s: string) => void
  setFilter: (f: TicketStatus[]) => void
  setColumnFilter: (col: string, values: string[]) => void
  toggleColumnFilter: (col: string, value: string) => void
  clearAllFilters: () => void
  setSort: (s: FlowBaseState["sort"]) => void
  setSelected: (ids: string[]) => void
  setFocused: (cell: FlowBaseState["focusedCell"]) => void
  setSearchOpen: (open: boolean) => void
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
    trashedBoards: [],
    trashedRows: [],
    settings: { workspaceLabel: "peter's workspace", workspaceInitial: "P" },
    schemaPositions: {},
    panels: { activityBar: true, sidebar: true, aiPanel: true, detailBar: false },
    viewByBoardId: { [interviews.id]: "sheet", [tasks.id]: "sheet" },
    activityMode: "tables",
    activeWorkspaceItem: "schema",
    libCategory: "optionLists",
    libAssetId: null,
    libView: "cards",
    search: "",
    filter: [],
    columnFilters: {},
    sort: { key: "date", dir: "desc" },
    selectedRowIds: [],
    focusedCell: null,
    searchOpen: false,
    navStack: [],
    navIndex: -1,
    lastChange: null,
  }
}

function publishChange(
  set: (partial: Partial<FlowBaseState>) => void,
  event: Omit<ChangeEvent, "timestamp">,
): void {
  set({ lastChange: { ...event, timestamp: Date.now() } })
}

// 현재 store 상태에서 NavEntry를 만들어 돌려준다 (push 직전 호출).
function snapshotNav(s: FlowBaseState): NavEntry {
  const mode = s.activityMode
  switch (mode) {
    case "tables": {
      const b = s.boards[s.activeBoardId]
      return {
        key: `tables:${s.activeBoardId}`,
        mode,
        label: b?.label ?? "Tables",
        sub: b?.rows ? `${b.rows.length} rows` : undefined,
        boardId: s.activeBoardId,
      }
    }
    case "workspace": {
      return {
        key: `workspace:${s.activeWorkspaceItem}`,
        mode,
        label:
          s.activeWorkspaceItem === "schema" ? "Schema" : "Automations",
        sub: "Workspace",
        workspaceItem: s.activeWorkspaceItem,
      }
    }
    case "library": {
      const cat = s.libCategory
      const id = s.libAssetId
      let assetName: string | undefined
      if (id) {
        const pool =
          cat === "optionLists"
            ? s.library.optionLists
            : cat === "fields"
              ? s.library.fields
              : cat === "templates"
                ? s.library.templates
                : cat === "functions"
                  ? s.library.functions
                  : s.library.dashboards
        const hit = (pool as { id: string; name: string }[]).find(
          (a) => a.id === id,
        )
        assetName = hit?.name
      }
      return {
        key: `library:${cat}:${id ?? "-"}`,
        mode,
        label: assetName ?? CATEGORY_LABEL[cat],
        sub: assetName ? `Library · ${CATEGORY_LABEL[cat]}` : "Library",
        libCategory: cat,
        libAssetId: id,
      }
    }
    case "wiki": {
      const p = s.wikiPages.find((x) => x.id === s.wikiSelectedId)
      return {
        key: `wiki:${s.wikiSelectedId ?? "-"}`,
        mode,
        label: p?.title ?? "Wiki",
        sub: p?.category ? `Wiki · ${p.category}` : "Wiki",
        wikiPageId: s.wikiSelectedId,
      }
    }
    case "inbox":
      return { key: "inbox", mode, label: "Inbox" }
    case "search":
      return { key: "search", mode, label: "Search" }
  }
}

const CATEGORY_LABEL: Record<LibraryCategoryId, string> = {
  optionLists: "Option Lists",
  fields: "Fields",
  templates: "Templates",
  functions: "Functions",
  dashboards: "Dashboards",
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

      // 네비 스택에 현재 상태 push. 같은 key 연속 push ❌. forward 분기 정리.
      // applyEntry(replay 중)에서 호출하지 않도록 명시적으로 분리.
      const pushNav = (): void => {
        const s = get()
        const entry = snapshotNav(s)
        const top = s.navStack[s.navIndex]
        if (top && top.key === entry.key) return // dedup
        const base = s.navStack.slice(0, s.navIndex + 1)
        const next = [...base, entry].slice(-50) // cap 50
        set({ navStack: next, navIndex: next.length - 1 })
      }

      // entry를 받아 store 상태를 직접 set — pushNav 호출 ❌ (replay 모드).
      const applyNavEntry = (entry: NavEntry): void => {
        const patch: Partial<FlowBaseState> = { activityMode: entry.mode }
        if (entry.mode === "tables" && entry.boardId) {
          patch.activeBoardId = entry.boardId
        } else if (entry.mode === "workspace" && entry.workspaceItem) {
          patch.activeWorkspaceItem = entry.workspaceItem
        } else if (entry.mode === "library" && entry.libCategory) {
          patch.libCategory = entry.libCategory
          patch.libAssetId = entry.libAssetId ?? null
        } else if (entry.mode === "wiki") {
          patch.wikiSelectedId = entry.wikiPageId ?? null
        }
        set(patch)
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
          pushNav()
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
            const target = s.boards[boardId]
            if (!target) return s
            const rest: Record<string, Board> = {}
            for (const [id, b] of Object.entries(s.boards)) {
              if (id !== boardId) rest[id] = b
            }
            const ids = Object.keys(rest)
            if (ids.length === 0) return s // 마지막 보드는 삭제 불가
            // boards에서 빼서 trashedBoards로 이동 (복원 가능)
            return {
              boards: rest,
              activeBoardId:
                s.activeBoardId === boardId ? ids[0] : s.activeBoardId,
              trashedBoards: [
                { board: target, deletedAt: nowIso() },
                ...s.trashedBoards,
              ],
            }
          })
        },

        restoreBoard: (boardId) => {
          set((s) => {
            const trashed = s.trashedBoards.find(
              (t) => t.board.id === boardId,
            )
            if (!trashed) return s
            return {
              boards: { ...s.boards, [boardId]: trashed.board },
              viewByBoardId: {
                ...s.viewByBoardId,
                [boardId]: s.viewByBoardId[boardId] ?? "sheet",
              },
              trashedBoards: s.trashedBoards.filter(
                (t) => t.board.id !== boardId,
              ),
            }
          })
        },

        permanentDeleteBoard: (boardId) => {
          set((s) => ({
            trashedBoards: s.trashedBoards.filter(
              (t) => t.board.id !== boardId,
            ),
          }))
        },

        restoreRow: (rowId) => {
          set((s) => {
            const trashed = s.trashedRows.find((t) => t.row.id === rowId)
            if (!trashed) return s
            const target = s.boards[trashed.boardId]
            if (!target) {
              // 보드 자체가 사라졌으면 row 복원 불가 — 휴지통에선 제거
              return {
                trashedRows: s.trashedRows.filter((t) => t.row.id !== rowId),
              }
            }
            return {
              boards: {
                ...s.boards,
                [trashed.boardId]: {
                  ...target,
                  rows: [...target.rows, trashed.row],
                  updatedAt: nowIso(),
                },
              },
              trashedRows: s.trashedRows.filter((t) => t.row.id !== rowId),
            }
          })
        },

        permanentDeleteRow: (rowId) => {
          set((s) => ({
            trashedRows: s.trashedRows.filter((t) => t.row.id !== rowId),
          }))
        },

        emptyTrash: () => set({ trashedBoards: [], trashedRows: [] }),

        cleanupExpiredTrash: () => {
          const cutoff = Date.now() - TRASH_EXPIRY_MS
          set((s) => ({
            trashedBoards: s.trashedBoards.filter(
              (t) => new Date(t.deletedAt).getTime() >= cutoff,
            ),
            trashedRows: s.trashedRows.filter(
              (t) => new Date(t.deletedAt).getTime() >= cutoff,
            ),
          }))
        },

        updateSettings: (patch) =>
          set((s) => ({ settings: { ...s.settings, ...patch } })),

        setSchemaPosition: (boardId, pos) =>
          set((s) => ({
            schemaPositions: { ...s.schemaPositions, [boardId]: pos },
          })),
        resetSchemaPositions: () => set({ schemaPositions: {} }),

        // Automations — rule 토글: active ↔ paused. draft는 따로 명시적 변경.
        toggleAutomationStatus: (id) =>
          set((s) => ({
            automations: s.automations.map((r) => {
              if (r.id !== id) return r
              const next =
                r.status === "active"
                  ? "paused"
                  : r.status === "paused"
                    ? "active"
                    : "active"
              return { ...r, status: next }
            }),
          })),

        deleteAutomation: (id) =>
          set((s) => ({
            automations: s.automations.filter((r) => r.id !== id),
          })),

        // 테스트 실행 — runsThisWeek++, lastRun = "just now".
        // 실제 트리거 매치 로직은 future work (rule-engine.jsx). 이건 visual proof.
        testRunAutomation: (id) =>
          set((s) => ({
            automations: s.automations.map((r) =>
              r.id === id
                ? {
                    ...r,
                    runsThisWeek: r.runsThisWeek + 1,
                    lastRun: "just now",
                  }
                : r,
            ),
          })),

        // Suggestion accept — 새 룰로 promote (간소화: name/desc 기반 빈 룰).
        acceptSuggestion: (id) =>
          set((s) => {
            const sug = s.suggestedAutomations.find((x) => x.id === id)
            if (!sug) return s
            const newRule = {
              id: `AUT-${Date.now().toString(36).slice(-6)}`,
              name: sug.summary,
              when: {
                table: "—",
                event: "manual trigger",
                value: "(needs configuration)",
              },
              then: [
                {
                  action: "Configure",
                  target: "this automation",
                  detail: sug.detail,
                },
              ],
              status: "draft" as const,
              aiSuggested: true,
              runsThisWeek: 0,
              lastRun: "never",
            }
            return {
              automations: [newRule, ...s.automations],
              suggestedAutomations: s.suggestedAutomations.filter(
                (x) => x.id !== id,
              ),
            }
          }),

        dismissSuggestion: (id) =>
          set((s) => ({
            suggestedAutomations: s.suggestedAutomations.filter(
              (x) => x.id !== id,
            ),
          })),

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

        addColumn: (col) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          // 중복 이름 방어 — "name", "name 2", "name 3" 순으로 자동 증가
          let name = col.name
          let label = col.label || col.name
          let n = 2
          while (b.columns.some((c) => c.name === name)) {
            name = `${col.name}_${n}`
            label = `${col.label || col.name} ${n}`
            n += 1
          }
          const newCol: ColumnDef = { ...col, name, label }
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                columns: [...b.columns, newCol],
                updatedAt: nowIso(),
              },
            },
          })
        },

        deleteColumn: (colName) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          if (colName === "id") return // id 컬럼 보호
          // 행에서 해당 키 제거
          const newRows: TableRow[] = b.rows.map((r) => {
            const next: TableRow = { ...r }
            delete next[colName]
            return next
          })
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                columns: b.columns.filter((c) => c.name !== colName),
                rows: newRows,
                updatedAt: nowIso(),
              },
            },
          })
        },

        renameColumn: (colName, newName, newLabel) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          if (colName === "id") return
          if (!newName.trim()) return
          // 키 충돌 방어
          if (
            newName !== colName &&
            b.columns.some((c) => c.name === newName)
          ) {
            return
          }
          const newCols: ColumnDef[] = b.columns.map((c) =>
            c.name === colName
              ? {
                  ...c,
                  name: newName,
                  label: newLabel?.trim() || newName,
                }
              : c,
          )
          // 행에서 키 migrate (newName !== colName인 경우만)
          const newRows: TableRow[] =
            newName === colName
              ? b.rows
              : b.rows.map((r) => {
                  if (!(colName in r)) return r
                  const next: TableRow = { ...r, [newName]: r[colName] }
                  delete next[colName]
                  return next
                })
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                columns: newCols,
                rows: newRows,
                updatedAt: nowIso(),
              },
            },
          })
        },

        updateColumn: (colName, patch) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                columns: b.columns.map((c) =>
                  c.name === colName ? { ...c, ...patch } : c,
                ),
                updatedAt: nowIso(),
              },
            },
          })
        },

        // Dashboard charts — active board 대상.
        addChart: (chart) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return ""
          const id = `chart-${Date.now().toString(36).slice(-6)}`
          const full: ChartConfig = { ...chart, id }
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                charts: [...(b.charts ?? []), full],
                updatedAt: nowIso(),
              },
            },
          })
          return id
        },
        removeChart: (chartId) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                charts: (b.charts ?? []).filter((c) => c.id !== chartId),
                updatedAt: nowIso(),
              },
            },
          })
        },
        updateChart: (chartId, patch) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                charts: (b.charts ?? []).map((c) =>
                  c.id === chartId ? { ...c, ...patch } : c,
                ),
                updatedAt: nowIso(),
              },
            },
          })
        },
        clearCustomCharts: () => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          set({
            boards: {
              ...s.boards,
              [b.id]: { ...b, charts: [], updatedAt: nowIso() },
            },
          })
        },

        // 컬럼을 Library Field로 승격 — usedIn 트래킹. 이미 승격됐으면 기존 id 반환.
        promoteColumnToLibraryField: (colName) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return null
          const col = b.columns.find((c) => c.name === colName)
          if (!col) return null
          if (col.libraryFieldId) return col.libraryFieldId
          const fieldId = `fld-${Date.now().toString(36).slice(-6)}`
          const newField = {
            id: fieldId,
            name: col.label || col.name,
            type: col.type,
            desc: `Promoted from ${b.label}.${col.name}`,
            usedIn: [`${b.label}.${col.name}`],
            config: col.options
              ? {
                  options: col.options.map((o) => ({
                    id: o.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    label: o,
                    color: "var(--chart-1)",
                  })),
                }
              : {},
          }
          set({
            library: {
              ...s.library,
              fields: [...s.library.fields, newField],
            },
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                columns: b.columns.map((c) =>
                  c.name === colName ? { ...c, libraryFieldId: fieldId } : c,
                ),
                updatedAt: nowIso(),
              },
            },
          })
          return fieldId
        },

        attachFunctionToColumn: (colName, functionId) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                columns: b.columns.map((c) =>
                  c.name === colName
                    ? { ...c, functionId: functionId ?? undefined }
                    : c,
                ),
                updatedAt: nowIso(),
              },
            },
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
          publishChange(set, {
            kind: "row_added",
            boardId: b.id,
            rowId: id,
            next: newRow,
          })
          return id
        },

        // 명시 boardId — 자동화 "Add row to Tasks" 처리용. activeBoard 우회.
        addRowToBoard: (boardId, row) => {
          const s = get()
          const b = s.boards[boardId]
          if (!b) return null
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
          set({
            boards: {
              ...s.boards,
              [boardId]: {
                ...b,
                rows: [...b.rows, newRow],
                updatedAt: ts,
              },
            },
          })
          publishChange(set, {
            kind: "row_added",
            boardId,
            rowId: id,
            next: newRow,
          })
          return id
        },

        // 행 복제 — id 새로 발급, 나머지 값 + AI confirmed 플래그 유지.
        duplicateRow: (rowId) => {
          const b = activeBoard()
          if (!b) return null
          const src = b.rows.find((r) => r.id === rowId)
          if (!src) return null
          pushUndo()
          const ts = nowIso()
          const newId = nextRowId(b)
          const dup: TableRow = {
            ...src,
            id: newId,
            createdAt: ts,
            updatedAt: ts,
          }
          // 원본 다음 위치에 삽입
          const idx = b.rows.findIndex((r) => r.id === rowId)
          const next = [...b.rows]
          next.splice(idx + 1, 0, dup)
          setRows(next)
          publishChange(set, {
            kind: "row_added",
            boardId: b.id,
            rowId: newId,
            next: dup,
          })
          return newId
        },

        updateRow: (rowId, patch) => {
          const b = activeBoard()
          if (!b) return
          const prev = b.rows.find((r) => r.id === rowId)
          if (!prev) return
          pushUndo()
          const next: TableRow = { ...prev, ...patch, updatedAt: nowIso() }
          setRows(b.rows.map((r) => (r.id === rowId ? next : r)))
          publishChange(set, {
            kind: "row_updated",
            boardId: b.id,
            rowId,
            prev,
            next,
          })
        },

        deleteRows: (rowIds) => {
          const b = activeBoard()
          if (!b || rowIds.length === 0) return
          pushUndo()
          const targets = new Set(rowIds)
          const movedToTrash: TrashedRow[] = b.rows
            .filter((r) => targets.has(r.id))
            .map((row) => ({
              boardId: b.id,
              boardLabel: b.label,
              row,
              deletedAt: nowIso(),
            }))
          setRows(b.rows.filter((r) => !targets.has(r.id)))
          set((s) => ({
            selectedRowIds: s.selectedRowIds.filter((id) => !targets.has(id)),
            trashedRows: [...movedToTrash, ...s.trashedRows],
          }))
        },

        // AI 추천 수용 — 값 설정 + confirmed=true
        commitAiCell: (rowId, col, value) => {
          const b = activeBoard()
          if (!b) return
          const prev = b.rows.find((r) => r.id === rowId)
          if (!prev) return
          pushUndo()
          const confirmKey =
            col === "theme" ? "themeConfirmed" : "sentimentConfirmed"
          const next: TableRow = {
            ...prev,
            [col]: value,
            [confirmKey]: true,
            updatedAt: nowIso(),
          }
          setRows(b.rows.map((r) => (r.id === rowId ? next : r)))
          publishChange(set, {
            kind: "row_updated",
            boardId: b.id,
            rowId,
            prev,
            next,
          })
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
        setActivityMode: (activityMode) => {
          set({ activityMode })
          pushNav()
        },
        setActiveWorkspaceItem: (activeWorkspaceItem) => {
          set({ activeWorkspaceItem })
          pushNav()
        },
        setWikiPage: (wikiSelectedId) => {
          set({ wikiSelectedId })
          pushNav()
        },
        updateWikiPage: (id, patch) =>
          set((s) => ({
            wikiPages: s.wikiPages.map((p) =>
              p.id === id ? { ...p, ...patch } : p,
            ),
          })),
        addWikiPage: (init) => {
          const today = new Date().toISOString().slice(0, 10)
          const id = `wiki-${Date.now().toString(36).slice(-6)}`
          const newPage: WikiPage = {
            id,
            title: init?.title ?? "Untitled page",
            category: init?.category ?? "Uncategorized",
            owner: init?.owner ?? "peter",
            verified: false,
            verifiedAt: null,
            expiresAt: null,
            updatedAt: today,
            body: init?.body ?? "# Untitled\n\nStart writing…",
          }
          set((s) => ({
            wikiPages: [newPage, ...s.wikiPages],
            wikiSelectedId: id,
          }))
          return id
        },
        deleteWikiPage: (id) =>
          set((s) => {
            const remaining = s.wikiPages.filter((p) => p.id !== id)
            return {
              wikiPages: remaining,
              wikiSelectedId:
                s.wikiSelectedId === id
                  ? (remaining[0]?.id ?? null)
                  : s.wikiSelectedId,
            }
          }),
        setLibCategory: (libCategory) => {
          set({ libCategory, libAssetId: null })
          pushNav()
        },
        setLibAsset: (libAssetId) => {
          set({ libAssetId })
          pushNav()
        },
        setLibView: (libView) => set({ libView }),
        selectAsset: (libCategory, libAssetId) => {
          set({ libCategory, libAssetId })
          pushNav()
        },

        // nav-history — applyNavEntry는 set만 호출 (pushNav ❌, replay)
        goBack: () => {
          const s = get()
          if (s.navIndex <= 0) return
          const entry = s.navStack[s.navIndex - 1]
          applyNavEntry(entry)
          set({ navIndex: s.navIndex - 1 })
        },
        goForward: () => {
          const s = get()
          if (s.navIndex >= s.navStack.length - 1) return
          const entry = s.navStack[s.navIndex + 1]
          applyNavEntry(entry)
          set({ navIndex: s.navIndex + 1 })
        },
        jumpToNavEntry: (index) => {
          const s = get()
          if (index < 0 || index >= s.navStack.length) return
          applyNavEntry(s.navStack[index])
          set({ navIndex: index })
        },
        setSearch: (search) => set({ search }),
        setFilter: (filter) => set({ filter }),
        setColumnFilter: (col, values) =>
          set((s) => {
            const next = { ...s.columnFilters }
            if (values.length === 0) {
              delete next[col]
            } else {
              next[col] = values
            }
            return { columnFilters: next }
          }),
        toggleColumnFilter: (col, value) =>
          set((s) => {
            const cur = s.columnFilters[col] ?? []
            const has = cur.includes(value)
            const nextVals = has
              ? cur.filter((v) => v !== value)
              : [...cur, value]
            const next = { ...s.columnFilters }
            if (nextVals.length === 0) {
              delete next[col]
            } else {
              next[col] = nextVals
            }
            return { columnFilters: next }
          }),
        clearAllFilters: () => set({ filter: [], columnFilters: {} }),
        setSort: (sort) => set({ sort }),
        setSelected: (selectedRowIds) => set({ selectedRowIds }),
        setFocused: (focusedCell) => set({ focusedCell }),
        setSearchOpen: (searchOpen) => set({ searchOpen }),
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
      //   v6 → v7: trashedBoards · settings
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
        if (version < 7) {
          s.trashedBoards = s.trashedBoards ?? []
          s.settings = s.settings ?? {
            workspaceLabel: "peter's workspace",
            workspaceInitial: "P",
          }
        }
        if (version < 8) {
          s.schemaPositions = s.schemaPositions ?? {}
        }
        if (version < 9) {
          s.trashedRows = s.trashedRows ?? []
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
        trashedBoards: s.trashedBoards,
        trashedRows: s.trashedRows,
        settings: s.settings,
        schemaPositions: s.schemaPositions,
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

  // Legacy status chips
  if (state.filter.length > 0) {
    const allowed = new Set<string>(state.filter)
    rows = rows.filter((r) => allowed.has(String(r.status ?? "")))
  }

  // 다중 필드 필터 (columnFilters)
  for (const [col, values] of Object.entries(state.columnFilters)) {
    if (values.length === 0) continue
    const allowed = new Set(values)
    rows = rows.filter((r) => allowed.has(String(r[col] ?? "")))
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
