// FlowBase V2 — Workspace 모드 (액티비티 바 Workspace)
// 출처: design-ref/prototype/prototype-app.jsx — Workspace = { schema, automations }
//
// Phase A는 Schema만 렌더. Automations는 후속.

"use client"

import { SchemaView } from "@/components/sections/schema-view"

export function WorkspaceMode() {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <SchemaView />
    </div>
  )
}
