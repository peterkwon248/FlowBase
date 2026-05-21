// FlowBase V2 — 보드 헤더 (상단 유틸리티 스트립)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §5 (D5 — 헤더 추출)
//
// 햄버거(PanelsMenu) + breadcrumb + 검색 + 테마 토글.

"use client"

import { Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { PanelsMenu } from "./panels-menu"

export function BoardHeader() {
  const board = useFlowBase(selectActiveBoard)
  const search = useFlowBase((s) => s.search)
  const setSearch = useFlowBase((s) => s.setSearch)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-3.5">
      <PanelsMenu />
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
  )
}
