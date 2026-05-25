// FlowBase V2 — 보드 헤더 (상단 유틸리티 스트립)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §5 (D5 — 헤더 추출)
//
// 햄버거(PanelsMenu) + breadcrumb + 검색 + 테마 토글.

"use client"

import { useState } from "react"
import { Search, Settings, Sparkles, Trash2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { CleanupDialog } from "@/components/board/cleanup-dialog"
import { NavCluster } from "@/components/board/nav-cluster"
import { SettingsDialog } from "@/components/board/settings-dialog"
import { TrashDialog } from "@/components/board/trash-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { Kbd } from "@/components/ui/kbd"
import { selectActiveBoard, selectIsViewer, useFlowBase } from "@/lib/flowbase-store"
import { PanelsMenu } from "./panels-menu"

export function BoardHeader() {
  const board = useFlowBase(selectActiveBoard)
  const search = useFlowBase((s) => s.search)
  const setSearch = useFlowBase((s) => s.setSearch)
  const setSearchOpen = useFlowBase((s) => s.setSearchOpen)
  const requestAskAi = useFlowBase((s) => s.requestAskAi)
  const workspaceLabel = useFlowBase((s) => s.settings.workspaceLabel)
  const trashedCount = useFlowBase((s) => s.trashedBoards.length)
  const renameBoard = useFlowBase((s) => s.renameBoard)
  const isViewer = useFlowBase(selectIsViewer)

  const [trashOpen, setTrashOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [autoNaming, setAutoNaming] = useState(false)
  const [cleanupOpen, setCleanupOpen] = useState(false)

  // B1: AI 보드 이름 제안. 사용자 명시 click → API 호출 → toast로 제안 + Accept action.
  // ANTHROPIC_API_KEY 미설정 시 graceful (toast.error). 자동 적용 ❌ — 사용자가 Apply 클릭해야 rename.
  const handleAutoName = async () => {
    if (!board || autoNaming) return
    setAutoNaming(true)
    const dismissId = toast.loading("Suggesting a name…")
    try {
      const res = await fetch("/api/ai/suggest-board-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentLabel: board.label,
          columns: board.columns.map((c) => ({
            name: c.name,
            label: c.label,
            type: c.type,
          })),
          sampleRows: board.rows.slice(0, 5),
        }),
      })
      const data = (await res.json()) as {
        suggested?: string
        domain?: string
        reasoning?: string
        error?: string
      }
      toast.dismiss(dismissId)
      if (!res.ok || !data.suggested) {
        toast.error(data.error || "AI suggestion failed", {
          description: !process?.env
            ? "Check ANTHROPIC_API_KEY in .env.local"
            : undefined,
        })
        return
      }
      toast.success(`"${data.suggested}"`, {
        description: data.reasoning || `Suggested for ${board.label}`,
        duration: 12000,
        action: {
          label: "Apply",
          onClick: () => {
            renameBoard(board.id, data.suggested!)
            toast.success(`Renamed to "${data.suggested}"`)
          },
        },
      })
    } catch (err) {
      toast.dismiss(dismissId)
      toast.error(err instanceof Error ? err.message : "AI call failed")
    } finally {
      setAutoNaming(false)
    }
  }

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border-subtle px-3.5">
        <PanelsMenu />
        <NavCluster />
        <div className="group/board-label ml-1 flex items-center gap-1.5 text-[13px]">
          <span className="text-muted-foreground">{workspaceLabel}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold">{board?.label ?? "FlowBase"}</span>
          {board && !isViewer && (
            <>
              <button
                type="button"
                onClick={handleAutoName}
                disabled={autoNaming}
                data-action="auto-name-board"
                title="Suggest a name with AI"
                className="ml-0.5 inline-flex size-5 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:bg-foreground/[0.06] hover:text-primary group-hover/board-label:opacity-100 focus:opacity-100 disabled:opacity-40"
              >
                <Sparkles className="size-3" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setCleanupOpen(true)}
                data-action="open-cleanup"
                title="Suggest data cleanup with AI"
                className="inline-flex size-5 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:bg-foreground/[0.06] hover:text-primary group-hover/board-label:opacity-100 focus:opacity-100"
              >
                <Wand2 className="size-3" strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
        <div className="flex-1" />

        {/* NOTE: storage counter 자리 — 로컬 first 아키텍처라 클라우드 quota 표기 ❌ (Key Design #17). */}
        {/* Phase 3+ 클라우드 sync 도입 시 sync status indicator(점/색)로 채울 자리. */}

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex w-56 items-center gap-1.5 rounded-md border border-border-subtle bg-muted px-2 py-1.5 text-left transition-colors hover:border-border"
          title="Search ⌘K"
        >
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
            onFocus={(e) => {
              // 입력 포커스만 — ⌘K 모달은 명시적 클릭/단축키만 열림
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
          {!search && <Kbd className="text-[10px]">⌘K</Kbd>}
        </button>
        <button
          type="button"
          onClick={() => requestAskAi()}
          data-ask-ai-trigger
          className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-muted px-2 py-1.5 text-[12.5px] transition-colors hover:border-border"
          title="Ask AI ⌘J"
        >
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-muted-foreground">Ask AI</span>
          <Kbd className="ml-0.5 text-[10px]">⌘J</Kbd>
        </button>
        <ThemeToggle />

        {/* Trash + Settings — ThemeToggle 오른쪽 (직전 위치: StatusBar 좌측) */}
        <button
          type="button"
          title={trashedCount > 0 ? `Trash · ${trashedCount} items` : "Trash"}
          onClick={() => setTrashOpen(true)}
          className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          {trashedCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-3 min-w-3 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold text-primary-foreground tabular-nums">
              {trashedCount}
            </span>
          )}
        </button>
        <button
          type="button"
          title="Settings"
          onClick={() => setSettingsOpen(true)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <Settings className="size-3.5" strokeWidth={1.75} />
        </button>
      </header>

      <TrashDialog open={trashOpen} onOpenChange={setTrashOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      {board && (
        <CleanupDialog
          open={cleanupOpen}
          onOpenChange={setCleanupOpen}
          board={board}
        />
      )}
    </>
  )
}
