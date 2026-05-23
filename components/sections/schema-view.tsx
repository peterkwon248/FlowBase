// FlowBase V2 — Schema 뷰 (3 sub-tab: Schema ER / Fields / Relations)
// 설계: docs/02-design/features/flowbase-v2-phase6.design.md §3 (D4 — 카드)
// 출처: design-ref/prototype/schema-er.jsx RichSchemaView
//
// 워크스페이스 레벨 — active board 무관, boards 전체를 렌더.

"use client"

import { useState } from "react"
import { KeyRound, Link2, List, Network } from "lucide-react"
import { SchemaERDiagram } from "@/components/sections/schema-er-diagram"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { Board, ColumnDef } from "@/types/flowbase"

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
        {board.columns.map((c, i) => (
          <SchemaFieldRow
            key={c.name}
            col={c}
            last={i === board.columns.length - 1}
          />
        ))}
      </div>
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

  return (
    <div className="flex-1 overflow-auto bg-background p-5">
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold">Table relations</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Foreign keys connecting tables. Add an FK column to link two boards.
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
              <TableChip label={r.fromLabel} id={r.fromId} color={findColor(r.fromId)} />
              <Link2 className="size-3 text-muted-foreground" strokeWidth={2} />
              <TableChip label={r.toLabel} id={r.toId} color={findColor(r.toId)} />
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
}: {
  label: string
  id: string
  color: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12.5px] font-semibold"
      style={{
        background: `color-mix(in oklch, ${color} 18%, var(--background))`,
        color,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
      <span
        className="ml-0.5 font-mono text-[10.5px] font-medium opacity-70"
      >
        {id}
      </span>
    </span>
  )
}
