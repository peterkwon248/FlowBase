// FlowBase V2 — Schema 뷰 (보드별 컬럼 인벤토리 + fk 관계)
// 설계: docs/02-design/features/flowbase-v2-phase6.design.md §3 (D4 — 카드)
// 출처: design-ref/prototype/schema-er.jsx FieldsInventory / RelationsList
//
// 워크스페이스 레벨 — active board 무관, boards 전체를 렌더.

"use client"

import { KeyRound, Link2 } from "lucide-react"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { Board, ColumnDef } from "@/types/flowbase"

interface Relation {
  fromLabel: string
  viaColumn: string
  toLabel: string
}

export function SchemaView() {
  const boards = useFlowBase((s) => s.boards)
  const boardList = Object.values(boards)

  // fk 컬럼 → 보드 간 관계
  const relations: Relation[] = []
  for (const b of boardList) {
    for (const c of b.columns) {
      if (c.type === "fk" && c.fk) {
        relations.push({
          fromLabel: b.label,
          viaColumn: c.name,
          toLabel: boards[c.fk]?.label ?? c.fk,
        })
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-auto bg-background p-5">
      <div>
        <h2 className="text-sm font-semibold">Schema</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {boardList.length} boards · column structure
        </p>
      </div>

      {/* 보드 카드 그리드 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {boardList.map((b) => (
          <BoardSchemaCard key={b.id} board={b} />
        ))}
      </div>

      {/* 관계 */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          <Link2 className="size-3" />
          Relations
        </div>
        {relations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground">
            No relations between boards — add an fk-type column to link them.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {relations.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-border-subtle bg-card px-3 py-2 text-[13px]"
              >
                <span className="font-medium">{r.fromLabel}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  .{r.viaColumn}
                </span>
                <Link2 className="size-3 text-muted-foreground" />
                <span className="font-medium">{r.toLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BoardSchemaCard({ board }: { board: Board }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-card">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ background: board.colorVar ?? "var(--chart-1)" }}
        />
        <span className="flex-1 truncate text-[13px] font-semibold">
          {board.label}
        </span>
        <span className="tabular-nums text-[11px] text-muted-foreground">
          {board.columns.length} columns
        </span>
      </div>
      {/* 컬럼 목록 */}
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
        "flex items-center gap-2 px-3 py-1.5 text-xs",
        !last && "border-b border-border-subtle",
      )}
    >
      {isPk ? (
        <KeyRound className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
      ) : (
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground"
          strokeWidth={1.5}
        />
      )}
      <span className="flex-1 truncate font-mono">{col.name}</span>
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
