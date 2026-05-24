// FlowBase V2 — Tables 모드 (액티비티 바 Tables)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §2
//
// 보드 영역 전체 — [사이드바 | 보드(타이틀·뷰스위처·시트/칸반/대시보드) | AI 패널].
// 셸(app/page.tsx)이 activityMode === "tables"일 때 렌더.

"use client"

import { useState } from "react"
import { Database, Plus, Trash2, Undo2, Upload } from "lucide-react"
import { AiActivityPanel } from "@/components/ai/ai-activity-panel"
import { BoardSidebar } from "@/components/board/board-sidebar"
import { DetailBar } from "@/components/board/detail-bar"
import { EdgeCollapse } from "@/components/board/edge-collapse"
import { ExpandTab } from "@/components/board/expand-tab"
import { ActiveFilterChips, FilterMenu } from "@/components/board/filter-menu"
import { FilterChips } from "@/components/board/filter-chips"
import { ViewSwitcher } from "@/components/board/view-switcher"
import { ImportDialog } from "@/components/import/import-dialog"
import { DashboardView } from "@/components/sections/dashboard-view"
import { GalleryView } from "@/components/sections/gallery-view"
import { KanbanView } from "@/components/sections/kanban-view"
import { TimelineView } from "@/components/sections/timeline-view"
import { SheetView } from "@/components/sheet/sheet-view"
import {
  selectActiveBoard,
  selectActiveView,
  useFlowBase,
} from "@/lib/flowbase-store"

export function TablesMode() {
  const [importOpen, setImportOpen] = useState(false)

  const board = useFlowBase(selectActiveBoard)
  const view = useFlowBase(selectActiveView)
  const panels = useFlowBase((s) => s.panels)
  const togglePanel = useFlowBase((s) => s.togglePanel)
  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const deleteRows = useFlowBase((s) => s.deleteRows)
  const addRow = useFlowBase((s) => s.addRow)
  const undo = useFlowBase((s) => s.undo)

  const rowCount = board?.rows.length ?? 0
  const colCount = board?.columns.length ?? 0
  const selectedCount = selectedRowIds.length

  // Kanban은 status 컬럼 필요, Timeline은 date 컬럼 필요 — 없으면 sheet 폴백.
  const hasStatus = board?.columns.some((c) => c.type === "status") ?? false
  const hasDate = board?.columns.some((c) => c.type === "date") ?? false
  const effectiveView =
    view === "kanban" && !hasStatus
      ? "sheet"
      : view === "timeline" && !hasDate
        ? "sheet"
        : view

  return (
    <>
      {panels.sidebar && (
        <div className="relative shrink-0">
          <BoardSidebar onImport={() => setImportOpen(true)} />
          <EdgeCollapse
            side="left"
            onClick={() => togglePanel("sidebar")}
            title="Close sidebar (⌘⇧F)"
          />
        </div>
      )}

      {/* 보드 영역 */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* 보드 타이틀 블록 */}
        <div className="shrink-0 px-6 pb-2 pt-5">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-chart-1/15 text-chart-1">
              <Database className="size-4" />
            </span>
            <h1 className="text-[22px] font-bold tracking-[-0.02em]">
              {board?.label ?? "FlowBase"}
            </h1>
          </div>
          <div className="flex items-center gap-3 pl-[38px]">
            <ViewSwitcher />
            <span className="text-xs tabular-nums text-muted-foreground">
              {rowCount} rows · {colCount} columns
            </span>
            <FilterMenu />
            <div className="flex-1" />
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => deleteRows(selectedRowIds)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
              >
                <Trash2 className="size-3" />
                Delete {selectedCount} rows
              </button>
            )}
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
            >
              <Upload className="size-3" />
              Import
            </button>
            <button
              type="button"
              onClick={() => undo()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
            >
              <Undo2 className="size-3" />
              Undo
            </button>
            <button
              type="button"
              onClick={() => addRow()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
            >
              <Plus className="size-3" />
              New row
            </button>
          </div>
          {hasStatus && (
            <div className="mt-2 pl-[38px]">
              <FilterChips />
            </div>
          )}
          <div className="mt-2 pl-[38px]">
            <ActiveFilterChips />
          </div>
        </div>

        {/* 뷰 — Sheet / Kanban / Gallery / Timeline / Dashboard */}
        {effectiveView === "kanban" ? (
          <KanbanView />
        ) : effectiveView === "grid" ? (
          <GalleryView />
        ) : effectiveView === "timeline" ? (
          <TimelineView />
        ) : effectiveView === "chart" ? (
          <DashboardView />
        ) : (
          <SheetView />
        )}

        {/* 닫힌 패널 재오픈 탭 */}
        {!panels.sidebar && (
          <ExpandTab
            side="left"
            label="Sidebar"
            onClick={() => togglePanel("sidebar")}
          />
        )}
        {!panels.aiPanel && (
          <ExpandTab
            side="right"
            label="AI"
            onClick={() => togglePanel("aiPanel")}
          />
        )}
      </div>

      {panels.detailBar && <DetailBar />}

      {panels.aiPanel && (
        <div className="relative shrink-0">
          <AiActivityPanel />
          <EdgeCollapse
            side="right"
            onClick={() => togglePanel("aiPanel")}
            title="Close AI panel (⌘B)"
          />
        </div>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  )
}
