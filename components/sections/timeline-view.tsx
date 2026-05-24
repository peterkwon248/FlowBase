// FlowBase V2 — Timeline view (날짜 기반 그룹)
// 출처: design-ref/prototype/view-timeline.jsx
//
// 첫 date 컬럼 기준으로 월별 그룹화. 각 그룹 내 카드 리스트 (제목·status·priority).
// date 컬럼 없으면 안내. RowContextMenu 래핑으로 우클릭 메뉴 지원.

"use client"

import { useMemo } from "react"
import { CalendarRange } from "lucide-react"
import { RowContextMenu } from "@/components/sheet/row-context-menu"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import { statusBgClass, statusColorClass } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, type ColumnDef, type TableRow, type TicketStatus } from "@/types/flowbase"

interface MonthGroup {
  key: string // "2026-05"
  label: string // "May 2026"
  rows: TableRow[]
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function monthKey(iso: string): string {
  // expects YYYY-MM-DD or full ISO
  if (!iso) return "no-date"
  const m = iso.match(/^(\d{4})-(\d{2})/)
  if (!m) return "no-date"
  return `${m[1]}-${m[2]}`
}

function monthLabel(key: string): string {
  if (key === "no-date") return "No date"
  const [y, m] = key.split("-")
  const idx = parseInt(m, 10) - 1
  return `${MONTHS[idx] ?? m} ${y}`
}

export function TimelineView() {
  const board = useFlowBase(selectActiveBoard)
  const search = useFlowBase((s) => s.search)
  const filter = useFlowBase((s) => s.filter)
  const sort = useFlowBase((s) => s.sort)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const rows = useMemo(
    () => selectVisibleRows(useFlowBase.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, search, filter, sort, columnFilters],
  )
  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const setSelected = useFlowBase((s) => s.setSelected)
  const togglePanel = useFlowBase((s) => s.togglePanel)
  const panels = useFlowBase((s) => s.panels)

  const dateCol: ColumnDef | null = useMemo(() => {
    if (!board) return null
    return board.columns.find((c) => c.type === "date") ?? null
  }, [board])

  const titleCol: ColumnDef | null = useMemo(() => {
    if (!board) return null
    const cols = board.columns.filter((c) => c.name !== "id")
    return (
      cols.find((c) => c.type === "avatar") ??
      cols.find((c) => c.type === "text") ??
      cols[0] ??
      null
    )
  }, [board])

  const statusCol: ColumnDef | null = useMemo(() => {
    if (!board) return null
    return board.columns.find((c) => c.type === "status") ?? null
  }, [board])

  const priorityCol: ColumnDef | null = useMemo(() => {
    if (!board) return null
    return board.columns.find((c) => c.name === "priority") ?? null
  }, [board])

  const groups: MonthGroup[] = useMemo(() => {
    if (!dateCol) return []
    const buckets = new Map<string, TableRow[]>()
    for (const r of rows) {
      const v = r[dateCol.name]
      const key = typeof v === "string" ? monthKey(v) : "no-date"
      const arr = buckets.get(key) ?? []
      arr.push(r)
      buckets.set(key, arr)
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1)) // 최근이 먼저
      .map(([key, rows]) => ({
        key,
        label: monthLabel(key),
        rows: rows.slice().sort((a, b) => {
          const av = String(a[dateCol.name] ?? "")
          const bv = String(b[dateCol.name] ?? "")
          return av < bv ? 1 : -1
        }),
      }))
  }, [rows, dateCol])

  if (!board) return null

  if (!dateCol) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="max-w-sm px-8 text-center">
          <CalendarRange
            className="mx-auto mb-3 size-7 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <h3 className="text-[13.5px] font-semibold">Timeline needs a date column</h3>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            Add a date-type column to group rows by month.
          </p>
        </div>
      </div>
    )
  }

  const openDetail = (rowId: string) => {
    setSelected([rowId])
    if (!panels.detailBar) togglePanel("detailBar")
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-5">
      {groups.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center text-[12.5px] text-muted-foreground">
          No items match the current filters.
        </div>
      ) : (
        <div className="mx-auto max-w-[920px] space-y-6">
          {groups.map((g) => (
            <section key={g.key} data-timeline-group={g.key}>
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className="text-[14px] font-bold">{g.label}</h3>
                <span className="rounded bg-muted px-1.5 py-0 font-mono text-[10.5px] text-muted-foreground tabular-nums">
                  {g.rows.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {g.rows.map((row) => (
                  <RowContextMenu key={row.id} rowId={row.id}>
                    <TimelineRow
                      row={row}
                      titleCol={titleCol}
                      dateCol={dateCol}
                      statusCol={statusCol}
                      priorityCol={priorityCol}
                      selected={selectedRowIds.includes(row.id)}
                      onClick={() => openDetail(row.id)}
                    />
                  </RowContextMenu>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function TimelineRow({
  row,
  titleCol,
  dateCol,
  statusCol,
  priorityCol,
  selected,
  onClick,
}: {
  row: TableRow
  titleCol: ColumnDef | null
  dateCol: ColumnDef
  statusCol: ColumnDef | null
  priorityCol: ColumnDef | null
  selected: boolean
  onClick: () => void
}) {
  const date = String(row[dateCol.name] ?? "")
  const day = date.split("-")[2] ?? "--"
  const title = titleCol ? String(row[titleCol.name] ?? row.id) : row.id
  const status = statusCol
    ? (String(row[statusCol.name] ?? "") as TicketStatus | "")
    : ""
  const priority = priorityCol ? String(row[priorityCol.name] ?? "") : ""

  return (
    <button
      type="button"
      onClick={onClick}
      data-timeline-row={row.id}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border bg-card px-3 py-2 text-left transition-colors",
        selected
          ? "border-primary"
          : "border-border-subtle hover:border-border hover:bg-foreground/[0.02]",
      )}
    >
      <div className="flex w-10 shrink-0 flex-col items-center">
        <span className="text-[16px] font-bold tabular-nums leading-none">
          {day}
        </span>
        <span className="font-mono text-[9.5px] text-muted-foreground">
          {date.slice(5, 7)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{title}</div>
        <div className="truncate font-mono text-[10.5px] text-muted-foreground">
          {row.id}
        </div>
      </div>
      {priority && (
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
          {priority}
        </span>
      )}
      {status && (
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-semibold",
            statusBgClass(status as TicketStatus),
            statusColorClass(status as TicketStatus),
          )}
        >
          {STATUS_LABELS[status as TicketStatus] ?? status}
        </span>
      )}
    </button>
  )
}
