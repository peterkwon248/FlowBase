// FlowBase V2 — Detail bar (4번째 패널) — 선택/포커스 행 디테일
// 출처: design-ref/prototype/prototype-shell.jsx PanelsMenu(detailBar)
//
// Tables 모드에서 사용 — 활성 보드의 마지막 포커스/선택 행을 컬럼별로 표시.
// 토글: 햄버거 > Detail bar 또는 ⌘I.

"use client"

import { Fragment, useMemo } from "react"
import {
  ArrowRight,
  Bot,
  Camera,
  History as HistoryIcon,
  MessageSquare,
  Plus,
  RotateCcw,
  X,
  type LucideIcon,
} from "lucide-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { EventKind, TimestampedEvent } from "@/types/flowbase"

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (typeof v === "object") {
    try {
      return JSON.stringify(v)
    } catch {
      return "—"
    }
  }
  return String(v)
}

export function DetailBar() {
  const board = useFlowBase(selectActiveBoard)
  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const focusedCell = useFlowBase((s) => s.focusedCell)
  const togglePanel = useFlowBase((s) => s.togglePanel)

  if (!board) return null

  // 우선순위: 포커스된 셀의 행 > 마지막 선택 행
  const targetRowId =
    focusedCell?.row ?? selectedRowIds[selectedRowIds.length - 1] ?? null
  const row = targetRowId
    ? board.rows.find((r) => r.id === targetRowId)
    : null

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-border-subtle bg-surface">
      {/* 헤더 */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3.5">
        <span className="text-[13px] font-semibold">Detail</span>
        {selectedRowIds.length > 1 && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {selectedRowIds.length} selected
          </span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => togglePanel("detailBar")}
          title="Close (⌘I)"
          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* 내용 */}
      {!row ? (
        <div className="flex-1 overflow-y-auto p-3.5">
          <div className="rounded-md border border-dashed border-border bg-card p-4 text-center text-[12px] text-muted-foreground">
            Select a row or focus a cell to see details.
          </div>
        </div>
      ) : (
        <Tabs
          defaultValue="fields"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList className="mx-3.5 mt-2 grid h-8 shrink-0 grid-cols-2 bg-foreground/[0.04] p-0.5">
            <TabsTrigger
              value="fields"
              className="h-7 text-[11.5px] data-[state=active]:bg-background"
            >
              Fields
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="h-7 text-[11.5px] data-[state=active]:bg-background"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="fields"
            className="min-h-0 flex-1 overflow-y-auto p-3.5"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                  {row.id}
                </span>
                {row.themeConfirmed === false && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    AI theme pending
                  </span>
                )}
                {row.sentimentConfirmed === false && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    AI sentiment pending
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
                {board.columns.map((col) => {
                  if (col.name === "id") return null
                  const v = row[col.name]
                  return (
                    <Fragment key={col.name}>
                      <dt className="font-medium text-muted-foreground">
                        {col.label || col.name}
                      </dt>
                      <dd className="min-w-0 break-words">{formatValue(v)}</dd>
                    </Fragment>
                  )
                })}
              </dl>
            </div>
          </TabsContent>

          <TabsContent
            value="activity"
            className="min-h-0 flex-1 overflow-y-auto p-3.5"
          >
            <RowActivity boardId={board.id} rowId={row.id} />
          </TabsContent>
        </Tabs>
      )}
    </aside>
  )
}

// ─── Row Activity — 해당 행의 events 시간순(최신 위) ───
// EventStore (state.events)에서 row scoped 추출. raw 구독 후 useMemo derive.

const KIND_LABELS: Record<EventKind, string> = {
  row_added: "Row added",
  row_updated: "Cell changed",
  ai_infer: "AI inference",
  ai_ask: "Asked AI",
  snapshot_saved: "Snapshot saved",
  snapshot_restored: "Snapshot restored",
}

const KIND_ICONS: Record<EventKind, LucideIcon> = {
  row_added: Plus,
  row_updated: ArrowRight,
  ai_infer: Bot,
  ai_ask: MessageSquare,
  snapshot_saved: Camera,
  snapshot_restored: RotateCcw,
}

const KIND_HUE: Record<EventKind, string> = {
  row_added: "text-emerald-600 dark:text-emerald-400",
  row_updated: "text-blue-600 dark:text-blue-400",
  ai_infer: "text-primary",
  ai_ask: "text-violet-600 dark:text-violet-400",
  snapshot_saved: "text-chart-4",
  snapshot_restored: "text-chart-4",
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDetail(event: TimestampedEvent): string | null {
  if (event.kind === "row_updated" && event.prev && event.next) {
    const changes: string[] = []
    for (const [k, nv] of Object.entries(event.next)) {
      if (k === "updatedAt" || k === "id") continue
      const pv = (event.prev as Record<string, unknown>)[k]
      if (pv === nv) continue
      const left = pv == null || pv === "" ? "—" : String(pv)
      const right = nv == null || nv === "" ? "—" : String(nv)
      changes.push(
        `${k}: ${truncate(left, 16)} → ${truncate(right, 16)}`,
      )
      if (changes.length >= 3) break
    }
    return changes.length > 0 ? changes.join(" · ") : null
  }
  if (event.title) return event.title
  return null
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

function RowActivity({ boardId, rowId }: { boardId: string; rowId: string }) {
  const events = useFlowBase((s) => s.events)
  // row scoped — boardId 일치 + rowId가 단일 OR rowIds에 포함
  const rowEvents = useMemo(
    () =>
      events
        .filter(
          (e) =>
            e.boardId === boardId &&
            (e.rowId === rowId || e.rowIds?.includes(rowId)),
        )
        .slice()
        .reverse(),
    [events, boardId, rowId],
  )

  if (rowEvents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-6 text-center text-[12px] text-muted-foreground">
        <HistoryIcon
          className="size-4 text-muted-foreground/60"
          strokeWidth={1.5}
        />
        No activity yet for this row.
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {rowEvents.map((e) => {
        const Icon = KIND_ICONS[e.kind]
        const detail = formatDetail(e)
        return (
          <li
            key={e.id}
            className="flex items-start gap-2 rounded-md px-1 py-1.5"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-foreground/[0.04]",
                KIND_HUE[e.kind],
              )}
            >
              <Icon className="size-3" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12px] font-medium">
                  {KIND_LABELS[e.kind]}
                </span>
                <span className="shrink-0 whitespace-nowrap text-[10.5px] tabular-nums text-muted-foreground">
                  {formatTime(e.ts)}
                </span>
              </div>
              {detail && (
                <div className="truncate text-[11px] text-muted-foreground">
                  {detail}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
