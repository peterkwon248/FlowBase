// FlowBase V2 — Trash 다이얼로그 (status bar Trash 클릭으로 열림)
//
// 삭제된 보드 목록 + Restore / Delete forever 액션 + Empty trash.

"use client"

import { RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFlowBase } from "@/lib/flowbase-store"

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export function TrashDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const trashedBoards = useFlowBase((s) => s.trashedBoards)
  const restoreBoard = useFlowBase((s) => s.restoreBoard)
  const permanentDeleteBoard = useFlowBase((s) => s.permanentDeleteBoard)
  const emptyTrash = useFlowBase((s) => s.emptyTrash)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Trash</DialogTitle>
          <DialogDescription className="text-[12px]">
            Deleted boards stay here. Restore them anytime — or delete forever.
          </DialogDescription>
        </DialogHeader>

        {trashedBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Trash2 className="size-7 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-[12.5px] text-muted-foreground">
              Trash is empty.
            </p>
          </div>
        ) : (
          <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
            {trashedBoards.map((t) => (
              <div
                key={t.board.id}
                className="flex items-center gap-3 rounded-md border border-border-subtle bg-card px-3 py-2"
                data-trashed-board={t.board.id}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">
                    {t.board.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.board.rows.length} rows · deleted {relativeTime(t.deletedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  title="Restore"
                  onClick={() => restoreBoard(t.board.id)}
                  className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  title="Delete forever"
                  onClick={() => permanentDeleteBoard(t.board.id)}
                  className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {trashedBoards.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => emptyTrash()}
              className="text-destructive hover:bg-destructive/15 hover:text-destructive"
            >
              Empty trash
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
