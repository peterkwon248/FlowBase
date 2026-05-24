// FlowBase V2 — Workspace 모드 (사이드바 + 콘텐츠)
// 출처: design-ref/prototype/library-view.jsx WorkspaceView (line 1868)
//
// [WorkspaceSidebar | Schema 또는 Automations]. 상단 탭 ❌ — 사이드바로
// 단일화 (Library/Wiki/Tables와 동일 패턴). panels.sidebar 토글 공유.

"use client"

import { SchemaView } from "@/components/sections/schema-view"
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar"
import { AutomationsView } from "@/components/workspace/automations-view"
import { HistoryView } from "@/components/workspace/history-view"
import { useFlowBase } from "@/lib/flowbase-store"

export function WorkspaceMode() {
  const activeWorkspaceItem = useFlowBase((s) => s.activeWorkspaceItem)
  const sidebarOn = useFlowBase((s) => s.panels.sidebar)

  return (
    <>
      {sidebarOn && <WorkspaceSidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        {activeWorkspaceItem === "automations" ? (
          <AutomationsView />
        ) : activeWorkspaceItem === "history" ? (
          <HistoryView />
        ) : (
          <SchemaView />
        )}
      </div>
    </>
  )
}
