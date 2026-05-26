// FlowBase V2 — Saved Views menu (G7-C C-V1·V2·V3)
// 출처 컨셉: Notion "Views" · Linear saved view.
//
// Tables 모드 ViewSwitcher 옆 Popover 진입점.
// 활성 보드의 saved views 카탈로그 + Save current as new + Rename(inline)/Delete/Update.
// LOCK: filter+sort+viewSettings 풀세트. 보드별 격리. 같은 보드 같은 이름 ❌.

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bookmark,
  BookmarkCheck,
  Check,
  CalendarRange,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  SquareKanban,
  Table2,
  Trash2,
  X,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  selectActiveBoard,
  selectActiveView,
  selectIsViewer,
  useFlowBase,
} from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { SavedView, ViewMode, ViewSettings } from "@/types/flowbase"

const VIEW_ICON: Record<ViewMode, LucideIcon> = {
  sheet: Table2,
  kanban: SquareKanban,
  grid: LayoutGrid,
  timeline: CalendarRange,
  chart: LayoutDashboard,
}

const EMPTY_LIST: SavedView[] = []
const EMPTY_VS: ViewSettings = {}

export function SavedViewsMenu() {
  const board = useFlowBase(selectActiveBoard)
  const isViewer = useFlowBase(selectIsViewer)
  const savedViewsForBoard = useFlowBase(
    (s) => (board ? (s.savedViews[board.id] ?? EMPTY_LIST) : EMPTY_LIST),
  )
  const activeViewId = useFlowBase(
    (s) => (board ? (s.activeSavedViewId[board.id] ?? null) : null),
  )
  // 현재 상태 (modified detection용)
  const currentViewType = useFlowBase(selectActiveView)
  const currentSettings = useFlowBase(
    (s) => (board ? (s.viewSettings[board.id] ?? EMPTY_VS) : EMPTY_VS),
  )
  const currentColumnFilters = useFlowBase((s) => s.columnFilters)
  const currentSort = useFlowBase((s) => s.sort)

  const saveCurrentAsView = useFlowBase((s) => s.saveCurrentAsView)
  const applySavedView = useFlowBase((s) => s.applySavedView)
  const renameSavedView = useFlowBase((s) => s.renameSavedView)
  const deleteSavedView = useFlowBase((s) => s.deleteSavedView)
  const updateSavedViewFromCurrent = useFlowBase(
    (s) => s.updateSavedViewFromCurrent,
  )

  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createName, setCreateName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const createInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creating) createInputRef.current?.focus()
  }, [creating])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  // popover 닫힐 때 inline state reset
  useEffect(() => {
    if (!open) {
      setCreating(false)
      setCreateName("")
      setEditingId(null)
      setEditingName("")
    }
  }, [open])

  const activeView = activeViewId
    ? savedViewsForBoard.find((v) => v.id === activeViewId)
    : null

  // Modified detection — 활성 view와 현재 상태 비교. JSON.stringify는 키 순서 영향
  // 받지만 store가 매번 같은 spread 순서로 patch하므로 안정적. polish는 후속.
  const isModified = useMemo(() => {
    if (!activeView) return false
    if (activeView.viewType !== currentViewType) return true
    if (
      JSON.stringify(activeView.settings) !== JSON.stringify(currentSettings)
    )
      return true
    if (
      JSON.stringify(activeView.columnFilters) !==
      JSON.stringify(currentColumnFilters)
    )
      return true
    if (JSON.stringify(activeView.sort) !== JSON.stringify(currentSort))
      return true
    return false
  }, [
    activeView,
    currentViewType,
    currentSettings,
    currentColumnFilters,
    currentSort,
  ])

  if (!board) return null

  const handleSave = () => {
    const id = saveCurrentAsView(createName)
    if (id) {
      setCreating(false)
      setCreateName("")
    }
  }

  const handleApply = (viewId: string) => {
    applySavedView(viewId)
    setOpen(false)
  }

  const handleRenameCommit = () => {
    if (!editingId) return
    renameSavedView(editingId, editingName)
    setEditingId(null)
    setEditingName("")
  }

  const startEditing = (v: SavedView) => {
    setEditingId(v.id)
    setEditingName(v.name)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={
            activeView
              ? `View: ${activeView.name}${isModified ? " (modified)" : ""}`
              : "Saved views"
          }
          data-action="saved-views-menu"
          className={cn(
            "inline-flex h-7 max-w-[180px] items-center gap-1 rounded-md border border-border-subtle px-2 text-[12px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
            activeView && "border-border bg-foreground/[0.06] text-foreground",
          )}
        >
          {activeView ? (
            <BookmarkCheck className="size-3.5 shrink-0" strokeWidth={1.75} />
          ) : (
            <Bookmark className="size-3.5 shrink-0" strokeWidth={1.75} />
          )}
          <span className="truncate">
            {activeView ? activeView.name : "Views"}
          </span>
          {isModified && (
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full bg-amber-500"
              title="Modified — current state differs from the saved view"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-72 p-0">
        <div className="space-y-0.5 py-1">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Saved views
            </span>
            {!creating && !isViewer && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                title="Save current as new view"
              >
                <Plus className="size-3" />
                Save current
              </button>
            )}
          </div>

          {creating && (
            <div className="px-3 pb-2">
              <div className="flex items-center gap-1">
                <Input
                  ref={createInputRef}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSave()
                    }
                    if (e.key === "Escape") {
                      setCreating(false)
                      setCreateName("")
                    }
                  }}
                  placeholder="View name"
                  className="h-7 flex-1 text-[12px]"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex h-7 items-center rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setCreateName("")
                  }}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.06]"
                  title="Cancel"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Saves filters · sort · display options of the current view.
              </p>
            </div>
          )}

          {savedViewsForBoard.length === 0 && !creating && (
            <div className="px-3 pb-3 pt-1 text-[12px] text-muted-foreground">
              No saved views yet. Save the current view to reuse filters and
              display options.
            </div>
          )}

          {activeView && isModified && !isViewer && !creating && (
            <div className="mx-2 mb-1 rounded-md border border-amber-500/40 bg-amber-500/[0.06] px-2.5 py-1.5 text-[11.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-foreground">
                  "{activeView.name}" has unsaved changes
                </span>
                <button
                  type="button"
                  onClick={() => updateSavedViewFromCurrent(activeView.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
                  title="Overwrite saved view with current state"
                >
                  <RefreshCw className="size-3" />
                  Update
                </button>
              </div>
            </div>
          )}

          {savedViewsForBoard.length > 0 && (
            <ul className="max-h-72 overflow-auto px-1 pb-1">
              {savedViewsForBoard.map((v) => {
                const Icon = VIEW_ICON[v.viewType] ?? Table2
                const active = v.id === activeViewId
                const editing = v.id === editingId
                return (
                  <li key={v.id}>
                    {editing ? (
                      <div className="flex items-center gap-1 px-2 py-1">
                        <Icon
                          className="size-3.5 shrink-0 text-muted-foreground"
                          strokeWidth={1.75}
                        />
                        <Input
                          ref={editInputRef}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleRenameCommit()
                            }
                            if (e.key === "Escape") {
                              setEditingId(null)
                              setEditingName("")
                            }
                          }}
                          onBlur={handleRenameCommit}
                          className="h-6 flex-1 text-[12px]"
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "group flex items-center gap-1 rounded-md px-2 py-1 text-[12px]",
                          active
                            ? "bg-foreground/[0.06] text-foreground"
                            : "text-muted-foreground hover:bg-foreground/[0.04]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleApply(v.id)}
                          className="flex min-w-0 flex-1 items-center gap-1.5"
                          title={`Apply "${v.name}"`}
                        >
                          <Icon
                            className="size-3.5 shrink-0"
                            strokeWidth={1.75}
                          />
                          <span className="truncate text-left">{v.name}</span>
                          {active && (
                            <Check
                              className="ml-auto size-3 shrink-0 text-primary"
                              strokeWidth={2.25}
                            />
                          )}
                        </button>
                        {!isViewer && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "inline-flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/[0.08] group-hover:opacity-100",
                                  active && "opacity-60",
                                )}
                                title="More"
                              >
                                <MoreHorizontal className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              sideOffset={4}
                              className="w-44"
                            >
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  startEditing(v)
                                }}
                                className="text-[12px]"
                              >
                                <Pencil className="size-3.5" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  updateSavedViewFromCurrent(v.id)
                                }}
                                className="text-[12px]"
                              >
                                <RefreshCw className="size-3.5" />
                                Update from current
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  deleteSavedView(v.id)
                                }}
                                variant="destructive"
                                className="text-[12px]"
                              >
                                <Trash2 className="size-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
