// FlowBase V2 — 앱 셸 (액티비티 모드 라우터)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §2
//
// 셸: 헤더 + [Activity bar | 모드 콘텐츠]. activityMode로 모드 전환.
// Tables·Workspace는 구현, Library/Wiki/Inbox/Search는 "준비 중" 스텁.

"use client"

import { useEffect, useState } from "react"
import { ActivityBar } from "@/components/board/activity-bar"
import { BoardHeader } from "@/components/board/board-header"
import { TablesMode } from "@/components/board/tables-mode"
import { WorkspaceMode } from "@/components/board/workspace-mode"
import { InboxView } from "@/components/inbox/inbox-view"
import { LibraryMode } from "@/components/library/library-mode"
import { SearchMode } from "@/components/search/search-mode"
import { SearchPalette } from "@/components/search/search-palette"
import { Toaster } from "@/components/ui/sonner"
import { WikiMode } from "@/components/wiki/wiki-mode"
import { AutomationRuntime } from "@/lib/automation-runtime"
import { useFlowBase } from "@/lib/flowbase-store"
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts"

export default function Home() {
  useKeyboardShortcuts()

  // zustand persist 리하이드레이션 후 렌더 — SSR/CSR 마크업 불일치 방지
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    // Trash 30일 만료 자동 정리 — Trash 다이얼로그 안 열어도 mount 한 번에 cleanup.
    // hydrate 비동기 race 회피: hasHydrated 시 즉시, 아직이면 finishHydration 콜백.
    const run = () => useFlowBase.getState().cleanupExpiredTrash()
    if (useFlowBase.persist.hasHydrated()) {
      run()
      return
    }
    const unsub = useFlowBase.persist.onFinishHydration(run)
    return unsub
  }, [])

  const activityMode = useFlowBase((s) => s.activityMode)
  const activityBar = useFlowBase((s) => s.panels.activityBar)
  // Theme accent — settings.themeAccent → <html data-theme-accent="...">
  const themeAccent = useFlowBase((s) => s.settings.themeAccent ?? "purple")
  useEffect(() => {
    if (themeAccent === "purple") {
      document.documentElement.removeAttribute("data-theme-accent")
    } else {
      document.documentElement.setAttribute("data-theme-accent", themeAccent)
    }
  }, [themeAccent])

  if (!mounted) {
    return <div className="min-h-[100dvh] bg-background" />
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <BoardHeader />

      {/* Activity bar | 모드 콘텐츠 */}
      <div className="flex min-h-0 flex-1">
        {activityBar && <ActivityBar />}
        {activityMode === "tables" ? (
          <TablesMode />
        ) : activityMode === "workspace" ? (
          <WorkspaceMode />
        ) : activityMode === "library" ? (
          <LibraryMode />
        ) : activityMode === "wiki" ? (
          <WikiMode />
        ) : activityMode === "inbox" ? (
          <InboxView />
        ) : activityMode === "search" ? (
          <SearchMode />
        ) : null}
      </div>

      <SearchPalette />
      <AutomationRuntime />
      <Toaster />
    </div>
  )
}
