// FlowBase V2 — 앱 셸 (액티비티 모드 라우터)
// 설계: docs/02-design/features/flowbase-v2-phase5.design.md §2
//
// 셸: 헤더 + [Activity bar | 모드 콘텐츠]. activityMode로 모드 전환.
// Tables·Workspace는 구현, Library/Wiki/Inbox/Search는 "준비 중" 스텁.

"use client"

import { useEffect, useState } from "react"
import { ActivityBar } from "@/components/board/activity-bar"
import { BoardHeader } from "@/components/board/board-header"
import { ComingSoonMode } from "@/components/board/coming-soon-mode"
import { TablesMode } from "@/components/board/tables-mode"
import { WorkspaceMode } from "@/components/board/workspace-mode"
import { Toaster } from "@/components/ui/sonner"
import { useFlowBase } from "@/lib/flowbase-store"
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts"

export default function Home() {
  useKeyboardShortcuts()

  // zustand persist 리하이드레이션 후 렌더 — SSR/CSR 마크업 불일치 방지
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const activityMode = useFlowBase((s) => s.activityMode)
  const activityBar = useFlowBase((s) => s.panels.activityBar)

  if (!mounted) {
    return <div className="min-h-[100dvh] bg-background" />
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <BoardHeader />

      {/* Activity bar | 모드 콘텐츠 */}
      <div className="flex min-h-0 flex-1">
        {activityBar && <ActivityBar />}
        {activityMode === "tables" ? (
          <TablesMode />
        ) : activityMode === "workspace" ? (
          <WorkspaceMode />
        ) : (
          <ComingSoonMode mode={activityMode} />
        )}
      </div>

      <Toaster />
    </div>
  )
}
