// FlowBase V2 — Timeline view (Gantt-style)
// 출처: design-ref/prototype/view-timeline.jsx (충실 답습)
//
// 가로 day-column header(sticky) + 각 row마다 start~due Gantt bar.
// today/주말 배경 highlight, OVERDUE 배지(due < today && status !== 완료).
// 필드는 board.columns에서 휴리스틱 자동 추출. RowContextMenu 통합.

"use client"

import { useMemo } from "react"
import { CalendarRange } from "lucide-react"
import { EmptyState } from "@/components/board/empty-state"
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
// scale별 컬럼(=버킷) 폭. day=1일, week=1주, month=1달이 한 컬럼.
const COL_WIDTH_DAY = 34
const COL_WIDTH_WEEK = 54
const COL_WIDTH_MONTH = 68
const LABEL_WIDTH = 280 // 좌측 item 라벨 영역
const CHECK_WIDTH = 32 // 체크박스 영역
const KO_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"]
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

type TimeScale = "day" | "week" | "month"

// 한 컬럼 = 한 버킷. scale에 따라 실제 시간 단위(일/주/달)로 집계.
interface Tick {
  key: string
  startMs: number // 버킷 시작(UTC) — bucketIndexOf 비교 기준
  label: string
  sub: string
  isToday: boolean
  isWeekend: boolean
}

// status별 bar 색 — Tailwind v4 토큰 (CSS var). LOCK 색 매핑 보존.
const STATUS_BAR_COLOR: Record<TicketStatus, string> = {
  미처리: "var(--color-blue-500)",
  진행중: "var(--color-amber-500)",
  대기: "var(--color-violet-500)",
  완료: "var(--color-emerald-500)",
}

// UTC 기준 스냅 — "YYYY-MM-DD"가 UTC 자정으로 파싱되므로 버킷 경계도 UTC로 맞춰
// due 날짜 ms가 정확히 해당 버킷 startMs와 일치(day scale 기존 동작 보존).
function startOfDayUTC(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}
function startOfWeekUTC(ms: number): number {
  const sod = startOfDayUTC(ms)
  return sod - new Date(sod).getUTCDay() * DAY_MS // 주 시작 = 일요일
}
function startOfMonthUTC(ms: number): number {
  const d = new Date(ms)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
}

// [minMs, maxMs] 구간을 scale 단위 버킷 배열로. day scale은 기존 day-by-day 보존.
function buildTicks(
  minMs: number,
  maxMs: number,
  scale: TimeScale,
  todayMs: number,
): Tick[] {
  const ticks: Tick[] = []
  if (scale === "month") {
    const end = startOfMonthUTC(maxMs)
    const todayBucket = startOfMonthUTC(todayMs)
    let cur = startOfMonthUTC(minMs)
    while (cur <= end) {
      const d = new Date(cur)
      const m = d.getUTCMonth()
      ticks.push({
        key: `m${cur}`,
        startMs: cur,
        label: MONTH_NAMES[m],
        sub: m === 0 || ticks.length === 0 ? String(d.getUTCFullYear()) : "",
        isToday: cur === todayBucket,
        isWeekend: false,
      })
      cur = Date.UTC(d.getUTCFullYear(), m + 1, 1)
    }
  } else if (scale === "week") {
    const end = startOfWeekUTC(maxMs)
    const todayBucket = startOfWeekUTC(todayMs)
    let cur = startOfWeekUTC(minMs)
    while (cur <= end) {
      const d = new Date(cur)
      ticks.push({
        key: `w${cur}`,
        startMs: cur,
        label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
        sub: "",
        isToday: cur === todayBucket,
        isWeekend: false,
      })
      cur += 7 * DAY_MS
    }
  } else {
    const end = startOfDayUTC(maxMs)
    const todayBucket = startOfDayUTC(todayMs)
    let cur = startOfDayUTC(minMs)
    while (cur <= end) {
      const dow = new Date(cur).getUTCDay()
      const iso = new Date(cur).toISOString().slice(0, 10)
      ticks.push({
        key: iso,
        startMs: cur,
        label: iso.slice(5),
        sub: KO_WEEKDAY[dow],
        isToday: cur === todayBucket,
        isWeekend: dow === 0 || dow === 6,
      })
      cur += DAY_MS
    }
  }
  return ticks
}

// ms가 속한 버킷 index (ticks 오름차순 가정). 범위 밖이면 -1.
function bucketIndexOf(ticks: Tick[], ms: number): number {
  if (!Number.isFinite(ms) || ticks.length === 0) return -1
  let idx = -1
  for (let i = 0; i < ticks.length; i++) {
    if (ticks[i].startMs <= ms) idx = i
    else break
  }
  return idx
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
        (c.type === "select" ||
          c.type === "multiSelect" ||
          c.type === "text") &&
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

  const scale: TimeScale =
    settings?.scale === "month"
      ? "month"
      : settings?.scale === "week"
        ? "week"
        : "day"
  const colWidth =
    scale === "month"
      ? COL_WIDTH_MONTH
      : scale === "week"
        ? COL_WIDTH_WEEK
        : COL_WIDTH_DAY

  // dated rows + 버킷(ticks) 계산 — hooks를 항상 같은 순서로 (early return 전)
  const { datedRows, ticks, todayISO } = useMemo(() => {
    if (!dateCol) return { datedRows: [], ticks: [] as Tick[], todayISO: "" }
    const dated = rows.filter((r) => typeof r[dateCol.name] === "string" && r[dateCol.name])
    if (dated.length === 0) {
      const today = new Date().toISOString().slice(0, 10)
      return { datedRows: [], ticks: [] as Tick[], todayISO: today }
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
    const built = buildTicks(min, max, scale, todayMs)
    // due 오름차순 정렬
    const sorted = [...dated].sort((a, b) => {
      const at = new Date(String(a[dateCol.name])).getTime()
      const bt = new Date(String(b[dateCol.name])).getTime()
      return at - bt
    })
    return { datedRows: sorted, ticks: built, todayISO: today.toISOString().slice(0, 10) }
  }, [rows, dateCol, startCol, scale])

  if (!board) return null

  if (!dateCol) {
    return (
      <EmptyState
        Icon={CalendarRange}
        title="Timeline needs a date column"
        description="Add a date-type column to render the Gantt timeline."
      />
    )
  }

  if (datedRows.length === 0) {
    return (
      <EmptyState
        Icon={CalendarRange}
        title={`No rows with ${dateCol.label || dateCol.name}`}
        description={`Add a value to the "${dateCol.label || dateCol.name}" column on at least one row to see it on the timeline.`}
      />
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
            {ticks.map((t) => (
              <div
                key={t.key}
                style={{
                  width: colWidth,
                  background: t.isToday
                    ? "color-mix(in oklch, var(--primary) 14%, transparent)"
                    : t.isWeekend
                      ? "var(--muted)"
                      : "transparent",
                }}
                className={cn(
                  "flex flex-col items-center gap-px border-r border-border-subtle py-2 font-mono text-[10px] leading-[1.2]",
                  t.isToday
                    ? "font-semibold text-primary"
                    : "font-medium text-muted-foreground",
                )}
              >
                <span>{t.label}</span>
                <span className="text-[8.5px] opacity-70">{t.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {datedRows.map((row) => (
          <RowContextMenu key={row.id} rowId={row.id}>
            <GanttRow
              row={row}
              ticks={ticks}
              todayISO={todayISO}
              colWidth={colWidth}
              scale={scale}
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
  ticks: Tick[]
  todayISO: string
  colWidth: number
  scale: TimeScale
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
  ticks,
  todayISO,
  colWidth,
  scale,
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
  // multiSelect cell이면 첫 값만 (Gantt 한 행이라 단일 표시).
  const subtitle = (() => {
    if (!subtitleCol) return ""
    const v = row[subtitleCol.name]
    if (Array.isArray(v)) return v.length > 0 ? String(v[0]) : ""
    return v == null ? "" : String(v)
  })()
  const title =
    (titleCol ? String(row[titleCol.name] ?? "") : "") || String(row.id)

  const dueIdx = bucketIndexOf(ticks, due ? new Date(due).getTime() : NaN)
  // start 명시 없으면 fallback 폭 — day scale은 4버킷(≈5일), week/month는 1버킷
  const fallbackBack = scale === "day" ? 4 : 0
  const startIdx = start
    ? bucketIndexOf(ticks, new Date(start).getTime())
    : Math.max(0, dueIdx - fallbackBack)
  const barStart = startIdx >= 0 ? startIdx : Math.max(0, dueIdx - fallbackBack)
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
        {ticks.map((t) => (
          <div
            key={t.key}
            style={{
              width: colWidth,
              background: t.isToday
                ? "color-mix(in oklch, var(--primary) 8%, transparent)"
                : t.isWeekend
                  ? "color-mix(in oklch, var(--muted) 50%, transparent)"
                  : "transparent",
            }}
            className="border-r border-border-subtle"
          />
        ))}
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
