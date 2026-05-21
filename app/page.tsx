// FlowBase V2 — 보드 페이지 (Phase 1B 최소 보드 셸 + 시트 뷰)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §9
// 옛 3섹션(설계/데이터/운영) UI는 V2 보드 UI로 대체. 멀티 보드/패널은 Phase 4~6.

"use client"

import { useEffect, useState } from "react"
import { Database, Plus, Search, Trash2, Undo2, Upload } from "lucide-react"
import { AiActivityPanel } from "@/components/ai/ai-activity-panel"
import { ImportDialog } from "@/components/import/import-dialog"
import { SheetView } from "@/components/sheet/sheet-view"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
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
  const search = useFlowBase((s) => s.search)
  const setSearch = useFlowBase((s) => s.setSearch)
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

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* 상단 유틸리티 스트립 */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-3.5">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="text-muted-foreground">peter&apos;s workspace</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold">{board?.label ?? "FlowBase"}</span>
        </div>
        <div className="flex-1" />
        <div className="flex w-56 items-center gap-1.5 rounded-md border border-border-subtle bg-muted px-2 py-1.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색…"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ThemeToggle />
      </header>

      {/* 보드 영역(타이틀 + 시트) + AI 패널 */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
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
          </div>

          {/* 시트 뷰 */}
          <SheetView />
        </div>

        {/* AI Activity 패널 (Phase 2 — 고정 슬롯) */}
        <AiActivityPanel />
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <Toaster />
    </div>
  )
}
