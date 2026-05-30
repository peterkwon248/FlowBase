// FlowBase V2 — Schema 뷰 (3 sub-tab: Schema ER / Fields / Relations)
// 설계: docs/02-design/features/flowbase-v2-phase6.design.md §3 (D4 — 카드)
// 출처: design-ref/prototype/schema-er.jsx RichSchemaView
//
// 워크스페이스 레벨 — active board 무관, boards 전체를 렌더.

"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  GripVertical,
  KeyRound,
  LayoutGrid,
  Link2,
  List,
  Network,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { SchemaERDiagram } from "@/components/sections/schema-er-diagram"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { selectIsViewer, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { Board, ColumnDef, ColumnType } from "@/types/flowbase"

// Schema Fields 편집에서 변경 가능한 타입 — fk(타겟 필요)·formula(expression 필요)·
// reaction·button은 제외 (단순 타입만 인라인 전환).
const SCHEMA_EDIT_TYPES: ColumnType[] = [
  "text",
  "num",
  "date",
  "email",
  "select",
  "multiSelect",
  "status",
  "avatar",
]

type Sub = "schema" | "fields" | "relations"

interface Relation {
  fromId: string
  fromLabel: string
  viaColumn: string
  toId: string
  toLabel: string
}

function deriveRelations(boards: Record<string, Board>): Relation[] {
  const out: Relation[] = []
  for (const b of Object.values(boards)) {
    for (const c of b.columns) {
      if (c.type === "fk" && c.fk) {
        out.push({
          fromId: b.id,
          fromLabel: b.label,
          viaColumn: c.name,
          toId: c.fk,
          toLabel: boards[c.fk]?.label ?? c.fk,
        })
      }
    }
  }
  return out
}

// 검색 매칭 — 테이블 많을 때 1순위 (2026-05-30 합의). q는 미리 lowercase·trim.
function colMatchesQuery(c: ColumnDef, q: string): boolean {
  if (!q) return false
  return c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
}
function boardMatchesQuery(b: Board, q: string): boolean {
  if (!q) return true
  if (b.label.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
    return true
  return b.columns.some((c) => colMatchesQuery(c, q))
}

export function SchemaView() {
  const boards = useFlowBase((s) => s.boards)
  const boardList = Object.values(boards)
  const relations = deriveRelations(boards)

  const [sub, setSub] = useState<Sub>("schema")

  const subs: { id: Sub; label: string; Icon: typeof Network; count?: number }[] = [
    { id: "schema", label: "Schema", Icon: Network, count: boardList.length },
    { id: "fields", label: "Fields", Icon: List },
    { id: "relations", label: "Relations", Icon: Link2, count: relations.length },
  ]

  return (
    <div className="flex flex-1 flex-col bg-background min-h-0">
      {/* Sub-tab nav */}
      <div className="flex h-9 shrink-0 items-center gap-0 border-b border-border-subtle px-5">
        {subs.map(({ id, label, Icon, count }) => {
          const on = sub === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSub(id)}
              data-schema-sub={id}
              className={cn(
                "relative inline-flex h-9 items-center gap-1.5 border-b-2 px-2.5 text-[12.5px] transition-colors",
                on
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.75} />
              <span>{label}</span>
              {typeof count === "number" && (
                <span className="ml-0.5 text-[10.5px] font-normal tabular-nums text-muted-foreground">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {sub === "schema" && <SchemaERDiagram />}
      {sub === "fields" && <FieldsInventory boards={boardList} />}
      {sub === "relations" && (
        <RelationsList boards={boardList} relations={relations} />
      )}
    </div>
  )
}

// Fields 카드 그리드 열 수 — auto(반응형) / 1(세로 1열) / 2 / 3. localStorage persist.
type FieldsCols = "auto" | "1" | "2" | "3"
const FIELDS_COLS_KEY = "flowbase:fields-cols"
const FIELDS_COLS_CLASS: Record<FieldsCols, string> = {
  auto: "grid-cols-[repeat(auto-fill,minmax(280px,1fr))]",
  "1": "grid-cols-1 max-w-[560px]",
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}
const FIELDS_COLS_ORDER: FieldsCols[] = ["auto", "1", "2", "3"]

// ─── Fields inventory ──────────────────────────────────────────────
function FieldsInventory({ boards }: { boards: Board[] }) {
  const [rawQuery, setRawQuery] = useState("")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const reorderBoards = useFlowBase((s) => s.reorderBoards)
  const isViewer = useFlowBase(selectIsViewer)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [cols, setCols] = useState<FieldsCols>("auto")

  // localStorage에서 열 수 선호 복원 (display preference — store 아님).
  useEffect(() => {
    const saved = window.localStorage.getItem(FIELDS_COLS_KEY)
    if (saved && FIELDS_COLS_ORDER.includes(saved as FieldsCols)) {
      setCols(saved as FieldsCols)
    }
  }, [])
  const changeCols = (next: FieldsCols) => {
    setCols(next)
    window.localStorage.setItem(FIELDS_COLS_KEY, next)
  }

  const q = rawQuery.trim().toLowerCase()
  const filtered = q ? boards.filter((b) => boardMatchesQuery(b, q)) : boards
  const matchCount = q
    ? boards.reduce(
        (n, b) => n + b.columns.filter((c) => colMatchesQuery(c, q)).length,
        0,
      )
    : 0

  const allCollapsed =
    boards.length > 0 && boards.every((b) => collapsed.has(b.id))
  const toggleAll = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(boards.map((b) => b.id)))
  const toggleOne = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // dnd 순서변경 — 검색 중이 아니고 non-viewer + 2개 이상일 때만. 드롭=대상 카드 앞에 삽입.
  const reorderable = !q && !isViewer && boards.length > 1
  const handleReorderDrop = (targetId: string) => {
    if (dragId && dragId !== targetId) {
      const rest = boards.map((b) => b.id).filter((id) => id !== dragId)
      rest.splice(rest.indexOf(targetId), 0, dragId)
      reorderBoards(rest)
    }
    setDragId(null)
    setOverId(null)
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold">Field inventory</h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {q ? (
              <>
                {filtered.length} of {boards.length} tables
                {matchCount > 0 && <> · {matchCount} matching fields</>}
              </>
            ) : (
              "Every column across every table."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setRawQuery("")
              }}
              placeholder="Search tables & fields…"
              data-fields-search
              className="h-8 w-56 pl-7 pr-7 text-[12px]"
            />
            {rawQuery && (
              <button
                type="button"
                onClick={() => setRawQuery("")}
                title="Clear search"
                className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <X className="size-3" strokeWidth={2} />
              </button>
            )}
          </div>
          {/* Display 옵션 — Columns(열 수). display-menu.tsx Popover 패턴 일치.
              Fields는 workspace-level(보드 무관)이라 viewSettings 아닌 localStorage persist. */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Display options"
                data-fields-display
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border-subtle px-2.5 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
                  cols !== "auto" &&
                    "border-border bg-foreground/[0.06] text-foreground",
                )}
              >
                <Settings2 className="size-3.5" strokeWidth={1.75} />
                <span>Display</span>
                {cols !== "auto" && (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-semibold text-primary-foreground tabular-nums">
                    1
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="w-64 p-0"
              data-fields-display-popover
            >
              <div className="space-y-0.5 py-1">
                <div className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Display · Fields
                </div>
                <div className="px-3 pb-2 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-muted-foreground">
                      Columns
                    </span>
                    <div
                      className="inline-flex rounded-md border border-border-subtle p-0.5"
                      role="group"
                      aria-label="Columns"
                      data-fields-cols={cols}
                    >
                      {FIELDS_COLS_ORDER.map((opt) => {
                        const on = cols === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => changeCols(opt)}
                            title={
                              opt === "auto"
                                ? "Auto-fit columns"
                                : opt === "1"
                                  ? "Single column (stacked)"
                                  : `${opt} columns`
                            }
                            data-fields-cols-opt={opt}
                            className={cn(
                              "inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1.5 text-[11.5px] transition-colors",
                              on
                                ? "bg-primary/15 font-semibold text-primary"
                                : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
                            )}
                          >
                            {opt === "auto" ? (
                              <LayoutGrid className="size-3.5" strokeWidth={2} />
                            ) : (
                              opt
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {boards.length > 1 && (
            <button
              type="button"
              onClick={toggleAll}
              data-fields-collapse-all
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              {allCollapsed ? (
                <ChevronDown className="size-3.5" strokeWidth={2} />
              ) : (
                <ChevronRight className="size-3.5" strokeWidth={2} />
              )}
              {allCollapsed ? "Expand all" : "Collapse all"}
            </button>
          )}
        </div>
      </div>
      {q && filtered.length === 0 ? (
        <div className="max-w-[820px] rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center text-[12.5px] text-muted-foreground">
          No tables or fields match{" "}
          <span className="font-medium text-foreground">
            &ldquo;{rawQuery.trim()}&rdquo;
          </span>
          .
        </div>
      ) : (
        <div className={cn("grid items-start gap-4", FIELDS_COLS_CLASS[cols])}>
          {filtered.map((b) => (
            <BoardFieldsCard
              key={b.id}
              board={b}
              query={q}
              collapsed={collapsed.has(b.id)}
              forceExpand={!!q}
              onToggleCollapse={() => toggleOne(b.id)}
              reorderable={reorderable}
              dragging={dragId === b.id}
              over={overId === b.id && dragId !== b.id}
              onReorderStart={() => setDragId(b.id)}
              onReorderOver={() => {
                if (dragId && dragId !== b.id) setOverId(b.id)
              }}
              onReorderDrop={() => handleReorderDrop(b.id)}
              onReorderEnd={() => {
                setDragId(null)
                setOverId(null)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BoardFieldsCard({
  board,
  query = "",
  collapsed = false,
  forceExpand = false,
  onToggleCollapse,
  reorderable = false,
  dragging = false,
  over = false,
  onReorderStart,
  onReorderOver,
  onReorderDrop,
  onReorderEnd,
}: {
  board: Board
  query?: string
  collapsed?: boolean
  forceExpand?: boolean
  onToggleCollapse?: () => void
  reorderable?: boolean
  dragging?: boolean
  over?: boolean
  onReorderStart?: () => void
  onReorderOver?: () => void
  onReorderDrop?: () => void
  onReorderEnd?: () => void
}) {
  const color = board.colorVar ?? "var(--chart-1)"
  const showBody = !collapsed || forceExpand
  const isViewer = useFlowBase(selectIsViewer)
  const addColumn = useFlowBase((s) => s.addColumn)
  const allBoards = useFlowBase((s) => s.boards)
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)

  // 양방향 관계 — outgoing(이 보드의 fk) · incoming(이 보드를 가리키는 다른 보드의 fk).
  const outgoing = board.columns
    .filter((c) => c.type === "fk" && c.fk)
    .map((c) => ({
      via: c.name,
      id: c.fk as string,
      label: allBoards[c.fk as string]?.label ?? (c.fk as string),
    }))
  const incoming = Object.values(allBoards)
    .filter((b) => b.id !== board.id)
    .flatMap((b) =>
      b.columns
        .filter((c) => c.type === "fk" && c.fk === board.id)
        .map((c) => ({ via: c.name, id: b.id, label: b.label })),
    )
  const jumpTo = (id: string, label: string) => {
    switchBoard(id)
    setActivityMode("tables")
    toast.success(`Opened ${label}`, { id: "rel-jump" })
  }

  return (
    <div
      onDragOver={
        reorderable
          ? (e) => {
              e.preventDefault()
              onReorderOver?.()
            }
          : undefined
      }
      onDrop={
        reorderable
          ? (e) => {
              e.preventDefault()
              onReorderDrop?.()
            }
          : undefined
      }
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card transition-all",
        over ? "border-primary ring-2 ring-primary" : "border-border-subtle",
        dragging && "opacity-50",
      )}
    >
      <div
        className="flex items-center gap-2 border-b border-border-subtle px-3 py-2"
        style={{
          background: `color-mix(in oklch, ${color} 18%, var(--background))`,
          color,
        }}
      >
        {reorderable && (
          <span
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move"
              e.dataTransfer.setData("text/plain", board.id)
              onReorderStart?.()
            }}
            onDragEnd={() => onReorderEnd?.()}
            title="Drag to reorder table"
            data-board-card-grip={board.id}
            className="-ml-1 flex size-5 shrink-0 cursor-grab items-center justify-center rounded opacity-60 transition hover:bg-foreground/10 hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" strokeWidth={2} />
          </span>
        )}
        {!forceExpand && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand table" : "Collapse table"}
            data-board-card-collapse={board.id}
            className="-ml-1 flex size-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-foreground/10"
          >
            {collapsed ? (
              <ChevronRight className="size-3.5" strokeWidth={2.25} />
            ) : (
              <ChevronDown className="size-3.5" strokeWidth={2.25} />
            )}
          </button>
        )}
        <span className="flex-1 truncate text-[13px] font-bold">
          {board.label}
        </span>
        <span className="font-mono text-[10.5px] opacity-70">{board.id}</span>
        <span className="rounded bg-foreground/10 px-1.5 py-0 text-[10.5px] font-semibold tabular-nums">
          {board.columns.length}
        </span>
      </div>
      {showBody && (outgoing.length > 0 || incoming.length > 0) && (
        <div className="flex flex-wrap gap-1 border-b border-border-subtle bg-background/40 px-3 py-1.5">
          {outgoing.map((r, i) => (
            <button
              key={`out-${i}`}
              type="button"
              onClick={() => jumpTo(r.id, r.label)}
              data-rel-out={r.id}
              title={`References ${r.label} (via ${r.via})`}
              className="inline-flex items-center gap-0.5 rounded-full bg-primary/12 px-2 py-0.5 text-[10.5px] font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <ArrowRight className="size-2.5" strokeWidth={2.5} />
              {r.label}
            </button>
          ))}
          {incoming.map((r, i) => (
            <button
              key={`in-${i}`}
              type="button"
              onClick={() => jumpTo(r.id, r.label)}
              data-rel-in={r.id}
              title={`${r.label} references this (via ${r.via})`}
              className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/12 px-2 py-0.5 text-[10.5px] font-medium text-violet-600 transition-colors hover:bg-violet-500/20 dark:text-violet-400"
            >
              <ArrowLeft className="size-2.5" strokeWidth={2.5} />
              {r.label}
            </button>
          ))}
        </div>
      )}
      {showBody && (
        <div className="flex flex-col">
          {board.columns.map((c, i) =>
            isViewer ? (
              <SchemaFieldRow
                key={c.name}
                col={c}
                last={i === board.columns.length - 1}
                highlight={colMatchesQuery(c, query)}
              />
            ) : (
              <EditableFieldRow
                key={c.name}
                col={c}
                boardId={board.id}
                highlight={colMatchesQuery(c, query)}
              />
            ),
          )}
          {!isViewer && (
            <button
              type="button"
              onClick={() =>
                addColumn(
                  { name: "field", label: "Field", type: "text", width: 140 },
                  board.id,
                )
              }
              data-schema-add-col={board.id}
              className="flex items-center gap-2 px-3 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Add column
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// 타입 배지 — PK(amber) / FK(violet) / 일반(neutral). read-only 표시용.
function TypeBadge({
  label,
  tone,
}: {
  label: string
  tone: "amber" | "violet" | "neutral"
}) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-px font-mono text-[10px] font-semibold lowercase",
        tone === "amber"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : tone === "violet"
            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
            : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  )
}

// 편집 가능 필드 행 (non-viewer) — name rename(키 migrate) · 타입 변경 · 삭제.
// id는 read-only(키 보호). fk/formula 등 특수 타입은 타입 변경 ❌(배지만), rename·삭제는 ✓.
function EditableFieldRow({
  col,
  boardId,
  highlight = false,
}: {
  col: ColumnDef
  boardId: string
  highlight?: boolean
}) {
  const renameColumn = useFlowBase((s) => s.renameColumn)
  const updateColumn = useFlowBase((s) => s.updateColumn)
  const deleteColumn = useFlowBase((s) => s.deleteColumn)

  const isPk = col.name === "id"
  const isFk = col.type === "fk"
  const canChangeType = SCHEMA_EDIT_TYPES.includes(col.type)
  const Icon = TYPE_ICON[col.type]

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(col.name)
  const [confirmDel, setConfirmDel] = useState(false)
  useEffect(() => {
    setDraft(col.name)
  }, [col.name])

  const isDerived =
    col.type === "lookup" || col.type === "rollup" || col.type === "formula"

  const commitRename = () => {
    const next = draft.trim()
    setEditing(false)
    if (!next || next === col.name) {
      setDraft(col.name)
      return
    }
    // schema는 키(name)를 표시·편집 — name+label 동시 갱신 (행 키 migrate).
    renameColumn(col.name, next, next, boardId)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-[12px]",
        highlight && "bg-primary/[0.07]",
      )}
    >
      {isPk ? (
        <KeyRound
          className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
          strokeWidth={2}
        />
      ) : (
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground"
          strokeWidth={1.5}
        />
      )}

      {isPk ? (
        <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground">
          {col.name}
        </span>
      ) : editing ? (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitRename()
            }
            if (e.key === "Escape") {
              setDraft(col.name)
              setEditing(false)
            }
          }}
          className="h-6 min-w-0 flex-1 font-mono text-[12px]"
          data-schema-col-name={col.name}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing(true)
            setDraft(col.name)
          }}
          title="Click to rename"
          data-schema-col-rename={col.name}
          className="min-w-0 flex-1 truncate text-left font-mono transition-colors hover:text-foreground"
        >
          {col.name}
        </button>
      )}

      {col.ai && (
        <span className="rounded bg-primary/15 px-1 text-[9px] font-bold text-primary">
          AI
        </span>
      )}

      {isPk ? (
        <TypeBadge label="PK" tone="amber" />
      ) : !canChangeType ? (
        <TypeBadge label={isFk ? "FK" : col.type} tone={isFk ? "violet" : "neutral"} />
      ) : (
        <Select
          value={col.type}
          onValueChange={(v) =>
            updateColumn(col.name, { type: v as ColumnType }, boardId)
          }
        >
          <SelectTrigger
            className="h-6 w-[112px] text-[11px]"
            data-schema-col-type={col.name}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCHEMA_EDIT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!isPk && (
        <button
          type="button"
          onClick={() => setConfirmDel(true)}
          title="Delete column"
          data-schema-col-delete={col.name}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" strokeWidth={2} />
        </button>
      )}

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{col.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              {isDerived
                ? "Removes this computed column. Row data isn't affected."
                : isFk
                  ? "Removes the relation column and its value from every row. Lookup/rollup columns using it will stop working. This can't be undone."
                  : "Removes the column and its value from every row. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteColumn(col.name, boardId)}
              data-schema-col-delete-confirm={col.name}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SchemaFieldRow({
  col,
  last,
  highlight = false,
}: {
  col: ColumnDef
  last: boolean
  highlight?: boolean
}) {
  const Icon = TYPE_ICON[col.type]
  const isPk = col.name === "id"
  const isFk = col.type === "fk"

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-[12px]",
        !last && "border-b border-border-subtle",
        highlight && "bg-primary/[0.07]",
      )}
    >
      {isPk ? (
        <KeyRound
          className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
          strokeWidth={2}
        />
      ) : (
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground"
          strokeWidth={1.5}
        />
      )}
      <span className="min-w-0 flex-1 truncate font-mono">{col.name}</span>
      {col.ai && (
        <span className="rounded bg-primary/15 px-1 text-[9px] font-bold text-primary">
          AI
        </span>
      )}
      <span
        className={cn(
          "rounded px-1.5 py-px font-mono text-[10px] font-semibold lowercase",
          isPk
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : isFk
              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
              : "bg-muted text-muted-foreground",
        )}
      >
        {isPk ? "PK" : isFk ? "FK" : col.type}
      </span>
    </div>
  )
}

// ─── Relations list ────────────────────────────────────────────────
function RelationsList({
  boards,
  relations,
}: {
  boards: Board[]
  relations: Relation[]
}) {
  const findColor = (id: string): string =>
    boards.find((b) => b.id === id)?.colorVar ?? "var(--chart-1)"
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)
  const isViewer = useFlowBase(selectIsViewer)
  const [addOpen, setAddOpen] = useState(false)
  const jumpToBoard = (id: string, label: string) => {
    switchBoard(id)
    setActivityMode("tables")
    toast.success(`Opened ${label}`, { id: "rel-jump" })
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[14px] font-semibold">Table relations</h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Foreign keys connecting tables. Click a table to open it.
          </p>
        </div>
        {!isViewer && boards.length > 0 && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            data-add-relation-open
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Add relation
          </button>
        )}
      </div>
      {relations.length === 0 ? (
        <div className="max-w-[820px] rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center text-[12.5px] text-muted-foreground">
          No relations yet.{" "}
          {!isViewer ? (
            <>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Add a relation
              </button>{" "}
              to link two tables.
            </>
          ) : (
            <>
              Add a column with{" "}
              <code className="rounded bg-muted px-1 font-mono text-[11px]">
                fk
              </code>{" "}
              type to link tables.
            </>
          )}
        </div>
      ) : (
        <div className="flex max-w-[820px] flex-col gap-2.5">
          {relations.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-card px-4 py-3 text-[13px]"
              data-relation-from={r.fromId}
              data-relation-to={r.toId}
            >
              <TableChip
                label={r.fromLabel}
                id={r.fromId}
                color={findColor(r.fromId)}
                onClick={() => jumpToBoard(r.fromId, r.fromLabel)}
              />
              <Link2 className="size-3 text-muted-foreground" strokeWidth={2} />
              <TableChip
                label={r.toLabel}
                id={r.toId}
                color={findColor(r.toId)}
                onClick={() => jumpToBoard(r.toId, r.toLabel)}
              />
              <div className="flex-1" />
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10.5px] font-semibold text-muted-foreground">
                1:N
              </span>
              <span className="font-mono text-[12px] text-muted-foreground">
                via {r.viaColumn}
              </span>
            </div>
          ))}
        </div>
      )}
      <AddRelationDialog
        boards={boards}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  )
}

// Relations 탭에서 직접 관계 생성 — From 테이블에 To를 가리키는 fk 컬럼을 추가.
// cross-board addColumn(boardId) 재사용. deriveRelations가 자동 반영.
function AddRelationDialog({
  boards,
  open,
  onOpenChange,
}: {
  boards: Board[]
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const addColumn = useFlowBase((s) => s.addColumn)
  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  useEffect(() => {
    if (open) {
      setFromId(boards[0]?.id ?? "")
      setToId(boards[1]?.id ?? boards[0]?.id ?? "")
    }
  }, [open, boards])

  const create = () => {
    const from = boards.find((b) => b.id === fromId)
    const to = boards.find((b) => b.id === toId)
    if (!from || !to) return
    const base =
      to.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "ref"
    addColumn(
      { name: base, label: to.label, type: "fk", fk: to.id, width: 160 },
      from.id,
    )
    toast.success(`Relation added — ${from.label} → ${to.label}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add relation</DialogTitle>
          <DialogDescription>
            Adds an fk column to the source table that points to the target.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-medium text-muted-foreground">
              From table (gets the relation column)
            </span>
            <Select value={fromId} onValueChange={setFromId}>
              <SelectTrigger className="h-8" data-relation-from-select>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {boards.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-center text-muted-foreground">
            <Link2 className="size-4" strokeWidth={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-medium text-muted-foreground">
              To table (referenced)
            </span>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger className="h-8" data-relation-to-select>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {boards.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-foreground/[0.04]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={create}
            data-relation-create
            className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add relation
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TableChip({
  label,
  id,
  color,
  onClick,
}: {
  label: string
  id: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Open ${label}`}
      data-relation-jump={id}
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12.5px] font-semibold transition-transform hover:scale-[1.03]"
      style={{
        background: `color-mix(in oklch, ${color} 18%, var(--background))`,
        color,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
      <span className="ml-0.5 font-mono text-[10.5px] font-medium opacity-70">
        {id}
      </span>
    </button>
  )
}
