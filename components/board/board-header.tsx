// FlowBase V2 — 보드 헤더 (상단 유틸리티 스트립)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §5 (D5 — 헤더 추출)
//
// 햄버거(PanelsMenu) + breadcrumb + 검색 + 테마 토글.

"use client"

import { useState } from "react"
import { Search, Settings, Sparkles, Trash2 } from "lucide-react"
import { NavCluster } from "@/components/board/nav-cluster"
import { SettingsDialog } from "@/components/board/settings-dialog"
import { TrashDialog } from "@/components/board/trash-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { Kbd } from "@/components/ui/kbd"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { PanelsMenu } from "./panels-menu"

export function BoardHeader() {
  const board = useFlowBase(selectActiveBoard)
  const search = useFlowBase((s) => s.search)
  const setSearch = useFlowBase((s) => s.setSearch)
  const setSearchOpen = useFlowBase((s) => s.setSearchOpen)
  const requestAskAi = useFlowBase((s) => s.requestAskAi)
  const workspaceLabel = useFlowBase((s) => s.settings.workspaceLabel)
  const trashedCount = useFlowBase((s) => s.trashedBoards.length)

  const [trashOpen, setTrashOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border-subtle px-3.5">
        <PanelsMenu />
        <NavCluster />
        <div className="ml-1 flex items-center gap-1.5 text-[13px]">
          <span className="text-muted-foreground">{workspaceLabel}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold">{board?.label ?? "FlowBase"}</span>
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
    </>
  )
}
