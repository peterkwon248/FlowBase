// FlowBase V2 — Timeline view (Gantt-style)
// 출처: design-ref/prototype/view-timeline.jsx (충실 답습)
//
// 가로 day-column header(sticky) + 각 row마다 start~due Gantt bar.
// today/주말 배경 highlight, OVERDUE 배지(due < today && status !== 완료).
// 필드는 board.columns에서 휴리스틱 자동 추출. RowContextMenu 통합.

"use client"

import { useMemo } from "react"
import { CalendarRange } from "lucide-react"
import { RowContextMenu } from "@/components/sheet/row-context-menu"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import {
  STATUS_LABELS,
  type ColumnDef,
  type TableRow,
  type TicketStatus,
} from "@/types/flowbase"

const DAY_MS = 86_400_000
const COL_WIDTH_DAY = 34 // day scale — px per day
const COL_WIDTH_WEEK = 14 // week scale — 압축
const COL_WIDTH_MONTH = 8 // month scale — 장기 timeline overview
const LABEL_WIDTH = 280 // 좌측 item 라벨 영역
const CHECK_WIDTH = 32 // 체크박스 영역
const KO_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"]

// status별 bar 색 — Tailwind v4 토큰 (CSS var). LOCK 색 매핑 보존.
const STATUS_BAR_COLOR: Record<TicketStatus, string> = {
  미처리: "var(--color-blue-500)",
  진행중: "var(--color-amber-500)",
  대기: "var(--color-violet-500)",
  완료: "var(--color-emerald-500)",
}

// ── 필드 휴리스틱 ────────────────────────────────────────
// dateCol = 첫 date type
// startCol = name이 created/createdAt/startDate인 컬럼, 또는 다른 date col, 아니면 null
// titleCol = avatar 또는 text 첫 컬럼 (id 제외)
// subtitleCol = assignee 이름 컬럼, 또는 첫 select(status/priority 아닌)
// statusCol = status type
// priorityCol = name "priority"
function pickColumns(board: { columns: ColumnDef[] } | undefined) {
  if (!board) {
    return {
      dateCol: null,
      startCol: null,
      titleCol: null,
      subtitleCol: null,
      statusCol: null,
      priorityCol: null,
    }
  }
  const cols = board.columns
  const dateCols = cols.filter((c) => c.type === "date")
  const dateCol = dateCols[0] ?? null
  const startNamed = cols.find(
    (c) =>
      c.type === "date" &&
      (c.name === "created" ||
        c.name === "createdAt" ||
        c.name === "startDate" ||
        c.name === "start"),
  )
  // 명시 created가 없으면 두 번째 date col (dateCol과 다른) 사용
  const startCol =
    startNamed ?? dateCols.find((c) => dateCol && c.name !== dateCol.name) ?? null
  const titleCol =
    cols.find((c) => c.type === "avatar" && c.name !== "id") ??
    cols.find((c) => c.type === "text" && c.name !== "id") ??
    cols.find((c) => c.name !== "id") ??
    null
  const statusCol = cols.find((c) => c.type === "status") ?? null
  const priorityCol = cols.find((c) => c.name === "priority") ?? null
  const subtitleCol =
    cols.find((c) => c.name === "assignee") ??
    cols.find(
      (c) =>
        (c.type === "select" || c.type === "text") &&
        c.name !== "id" &&
        c.name !== titleCol?.name &&
        c.name !== statusCol?.name &&
        c.name !== priorityCol?.name,
    ) ??
    null
  return { dateCol, startCol, titleCol, subtitleCol, statusCol, priorityCol }
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
  // Display 옵션 — dateField + scale.
  const settings = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.timeline,
  )

  const picked = useMemo(() => pickColumns(board), [board])
  // settings.dateField가 valid date 컬럼이면 override
  const overrideDateCol =
    settings?.dateField && board
      ? (board.columns.find(
          (c) => c.name === settings.dateField && c.type === "date",
        ) ?? null)
      : null
  const dateCol = overrideDateCol ?? picked.dateCol
  const { startCol, titleCol, subtitleCol, statusCol, priorityCol } = picked

  const colWidth =
    settings?.scale === "month"
      ? COL_WIDTH_MONTH
      : settings?.scale === "week"
        ? COL_WIDTH_WEEK
        : COL_WIDTH_DAY

  // dated rows + date range 계산 — hooks를 항상 같은 순서로 (early return 전)
  const { datedRows, days, todayISO } = useMemo(() => {
    if (!dateCol) return { datedRows: [], days: [] as string[], todayISO: "" }
    const dated = rows.filter((r) => typeof r[dateCol.name] === "string" && r[dateCol.name])
    if (dated.length === 0) {
      const today = new Date().toISOString().slice(0, 10)
      return { datedRows: [], days: [], todayISO: today }
    }
    const allTs: number[] = []
    for (const r of dated) {
      const due = r[dateCol.name]
      if (typeof due === "string") {
        const t = new Date(due).getTime()
        if (Number.isFinite(t)) allTs.push(t)
      }
      if (startCol) {
        const s = r[startCol.name]
        if (typeof s === "string") {
          const t = new Date(s).getTime()
          if (Number.isFinite(t)) allTs.push(t)
        }
      }
    }
    const today = new Date()
    const todayMs = today.getTime()
    allTs.push(todayMs)
    const min = Math.min(...allTs) - 2 * DAY_MS
    const max = Math.max(...allTs) + 2 * DAY_MS
    const dayList: string[] = []
    for (let t = min; t <= max; t += DAY_MS) {
      dayList.push(new Date(t).toISOString().slice(0, 10))
    }
    // due 오름차순 정렬
    const sorted = [...dated].sort((a, b) => {
      const at = new Date(String(a[dateCol.name])).getTime()
      const bt = new Date(String(b[dateCol.name])).getTime()
      return at - bt
    })
    return { datedRows: sorted, days: dayList, todayISO: today.toISOString().slice(0, 10) }
  }, [rows, dateCol, startCol])

  if (!board) return null

  if (!dateCol) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="max-w-sm px-8 text-center">
          <CalendarRange
            className="mx-auto mb-3 size-7 text-muted-foreground/40"
            strokeWidth={1.5}
          />
          <h3 className="text-[13.5px] font-semibold">
            Timeline needs a date column
          </h3>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            Add a date-type column to render the Gantt timeline.
          </p>
        </div>
      </div>
    )
  }

  if (datedRows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="max-w-sm px-8 text-center text-[12.5px] text-muted-foreground">
          No rows with{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {dateCol.name}
          </code>{" "}
          dates. Add a date to a row to see it on the timeline.
        </div>
      </div>
    )
  }

  const toggleSel = (id: string) => {
    const has = selectedRowIds.includes(id)
    setSelected(has ? selectedRowIds.filter((x) => x !== id) : [...selectedRowIds, id])
  }

  const openDetail = (id: string) => {
    setSelected([id])
    if (!panels.detailBar) togglePanel("detailBar")
  }

  return (
    <div className="min-w-0 flex-1 overflow-auto bg-background" data-timeline-gantt>
      <div className="block w-full min-w-full">
        {/* Sticky header */}
        <div className="sticky top-0 z-[2] flex border-b border-border bg-surface">
          <div
            style={{ width: CHECK_WIDTH }}
            className="shrink-0 border-r border-border"
          />
          <div
            style={{ width: LABEL_WIDTH }}
            className="shrink-0 border-r border-border px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
          >
            Item ({datedRows.length}) · by {dateCol.name}
          </div>
          <div className="flex">
            {days.map((d) => {
              const isToday = d === todayISO
              const isWeekend = [0, 6].includes(new Date(d).getDay())
              return (
                <div
                  key={d}
                  style={{
                    width: colWidth,
                    background: isToday
                      ? "color-mix(in oklch, var(--primary) 14%, transparent)"
                      : isWeekend
                        ? "var(--muted)"
                        : "transparent",
                  }}
                  className={cn(
                    "flex flex-col items-center gap-px border-r border-border-subtle py-2 font-mono text-[10px] leading-[1.2]",
                    isToday
                      ? "font-semibold text-primary"
                      : "font-medium text-muted-foreground",
                  )}
                >
                  <span>{d.slice(5)}</span>
                  <span className="text-[8.5px] opacity-70">
                    {KO_WEEKDAY[new Date(d).getDay()]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rows */}
        {datedRows.map((row) => (
          <RowContextMenu key={row.id} rowId={row.id}>
            <GanttRow
              row={row}
              days={days}
              todayISO={todayISO}
              colWidth={colWidth}
              dateCol={dateCol}
              startCol={startCol}
              titleCol={titleCol}
              subtitleCol={subtitleCol}
              statusCol={statusCol}
              priorityCol={priorityCol}
              selected={selectedRowIds.includes(row.id)}
              onToggleSelect={() => toggleSel(row.id)}
              onOpenDetail={() => openDetail(row.id)}
            />
          </RowContextMenu>
        ))}
      </div>
    </div>
  )
}

interface GanttRowProps {
  row: TableRow
  days: string[]
  todayISO: string
  colWidth: number
  dateCol: ColumnDef
  startCol: ColumnDef | null
  titleCol: ColumnDef | null
  subtitleCol: ColumnDef | null
  statusCol: ColumnDef | null
  priorityCol: ColumnDef | null
  selected: boolean
  onToggleSelect: () => void
  onOpenDetail: () => void
}

function GanttRow({
  row,
  days,
  todayISO,
  colWidth,
  dateCol,
  startCol,
  titleCol,
  subtitleCol,
  statusCol,
  priorityCol,
  selected,
  onToggleSelect,
  onOpenDetail,
}: GanttRowProps) {
  const due = String(row[dateCol.name] ?? "")
  const start =
    startCol && typeof row[startCol.name] === "string"
      ? String(row[startCol.name])
      : ""
  const status = statusCol
    ? (String(row[statusCol.name] ?? "") as TicketStatus | "")
    : ""
  const priority = priorityCol ? String(row[priorityCol.name] ?? "") : ""
  const subtitle = subtitleCol ? String(row[subtitleCol.name] ?? "") : ""
  const title =
    (titleCol ? String(row[titleCol.name] ?? "") : "") || String(row.id)

  const dueIdx = days.indexOf(due)
  // start 명시 없으면 dueIdx - 4 (최소 4일 폭) fallback
  const startIdx = start ? days.indexOf(start) : Math.max(0, dueIdx - 4)
  const barStart = startIdx >= 0 ? startIdx : Math.max(0, dueIdx - 4)
  const barEnd = Math.max(barStart, dueIdx)
  const barWidth = Math.max(1, barEnd - barStart + 1)
  const overdue =
    !!due && due < todayISO && status !== "" && status !== "완료"
  const barColor =
    status && status in STATUS_BAR_COLOR
      ? STATUS_BAR_COLOR[status as TicketStatus]
      : "var(--color-blue-500)"

  return (
    <div
      data-timeline-row={row.id}
      onClick={onOpenDetail}
      style={{
        background: selected
          ? "color-mix(in oklch, var(--primary) 7%, transparent)"
          : undefined,
      }}
      className="flex min-h-10 cursor-pointer items-stretch border-b border-border-subtle"
    >
      {/* 체크박스 */}
      <div
        style={{ width: CHECK_WIDTH }}
        className="flex shrink-0 items-center justify-center border-r border-border-subtle"
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect()
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="m-0 cursor-pointer"
          aria-label={`Select ${row.id}`}
        />
      </div>

      {/* Label 영역 */}
      <div
        style={{ width: LABEL_WIDTH }}
        className="flex shrink-0 flex-col justify-center border-r border-border px-3.5 py-2"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: barColor }}
          />
          <span className="truncate text-[12.5px] font-medium leading-[1.4]">
            {title}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <span className="font-mono">{row.id}</span>
          {subtitle && (
            <>
              <span className="opacity-50">·</span>
              <span>
                {subtitleCol?.name === "assignee" ? "@" : ""}
                {subtitle}
              </span>
            </>
          )}
          {overdue && (
            <span
              className="ml-auto whitespace-nowrap rounded px-1.5 py-px text-[9.5px] font-bold text-blue-700 dark:text-blue-300"
              style={{
                background:
                  "color-mix(in oklch, var(--color-blue-500) 18%, transparent)",
              }}
            >
              OVERDUE
            </span>
          )}
        </div>
      </div>

      {/* Gantt 영역 */}
      <div className="relative flex flex-1">
        {days.map((d) => {
          const isToday = d === todayISO
          const isWeekend = [0, 6].includes(new Date(d).getDay())
          return (
            <div
              key={d}
              style={{
                width: colWidth,
                background: isToday
                  ? "color-mix(in oklch, var(--primary) 8%, transparent)"
                  : isWeekend
                    ? "color-mix(in oklch, var(--muted) 50%, transparent)"
                    : "transparent",
              }}
              className="border-r border-border-subtle"
            />
          )
        })}
        {dueIdx >= 0 && (
          <div
            data-gantt-bar={row.id}
            style={{
              left: barStart * colWidth + 3,
              width: barWidth * colWidth - 6,
              top: "50%",
              transform: "translateY(-50%)",
              background: `color-mix(in oklch, ${barColor} 22%, var(--card))`,
              borderLeft: `3px solid ${barColor}`,
              color: barColor,
            }}
            className="absolute flex h-6 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-md px-2 text-[11px] font-medium"
          >
            {status && (
              <span className="shrink-0">{STATUS_LABELS[status as TicketStatus] ?? status}</span>
            )}
            {status && priority && (
              <span className="text-[10px] opacity-70">·</span>
            )}
            {priority && (
              <span className="truncate text-[10.5px] opacity-80">
                {priority}
              </span>
            )}
            {!status && !priority && (
              <span className="truncate text-[10.5px] opacity-80">{due}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
