// FlowBase V2 — 보드 헤더 (상단 유틸리티 스트립)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §5 (D5 — 헤더 추출)
//
// 햄버거(PanelsMenu) + breadcrumb + 검색 + 테마 토글.

"use client"

import { Search } from "lucide-react"
import { NavCluster } from "@/components/board/nav-cluster"
import { ThemeToggle } from "@/components/theme-toggle"
import { Kbd } from "@/components/ui/kbd"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { PanelsMenu } from "./panels-menu"

export function BoardHeader() {
  const board = useFlowBase(selectActiveBoard)
  const search = useFlowBase((s) => s.search)
  const setSearch = useFlowBase((s) => s.setSearch)
  const setSearchOpen = useFlowBase((s) => s.setSearchOpen)
  const workspaceLabel = useFlowBase((s) => s.settings.workspaceLabel)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border-subtle px-3.5">
      <PanelsMenu />
      <NavCluster />
      <div className="ml-1 flex items-center gap-1.5 text-[13px]">
        <span className="text-muted-foreground">{workspaceLabel}</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-semibold">{board?.label ?? "FlowBase"}</span>
      </div>
      <div className="flex-1" />
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
      <ThemeToggle />
    </header>
  )
}
