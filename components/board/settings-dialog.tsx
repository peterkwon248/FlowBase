// FlowBase V2 — Settings 다이얼로그 (status bar Settings 클릭으로 열림)
//
// 첫 패스: 워크스페이스 이름 · 단축 표기(P) · 저장공간 정보 (read-only stub).
// 향후 추가: 멤버/권한 · 테마 프리셋 · 데이터 export 등.

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFlowBase } from "@/lib/flowbase-store"

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const settings = useFlowBase((s) => s.settings)
  const updateSettings = useFlowBase((s) => s.updateSettings)

  const [draftLabel, setDraftLabel] = useState(settings.workspaceLabel)
  const [draftInitial, setDraftInitial] = useState(settings.workspaceInitial)

  // 다이얼로그가 열릴 때마다 store 값으로 초기화 (이전 편집 폐기)
  useEffect(() => {
    if (open) {
      setDraftLabel(settings.workspaceLabel)
      setDraftInitial(settings.workspaceInitial)
    }
  }, [open, settings.workspaceLabel, settings.workspaceInitial])

  const save = () => {
    const label = draftLabel.trim() || "Workspace"
    const initial =
      (draftInitial.trim() || label[0] || "W").slice(0, 1).toUpperCase()
    updateSettings({
      workspaceLabel: label,
      workspaceInitial: initial,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="text-[12px]">
            Customize your workspace. More options coming soon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws-label" className="text-[12px]">
              Workspace name
            </Label>
            <Input
              id="ws-label"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              maxLength={60}
              placeholder="peter's workspace"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-initial" className="text-[12px]">
              Sidebar initial
            </Label>
            <Input
              id="ws-initial"
              value={draftInitial}
              onChange={(e) => setDraftInitial(e.target.value.slice(0, 1))}
              maxLength={1}
              className="w-16 text-center font-semibold uppercase"
              placeholder="P"
            />
            <p className="text-[10.5px] text-muted-foreground">
              The single letter shown on the sidebar workspace badge.
            </p>
          </div>

          <div className="border-t border-border-subtle pt-3">
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Storage
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-muted-foreground">Used</span>
              <span className="tabular-nums font-medium">2.1 / 10 GB</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: "21%" }}
              />
            </div>
            <p className="mt-2 text-[10.5px] text-muted-foreground">
              Storage tracking is currently a placeholder.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
