// FlowBase V2 — 보드 페이지 (앱 셸)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §2
// 셸: 헤더 + [Activity bar | Sidebar | 보드 영역 | AI 패널]. 패널 토글(Phase 5).

"use client"

import { useEffect, useState } from "react"
import { Database, Plus, Trash2, Undo2, Upload } from "lucide-react"
import { AiActivityPanel } from "@/components/ai/ai-activity-panel"
import { ActivityBar } from "@/components/board/activity-bar"
import { BoardHeader } from "@/components/board/board-header"
import { BoardSidebar } from "@/components/board/board-sidebar"
import { EdgeCollapse } from "@/components/board/edge-collapse"
import { ExpandTab } from "@/components/board/expand-tab"
import { FilterChips } from "@/components/board/filter-chips"
import { ViewSwitcher } from "@/components/board/view-switcher"
import { ImportDialog } from "@/components/import/import-dialog"
import { DashboardView } from "@/components/sections/dashboard-view"
import { KanbanView } from "@/components/sections/kanban-view"
import { SchemaView } from "@/components/sections/schema-view"
import { SheetView } from "@/components/sheet/sheet-view"
import { Toaster } from "@/components/ui/sonner"
import {
  selectActiveBoard,
  selectActiveView,
  useFlowBase,
} from "@/lib/flowbase-store"
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts"

export default function Home() {
  useKeyboardShortcuts()

  // zustand persist 리하이드레이션 후 렌더 — SSR/CSR 마크업 불일치 방지
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [importOpen, setImportOpen] = useState(false)

  const board = useFlowBase(selectActiveBoard)
  const view = useFlowBase(selectActiveView)
  const panels = useFlowBase((s) => s.panels)
  const togglePanel = useFlowBase((s) => s.togglePanel)
  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const deleteRows = useFlowBase((s) => s.deleteRows)
  const addRow = useFlowBase((s) => s.addRow)
  const undo = useFlowBase((s) => s.undo)

  if (!mounted) {
    return <div className="min-h-[100dvh] bg-background" />
  }

  const rowCount = board?.rows.length ?? 0
  const colCount = board?.columns.length ?? 0
  const selectedCount = selectedRowIds.length

  // Kanban은 status 컬럼 필요 — 없으면 sheet 폴백. grid/timeline도 sheet(Phase 4 범위 밖).
  const hasStatus = board?.columns.some((c) => c.type === "status") ?? false
  const effectiveView = view === "kanban" && !hasStatus ? "sheet" : view

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <BoardHeader />

      {/* Activity bar | Sidebar | 보드 영역 | AI 패널 */}
      <div className="flex min-h-0 flex-1">
        {panels.activityBar && <ActivityBar />}

        {panels.sidebar && (
          <div className="relative shrink-0">
            <BoardSidebar onImport={() => setImportOpen(true)} />
            <EdgeCollapse
              side="left"
              onClick={() => togglePanel("sidebar")}
              title="사이드바 닫기 (⌘⇧F)"
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
              <div className="flex-1" />
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => deleteRows(selectedRowIds)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
                >
                  <Trash2 className="size-3" />
                  {selectedCount}개 행 삭제
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
                실행 취소
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
          </div>

          {/* 뷰 — Sheet / Kanban / Dashboard / Schema */}
          {effectiveView === "kanban" ? (
            <KanbanView />
          ) : effectiveView === "chart" ? (
            <DashboardView />
          ) : effectiveView === "schema" ? (
            <SchemaView />
          ) : (
            <SheetView />
          )}

          {/* 닫힌 패널 재오픈 탭 */}
          {!panels.sidebar && (
            <ExpandTab
              side="left"
              label="사이드바"
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

        {panels.aiPanel && (
          <div className="relative shrink-0">
            <AiActivityPanel />
            <EdgeCollapse
              side="right"
              onClick={() => togglePanel("aiPanel")}
              title="AI 패널 닫기 (⌘B)"
            />
          </div>
        )}
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <Toaster />
    </div>
  )
}
