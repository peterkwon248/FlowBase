// FlowBase V2 — Gallery view (카드 그리드)
// 출처: design-ref/prototype/view-grid.jsx GridView
//
// 행을 카드로 표시. 카드는 보드 컬럼에서 derive: avatar/name 컬럼 헤더,
// 그 다음 select/status/date 컬럼 4종까지. 체크박스 선택. 클릭 시 detail bar 포커스.

"use client"

import { useMemo } from "react"
import { Calendar, LayoutGrid, User } from "lucide-react"
import { EmptyState } from "@/components/board/empty-state"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { RowContextMenu } from "@/components/sheet/row-context-menu"
import {
  selectActiveBoard,
  selectVisibleRows,
  useFlowBase,
} from "@/lib/flowbase-store"
import { statusBgClass, statusColorClass } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, type ColumnDef, type TableRow, type TicketStatus } from "@/types/flowbase"

export function GalleryView() {
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
  // Display 옵션 — cover/cardFields/columns
  const settings = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.gallery,
  )

  // 카드 컬럼 선택: settings 우선, 없으면 휴리스틱 (avatar/text 헤더 + status/select/date/num 4개).
  const layout = useMemo(() => {
    if (!board) return { headerCol: null as ColumnDef | null, bodyCols: [] as ColumnDef[] }
    const cols = board.columns.filter((c) => c.name !== "id")
    const headerCol = settings?.coverField
      ? (cols.find((c) => c.name === settings.coverField) ?? null)
      : (cols.find((c) => c.type === "avatar") ??
          cols.find((c) => c.type === "text") ??
          cols[0] ??
          null)
    const bodyCols =
      settings?.cardFields && settings.cardFields.length > 0
        ? settings.cardFields
            .map((n) => cols.find((c) => c.name === n))
            .filter((c): c is ColumnDef => !!c)
        : cols
            .filter((c) => c !== headerCol)
            .filter((c) =>
              ["status", "select", "multiSelect", "date", "num"].includes(c.type),
            )
            .slice(0, 4)
    return { headerCol, bodyCols }
  }, [board, settings])

  // Grid columns — settings 명시면 고정 N, 없으면 auto-fill
  const gridTemplate = settings?.columns
    ? `repeat(${settings.columns}, minmax(0, 1fr))`
    : "repeat(auto-fill, minmax(240px, 1fr))"

  if (!board) return null

  const toggleSelect = (rowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const has = selectedRowIds.includes(rowId)
    setSelected(
      has ? selectedRowIds.filter((id) => id !== rowId) : [...selectedRowIds, rowId],
    )
  }

  const openDetail = (rowId: string) => {
    setSelected([rowId])
    if (!panels.detailBar) togglePanel("detailBar")
  }

  const hasAnyRow = (board?.rows.length ?? 0) > 0

  return (
    <div className="min-w-0 flex-1 overflow-auto bg-background p-4">
      {rows.length === 0 ? (
        <EmptyState
          Icon={LayoutGrid}
          title={hasAnyRow ? "No items match" : "No items yet"}
          description={
            hasAnyRow
              ? "Adjust filters or clear them to see all rows."
              : "Add a row in the Sheet view to see it as a card here."
          }
        />
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {rows.map((row) => {
            const selected = selectedRowIds.includes(row.id)
            return (
              <RowContextMenu key={row.id} rowId={row.id}>
                <div
                  data-gallery-card={row.id}
                  onClick={() => openDetail(row.id)}
                  className={cn(
                    "group relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3.5 text-left transition-all hover:-translate-y-px hover:shadow-md",
                    selected
                      ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
                      : "border-border-subtle",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) =>
                      toggleSelect(row.id, e as unknown as React.MouseEvent)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-2.5 top-2.5 size-3.5 cursor-pointer"
                    aria-label={`Select ${row.id}`}
                  />
                  <div className="pl-5">
                    <GalleryCardHeader col={layout.headerCol} row={row} />
                  </div>
                  <div className="space-y-1">
                    {layout.bodyCols.map((c) => (
                      <GalleryCardField key={c.name} col={c} row={row} />
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-1.5 text-[10.5px] text-muted-foreground">
                    <span className="font-mono">{row.id}</span>
                  </div>
                </div>
              </RowContextMenu>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GalleryCardHeader({
  col,
  row,
}: {
  col: ColumnDef | null
  row: TableRow
}) {
  if (!col) {
    return (
      <div className="text-[13px] font-medium font-mono text-muted-foreground">
        {row.id}
      </div>
    )
  }
  const value = row[col.name]
  if (col.type === "avatar") {
    const initial = String(value ?? "?")[0]?.toUpperCase() ?? "?"
    const subtitle = col.subtitleField
      ? String(row[col.subtitleField] ?? "")
      : ""
    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--chart-2), var(--chart-4))",
          }}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold">
            {String(value ?? "")}
          </div>
          {subtitle && (
            <div className="truncate text-[11px] text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="text-[14px] font-semibold leading-tight">
      {String(value ?? "")}
    </div>
  )
}

function GalleryCardField({ col, row }: { col: ColumnDef; row: TableRow }) {
  const Icon = TYPE_ICON[col.type] ?? User
  const value = row[col.name]
  if (value == null || value === "") return null
  if (Array.isArray(value) && value.length === 0) return null

  if (col.type === "multiSelect") {
    const arr = (value as unknown[]).map((v) => String(v ?? "")).filter(Boolean)
    if (arr.length === 0) return null
    return (
      <div className="flex items-start gap-1.5 text-[11.5px]">
        <span className="shrink-0 text-muted-foreground">{col.label}:</span>
        <span className="flex flex-wrap gap-1">
          {arr.map((v) => (
            <span
              key={v}
              className="inline-flex items-center whitespace-nowrap rounded border border-border-subtle bg-muted px-1.5 py-0 text-[10.5px] text-foreground"
            >
              {v}
            </span>
          ))}
        </span>
      </div>
    )
  }

  if (col.type === "status") {
    const s = String(value) as TicketStatus
    return (
      <div className="flex items-center gap-1.5 text-[11.5px]">
        <span className="font-medium text-muted-foreground">{col.label}</span>
        <span
          className={cn(
            "inline-flex items-center whitespace-nowrap rounded px-1.5 py-0 text-[10.5px] font-semibold",
            statusBgClass(s),
            statusColorClass(s),
          )}
        >
          {STATUS_LABELS[s] ?? String(value)}
        </span>
      </div>
    )
  }

  if (col.type === "date") {
    return (
      <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Calendar className="size-3" strokeWidth={1.75} />
        <span className="font-mono text-foreground">{String(value)}</span>
      </div>
    )
  }

  if (col.type === "num") {
    return (
      <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Icon className="size-3" strokeWidth={1.75} />
        <span className="font-mono tabular-nums text-foreground">
          {String(value)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-[11.5px]">
      <span className="text-muted-foreground">{col.label}:</span>
      <span className="truncate font-medium">{String(value)}</span>
    </div>
  )
}
