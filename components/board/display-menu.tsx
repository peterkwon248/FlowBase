// FlowBase V2 — Display 옵션 메뉴 (Linear "Display" 패턴)
// 출처 컨셉: Linear/Notion view options popover.
//
// Filter 옆 헤더 버튼 → Popover → 현재 view에 맞는 옵션 섹션만 노출.
// view별 옵션 모델: types.ViewSettings · 보드별+view별 persist.
// 각 섹션: Sheet(hiddenColumns) · Kanban(groupBy) · Gallery(cover/cards/columns) · Timeline(date/scale).
// Dashboard는 옵션 없음 — "No display options" placeholder.

"use client"

import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Settings2,
  X,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import {
  selectActiveBoard,
  selectActiveView,
  useFlowBase,
} from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type {
  ColumnDef,
  GalleryViewSettings,
  KanbanViewSettings,
  SheetViewSettings,
  SortDir,
  TimelineViewSettings,
  ViewSettings,
} from "@/types/flowbase"

// 모듈 스코프 상수 — 매 셀렉터 호출에 새 빈 객체 반환 ❌ (zustand 무한 루프 방지).
const EMPTY_VS: ViewSettings = {}

export function DisplayMenu() {
  const board = useFlowBase(selectActiveBoard)
  const view = useFlowBase(selectActiveView)
  const viewSettings = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId] ?? EMPTY_VS,
  )

  // 현재 view의 옵션 활성 개수 (배지용)
  const activeCount = useMemo(() => {
    if (!board) return 0
    if (view === "sheet") {
      const s = viewSettings.sheet
      return (
        (s?.hiddenColumns?.length ?? 0) +
        (s?.groupBy ? 1 : 0) +
        (s?.sorts?.length ?? 0)
      )
    }
    if (view === "kanban") {
      return viewSettings.kanban?.groupBy ? 1 : 0
    }
    if (view === "grid") {
      const g = viewSettings.gallery
      return (g?.coverField ? 1 : 0) + (g?.cardFields?.length ?? 0)
    }
    if (view === "timeline") {
      const t = viewSettings.timeline
      return (t?.dateField ? 1 : 0) + (t?.scale && t.scale !== "day" ? 1 : 0)
    }
    // scale: day는 default라 count 안 함, week/month는 count

    return 0
  }, [board, view, viewSettings])

  if (!board) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Display options"
          data-action="display-menu"
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-md border border-border-subtle px-2 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
            activeCount > 0 && "border-border bg-foreground/[0.06] text-foreground",
          )}
        >
          <Settings2 className="size-3.5" strokeWidth={1.75} />
          <span>Display</span>
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-semibold text-primary-foreground tabular-nums">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 p-0"
        data-display-popover
        data-display-view={view}
      >
        <div className="space-y-0.5 py-1">
          <div className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Display · {VIEW_LABEL[view]}
          </div>
          <div className="px-3 pb-2 pt-1">
            {view === "sheet" && <SheetSection board={board} />}
            {view === "kanban" && <KanbanSection board={board} />}
            {view === "grid" && <GallerySection board={board} />}
            {view === "timeline" && <TimelineSection board={board} />}
            {view === "chart" && (
              <p className="text-[12px] text-muted-foreground">
                No display options for Dashboard. Add or arrange charts from
                the toolbar above.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const VIEW_LABEL: Record<string, string> = {
  sheet: "Sheet",
  kanban: "Kanban",
  grid: "Gallery",
  timeline: "Timeline",
  chart: "Dashboard",
}

// ─── Sheet — column visibility · group by · multi-sort ────────
function SheetSection({ board }: { board: { columns: ColumnDef[] } }) {
  const settings = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.sheet,
  ) as SheetViewSettings | undefined
  const setViewOption = useFlowBase((s) => s.setViewOption)

  const hidden = new Set(settings?.hiddenColumns ?? [])
  const togglable = board.columns.filter((c) => c.name !== "id")

  const toggleHidden = (name: string) => {
    const next = new Set(hidden)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setViewOption("sheet", { hiddenColumns: Array.from(next) })
  }

  // GroupBy — status/select 컬럼만 (Kanban 패턴 답습)
  const groupable = board.columns.filter(
    (c) =>
      c.name !== "id" &&
      (c.type === "status" || c.type === "select" || c.type === "multiSelect"),
  )
  const groupBy = settings?.groupBy ?? "_none"

  // Sorts — 다중 (Linear "Ordering" 패턴)
  const sorts = settings?.sorts ?? []
  const sortableCols = togglable
  const usedSortKeys = new Set(sorts.map((s) => s.key))
  const addableSortCols = sortableCols.filter((c) => !usedSortKeys.has(c.name))

  const addSort = (key: string) => {
    setViewOption("sheet", { sorts: [...sorts, { key, dir: "asc" as SortDir }] })
  }
  const removeSort = (key: string) => {
    setViewOption("sheet", { sorts: sorts.filter((s) => s.key !== key) })
  }
  const toggleSortDir = (key: string) => {
    setViewOption("sheet", {
      sorts: sorts.map((s) =>
        s.key === key
          ? { ...s, dir: (s.dir === "asc" ? "desc" : "asc") as SortDir }
          : s,
      ),
    })
  }
  const moveSort = (i: number, dir: "up" | "down") => {
    const next = sorts.slice()
    const swap = dir === "up" ? i - 1 : i + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[i], next[swap]] = [next[swap], next[i]]
    setViewOption("sheet", { sorts: next })
  }

  return (
    <div className="space-y-3">
      {/* Group by */}
      {groupable.length > 0 && (
        <Row label="Group by">
          <Select
            value={groupBy}
            onValueChange={(v) =>
              setViewOption("sheet", {
                groupBy: v === "_none" ? undefined : v,
              })
            }
          >
            <SelectTrigger
              className="h-7 w-[140px] text-[12px]"
              data-display-sheet-group
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">No grouping</SelectItem>
              {groupable.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.label || c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      )}

      {/* Sorts (다중) */}
      <div>
        <div className="mb-1 text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          Ordering
        </div>
        {sorts.length === 0 ? (
          <p className="text-[11.5px] text-muted-foreground">
            No sort. Click + to add.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {sorts.map((s, i, arr) => {
              const col = sortableCols.find((c) => c.name === s.key)
              if (!col) return null
              const Icon = TYPE_ICON[col.type]
              return (
                <li
                  key={s.key}
                  className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-[12px] hover:bg-accent"
                  data-display-sheet-sort={s.key}
                >
                  <Icon
                    className="size-3 shrink-0 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {col.label || col.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSortDir(s.key)}
                    title={
                      s.dir === "asc" ? "Ascending (toggle)" : "Descending (toggle)"
                    }
                    className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground"
                  >
                    {s.dir === "asc" ? (
                      <ArrowUp className="size-3" strokeWidth={2} />
                    ) : (
                      <ArrowDown className="size-3" strokeWidth={2} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSort(i, "up")}
                    disabled={i === 0}
                    title="Move up"
                    className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] disabled:opacity-30"
                  >
                    <ChevronUp className="size-3" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSort(i, "down")}
                    disabled={i === arr.length - 1}
                    title="Move down"
                    className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] disabled:opacity-30"
                  >
                    <ChevronDown className="size-3" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSort(s.key)}
                    title="Remove"
                    className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/[0.08] hover:text-destructive"
                  >
                    <X className="size-3" strokeWidth={2} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {addableSortCols.length > 0 && (
          <Select value="" onValueChange={(v) => v && addSort(v)}>
            <SelectTrigger
              className="mt-1 h-7 w-full text-[11.5px] text-muted-foreground"
              data-display-sheet-sort-add
            >
              <span className="inline-flex items-center gap-1">
                <Plus className="size-3" strokeWidth={2} />
                Add sort
              </span>
            </SelectTrigger>
            <SelectContent>
              {addableSortCols.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.label || c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Shown columns (기존) */}
      <div>
        <div className="mb-1 text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          Shown columns
        </div>
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {togglable.map((col) => {
            const Icon = TYPE_ICON[col.type]
            const checked = !hidden.has(col.name)
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => toggleHidden(col.name)}
                data-display-col={col.name}
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1.5 text-left text-[12.5px] transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded border",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {checked && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <Icon
                  className="size-3.5 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <span className="flex-1 truncate">{col.label || col.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban — group by ─────────────────────────────────
function KanbanSection({ board }: { board: { columns: ColumnDef[] } }) {
  const settings = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.kanban,
  ) as KanbanViewSettings | undefined
  const setViewOption = useFlowBase((s) => s.setViewOption)

  const groupable = board.columns.filter(
    (c) =>
      c.name !== "id" &&
      (c.type === "status" || c.type === "select" || c.type === "multiSelect"),
  )

  const defaultGroup =
    board.columns.find((c) => c.type === "status")?.name ??
    groupable[0]?.name ??
    ""
  const current = settings?.groupBy ?? defaultGroup

  return (
    <div className="space-y-2">
      <Row label="Group by">
        <Select
          value={current}
          onValueChange={(v) => setViewOption("kanban", { groupBy: v })}
        >
          <SelectTrigger
            className="h-7 w-[140px] text-[12px]"
            data-display-kanban-group
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groupable.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.label || c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
    </div>
  )
}

// ─── Gallery — cover · cards · columns ─────────────────
function GallerySection({ board }: { board: { columns: ColumnDef[] } }) {
  const settings = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.gallery,
  ) as GalleryViewSettings | undefined
  const setViewOption = useFlowBase((s) => s.setViewOption)

  const coverCols = board.columns.filter(
    (c) =>
      c.name !== "id" && (c.type === "avatar" || c.type === "text"),
  )
  const cardCols = board.columns.filter((c) => c.name !== "id")
  const cards = new Set(settings?.cardFields ?? [])
  const cols = settings?.columns ?? 3

  // dnd reorder 상태 (네이티브 HTML5 — dnd lib ❌ LOCK 준수)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const toggleCard = (name: string) => {
    const next = new Set(cards)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setViewOption("gallery", { cardFields: Array.from(next) })
  }

  // from → to 이동(swap 아님). ↑/↓ 버튼과 동일하게 setViewOption 재사용.
  const reorder = (from: number, to: number) => {
    if (from === to) return
    const arr = (settings?.cardFields ?? []).slice()
    if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) return
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    setViewOption("gallery", { cardFields: arr })
  }

  return (
    <div className="space-y-3">
      <Row label="Cover">
        <Select
          value={settings?.coverField ?? "_auto"}
          onValueChange={(v) =>
            setViewOption("gallery", {
              coverField: v === "_auto" ? undefined : v,
            })
          }
        >
          <SelectTrigger
            className="h-7 w-[140px] text-[12px]"
            data-display-gallery-cover
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_auto">Auto</SelectItem>
            {coverCols.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.label || c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row label="Columns">
        <div className="inline-flex rounded-md border border-border-subtle p-0.5">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                setViewOption("gallery", { columns: n as 2 | 3 | 4 })
              }
              data-display-gallery-cols={n}
              className={cn(
                "rounded-sm px-2 py-0.5 text-[11.5px] transition-colors",
                cols === n
                  ? "bg-primary/15 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </Row>
      <div>
        <div className="mb-1 text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          Card fields
        </div>
        {/* 선택된 cardFields 우선 표시 + 순서 보존, 그 다음 미선택 컬럼. */}
        <div className="max-h-44 space-y-0.5 overflow-y-auto">
          {/* 선택된 (순서 의미) — ↑/↓로 reorder */}
          {(settings?.cardFields ?? []).map((name, i, arr) => {
            const col = cardCols.find((c) => c.name === name)
            if (!col) return null
            const Icon = TYPE_ICON[col.type]
            const move = (dir: "up" | "down") => {
              const next = arr.slice()
              const swap = dir === "up" ? i - 1 : i + 1
              if (swap < 0 || swap >= next.length) return
              ;[next[i], next[swap]] = [next[swap], next[i]]
              setViewOption("gallery", { cardFields: next })
            }
            return (
              <div
                key={col.name}
                data-display-gallery-card={col.name}
                draggable
                onDragStart={(e) => {
                  setDragIdx(i)
                  e.dataTransfer.effectAllowed = "move"
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  if (overIdx !== i) setOverIdx(i)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragIdx !== null) reorder(dragIdx, i)
                  setDragIdx(null)
                  setOverIdx(null)
                }}
                onDragEnd={() => {
                  setDragIdx(null)
                  setOverIdx(null)
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-[12px] transition-colors hover:bg-accent",
                  dragIdx === i && "opacity-40",
                  overIdx === i &&
                    dragIdx !== i &&
                    "bg-primary/[0.06] ring-1 ring-inset ring-primary/40",
                )}
              >
                <span
                  className="flex size-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/50 active:cursor-grabbing"
                  title="Drag to reorder"
                  aria-hidden
                >
                  <GripVertical className="size-3" strokeWidth={1.75} />
                </span>
                <button
                  type="button"
                  onClick={() => toggleCard(col.name)}
                  className="flex size-3.5 shrink-0 items-center justify-center rounded border border-primary bg-primary text-primary-foreground"
                  title="Remove from card"
                >
                  <Check className="size-2.5" strokeWidth={3} />
                </button>
                <Icon
                  className="size-3 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <span className="flex-1 truncate">
                  {col.label || col.name}
                </span>
                <button
                  type="button"
                  onClick={() => move("up")}
                  disabled={i === 0}
                  className="flex size-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] disabled:opacity-30"
                  title="Move up"
                  data-card-up={col.name}
                >
                  <ChevronUp className="size-3" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => move("down")}
                  disabled={i === arr.length - 1}
                  className="flex size-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] disabled:opacity-30"
                  title="Move down"
                  data-card-down={col.name}
                >
                  <ChevronDown className="size-3" strokeWidth={2.5} />
                </button>
              </div>
            )
          })}
          {/* 미선택 — 추가만 */}
          {cardCols
            .filter((c) => !cards.has(c.name))
            .map((col) => {
              const Icon = TYPE_ICON[col.type]
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => toggleCard(col.name)}
                  data-display-gallery-add={col.name}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-left text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="flex size-3.5 shrink-0 items-center justify-center rounded border border-border" />
                  <Icon
                    className="size-3 shrink-0"
                    strokeWidth={1.75}
                  />
                  <span className="flex-1 truncate">
                    {col.label || col.name}
                  </span>
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}

// ─── Timeline — date field · scale ─────────────────────
function TimelineSection({ board }: { board: { columns: ColumnDef[] } }) {
  const settings = useFlowBase(
    (s) => s.viewSettings[s.activeBoardId]?.timeline,
  ) as TimelineViewSettings | undefined
  const setViewOption = useFlowBase((s) => s.setViewOption)

  const dateCols = board.columns.filter((c) => c.type === "date")
  const current = settings?.dateField ?? dateCols[0]?.name ?? ""
  const scale = settings?.scale ?? "day"

  return (
    <div className="space-y-2">
      <Row label="Date field">
        <Select
          value={current}
          onValueChange={(v) => setViewOption("timeline", { dateField: v })}
        >
          <SelectTrigger
            className="h-7 w-[140px] text-[12px]"
            data-display-timeline-date
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateCols.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.label || c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row label="Scale">
        <div className="inline-flex rounded-md border border-border-subtle p-0.5">
          {(["day", "week", "month"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setViewOption("timeline", { scale: s })}
              data-display-timeline-scale={s}
              className={cn(
                "rounded-sm px-2 py-0.5 text-[11.5px] capitalize transition-colors",
                scale === s
                  ? "bg-primary/15 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Row>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
