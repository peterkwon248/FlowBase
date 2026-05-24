// FlowBase V2 — Trash 다이얼로그 (status bar Trash 클릭으로 열림)
//
// 두 탭: Boards · Rows. 30일 지난 항목은 mount 시 자동 정리(cleanupExpiredTrash).

"use client"

import { useEffect, useMemo, useState } from "react"
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
import { cn } from "@/lib/utils"
import { useFlowBase } from "@/lib/flowbase-store"
import type { TrashedBoard, TrashedRow } from "@/types/flowbase"

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

function daysUntilExpiry(iso: string): number {
  const elapsed = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.ceil(30 - elapsed / 86_400_000))
}

type Tab = "boards" | "rows"

export function TrashDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const trashedBoards = useFlowBase((s) => s.trashedBoards)
  const trashedRows = useFlowBase((s) => s.trashedRows)
  const restoreBoard = useFlowBase((s) => s.restoreBoard)
  const permanentDeleteBoard = useFlowBase((s) => s.permanentDeleteBoard)
  const restoreRow = useFlowBase((s) => s.restoreRow)
  const permanentDeleteRow = useFlowBase((s) => s.permanentDeleteRow)
  const emptyTrash = useFlowBase((s) => s.emptyTrash)
  const cleanupExpiredTrash = useFlowBase((s) => s.cleanupExpiredTrash)

  // 다이얼로그 열 때 만료된 항목 자동 정리
  useEffect(() => {
    if (open) cleanupExpiredTrash()
  }, [open, cleanupExpiredTrash])

  const [tab, setTab] = useState<Tab>("boards")

  const total = trashedBoards.length + trashedRows.length

  // Auto-pick tab with content on open
  useEffect(() => {
    if (open) {
      if (trashedBoards.length === 0 && trashedRows.length > 0) {
        setTab("rows")
      } else {
        setTab("boards")
      }
    }
  }, [open, trashedBoards.length, trashedRows.length])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Trash</DialogTitle>
          <DialogDescription className="text-[12px]">
            Items here are permanently deleted after 30 days.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border-subtle">
          <TabButton
            id="boards"
            label="Boards"
            count={trashedBoards.length}
            active={tab === "boards"}
            onClick={setTab}
          />
          <TabButton
            id="rows"
            label="Rows"
            count={trashedRows.length}
            active={tab === "rows"}
            onClick={setTab}
          />
        </div>

        {tab === "boards" ? (
          <BoardsList
            items={trashedBoards}
            onRestore={restoreBoard}
            onDelete={permanentDeleteBoard}
          />
        ) : (
          <RowsList
            items={trashedRows}
            onRestore={restoreRow}
            onDelete={permanentDeleteRow}
          />
        )}

        <DialogFooter>
          {total > 0 && (
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

function TabButton({
  id,
  label,
  count,
  active,
  onClick,
}: {
  id: Tab
  label: string
  count: number
  active: boolean
  onClick: (id: Tab) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      data-trash-tab={id}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 border-b-2 px-3 text-[12.5px] transition-colors",
        active
          ? "border-primary text-foreground font-semibold"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      <span>{label}</span>
      <span className="text-[10.5px] font-normal tabular-nums text-muted-foreground">
        {count}
      </span>
    </button>
  )
}

function EmptyState({ kind }: { kind: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Trash2 className="size-7 text-muted-foreground/40" strokeWidth={1.5} />
      <p className="text-[12.5px] text-muted-foreground">No deleted {kind}.</p>
    </div>
  )
}

function BoardsList({
  items,
  onRestore,
  onDelete,
}: {
  items: TrashedBoard[]
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (items.length === 0) return <EmptyState kind="boards" />
  return (
    <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
      {items.map((t) => (
        <div
          key={t.board.id}
          className="flex items-center gap-3 rounded-md border border-border-subtle bg-card px-3 py-2"
          data-trashed-board={t.board.id}
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{t.board.label}</div>
            <div className="text-[11px] text-muted-foreground">
              {t.board.rows.length} rows · deleted {relativeTime(t.deletedAt)}
              {" · "}expires in {daysUntilExpiry(t.deletedAt)}d
            </div>
          </div>
          <ActionButtons
            onRestore={() => onRestore(t.board.id)}
            onDelete={() => onDelete(t.board.id)}
          />
        </div>
      ))}
    </div>
  )
}

function RowsList({
  items,
  onRestore,
  onDelete,
}: {
  items: TrashedRow[]
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}) {
  // 같은 보드 행은 그룹화 표시 — hook은 early return 전 항상 호출
  const grouped = useMemo(() => {
    const m = new Map<string, TrashedRow[]>()
    for (const t of items) {
      const arr = m.get(t.boardLabel) ?? []
      arr.push(t)
      m.set(t.boardLabel, arr)
    }
    return Array.from(m.entries())
  }, [items])

  if (items.length === 0) return <EmptyState kind="rows" />

  return (
    <div className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
      {grouped.map(([boardLabel, rows]) => (
        <div key={boardLabel}>
          <div className="mb-1 px-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {boardLabel} · {rows.length}
          </div>
          <div className="space-y-1.5">
            {rows.map((t) => (
              <div
                key={t.row.id}
                data-trashed-row={t.row.id}
                className="flex items-center gap-3 rounded-md border border-border-subtle bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium">
                    <span className="font-mono text-muted-foreground">
                      {t.row.id}
                    </span>
                    {firstReadableField(t.row) && (
                      <span className="ml-2">{firstReadableField(t.row)}</span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    deleted {relativeTime(t.deletedAt)} · expires in{" "}
                    {daysUntilExpiry(t.deletedAt)}d
                  </div>
                </div>
                <ActionButtons
                  onRestore={() => onRestore(t.row.id)}
                  onDelete={() => onDelete(t.row.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function firstReadableField(row: Record<string, unknown>): string {
  for (const key of ["title", "name", "label", "quote"]) {
    const v = row[key]
    if (typeof v === "string" && v) return v.slice(0, 60)
  }
  return ""
}

function ActionButtons({
  onRestore,
  onDelete,
}: {
  onRestore: () => void
  onDelete: () => void
}) {
  return (
    <>
      <button
        type="button"
        title="Restore"
        onClick={onRestore}
        className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
      >
        <RotateCcw className="size-3.5" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        title="Delete forever"
        onClick={onDelete}
        className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
      >
        <Trash2 className="size-3.5" strokeWidth={1.75} />
      </button>
    </>
  )
}
