// FlowBase V2 — Kanban 뷰 (status 칸별 보드)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §3
// 출처: design-ref/prototype/prototype-shell.jsx KanbanView
//
// status 컬럼별 4칸. 카드 이동 = 버튼(DnD ❌, D1). 카드 표시 필드는
// board columns에서 파생(deriveCardConfig, D6). LOCK status 색.

"use client"

import { useMemo } from "react"
import { statusIcon } from "@/components/sheet/editable-cell"
import { STATUS_OPTIONS } from "@/lib/flowbase-seed"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import { priorityDotClass, statusColorClass } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, type ColumnDef, type TableRow, type TicketStatus } from "@/types/flowbase"

// ── 카드 표시 필드 파생 (D6) ──────────────────────────────────────
interface CardConfig {
  titleField: string
  subtitleField: string | null
  badgeField: string | null
  dateField: string | null
  hasPriority: boolean
}

function deriveCardConfig(columns: ColumnDef[]): CardConfig {
  const usable = columns.filter((c) => c.name !== "id")
  const title =
    usable.find((c) => c.type === "avatar") ??
    usable.find((c) => c.type === "text")
  const titleName = title?.name ?? "id"
  // subtitle — title 이후의 마지막 text 컬럼 (가장 서술적인 자유 텍스트)
  const textCols = usable.filter(
    (c) => c.type === "text" && c.name !== titleName,
  )
  const badge = usable.find((c) => c.type === "select")
  const date = usable.find((c) => c.type === "date")
  return {
    titleField: titleName,
    subtitleField: textCols.at(-1)?.name ?? null,
    badgeField: badge?.name ?? null,
    dateField: date?.name ?? null,
    hasPriority: columns.some((c) => c.name === "priority"),
  }
}

function cellText(row: TableRow, field: string | null): string {
  if (!field) return ""
  const v = row[field]
  return v == null ? "" : String(v)
}

export function KanbanView() {
  const board = useFlowBase(selectActiveBoard)
  // selectVisibleRows는 새 배열을 반환 → 직접 구독 ❌. 의존 슬라이스 구독 후 useMemo.
  const search = useFlowBase((s) => s.search)
  const filter = useFlowBase((s) => s.filter)
  const sort = useFlowBase((s) => s.sort)
  const columnFilters = useFlowBase((s) => s.columnFilters)
  const rows = useMemo(
    () => selectVisibleRows(useFlowBase.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, search, filter, sort, columnFilters],
  )
  const updateRow = useFlowBase((s) => s.updateRow)
  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const setSelected = useFlowBase((s) => s.setSelected)
  // Display: groupBy. 기본 status (있는 보드만).
  const groupByOpt = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.kanban?.groupBy,
  )

  if (!board) return null

  const cfg = deriveCardConfig(board.columns)

  // groupBy 컬럼 결정 — 옵션 우선, fallback first status col.
  const groupCol =
    board.columns.find((c) => c.name === groupByOpt && (c.type === "status" || c.type === "select")) ??
    board.columns.find((c) => c.type === "status") ??
    null
  const groupName = groupCol?.name ?? "status"
  const isStatusGroup = groupCol?.type === "status"

  // group values: status면 STATUS_OPTIONS (LOCK), select면 options 또는 unique
  const groupValues: string[] = isStatusGroup
    ? [...STATUS_OPTIONS]
    : groupCol
      ? Array.from(
          new Set([
            ...(groupCol.options ?? []),
            ...rows
              .map((r) => r[groupName])
              .filter((v): v is string => typeof v === "string" && !!v),
          ]),
        )
      : [...STATUS_OPTIONS]

  const toggleSelect = (id: string) => {
    setSelected(
      selectedRowIds.includes(id)
        ? selectedRowIds.filter((x) => x !== id)
        : [...selectedRowIds, id],
    )
  }

  return (
    <div className="grid flex-1 auto-cols-[minmax(260px,1fr)] grid-flow-col gap-3 overflow-auto bg-background p-4">
      {groupValues.map((value) => {
        const items = rows.filter((r) => r[groupName] === value)
        const label = isStatusGroup
          ? STATUS_LABELS[value as TicketStatus] ?? value
          : value
        return (
          <div
            key={value}
            data-kanban-col={value}
            className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface"
          >
            {/* 칸 헤더 */}
            <div className="flex items-center gap-1.5 border-b border-border-subtle px-3 py-2.5">
              {isStatusGroup ? (
                statusIcon(value as TicketStatus)
              ) : (
                <span className="size-2 rounded-full bg-chart-1" aria-hidden="true" />
              )}
              <span className="text-[13px] font-semibold">{label}</span>
              <span className="tabular-nums text-[11.5px] text-muted-foreground">
                {items.length}
              </span>
            </div>

            {/* 카드 목록 */}
            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
              {items.map((row) => (
                <KanbanCard
                  key={row.id}
                  row={row}
                  groupName={groupName}
                  groupValue={value}
                  groupValues={groupValues}
                  isStatusGroup={!!isStatusGroup}
                  cfg={cfg}
                  selected={selectedRowIds.includes(row.id)}
                  onToggleSelect={() => toggleSelect(row.id)}
                  onMove={(to) => updateRow(row.id, { [groupName]: to })}
                />
              ))}
              {items.length === 0 && (
                <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 카드 ──────────────────────────────────────────────────────────
interface KanbanCardProps {
  row: TableRow
  groupName: string
  groupValue: string
  groupValues: string[]
  isStatusGroup: boolean
  cfg: CardConfig
  selected: boolean
  onToggleSelect: () => void
  onMove: (to: string) => void
}

function KanbanCard({
  row,
  groupName: _gn,
  groupValue,
  groupValues,
  isStatusGroup,
  cfg,
  selected,
  onToggleSelect,
  onMove,
}: KanbanCardProps) {
  const title = cellText(row, cfg.titleField) || String(row.id)
  const subtitle = cellText(row, cfg.subtitleField)
  const badge = cellText(row, cfg.badgeField)
  const date = cellText(row, cfg.dateField)
  const priority = cfg.hasPriority ? String(row.priority ?? "") : ""

  return (
    <div
      onClick={onToggleSelect}
      className={cn(
        "flex cursor-pointer flex-col gap-1.5 rounded-md border bg-card p-2.5 transition-colors",
        selected ? "border-primary ring-1 ring-primary" : "border-border-subtle",
      )}
    >
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer"
        />
        <span className="font-mono text-[10.5px] text-muted-foreground">
          {String(row.id)}
        </span>
        <span className="flex-1" />
        {priority && (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                priorityDotClass(
                  priority as "Urgent" | "High" | "Med" | "Low",
                ),
              )}
            />
            {priority}
          </span>
        )}
      </div>

      <div className="text-[13px] font-semibold leading-snug">{title}</div>
      {subtitle && (
        <div className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {subtitle}
        </div>
      )}

      {(badge || date) && (
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="rounded bg-chart-1/10 px-1.5 py-px text-[11px] font-medium text-chart-1">
              {badge}
            </span>
          )}
          <span className="flex-1" />
          {date && (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {date}
            </span>
          )}
        </div>
      )}

      {/* 이동 버튼 (D1 — DnD ❌) */}
      <div className="mt-1 flex flex-wrap gap-1 border-t border-border-subtle pt-1.5">
        {groupValues
          .filter((o) => o !== groupValue)
          .map((to) => {
            const label = isStatusGroup
              ? STATUS_LABELS[to as TicketStatus] ?? to
              : to
            return (
              <button
                key={to}
                type="button"
                title={`Move to ${label}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onMove(to)
                }}
                className={cn(
                  "flex-1 rounded border border-border py-0.5 text-[10.5px] text-muted-foreground hover:bg-foreground/[0.05]",
                  isStatusGroup && statusColorClass(to as TicketStatus),
                )}
              >
                → {label}
              </button>
            )
          })}
      </div>
    </div>
  )
}
