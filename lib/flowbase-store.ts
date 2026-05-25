"use client"

// FlowBase V2 — zustand 스토어 (보드·행·시트 UI 상태 + localStorage persist)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §4
// 출처: design-ref/prototype/prototype-app.jsx
// 데이터 모델: 제네릭 컬럼 구동 (types/flowbase.ts). theme은 next-themes 소유.

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { toast } from "sonner"
import type {
  ActiveWorkspaceItem,
  ActivityMode,
  AIHistoryEntry,
  Board,
  ChangeEvent,
  ChartConfig,
  ColumnDef,
  ColumnType,
  EventKind,
  ExportedSnapshot,
  FilterCondition,
  FlowBaseState,
  LibraryCategoryId,
  MemoryEntry,
  NavEntry,
  PageRevision,
  RecentFilterSnapshot,
  RecentSortSnapshot,
  Snapshot,
  SnapshotState,
  SortDir,
  TableRow,
  TicketStatus,
  MemberRole,
  TrashedBoard,
  TrashedRow,
  TrashedWikiPage,
  ViewMode,
  ViewSettings,
  TimestampedEvent,
  WikiPage,
  WorkspaceMember,
  WorkspaceMemory,
  WorkspaceSettings,
} from "@/types/flowbase"
import { roleCanEdit } from "@/types/flowbase"
import {
  coerceMultiValue,
  multiFirst,
  multiToSingle,
  singleToMulti,
} from "@/lib/multi-select"
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
const STORE_VERSION = 16 // v16: snapshots 추가 (GitHub 식 명시 save point · 사용자 클릭 → deep state copy)

// 초기 시드 멤버 — 데모용 4명. 사용자는 Owner. lastSeenAt mock.
function createSeedMembers(): WorkspaceMember[] {
  const today = new Date().toISOString().slice(0, 10)
  const nowIso = new Date().toISOString()
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
  const twoHrAgo = new Date(Date.now() - 2 * 3600_000).toISOString()
  const yesterday = new Date(Date.now() - 86_400_000).toISOString()
  return [
    { id: "mem-peter", name: "peter", email: "peter@flowbase.app", initial: "P", role: "owner", joinedAt: today, lastSeenAt: nowIso },
    { id: "mem-jisoo", name: "Jisoo Kim", email: "jisoo@flowbase.app", initial: "J", role: "admin", joinedAt: today, lastSeenAt: fiveMinAgo },
    { id: "mem-min", name: "Min Park", email: "min@flowbase.app", initial: "M", role: "member", joinedAt: today, lastSeenAt: twoHrAgo },
    { id: "mem-rina", name: "Rina Lee", email: "rina@flowbase.app", initial: "R", role: "viewer", joinedAt: today, lastSeenAt: yesterday },
  ]
}

const TRASH_EXPIRY_MS = 30 * 86_400_000 // 30 days

function nowIso(): string {
  return new Date().toISOString()
}

// ─── Members role enforcement helper ────────────────────────────────
// viewer는 콘텐츠 mutation 차단. UI/view 상태(panels/filter/search/sort/viewSettings/
// selected/focused/nav)는 자기 화면이라 viewer도 허용.
// toast id로 폭주 방지 — 같은 id면 sonner가 새 토스트 안 만들고 기존 거 update.
const VIEWER_TOAST_ID = "viewer-readonly"

function isViewer(s: FlowBaseState): boolean {
  if (!s.settings) return false
  const cur = s.settings.members.find(
    (m) => m.id === s.settings.currentUserId,
  )
  return !!cur && !roleCanEdit(cur.role)
}

function ensureCanEdit(s: FlowBaseState, action?: string): boolean {
  if (!isViewer(s)) return true
  toast.warning("Viewers can't edit", {
    id: VIEWER_TOAST_ID,
    description: action
      ? `"${action}" is disabled in viewer mode.`
      : "Switch to an editor role (Member/Admin/Owner) to make changes.",
  })
  return false
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
  restoreWikiPage: (pageId: string) => void
  permanentDeleteWikiPage: (pageId: string) => void
  emptyTrash: () => void
  // 30일 만료 자동 정리 (mount 시 호출 권장)
  cleanupExpiredTrash: () => void

  // Settings
  updateSettings: (patch: Partial<WorkspaceSettings>) => void

  // Members — mock 멤버/권한. Owner는 변경/삭제 ❌.
  addMember: (init: { name: string; email: string; role: MemberRole }) => string
  updateMemberRole: (id: string, role: MemberRole) => void
  removeMember: (id: string) => void

  // Data export — 전체 store 상태(persisted slice)를 JSON 문자열로.
  exportData: () => string
  // Data import — exported snapshot의 모든 메타 머지. id 충돌 정책:
  //   - boards: 새 id 부여 (always add)
  //   - library/wiki/automations: id 일치 항목 skip (no overwrite)
  // 반환: 머지 카운트 요약.
  importWorkspace: (snapshot: ExportedSnapshot) => {
    boards: number
    library: number
    wiki: number
    automations: number
    // id 충돌로 skip된 항목 (boards는 새 id로 항상 추가라 skip ❌)
    skipped: {
      library: number
      wiki: number
      automations: number
    }
  }

  // Schema positions
  setSchemaPosition: (boardId: string, pos: { x: number; y: number }) => void
  resetSchemaPositions: () => void

  // View Display 옵션 — active board + 특정 view section 부분 patch.
  // patch = undefined인 키는 유지. view 키 자체 reset은 명시 빈 객체 전달.
  setViewOption: <K extends keyof ViewSettings>(
    view: K,
    patch: Partial<NonNullable<ViewSettings[K]>>,
  ) => void
  resetViewOption: (view: keyof ViewSettings) => void

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
  moveChart: (chartId: string, direction: "up" | "down") => void
  clearCustomCharts: () => void
  // Library promotion: 현재 active board의 컬럼을 LibraryField로 승격.
  promoteColumnToLibraryField: (colName: string) => string | null
  attachFunctionToColumn: (colName: string, functionId: string | null) => void
  // F2: Library Field에 옵션 추가. config.optionListId 있으면 OptionList sync, 없으면 인라인.
  // 호출 시 명시 ✅ (자동 promote ❌, LOCK). cell editor "+"/promote toast가 사용.
  addOptionToLibraryField: (fieldId: string, value: string) => boolean

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
  // 다중 필드 필터 — 컬럼당 multiple condition (AND). FilterCondition discriminated union.
  // setColumnCondition: 인덱스 명시 — 0 = 단일 cond 자리 (legacy single-cond 호출처 호환).
  setColumnCondition: (col: string, cond: FilterCondition | null, index?: number) => void
  // 'in' 전용 편의 액션 (FilterMenu 체크박스 토글) — 첫 번째 in/not_in cond에 적용.
  toggleColumnInValue: (col: string, value: string) => void
  // 컬럼에 새 condition 추가 (AND).
  addColumnCondition: (col: string, cond: FilterCondition) => void
  // 컬럼의 index번째 condition 제거.
  removeColumnCondition: (col: string, index: number) => void
  clearAllFilters: () => void
  setSort: (s: FlowBaseState["sort"]) => void
  setSelected: (ids: string[]) => void
  setFocused: (cell: FlowBaseState["focusedCell"]) => void
  setSearchOpen: (open: boolean) => void
  togglePanel: (k: keyof FlowBaseState["panels"]) => void
  showAllPanels: () => void
  hideAllPanels: () => void

  // Ask AI 진입 — 헤더 버튼/⌘J 단축키 양쪽에서 호출. AI 패널 보장 + composer focus.
  requestAskAi: () => void

  // Snapshots — GitHub 식 명시 save point (Key Design #18).
  // saveSnapshot: 현재 워크스페이스 deep copy + snapshots 배열 맨 앞에 push. 반환 = 새 id (실패 시 "").
  saveSnapshot: (label: string, description?: string) => string
  // restoreSnapshot: 현재 상태를 자동 새 snapshot으로 save 후 target 시점으로 복원. 반환 = 성공 여부.
  //   - events는 복원 ❌ (timeline append-only) — snapshot_restored 이벤트만 push.
  //   - 활성 보드가 복원된 boards에 없으면 첫 보드로 fallback.
  //   - ephemeral(selectedRowIds/focusedCell/columnFilters)는 reset, undo 스택 clear.
  restoreSnapshot: (id: string) => boolean
  deleteSnapshot: (id: string) => void
  renameSnapshot: (id: string, label: string, description?: string) => void
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
    trashedWikiPages: [],
    settings: {
      workspaceLabel: "peter's workspace",
      workspaceInitial: "P",
      members: createSeedMembers(),
      currentUserId: "mem-peter",
    },
    schemaPositions: {},
    viewSettings: {},
    workspaceMemory: { byScope: {}, recentFilters: [], recentSorts: [] },
    events: [],
    snapshots: [],
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
    askAiFocusToken: 0,
  }
}

// ─── EventStore — 통합 액션 timeline ───
// LOCK: append-only · 90일 expire · 1000개 cap. Phase A에선 추가만, 기존 store 변경 ❌.
// 향후 Workspace > History · Detail Activity · AI Timeline 모두 이 source에서 derive.

const EVENT_EXPIRE_MS = 90 * 24 * 60 * 60 * 1000 // 90일
const EVENT_CAP = 1000

function makeEventId(ts: number): string {
  return `evt-${ts.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function appendEvent(events: TimestampedEvent[], next: TimestampedEvent): TimestampedEvent[] {
  const cutoff = Date.now() - EVENT_EXPIRE_MS
  const merged = [...events, next].filter((e) => e.ts > cutoff)
  // cap: 오래된 것부터 잘림 (배열 끝이 최신)
  return merged.length > EVENT_CAP ? merged.slice(-EVENT_CAP) : merged
}

function publishChange(
  set: (partial: Partial<FlowBaseState>) => void,
  get: () => FlowBaseState,
  event: Omit<ChangeEvent, "timestamp">,
): void {
  const ts = Date.now()
  // ephemeral — 자동화 트리거 (lib/automation-runtime)
  set({ lastChange: { ...event, timestamp: ts } })
  // persist — EventStore에 동시 push (Phase A)
  const s = get()
  set({
    events: appendEvent(s.events, {
      id: makeEventId(ts),
      ts,
      kind: event.kind,
      boardId: event.boardId,
      rowId: event.rowId,
      prev: event.prev,
      next: event.next,
    }),
  })
}

// ─── Snapshots helper ───
// 현재 store 상태에서 SnapshotState slice 추출. Save/Restore에서 deep copy 대상.
// events/undo/ephemeral 슬라이스는 제외 (snapshot 의미 — 사용자 데이터만).
function snapshotStateFromStore(s: FlowBaseState): SnapshotState {
  return {
    boards: s.boards,
    library: s.library,
    wikiPages: s.wikiPages,
    automations: s.automations,
    suggestedAutomations: s.suggestedAutomations,
    trashedBoards: s.trashedBoards,
    trashedRows: s.trashedRows,
    trashedWikiPages: s.trashedWikiPages,
    settings: s.settings,
    schemaPositions: s.schemaPositions,
    viewSettings: s.viewSettings,
  }
}

// ─── Workspace Memory — 자동 학습 cache ───
// LOCK: Memory ≠ Library. 자동 학습, frequency 2+ 부터 노출(selector), 30일 expire + 50개 cap.
// scope 키 = `{colName}::{libraryFieldId ?? "_"}` — 같은 colName이라도 다른 LibraryField면 격리.
// 학습 대상 type: text · select · status · multiSelect (배열 unpack).
// num/date/email/avatar/reaction/button/fk 제외.

const MEMORY_EXPIRE_MS = 30 * 24 * 60 * 60 * 1000 // 30일
const MEMORY_CAP_PER_SCOPE = 50
const MEMORY_LEARN_TYPES = new Set<ColumnType>([
  "text",
  "select",
  "status",
  "multiSelect",
])
// B1-3: frequency 도달 시 Library promote bridge toast 권유. LOCK: 자동 등록 ❌, 명시 click 시만.
const PROMOTE_BRIDGE_COUNT = 5

// B1-1/B1-2: recent filter/sort 자동 학습. debounce 2s + JSON dedupe + 최대 10개.
// LOCK: 자동 학습이지만 사용자 부담 0 — 변경 후 짧은 멈춤 = "확정"으로 추정.
const RECENT_LEARN_DEBOUNCE_MS = 2000
const RECENT_CAP = 10
let _filterLearnTimer: ReturnType<typeof setTimeout> | null = null
let _sortLearnTimer: ReturnType<typeof setTimeout> | null = null

function scheduleLearnRecentFilter(): void {
  if (_filterLearnTimer) clearTimeout(_filterLearnTimer)
  _filterLearnTimer = setTimeout(() => {
    const s = useFlowBase.getState()
    const empty = Object.keys(s.columnFilters).length === 0
    if (empty) return
    const snapshot: RecentFilterSnapshot = {
      ts: Date.now(),
      boardId: s.activeBoardId,
      conditions: { ...s.columnFilters },
    }
    const key = JSON.stringify({ b: snapshot.boardId, c: snapshot.conditions })
    const existing = s.workspaceMemory.recentFilters.filter(
      (r) => JSON.stringify({ b: r.boardId, c: r.conditions }) !== key,
    )
    const next = [snapshot, ...existing].slice(0, RECENT_CAP)
    useFlowBase.setState({
      workspaceMemory: { ...s.workspaceMemory, recentFilters: next },
    })
  }, RECENT_LEARN_DEBOUNCE_MS)
}

function scheduleLearnRecentSort(): void {
  if (_sortLearnTimer) clearTimeout(_sortLearnTimer)
  _sortLearnTimer = setTimeout(() => {
    const s = useFlowBase.getState()
    if (!s.sort) return
    const snapshot: RecentSortSnapshot = {
      ts: Date.now(),
      boardId: s.activeBoardId,
      sort: s.sort,
    }
    const key = JSON.stringify({ b: snapshot.boardId, s: snapshot.sort })
    const existing = s.workspaceMemory.recentSorts.filter(
      (r) => JSON.stringify({ b: r.boardId, s: r.sort }) !== key,
    )
    const next = [snapshot, ...existing].slice(0, RECENT_CAP)
    useFlowBase.setState({
      workspaceMemory: { ...s.workspaceMemory, recentSorts: next },
    })
  }, RECENT_LEARN_DEBOUNCE_MS)
}

function memoryScopeKey(col: ColumnDef): string {
  return `${col.name}::${col.libraryFieldId ?? "_"}`
}

// 한 행의 patch를 학습. 변경된 컬럼별 값을 scope별로 누적.
function learnFromPatch(
  state: FlowBaseState,
  boardId: string,
  patch: Record<string, unknown>,
): WorkspaceMemory {
  const board = state.boards[boardId]
  if (!board) return state.workspaceMemory
  const now = Date.now()
  const cutoff = now - MEMORY_EXPIRE_MS
  const byScope = { ...state.workspaceMemory.byScope }

  for (const [colName, raw] of Object.entries(patch)) {
    const col = board.columns.find((c) => c.name === colName)
    if (!col || !MEMORY_LEARN_TYPES.has(col.type)) continue
    // multiSelect는 array — 각 원소를 별 학습. 그 외는 단일 string.
    const valuesToLearn: string[] = []
    if (col.type === "multiSelect") {
      for (const item of coerceMultiValue(raw)) {
        const trimmed = item.trim()
        if (trimmed) valuesToLearn.push(trimmed)
      }
    } else {
      if (typeof raw !== "string") continue
      const trimmed = raw.trim()
      if (trimmed) valuesToLearn.push(trimmed)
    }
    if (valuesToLearn.length === 0) continue
    const scope = memoryScopeKey(col)
    const list = byScope[scope] ? [...byScope[scope]] : []
    for (const value of valuesToLearn) {
      const idx = list.findIndex((e) => e.value === value)
      let nextCount: number
      if (idx >= 0) {
        nextCount = list[idx].count + 1
        list[idx] = {
          ...list[idx],
          count: nextCount,
          lastUsedTs: now,
        }
      } else {
        nextCount = 1
        list.push({ value, count: 1, lastUsedTs: now })
      }

      // B1-3: promote bridge toast — frequency 정확 5 도달 시 + col.options에 없으면 권유.
      // toast click 시 col.options에 추가 (A3-1과 같은 동작, "Save as option" 자동 진입점).
      // LOCK: 자동 등록 ❌, 명시 click 시만. dedupe = toast id로 같은 (scope,value) 중복 ❌.
      if (
        nextCount === PROMOTE_BRIDGE_COUNT &&
        !(col.options ?? []).includes(value)
      ) {
        const colName_ = col.name
        const colLabel = col.label || col.name
        const boardId_ = boardId
        toast(`"${value}" used ${PROMOTE_BRIDGE_COUNT} times`, {
          id: `promote-${scope}-${value}`,
          description: `Save to ${colLabel} options?`,
          action: {
            label: "Save",
            onClick: () => {
              const s = useFlowBase.getState()
              const b = s.boards[boardId_]
              const c = b?.columns.find((x) => x.name === colName_)
              if (!c) return
              const existing = c.options ?? []
              if (existing.includes(value)) {
                toast.info(`Already in ${colLabel} options.`)
                return
              }
              // updateColumn은 activeBoard 기준이라 boardId 일치 확인 — 안 맞으면 직접 set
              if (s.activeBoardId === boardId_) {
                s.updateColumn(colName_, { options: [...existing, value] })
              } else {
                // 다른 보드 — 직접 patch (드문 케이스, ensureCanEdit 우회)
                useFlowBase.setState({
                  boards: {
                    ...s.boards,
                    [boardId_]: {
                      ...b!,
                      columns: b!.columns.map((x) =>
                        x.name === colName_
                          ? { ...x, options: [...existing, value] }
                          : x,
                      ),
                      updatedAt: new Date().toISOString(),
                    },
                  },
                })
              }
              // F2: col.libraryFieldId 있으면 Library OptionList에도 sync
              let libSynced = false
              if (c.libraryFieldId) {
                libSynced = useFlowBase
                  .getState()
                  .addOptionToLibraryField(c.libraryFieldId, value)
              }
              toast.success(
                libSynced
                  ? `Saved "${value}" to ${colLabel} + Library`
                  : `Saved "${value}" to ${colLabel}`,
              )
            },
          },
        })
      }
    }
    // expire + cap: 30일 이전 제거 + lastUsed 기준 상위 N개. 컬럼 단위로 한 번에 적용.
    const filtered = list
      .filter((e) => e.lastUsedTs > cutoff)
      .sort((a, b) => b.lastUsedTs - a.lastUsedTs)
      .slice(0, MEMORY_CAP_PER_SCOPE)
    byScope[scope] = filtered
  }
  return {
    byScope,
    recentFilters: state.workspaceMemory.recentFilters,
    recentSorts: state.workspaceMemory.recentSorts,
  }
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
          if (!ensureCanEdit(get(), "Create board")) return ""
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
          if (!ensureCanEdit(get(), "Delete board")) return
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
          if (!ensureCanEdit(get(), "Restore board")) return
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
          if (!ensureCanEdit(get(), "Permanently delete board")) return
          set((s) => {
            // dangling viewSettings · schemaPositions · viewByBoardId cleanup
            const nextViewSettings = { ...s.viewSettings }
            delete nextViewSettings[boardId]
            const nextSchemaPositions = { ...s.schemaPositions }
            delete nextSchemaPositions[boardId]
            const nextViewByBoardId = { ...s.viewByBoardId }
            delete nextViewByBoardId[boardId]
            return {
              trashedBoards: s.trashedBoards.filter(
                (t) => t.board.id !== boardId,
              ),
              viewSettings: nextViewSettings,
              schemaPositions: nextSchemaPositions,
              viewByBoardId: nextViewByBoardId,
            }
          })
          // 자동화 firedKeys 중 이 boardId 포함된 dueDate 키 cleanup
          // (key 형식: `${ruleId}:${boardId}:${rowId}` — daily는 영향 ❌)
          // 변경 후 automation-runtime의 in-memory ref도 sync 필요 → CustomEvent dispatch.
          try {
            const raw = localStorage.getItem(
              "flowbase-automation-firedKeys-v1",
            )
            if (!raw) return
            const arr = JSON.parse(raw)
            if (!Array.isArray(arr)) return
            const filtered = (arr as string[]).filter((k) => {
              const parts = k.split(":")
              return parts.length !== 3 || parts[1] !== boardId
            })
            if (filtered.length !== arr.length) {
              localStorage.setItem(
                "flowbase-automation-firedKeys-v1",
                JSON.stringify(filtered),
              )
              // runtime ref 즉시 reload — 다음 1분 tick 기다림 ❌
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("flowbase-firedkeys-changed"),
                )
              }
            }
          } catch {
            // silent — quota 등
          }
        },

        restoreRow: (rowId) => {
          if (!ensureCanEdit(get(), "Restore row")) return
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
          if (!ensureCanEdit(get(), "Permanently delete row")) return
          set((s) => ({
            trashedRows: s.trashedRows.filter((t) => t.row.id !== rowId),
          }))
        },

        restoreWikiPage: (pageId) => {
          if (!ensureCanEdit(get(), "Restore wiki page")) return
          set((s) => {
            const trashed = s.trashedWikiPages.find(
              (t) => t.page.id === pageId,
            )
            if (!trashed) return s
            // 같은 id가 이미 있으면(드물지만) 중복 ❌ — trash에서만 빼고 끝.
            if (s.wikiPages.some((p) => p.id === pageId)) {
              return {
                trashedWikiPages: s.trashedWikiPages.filter(
                  (t) => t.page.id !== pageId,
                ),
              }
            }
            return {
              wikiPages: [trashed.page, ...s.wikiPages],
              trashedWikiPages: s.trashedWikiPages.filter(
                (t) => t.page.id !== pageId,
              ),
            }
          })
        },

        permanentDeleteWikiPage: (pageId) => {
          if (!ensureCanEdit(get(), "Permanently delete wiki page")) return
          set((s) => ({
            trashedWikiPages: s.trashedWikiPages.filter(
              (t) => t.page.id !== pageId,
            ),
          }))
        },

        emptyTrash: () => {
          if (!ensureCanEdit(get(), "Empty trash")) return
          set({ trashedBoards: [], trashedRows: [], trashedWikiPages: [] })
        },

        cleanupExpiredTrash: () => {
          const cutoff = Date.now() - TRASH_EXPIRY_MS
          set((s) => ({
            trashedBoards: s.trashedBoards.filter(
              (t) => new Date(t.deletedAt).getTime() >= cutoff,
            ),
            trashedRows: s.trashedRows.filter(
              (t) => new Date(t.deletedAt).getTime() >= cutoff,
            ),
            trashedWikiPages: s.trashedWikiPages.filter(
              (t) => new Date(t.deletedAt).getTime() >= cutoff,
            ),
          }))
        },

        updateSettings: (patch) => {
          // currentUserId 변경(데모 "Switch to")은 가드 우회 — viewer도 자기 role 둘러보기 가능.
          // 그 외 settings 변경(workspaceLabel/themeAccent 등)은 가드.
          const isOnlySwitch =
            Object.keys(patch).length === 1 && "currentUserId" in patch
          if (!isOnlySwitch && !ensureCanEdit(get(), "Update settings")) return
          set((s) => ({ settings: { ...s.settings, ...patch } }))
        },

        addMember: ({ name, email, role }) => {
          if (!ensureCanEdit(get(), "Add member")) return ""
          const id = `mem-${Date.now().toString(36).slice(-6)}`
          const newMember: WorkspaceMember = {
            id,
            name: name.trim() || "Unnamed",
            email: email.trim(),
            initial: (name.trim()[0] || "?").toUpperCase(),
            role,
            joinedAt: new Date().toISOString().slice(0, 10),
          }
          set((s) => ({
            settings: {
              ...s.settings,
              members: [...s.settings.members, newMember],
            },
          }))
          return id
        },

        updateMemberRole: (id, role) => {
          if (!ensureCanEdit(get(), "Update member role")) return
          set((s) => ({
            settings: {
              ...s.settings,
              members: s.settings.members.map((m) =>
                // Owner role은 변경 ❌ (다른 멤버를 owner로 승격하지도 못함 — 워크스페이스당 1 owner)
                m.id === id && m.role !== "owner" && role !== "owner"
                  ? { ...m, role }
                  : m,
              ),
            },
          }))
        },

        removeMember: (id) => {
          if (!ensureCanEdit(get(), "Remove member")) return
          set((s) => ({
            settings: {
              ...s.settings,
              members: s.settings.members.filter(
                (m) => m.id !== id || m.role === "owner", // Owner 삭제 ❌
              ),
            },
          }))
        },

        importWorkspace: (snapshot) => {
          const emptySummary = {
            boards: 0,
            library: 0,
            wiki: 0,
            automations: 0,
            skipped: { library: 0, wiki: 0, automations: 0 },
          }
          if (!ensureCanEdit(get(), "Import workspace")) {
            return emptySummary
          }
          const s = get()
          const summary = {
            boards: 0,
            library: 0,
            wiki: 0,
            automations: 0,
            skipped: { library: 0, wiki: 0, automations: 0 },
          }

          // 1) Boards — id 충돌 시 새 id, 항상 추가 (skip ❌)
          const nextBoards = { ...s.boards }
          const nextViewByBoardId = { ...s.viewByBoardId }
          for (const [importedId, board] of Object.entries(
            snapshot.boards ?? {},
          )) {
            let id = importedId
            if (nextBoards[id]) {
              id = `${importedId}-imported-${Date.now().toString(36).slice(-4)}-${summary.boards}`
            }
            nextBoards[id] = { ...board, id, updatedAt: nowIso() }
            nextViewByBoardId[id] = nextViewByBoardId[id] ?? "sheet"
            summary.boards += 1
          }

          // 2) Library — 카테고리별 id 일치 항목 skip, 신규만 추가 (skip 카운트 누적)
          const nextLibrary = { ...s.library }
          if (snapshot.library) {
            const merge = <T extends { id: string }>(
              cur: T[],
              incoming: T[] | undefined,
            ): T[] => {
              if (!incoming) return cur
              const existing = new Set(cur.map((x) => x.id))
              const added = incoming.filter((x) => !existing.has(x.id))
              summary.library += added.length
              summary.skipped.library += incoming.length - added.length
              return [...cur, ...added]
            }
            nextLibrary.optionLists = merge(
              nextLibrary.optionLists,
              snapshot.library.optionLists,
            )
            nextLibrary.fields = merge(
              nextLibrary.fields,
              snapshot.library.fields,
            )
            nextLibrary.templates = merge(
              nextLibrary.templates,
              snapshot.library.templates,
            )
            nextLibrary.functions = merge(
              nextLibrary.functions,
              snapshot.library.functions,
            )
            nextLibrary.dashboards = merge(
              nextLibrary.dashboards,
              snapshot.library.dashboards,
            )
          }

          // 3) Wiki — id 일치 skip
          const existingWikiIds = new Set(s.wikiPages.map((p) => p.id))
          const incomingWiki = snapshot.wikiPages ?? []
          const addedWiki = incomingWiki.filter(
            (p) => !existingWikiIds.has(p.id),
          )
          summary.wiki = addedWiki.length
          summary.skipped.wiki = incomingWiki.length - addedWiki.length

          // 4) Automations — id 일치 skip
          const existingAutoIds = new Set(s.automations.map((a) => a.id))
          const incomingAutos = snapshot.automations ?? []
          const addedAutos = incomingAutos.filter(
            (a) => !existingAutoIds.has(a.id),
          )
          summary.automations = addedAutos.length
          summary.skipped.automations = incomingAutos.length - addedAutos.length

          set({
            boards: nextBoards,
            viewByBoardId: nextViewByBoardId,
            library: nextLibrary,
            wikiPages: [...s.wikiPages, ...addedWiki],
            automations: [...s.automations, ...addedAutos],
          })
          return summary
        },

        exportData: () => {
          const s = get()
          // partialize와 같은 슬라이스만 — ephemeral state 제외 (signal-to-noise)
          const snapshot = {
            exportedAt: new Date().toISOString(),
            storeVersion: STORE_VERSION,
            boards: s.boards,
            activeBoardId: s.activeBoardId,
            library: s.library,
            automations: s.automations,
            suggestedAutomations: s.suggestedAutomations,
            wikiPages: s.wikiPages,
            wikiSelectedId: s.wikiSelectedId,
            trashedBoards: s.trashedBoards,
            trashedRows: s.trashedRows,
            trashedWikiPages: s.trashedWikiPages,
            settings: s.settings,
            schemaPositions: s.schemaPositions,
          }
          return JSON.stringify(snapshot, null, 2)
        },

        setSchemaPosition: (boardId, pos) => {
          if (!ensureCanEdit(get(), "Move schema card")) return
          set((s) => ({
            schemaPositions: { ...s.schemaPositions, [boardId]: pos },
          }))
        },
        resetSchemaPositions: () => {
          if (!ensureCanEdit(get(), "Reset schema positions")) return
          set({ schemaPositions: {} })
        },

        setViewOption: (view, patch) => {
          const s = get()
          const boardId = s.activeBoardId
          const cur = s.viewSettings[boardId] ?? {}
          const curView = (cur[view] ?? {}) as Record<string, unknown>
          set({
            viewSettings: {
              ...s.viewSettings,
              [boardId]: {
                ...cur,
                [view]: { ...curView, ...patch },
              },
            },
          })
        },
        resetViewOption: (view) => {
          const s = get()
          const boardId = s.activeBoardId
          const cur = s.viewSettings[boardId] ?? {}
          const next: ViewSettings = { ...cur }
          delete next[view]
          set({
            viewSettings: { ...s.viewSettings, [boardId]: next },
          })
        },

        // Automations — rule 토글: active ↔ paused. draft는 따로 명시적 변경.
        toggleAutomationStatus: (id) => {
          if (!ensureCanEdit(get(), "Toggle automation")) return
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
          }))
        },

        deleteAutomation: (id) => {
          if (!ensureCanEdit(get(), "Delete automation")) return
          set((s) => ({
            automations: s.automations.filter((r) => r.id !== id),
          }))
        },

        // 테스트 실행 — runsThisWeek++, lastRun = "just now".
        // 실제 트리거 매치 로직은 future work (rule-engine.jsx). 이건 visual proof.
        testRunAutomation: (id) => {
          if (!ensureCanEdit(get(), "Test run automation")) return
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
          }))
        },

        // Suggestion accept — 새 룰로 promote (간소화: name/desc 기반 빈 룰).
        acceptSuggestion: (id) => {
          if (!ensureCanEdit(get(), "Accept suggestion")) return
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
          })
        },

        dismissSuggestion: (id) => {
          if (!ensureCanEdit(get(), "Dismiss suggestion")) return
          set((s) => ({
            suggestedAutomations: s.suggestedAutomations.filter(
              (x) => x.id !== id,
            ),
          }))
        },

        renameBoard: (boardId, label) => {
          if (!ensureCanEdit(get(), "Rename board")) return
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
          if (!ensureCanEdit(s, "Add column")) return
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
          if (!ensureCanEdit(s, "Delete column")) return
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
          if (!ensureCanEdit(s, "Rename column")) return
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
          if (!ensureCanEdit(s, "Change column")) return
          // select ⇄ multiSelect type 전환 시 cell value 자동 마이그레이션.
          //   select → multiSelect: 단일 string → [string]
          //   multiSelect → select: array → 첫 값만 (나머지 데이터 손실 → toast 안내)
          // 그 외 type 전환은 cell 변환 ❌ (raw 그대로, UI 단에서 렌더 분기).
          const prevCol = b.columns.find((c) => c.name === colName)
          const prevType = prevCol?.type
          const nextType = patch.type
          let nextRows: TableRow[] = b.rows
          if (prevType && nextType && prevType !== nextType) {
            if (prevType === "select" && nextType === "multiSelect") {
              nextRows = b.rows.map((r) => {
                if (!(colName in r)) return r
                return { ...r, [colName]: singleToMulti(r[colName]) }
              })
            } else if (prevType === "multiSelect" && nextType === "select") {
              let lossy = false
              nextRows = b.rows.map((r) => {
                if (!(colName in r)) return r
                const arr = Array.isArray(r[colName]) ? (r[colName] as unknown[]) : null
                if (arr && arr.length > 1) lossy = true
                return { ...r, [colName]: multiToSingle(r[colName]) }
              })
              if (lossy) {
                toast.warning("Multi-select → Single select: extra values dropped", {
                  id: `migrate-${b.id}-${colName}`,
                  description: `${prevCol?.label || colName}: only the first value of each row was kept.`,
                })
              }
            }
          }
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                columns: b.columns.map((c) =>
                  c.name === colName ? { ...c, ...patch } : c,
                ),
                rows: nextRows,
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
          if (!ensureCanEdit(s, "Add chart")) return ""
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
          if (!ensureCanEdit(s, "Remove chart")) return
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
          if (!ensureCanEdit(s, "Update chart")) return
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
        moveChart: (chartId, direction) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b || !b.charts) return
          if (!ensureCanEdit(s, "Move chart")) return
          const idx = b.charts.findIndex((c) => c.id === chartId)
          if (idx < 0) return
          const next = direction === "up" ? idx - 1 : idx + 1
          if (next < 0 || next >= b.charts.length) return // 양 끝 no-op
          const newCharts = [...b.charts]
          ;[newCharts[idx], newCharts[next]] = [newCharts[next], newCharts[idx]]
          set({
            boards: {
              ...s.boards,
              [b.id]: { ...b, charts: newCharts, updatedAt: nowIso() },
            },
          })
        },
        clearCustomCharts: () => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          if (!ensureCanEdit(s, "Reset charts")) return
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
          if (!ensureCanEdit(s, "Promote column")) return null
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
          if (!ensureCanEdit(s, "Attach function")) return
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

        // F2: Library Field에 옵션 추가. config.optionListId 참조면 OptionList sync, 인라인이면 config.options.
        // 반환: 추가됐으면 true, 이미 있으면 false.
        // LOCK: 명시 호출 시만 (cell editor "+" 버튼 / promote toast). 자동 ❌.
        addOptionToLibraryField: (fieldId, value) => {
          const s = get()
          if (!ensureCanEdit(s, "Add Library option")) return false
          const field = s.library.fields.find((f) => f.id === fieldId)
          if (!field) return false
          const newOptId = `opt-${Date.now().toString(36).slice(-6)}`

          // Case 1: optionListId 참조 — OptionList에 sync
          if (field.config.optionListId) {
            const list = s.library.optionLists.find(
              (l) => l.id === field.config.optionListId,
            )
            if (!list) return false
            if (list.options.some((o) => o.label === value)) return false
            set({
              library: {
                ...s.library,
                optionLists: s.library.optionLists.map((l) =>
                  l.id === list.id
                    ? {
                        ...l,
                        options: [
                          ...l.options,
                          { id: newOptId, label: value, color: "var(--chart-1)" },
                        ],
                      }
                    : l,
                ),
              },
            })
            return true
          }

          // Case 2: 인라인 options — config.options에 추가
          const existing = field.config.options ?? []
          if (existing.some((o) => o.label === value)) return false
          set({
            library: {
              ...s.library,
              fields: s.library.fields.map((f) =>
                f.id === fieldId
                  ? {
                      ...f,
                      config: {
                        ...f.config,
                        options: [
                          ...existing,
                          { id: newOptId, label: value, color: "var(--chart-1)" },
                        ],
                      },
                    }
                  : f,
              ),
            },
          })
          return true
        },

        addRow: (row) => {
          const b = activeBoard()
          if (!b) return row?.id ?? "ROW-100"
          if (!ensureCanEdit(get(), "Add row")) return row?.id ?? ""
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
          set({ workspaceMemory: learnFromPatch(get(), b.id, newRow) })
          publishChange(set, get, {
            kind: "row_added",
            boardId: b.id,
            rowId: id,
            next: newRow,
          })
          return id
        },

        // 명시 boardId — 자동화 "Add row to Tasks" 처리용. activeBoard 우회.
        // 자동화 런타임도 호출하므로 viewer 가드 — 자동화 자체가 viewer에선 발화 ❌.
        addRowToBoard: (boardId, row) => {
          const s = get()
          const b = s.boards[boardId]
          if (!b) return null
          if (!ensureCanEdit(s, "Add row")) return null
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
            workspaceMemory: learnFromPatch(get(), boardId, newRow),
          })
          publishChange(set, get, {
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
          if (!ensureCanEdit(get(), "Duplicate row")) return null
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
          publishChange(set, get, {
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
          if (!ensureCanEdit(get(), "Edit cell")) return
          pushUndo()
          const next: TableRow = { ...prev, ...patch, updatedAt: nowIso() }
          setRows(b.rows.map((r) => (r.id === rowId ? next : r)))
          set({ workspaceMemory: learnFromPatch(get(), b.id, patch) })
          publishChange(set, get, {
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
          if (!ensureCanEdit(get(), "Delete rows")) return
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
          if (!ensureCanEdit(get(), "Accept AI cell")) return
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
          set({ workspaceMemory: learnFromPatch(get(), b.id, { [col]: value }) })
          publishChange(set, get, {
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
          if (!ensureCanEdit(get(), "Dismiss AI cell")) return
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
          if (!ensureCanEdit(get(), "Accept all AI")) return
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
          if (!ensureCanEdit(get(), "Dismiss all AI")) return
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
        // Phase A: events에도 동시 push (kind: ai_infer/ai_ask). 향후 derived view로 통일.
        pushAi: (entry) => {
          const s = get()
          const b = s.boards[s.activeBoardId]
          if (!b) return
          const ts = Date.now()
          const full: AIHistoryEntry = {
            ...entry,
            id: `ai-${ts.toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,
            time: nowIso(),
          }
          const eventKind: EventKind =
            entry.kind === "ask" ? "ai_ask" : "ai_infer"
          set({
            boards: {
              ...s.boards,
              [b.id]: {
                ...b,
                aiHistory: [...b.aiHistory, full],
                updatedAt: nowIso(),
              },
            },
            events: appendEvent(s.events, {
              id: makeEventId(ts),
              ts,
              kind: eventKind,
              boardId: b.id,
              rowIds: entry.rowIds,
              title: entry.title,
              detail: entry.detail,
              status: entry.status,
            }),
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
        updateWikiPage: (id, patch) => {
          if (!ensureCanEdit(get(), "Edit wiki page")) return
          set((s) => ({
            wikiPages: s.wikiPages.map((p) => {
              if (p.id !== id) return p
              // body 또는 title 변경 시 revisions에 prev 보존 (max 20 FIFO).
              // 같은 값으로 set 시 noop.
              const bodyChanged = patch.body !== undefined && patch.body !== p.body
              const titleChanged =
                patch.title !== undefined && patch.title !== p.title
              if (!bodyChanged && !titleChanged) {
                return { ...p, ...patch }
              }
              const prevRev: PageRevision = {
                ts: Date.now(),
                title: p.title,
                body: p.body,
              }
              const revisions = [prevRev, ...(p.revisions ?? [])].slice(0, 20)
              return { ...p, ...patch, revisions }
            }),
          }))
        },
        addWikiPage: (init) => {
          if (!ensureCanEdit(get(), "Add wiki page")) return ""
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
        // 삭제 = trash 이동. 30일 후 cleanupExpiredTrash가 자동 영구 삭제.
        deleteWikiPage: (id) => {
          if (!ensureCanEdit(get(), "Delete wiki page")) return
          set((s) => {
            const target = s.wikiPages.find((p) => p.id === id)
            if (!target) return s
            const remaining = s.wikiPages.filter((p) => p.id !== id)
            return {
              wikiPages: remaining,
              wikiSelectedId:
                s.wikiSelectedId === id
                  ? (remaining[0]?.id ?? null)
                  : s.wikiSelectedId,
              trashedWikiPages: [
                { page: target, deletedAt: nowIso() },
                ...s.trashedWikiPages,
              ],
            }
          })
        },
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
        // condition 단일 슬롯에 set/replace/clear.
        // index=0(default) = 첫 cond. cond=null이면 그 index 제거.
        // 빈 cond(empty values/empty text 등)도 제거 처리.
        setColumnCondition: (col, cond, index = 0) => {
          set((s) => {
            const next = { ...s.columnFilters }
            const list = [...(next[col] ?? [])]
            const isEmpty =
              cond === null ||
              ((cond.kind === "in" || cond.kind === "not_in") &&
                cond.values.length === 0) ||
              (cond.kind === "range" &&
                cond.min === undefined &&
                cond.max === undefined) ||
              (cond.kind === "date-range" && !cond.from && !cond.to) ||
              ((cond.kind === "contains" || cond.kind === "not_contains") &&
                !cond.text.trim())
            if (isEmpty) {
              list.splice(index, 1)
            } else if (index < list.length) {
              list[index] = cond as FilterCondition
            } else {
              list.push(cond as FilterCondition)
            }
            if (list.length === 0) {
              delete next[col]
            } else {
              next[col] = list
            }
            return { columnFilters: next }
          })
          scheduleLearnRecentFilter()
        },
        // values 토글 — 컬럼의 첫 in/not_in cond에 적용. 없으면 새로 추가(in).
        toggleColumnInValue: (col, value) => {
          scheduleLearnRecentFilter()
          set((s) => {
            const next = { ...s.columnFilters }
            const list = [...(next[col] ?? [])]
            // 첫 in/not_in cond 찾기
            const idx = list.findIndex(
              (c) => c.kind === "in" || c.kind === "not_in",
            )
            if (idx === -1) {
              // 없으면 새 in 추가
              list.push({ kind: "in", values: [value] })
            } else {
              const cur = list[idx]
              if (cur.kind !== "in" && cur.kind !== "not_in") return s
              const isNot = cur.kind === "not_in"
              const has = cur.values.includes(value)
              const nextVals = has
                ? cur.values.filter((v) => v !== value)
                : [...cur.values, value]
              if (nextVals.length === 0) {
                list.splice(idx, 1)
              } else {
                list[idx] = isNot
                  ? { kind: "not_in", values: nextVals }
                  : { kind: "in", values: nextVals }
              }
            }
            if (list.length === 0) {
              delete next[col]
            } else {
              next[col] = list
            }
            return { columnFilters: next }
          })
        },
        addColumnCondition: (col, cond) => {
          set((s) => {
            const next = { ...s.columnFilters }
            const list = [...(next[col] ?? []), cond]
            next[col] = list
            return { columnFilters: next }
          })
          scheduleLearnRecentFilter()
        },
        removeColumnCondition: (col, index) => {
          set((s) => {
            const next = { ...s.columnFilters }
            const list = [...(next[col] ?? [])]
            list.splice(index, 1)
            if (list.length === 0) {
              delete next[col]
            } else {
              next[col] = list
            }
            return { columnFilters: next }
          })
          scheduleLearnRecentFilter()
        },
        clearAllFilters: () => set({ filter: [], columnFilters: {} }),
        setSort: (sort) => {
          set({ sort })
          scheduleLearnRecentSort()
        },
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

        // Ask AI — 헤더 버튼/⌘J. 패널 닫혀 있으면 강제로 열고, focus 토큰 갱신.
        // 같은 turn에 두 set이 일어나도 React batching이 합치므로 안전.
        requestAskAi: () => {
          const s = get()
          if (!s.panels.aiPanel) {
            set({ panels: { ...s.panels, aiPanel: true } })
          }
          set({ askAiFocusToken: Date.now() })
        },

        // ─── Snapshots — GitHub 식 명시 save point ───
        // LOCK: deep copy(option A) · cap ❌ · Restore = 자동 새 snapshot 생성.
        saveSnapshot: (label, description) => {
          if (!ensureCanEdit(get(), "Save snapshot")) return ""
          const s = get()
          const ts = Date.now()
          const id = `snap-${ts.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
          const trimmedLabel = label.trim() || "Untitled snapshot"
          const trimmedDesc = description?.trim() || undefined
          const snapshot: Snapshot = {
            id,
            ts,
            label: trimmedLabel,
            description: trimmedDesc,
            by: s.settings.currentUserId ?? "unknown",
            state: snapshotStateFromStore(s),
          }
          set({
            snapshots: [snapshot, ...s.snapshots],
            events: appendEvent(s.events, {
              id: makeEventId(ts),
              ts,
              kind: "snapshot_saved",
              title: trimmedLabel,
              detail: trimmedDesc,
            }),
          })
          return id
        },

        restoreSnapshot: (id) => {
          if (!ensureCanEdit(get(), "Restore snapshot")) return false
          const s = get()
          const target = s.snapshots.find((sn) => sn.id === id)
          if (!target) {
            toast.error("Snapshot not found")
            return false
          }
          // 1) 현재 상태를 자동 새 snapshot으로 보존 (사용자가 되돌릴 수 있게)
          const autoTs = Date.now()
          const autoId = `snap-${autoTs.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
          const autoSnapshot: Snapshot = {
            id: autoId,
            ts: autoTs,
            label: `Auto-saved before restore: ${target.label}`,
            by: s.settings.currentUserId ?? "unknown",
            state: snapshotStateFromStore(s),
          }
          // 2) target 시점으로 복원. 활성 보드 미존재 → 첫 보드 fallback.
          const restoredBoards = target.state.boards
          const boardIds = Object.keys(restoredBoards)
          const newActiveBoardId = boardIds.includes(s.activeBoardId)
            ? s.activeBoardId
            : (boardIds[0] ?? s.activeBoardId)
          // viewByBoardId는 복원된 보드들에 한해 유지 (없는 보드는 sheet default).
          const nextViewByBoardId: Record<string, ViewMode> = {}
          for (const bid of boardIds) {
            nextViewByBoardId[bid] = s.viewByBoardId[bid] ?? "sheet"
          }
          // 3) snapshot_restored 이벤트 + autoSnapshot save 이벤트 두 개 push.
          const restoreTs = autoTs + 1
          const eventsAfterAuto = appendEvent(s.events, {
            id: makeEventId(autoTs),
            ts: autoTs,
            kind: "snapshot_saved",
            title: autoSnapshot.label,
            detail: "Auto-saved before restore",
          })
          const eventsAfterRestore = appendEvent(eventsAfterAuto, {
            id: makeEventId(restoreTs),
            ts: restoreTs,
            kind: "snapshot_restored",
            title: target.label,
            detail: `Restored snapshot from ${new Date(target.ts).toLocaleString()}`,
          })
          set({
            snapshots: [autoSnapshot, ...s.snapshots],
            boards: restoredBoards,
            activeBoardId: newActiveBoardId,
            viewByBoardId: nextViewByBoardId,
            library: target.state.library,
            wikiPages: target.state.wikiPages,
            automations: target.state.automations,
            suggestedAutomations: target.state.suggestedAutomations,
            trashedBoards: target.state.trashedBoards,
            trashedRows: target.state.trashedRows,
            trashedWikiPages: target.state.trashedWikiPages,
            settings: target.state.settings,
            schemaPositions: target.state.schemaPositions,
            viewSettings: target.state.viewSettings,
            // ephemeral reset
            selectedRowIds: [],
            focusedCell: null,
            columnFilters: {},
            filter: [],
            search: "",
            events: eventsAfterRestore,
          })
          undoStack.clear()
          return true
        },

        deleteSnapshot: (id) => {
          if (!ensureCanEdit(get(), "Delete snapshot")) return
          set((s) => ({
            snapshots: s.snapshots.filter((sn) => sn.id !== id),
          }))
        },

        renameSnapshot: (id, label, description) => {
          if (!ensureCanEdit(get(), "Rename snapshot")) return
          set((s) => ({
            snapshots: s.snapshots.map((sn) =>
              sn.id === id
                ? {
                    ...sn,
                    label: label.trim() || sn.label,
                    description: description?.trim() || undefined,
                  }
                : sn,
            ),
          }))
        },
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
      //   v7 → v8: schemaPositions
      //   v8 → v9: trashedRows
      //   v9 → v10: trashedWikiPages
      //   v10 → v11: settings.members
      //   v11 → v12: viewSettings (보드별 view별 Display 옵션)
      //   v12 → v13: settings.currentUserId (Members role enforcement 기준)
      //   v13 → v14: workspaceMemory (자동 학습 cache · Library와 분리)
      //   v14 → v15: events (EventStore 인프라 · 기존 aiHistory 백필)
      //   v15 → v16: snapshots (GitHub 식 명시 save point · 기본 빈 배열)
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
          s.settings = (s.settings ?? {
            workspaceLabel: "peter's workspace",
            workspaceInitial: "P",
          }) as WorkspaceSettings
        }
        if (version < 8) {
          s.schemaPositions = s.schemaPositions ?? {}
        }
        if (version < 9) {
          s.trashedRows = s.trashedRows ?? []
        }
        if (version < 10) {
          s.trashedWikiPages = s.trashedWikiPages ?? []
        }
        if (version < 11) {
          // settings.members 시드 주입 (기존 사용자에게 데모 표시)
          s.settings = {
            workspaceLabel: s.settings?.workspaceLabel ?? "peter's workspace",
            workspaceInitial: s.settings?.workspaceInitial ?? "P",
            members:
              (s.settings as Partial<WorkspaceSettings>)?.members ??
              createSeedMembers(),
          }
        }
        if (version < 12) {
          s.viewSettings = s.viewSettings ?? {}
        }
        if (version < 13) {
          // currentUserId 시드 (기존 사용자는 peter owner로 init)
          s.settings = {
            ...(s.settings as WorkspaceSettings),
            currentUserId:
              (s.settings as WorkspaceSettings)?.currentUserId ?? "mem-peter",
          }
        }
        if (version < 14) {
          s.workspaceMemory = s.workspaceMemory ?? {
            byScope: {},
            recentFilters: [],
            recentSorts: [],
          }
        }
        // v14에서 추가된 workspaceMemory에 recentFilters/Sorts 필드가 없을 수 있음 — 보강.
        if (s.workspaceMemory) {
          s.workspaceMemory.recentFilters = s.workspaceMemory.recentFilters ?? []
          s.workspaceMemory.recentSorts = s.workspaceMemory.recentSorts ?? []
        }
        if (version < 15) {
          // 기존 board.aiHistory entries를 events로 백필 (호환 유지 — aiHistory도 그대로 남김).
          const events: TimestampedEvent[] = []
          const boards = (s.boards ?? {}) as Record<string, Board>
          Object.values(boards).forEach((b) => {
            ;(b.aiHistory ?? []).forEach((h) => {
              const ts = Date.parse(h.time)
              if (!Number.isFinite(ts)) return
              events.push({
                id: `evt-mig-${h.id}`,
                ts,
                kind: h.kind === "ask" ? "ai_ask" : "ai_infer",
                boardId: b.id,
                rowIds: h.rowIds,
                title: h.title,
                detail: h.detail,
                status: h.status,
              })
            })
          })
          events.sort((a, b) => a.ts - b.ts)
          // 90일 cutoff + cap 적용
          const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
          const filtered = events.filter((e) => e.ts > cutoff).slice(-1000)
          s.events = (s.events ?? []).concat(filtered)
        }
        if (version < 16) {
          s.snapshots = s.snapshots ?? []
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
        trashedWikiPages: s.trashedWikiPages,
        settings: s.settings,
        schemaPositions: s.schemaPositions,
        viewSettings: s.viewSettings,
        workspaceMemory: s.workspaceMemory,
        events: s.events,
        snapshots: s.snapshots,
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

// 현재 로그인 사용자가 viewer면 true — UI button/menu disable에 사용.
// roleCanEdit(role): owner/admin/member ✅, viewer ❌. primitive boolean 반환이라 zustand 직접 구독 안전.
// settings/members가 hydrate 전 또는 손상된 state면 false (안전한 default — 보드 보임).
export function selectIsViewer(state: FlowBaseState): boolean {
  const members = state.settings?.members
  if (!members || !Array.isArray(members)) return false
  const cur = members.find((m) => m.id === state.settings.currentUserId)
  return !!cur && !roleCanEdit(cur.role)
}

export function selectActiveView(state: FlowBaseState): ViewMode {
  return state.viewByBoardId[state.activeBoardId] ?? "sheet"
}

// EventStore — Phase A 인프라. 향후 Workspace > History · Detail Activity · AI Timeline의 source.
// raw 슬라이스 구독 후 컴포넌트에서 useMemo로 derive (selector 직접 구독 시 새 배열 → 무한 루프).
//   - selectEventsForBoard(state, boardId): 보드 scoped (AI panel Timeline 후속 통일용)
//   - selectEventsForRow(state, boardId, rowId): row scoped (Detail Activity 후속용)
//   - selectGlobalEvents(state): 전역 timeline (Workspace > History 후속용)
export function selectEventsForBoard(
  state: FlowBaseState,
  boardId: string,
): TimestampedEvent[] {
  return state.events.filter((e) => e.boardId === boardId)
}
export function selectEventsForRow(
  state: FlowBaseState,
  boardId: string,
  rowId: string,
): TimestampedEvent[] {
  return state.events.filter(
    (e) =>
      e.boardId === boardId &&
      (e.rowId === rowId || e.rowIds?.includes(rowId)),
  )
}
export function selectGlobalEvents(state: FlowBaseState): TimestampedEvent[] {
  return state.events
}

// Workspace Memory — cell editor 드롭다운 "Recent" 섹션 노출용.
// 컬럼 scope의 entries 중 frequency ≥ 2만, count desc · lastUsed desc 정렬.
// `excludeValues`: 이미 column.options에 있는 값은 제외 (중복 노출 방지).
export const MEMORY_MIN_COUNT = 2
export function selectMemoryForColumn(
  state: FlowBaseState,
  col: ColumnDef,
  excludeValues?: Set<string>,
): MemoryEntry[] {
  const scope = `${col.name}::${col.libraryFieldId ?? "_"}`
  const list = state.workspaceMemory.byScope[scope] ?? []
  return list
    .filter((e) => e.count >= MEMORY_MIN_COUNT)
    .filter((e) => !excludeValues?.has(e.value))
    .sort((a, b) => b.count - a.count || b.lastUsedTs - a.lastUsedTs)
}

// status/priority는 의미 순서로, 그 외는 값 비교로 정렬.
// multiSelect는 first-value 정렬 (빈 배열은 마지막 — 빈 문자열은 ASCII 정렬 자연 마지막 가까움).
function compareRows(a: TableRow, b: TableRow, key: string, dir: SortDir): number {
  let av: unknown = a[key]
  let bv: unknown = b[key]
  if (key === "status") {
    av = STATUS_RANK[String(av)] ?? 99
    bv = STATUS_RANK[String(bv)] ?? 99
  } else if (key === "priority") {
    av = PRIORITY_RANK[String(av)] ?? 99
    bv = PRIORITY_RANK[String(bv)] ?? 99
  } else if (Array.isArray(av) || Array.isArray(bv)) {
    // multiSelect 또는 잡종 — 첫 값으로 비교. 빈 배열 → "" (정렬상 자연스럽게 앞으로 가지만, 의도는 last).
    const afirst = multiFirst(av)
    const bfirst = multiFirst(bv)
    // 빈 값은 정렬상 마지막으로 (asc/desc 무관 — direction 전 처리).
    const aw = afirst === "" ? "￿" : afirst
    const bw = bfirst === "" ? "￿" : bfirst
    const cmp = aw < bw ? -1 : aw > bw ? 1 : 0
    return dir === "asc" ? cmp : -cmp
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

  // 다중 필드 필터 (columnFilters — 컬럼당 multi-condition AND, FilterCondition union)
  for (const [col, conds] of Object.entries(state.columnFilters)) {
    if (!conds || conds.length === 0) continue
    for (const cond of conds) {
      if (cond.kind === "in") {
        if (cond.values.length === 0) continue
        const allowed = new Set(cond.values)
        // multiSelect: ANY-match (cell의 배열 원소 중 하나라도 allowed에 있으면 통과).
        // 그 외: 단일 값 == allowed.
        rows = rows.filter((r) => {
          const v = r[col]
          if (Array.isArray(v)) return v.some((x) => allowed.has(String(x ?? "")))
          return allowed.has(String(v ?? ""))
        })
      } else if (cond.kind === "not_in") {
        if (cond.values.length === 0) continue
        const excluded = new Set(cond.values)
        // multiSelect: NONE-match (cell의 배열 원소 중 하나라도 excluded면 차단).
        rows = rows.filter((r) => {
          const v = r[col]
          if (Array.isArray(v)) return !v.some((x) => excluded.has(String(x ?? "")))
          return !excluded.has(String(v ?? ""))
        })
      } else if (cond.kind === "range") {
        const { min, max } = cond
        if (min === undefined && max === undefined) continue
        rows = rows.filter((r) => {
          const n = Number(r[col])
          if (!Number.isFinite(n)) return false
          if (min !== undefined && n < min) return false
          if (max !== undefined && n > max) return false
          return true
        })
      } else if (cond.kind === "date-range") {
        const { from, to } = cond
        if (!from && !to) continue
        rows = rows.filter((r) => {
          const v = String(r[col] ?? "")
          if (!v) return false
          if (from && v < from) return false
          if (to && v > to) return false
          return true
        })
      } else if (cond.kind === "contains") {
        const q = cond.text.trim().toLowerCase()
        if (!q) continue
        rows = rows.filter((r) => {
          const v = r[col]
          return typeof v === "string" && v.toLowerCase().includes(q)
        })
      } else if (cond.kind === "not_contains") {
        const q = cond.text.trim().toLowerCase()
        if (!q) continue
        rows = rows.filter((r) => {
          const v = r[col]
          return !(typeof v === "string" && v.toLowerCase().includes(q))
        })
      }
    }
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

  // Sheet view 한정 다중 sort — viewSettings.sheet.sorts 있으면 우선 (state.sort 무시).
  // 다른 view(Kanban/Gallery/Timeline/Dashboard)는 state.sort 그대로.
  const activeView = state.viewByBoardId[state.activeBoardId] ?? "sheet"
  const sheetSorts =
    activeView === "sheet"
      ? state.viewSettings[state.activeBoardId]?.sheet?.sorts
      : undefined
  if (sheetSorts && sheetSorts.length > 0) {
    rows = [...rows].sort((a, b) => {
      for (const s of sheetSorts) {
        const c = compareRows(a, b, s.key, s.dir)
        if (c !== 0) return c
      }
      return 0
    })
  } else if (state.sort) {
    const { key, dir } = state.sort
    rows = [...rows].sort((a, b) => compareRows(a, b, key, dir))
  }

  return rows
}
