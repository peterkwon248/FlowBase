// FlowBase V2 — Persistent status bar (셸 맨 하단, 모든 패널 상태 무관)
//
// 목업의 사이드바 푸터(prototype-shell.jsx:162-167)는 사이드바가 숨겨질 때 같이
// 사라지는 결함이 있다. 우리는 hide-all 패널 지원 → Trash·Settings·storage는
// 패널 밖 셸 자체의 푸터에 둠. 어떤 모드/패널 상태에서도 항상 접근 가능.

"use client"

import { useState } from "react"
import { Settings, Trash2 } from "lucide-react"
import { SettingsDialog } from "@/components/board/settings-dialog"
import { TrashDialog } from "@/components/board/trash-dialog"
import { useFlowBase } from "@/lib/flowbase-store"

export function StatusBar() {
  const trashedCount = useFlowBase((s) => s.trashedBoards.length)

  const [trashOpen, setTrashOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <footer className="flex h-7 shrink-0 items-center gap-1 border-t border-border-subtle bg-surface px-3 text-[11.5px] text-muted-foreground">
        <button
          type="button"
          title={trashedCount > 0 ? `Trash · ${trashedCount} items` : "Trash"}
          onClick={() => setTrashOpen(true)}
          className="relative flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
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
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <Settings className="size-3.5" strokeWidth={1.75} />
        </button>
        <div className="flex-1" />
        <span className="tabular-nums">2.1 / 10 GB</span>
      </footer>

      <TrashDialog open={trashOpen} onOpenChange={setTrashOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
