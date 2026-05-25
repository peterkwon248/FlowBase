// FlowBase V2 — Workspace > History (전역 액션 timeline)
// 출처: Phase C 설계 — EventStore의 첫 사용자 surface.
//
// 모든 보드의 액션을 시간순으로. 날짜별 그룹(Today/Yesterday/MMM d) + kind/board filter.
// Entry click → 해당 보드 + 행으로 점프 (Library "Used in" 점프 패턴).
//
// LOCK:
//   - events는 raw 구독 + useMemo derive (selector 직접 구독 시 새 배열 → 무한 루프)
//   - 보드 삭제로 boardId가 missing → entry는 표시하되 click 시 toast 안내 (silent skip ❌)
//   - 90일 expire는 store appendEvent에서 처리. 여기선 단순 표시.

"use client"

import { useMemo, useState } from "react"
import {
  ArrowRight,
  Bot,
  Camera,
  Filter as FilterIcon,
  History as HistoryIcon,
  MessageSquare,
  Plus,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { EventKind, TimestampedEvent } from "@/types/flowbase"

const KIND_LABELS: Record<EventKind, string> = {
  row_added: "Row added",
  row_updated: "Row updated",
  ai_infer: "AI inference",
  ai_ask: "Asked AI",
  snapshot_saved: "Snapshot saved",
  snapshot_restored: "Snapshot restored",
}

const KIND_ICONS: Record<EventKind, LucideIcon> = {
  row_added: Plus,
  row_updated: ArrowRight,
  ai_infer: Sparkles,
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

type KindFilter = EventKind | "all"
type BoardFilter = string | "all"

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDateLabel(dayStart: number, todayStart: number): string {
  const diff = Math.round((todayStart - dayStart) / (24 * 60 * 60 * 1000))
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  const d = new Date(dayStart)
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  })
}

interface DayGroup {
  dayStart: number
  label: string
  events: TimestampedEvent[]
}

function groupByDate(events: TimestampedEvent[]): DayGroup[] {
  const todayStart = startOfDay(Date.now())
  const buckets = new Map<number, TimestampedEvent[]>()
  for (const e of events) {
    const day = startOfDay(e.ts)
    const list = buckets.get(day) ?? []
    list.push(e)
    buckets.set(day, list)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([dayStart, list]) => ({
      dayStart,
      label: formatDateLabel(dayStart, todayStart),
      events: list,
    }))
}

export function HistoryView() {
  const events = useFlowBase((s) => s.events)
  const boards = useFlowBase((s) => s.boards)
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)
  const setFocused = useFlowBase((s) => s.setFocused)
  const togglePanel = useFlowBase((s) => s.togglePanel)
  const panelDetailOn = useFlowBase((s) => s.panels.detailBar)

  const [kindFilter, setKindFilter] = useState<KindFilter>("all")
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all")

  // 보드 옵션 (filter 메뉴) — 현재 살아있는 보드만
  const boardOptions = useMemo(
    () =>
      Object.values(boards)
        .map((b) => ({ id: b.id, label: b.label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [boards],
  )

  // filter + reverse (최신 위)
  const filtered = useMemo(() => {
    let list = events
    if (kindFilter !== "all") list = list.filter((e) => e.kind === kindFilter)
    if (boardFilter !== "all")
      list = list.filter((e) => e.boardId === boardFilter)
    return list.slice().reverse()
  }, [events, kindFilter, boardFilter])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  const jump = (event: TimestampedEvent) => {
    if (!event.boardId) {
      toast.info("This event has no board context.")
      return
    }
    const board = boards[event.boardId]
    if (!board) {
      toast.warning("Source board was deleted.")
      return
    }
    switchBoard(event.boardId)
    setActivityMode("tables")
    // row scoped → focus + detail bar 자동 open
    const rowId = event.rowId ?? event.rowIds?.[0]
    if (rowId && board.rows.find((r) => r.id === rowId)) {
      const firstCol = board.columns[0]?.name ?? "id"
      setFocused({ row: rowId, col: firstCol })
      if (!panelDetailOn) togglePanel("detailBar")
    }
  }

  const kindFilterLabel =
    kindFilter === "all" ? "All kinds" : KIND_LABELS[kindFilter]
  const boardFilterLabel =
    boardFilter === "all"
      ? "All boards"
      : boards[boardFilter]?.label ?? "Unknown"

  const total = filtered.length

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b border-border-subtle bg-background/95 px-6 py-4 backdrop-blur">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-chart-4/15 text-chart-4">
            <HistoryIcon className="size-4" strokeWidth={1.75} />
          </span>
          <h1 className="text-[20px] font-bold tracking-[-0.02em]">History</h1>
          <span className="text-xs tabular-nums text-muted-foreground">
            {total} {total === 1 ? "event" : "events"}
          </span>
        </div>
        <div className="flex items-center gap-2 pl-[38px]">
          {/* Kind filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
              >
                <FilterIcon className="size-3" strokeWidth={1.75} />
                {kindFilterLabel}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                Filter by kind
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setKindFilter("all")}>
                All kinds
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(Object.keys(KIND_LABELS) as EventKind[]).map((k) => {
                const Icon = KIND_ICONS[k]
                return (
                  <DropdownMenuItem
                    key={k}
                    onSelect={() => setKindFilter(k)}
                    className="gap-2"
                  >
                    <Icon className={cn("size-3", KIND_HUE[k])} strokeWidth={1.75} />
                    {KIND_LABELS[k]}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Board filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
              >
                {boardFilterLabel}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                Filter by board
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setBoardFilter("all")}>
                All boards
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {boardOptions.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onSelect={() => setBoardFilter(b.id)}
                >
                  {b.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(kindFilter !== "all" || boardFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setKindFilter("all")
                setBoardFilter("all")
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="min-w-0 flex-1 px-6 py-5">
        {groups.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center text-[12.5px] text-muted-foreground">
            {events.length === 0 ? (
              <>
                <HistoryIcon
                  className="mx-auto mb-2 size-5 text-muted-foreground/60"
                  strokeWidth={1.5}
                />
                No events yet. Edit a row or run AI to start.
              </>
            ) : (
              "No events match these filters."
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 pl-[38px]">
            {groups.map((g) => (
              <section key={g.dayStart}>
                <h2 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {g.label}
                </h2>
                <ul className="flex flex-col">
                  {g.events.map((e) => (
                    <HistoryRow
                      key={e.id}
                      event={e}
                      boardLabel={
                        e.boardId
                          ? boards[e.boardId]?.label ?? "(deleted board)"
                          : "Workspace"
                      }
                      onJump={() => jump(e)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryRow({
  event,
  boardLabel,
  onJump,
}: {
  event: TimestampedEvent
  boardLabel: string
  onJump: () => void
}) {
  const Icon = event.kind.startsWith("ai_") ? Bot : KIND_ICONS[event.kind]
  const hue = KIND_HUE[event.kind]
  // detail 결정: title 우선, 없으면 row 변경 요약
  const detail = event.title ?? formatRowDetail(event)
  return (
    <li>
      <button
        type="button"
        onClick={onJump}
        className="group flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-foreground/[0.04]"
      >
        <span
          className={cn(
            "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded",
            "bg-foreground/[0.04]",
            hue,
          )}
        >
          <Icon className="size-3" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[12.5px] font-medium">
              {KIND_LABELS[event.kind]}
            </span>
            <span className="truncate text-[11.5px] text-muted-foreground">
              {boardLabel}
              {event.rowId && (
                <>
                  {" · "}
                  <code className="font-mono text-[11px]">{event.rowId}</code>
                </>
              )}
              {event.rowIds && event.rowIds.length > 1 && (
                <> · {event.rowIds.length} rows</>
              )}
            </span>
          </div>
          {detail && (
            <div className="truncate text-[11.5px] text-muted-foreground">
              {detail}
            </div>
          )}
        </div>
        <span className="shrink-0 whitespace-nowrap text-[10.5px] tabular-nums text-muted-foreground">
          {formatTime(event.ts)}
        </span>
      </button>
    </li>
  )
}

// row_updated 시 prev → next 의미있는 변경 추출. 너무 길면 truncate.
function formatRowDetail(event: TimestampedEvent): string | null {
  if (event.kind === "row_added" && event.next) {
    // 첫 의미있는 string 필드 표시
    const entries = Object.entries(event.next).filter(
      ([k, v]) =>
        typeof v === "string" &&
        v.trim() !== "" &&
        !["id", "createdAt", "updatedAt"].includes(k) &&
        !k.endsWith("Confirmed"),
    )
    if (entries.length === 0) return null
    const [, v] = entries[0]
    const text = String(v)
    return text.length > 60 ? `${text.slice(0, 60)}…` : text
  }
  if (event.kind === "row_updated" && event.prev && event.next) {
    const changes: string[] = []
    for (const [k, nv] of Object.entries(event.next)) {
      if (k === "updatedAt" || k === "id") continue
      const pv = (event.prev as Record<string, unknown>)[k]
      if (pv === nv) continue
      const left = pv == null || pv === "" ? "—" : String(pv)
      const right = nv == null || nv === "" ? "—" : String(nv)
      changes.push(`${k}: ${truncate(left, 18)} → ${truncate(right, 18)}`)
      if (changes.length >= 2) break
    }
    return changes.length > 0 ? changes.join(" · ") : null
  }
  return null
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}
