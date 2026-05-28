// FlowBase V2 — Wiki 페이지 revision history Dialog
// 출처: NEXT-ACTION 우선순위 낮음 11 — Wiki body diff/version history
//
// 페이지의 revisions(직전 20개) 표시. 클릭 시 옛 버전 미리보기 + 현재 본문과 line diff.
// "Restore this version" → 그 body로 updateWikiPage (현재 본문은 또 revisions에 push).
// LOCK: revisions persist · max 20 FIFO (types.WikiPage.revisions, store.updateWikiPage 처리)

"use client"

import { useMemo, useState } from "react"
import { History, RotateCcw } from "lucide-react"
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
import { diffLines } from "@/lib/line-diff"
import { cn } from "@/lib/utils"
import type { PageRevision, WikiPage } from "@/types/flowbase"

interface WikiHistoryDialogProps {
  page: WikiPage
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatTs(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function WikiHistoryDialog({
  page,
  open,
  onOpenChange,
}: WikiHistoryDialogProps) {
  const updateWikiPage = useFlowBase((s) => s.updateWikiPage)
  const revisions = page.revisions ?? []
  const [selectedIdx, setSelectedIdx] = useState<number>(0)

  const selectedRev: PageRevision | null = revisions[selectedIdx] ?? null

  // 현재 본문 vs 선택 revision body — diff lines
  const diff = useMemo(() => {
    if (!selectedRev) return null
    return diffLines(selectedRev.body, page.body)
  }, [selectedRev, page.body])

  const restore = () => {
    if (!selectedRev) return
    updateWikiPage(page.id, {
      title: selectedRev.title,
      body: selectedRev.body,
      updatedAt: new Date().toISOString().slice(0, 10),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" strokeWidth={1.75} />
            Version history
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Last {revisions.length} version{revisions.length === 1 ? "" : "s"} of
            "{page.title}". Line-level diff vs current.
          </DialogDescription>
        </DialogHeader>

        {revisions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card px-6 py-10 text-center text-[12.5px] text-muted-foreground">
            No previous versions yet. Edits will be tracked here.
          </div>
        ) : (
          <div className="grid grid-cols-[180px_1fr] gap-3">
            {/* Revisions list */}
            <ul className="max-h-[440px] space-y-0.5 overflow-y-auto rounded-md border border-border-subtle bg-card p-1">
              {revisions.map((r, i) => {
                const active = i === selectedIdx
                return (
                  <li key={r.ts}>
                    <button
                      type="button"
                      onClick={() => setSelectedIdx(i)}
                      data-wiki-revision={r.ts}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-left text-[12px] transition-colors",
                        active
                          ? "bg-foreground/[0.06] text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.04]",
                      )}
                    >
                      <span className="font-medium tabular-nums">
                        {formatTs(r.ts)}
                      </span>
                      <span className="truncate text-[10.5px] text-muted-foreground/70">
                        {r.title}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Diff view */}
            <div
              className="max-h-[440px] overflow-y-auto rounded-md border border-border-subtle bg-card p-3 font-mono text-[11.5px] leading-relaxed"
              data-wiki-diff
            >
              {!diff || diff.length === 0 ? (
                <span className="text-muted-foreground">(empty)</span>
              ) : (
                diff.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap rounded-sm px-1",
                      line.kind === "added" &&
                        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      line.kind === "removed" &&
                        "bg-rose-500/10 text-rose-700 line-through opacity-80 dark:text-rose-300",
                      line.kind === "same" && "text-muted-foreground",
                    )}
                  >
                    <span className="mr-1.5 select-none opacity-50">
                      {line.kind === "added"
                        ? "+"
                        : line.kind === "removed"
                          ? "−"
                          : " "}
                    </span>
                    {line.text || " "}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-[12px]"
          >
            Close
          </Button>
          {selectedRev && (
            <Button
              onClick={restore}
              className="gap-1.5 text-[12px]"
              data-wiki-restore
            >
              <RotateCcw className="size-3" strokeWidth={2} />
              Restore this version
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
