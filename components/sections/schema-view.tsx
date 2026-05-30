// FlowBase V2 — Schema 뷰 (3 sub-tab: Schema ER / Fields / Relations)
// 설계: docs/02-design/features/flowbase-v2-phase6.design.md §3 (D4 — 카드)
// 출처: design-ref/prototype/schema-er.jsx RichSchemaView
//
// 워크스페이스 레벨 — active board 무관, boards 전체를 렌더.

"use client"

import { useEffect, useState } from "react"
import { KeyRound, Link2, List, Network, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { SchemaERDiagram } from "@/components/sections/schema-er-diagram"
import { Input } from "@/components/ui/input"
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

// ─── Fields inventory ──────────────────────────────────────────────
function FieldsInventory({ boards }: { boards: Board[] }) {
  return (
    <div className="flex-1 overflow-auto bg-background p-5">
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold">Field inventory</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Every column across every table.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {boards.map((b) => (
          <BoardFieldsCard key={b.id} board={b} />
        ))}
      </div>
    </div>
  )
}

function BoardFieldsCard({ board }: { board: Board }) {
  const color = board.colorVar ?? "var(--chart-1)"
  const isViewer = useFlowBase(selectIsViewer)
  const addColumn = useFlowBase((s) => s.addColumn)
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-card">
      <div
        className="flex items-center gap-2 border-b border-border-subtle px-3 py-2"
        style={{
          background: `color-mix(in oklch, ${color} 18%, var(--background))`,
          color,
        }}
      >
        <span className="flex-1 truncate text-[13px] font-bold">
          {board.label}
        </span>
        <span className="font-mono text-[10.5px] opacity-70">{board.id}</span>
        <span className="rounded bg-foreground/10 px-1.5 py-0 text-[10.5px] font-semibold tabular-nums">
          {board.columns.length}
        </span>
      </div>
      <div className="flex flex-col">
        {board.columns.map((c, i) =>
          isViewer ? (
            <SchemaFieldRow
              key={c.name}
              col={c}
              last={i === board.columns.length - 1}
            />
          ) : (
            <EditableFieldRow key={c.name} col={c} boardId={board.id} />
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
}: {
  col: ColumnDef
  boardId: string
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
  useEffect(() => {
    setDraft(col.name)
  }, [col.name])

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
    <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-[12px]">
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
          onClick={() => deleteColumn(col.name, boardId)}
          title="Delete column"
          data-schema-col-delete={col.name}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

function SchemaFieldRow({ col, last }: { col: ColumnDef; last: boolean }) {
  const Icon = TYPE_ICON[col.type]
  const isPk = col.name === "id"
  const isFk = col.type === "fk"

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-[12px]",
        !last && "border-b border-border-subtle",
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
  const jumpToBoard = (id: string, label: string) => {
    switchBoard(id)
    setActivityMode("tables")
    toast.success(`Opened ${label}`, { id: "rel-jump" })
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-5">
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold">Table relations</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Foreign keys connecting tables. Click a table to open it.
        </p>
      </div>
      {relations.length === 0 ? (
        <div className="max-w-[820px] rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center text-[12.5px] text-muted-foreground">
          No relations yet. Add a column with{" "}
          <code className="rounded bg-muted px-1 font-mono text-[11px]">fk</code>
          {" "}type to link tables.
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
    </div>
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
