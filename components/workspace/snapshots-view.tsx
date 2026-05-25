// FlowBase V2 — Workspace > Snapshots (GitHub 식 명시 save point)
// 출처: Key Design #18 (상용화 backlog) — 사용자 명시 click 시만 save · Restore = 자동 새 snapshot.
//
// 목록 + Save Dialog + Restore/Delete AlertDialog. history-view 답습 패턴.
//
// LOCK:
//   - snapshots는 raw 구독 + useMemo derive (selector 직접 구독 시 새 배열 → 무한 루프)
//   - Restore = 자동 새 snapshot 생성 (사용자 되돌리기 보장) — store.restoreSnapshot 처리
//   - 자동 새 snapshot 라벨 prefix = "Auto-saved before restore:" — UI 시각 구분

"use client"

import { useMemo, useState } from "react"
import {
  Camera,
  Clock,
  GitCompare,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SnapshotCompareDialog } from "@/components/workspace/snapshot-compare-dialog"
import { useFlowBase, selectIsViewer } from "@/lib/flowbase-store"
import {
  diffSnapshotStates,
  summarizeDiff,
} from "@/lib/snapshot-diff"
import { cn } from "@/lib/utils"
import type { Snapshot, SnapshotState } from "@/types/flowbase"

const AUTO_PREFIX = "Auto-saved before restore:"

function formatTs(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (sameDay) {
    return `Today ${d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// snapshot 안의 보드/위키/automation 카운트 — 목록 카드 stats.
function snapshotStats(snap: Snapshot): {
  boards: number
  rows: number
  wiki: number
  automations: number
} {
  const boards = Object.values(snap.state.boards)
  const rows = boards.reduce((acc, b) => acc + b.rows.length, 0)
  return {
    boards: boards.length,
    rows,
    wiki: snap.state.wikiPages.length,
    automations: snap.state.automations.length,
  }
}

export function SnapshotsView() {
  const snapshots = useFlowBase((s) => s.snapshots)
  const members = useFlowBase((s) => s.settings.members)
  const saveSnapshot = useFlowBase((s) => s.saveSnapshot)
  const restoreSnapshot = useFlowBase((s) => s.restoreSnapshot)
  const deleteSnapshot = useFlowBase((s) => s.deleteSnapshot)
  const renameSnapshot = useFlowBase((s) => s.renameSnapshot)
  const isViewer = useFlowBase(selectIsViewer)

  const [saveOpen, setSaveOpen] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<Snapshot | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Snapshot | null>(null)
  const [renameTarget, setRenameTarget] = useState<Snapshot | null>(null)
  const [compareTarget, setCompareTarget] = useState<Snapshot | null>(null)
  // G3-1: A vs B compare (임의 두 snapshot). compareA 단독이면 vs current (기존).
  // compareB 있으면 A vs B로 SnapshotCompareDialog에 compareWith 전달.
  const [compareA, setCompareA] = useState<string>("")
  const [compareB, setCompareB] = useState<string>("")
  const [compareDualOpen, setCompareDualOpen] = useState(false)
  const snapById = useMemo(() => {
    const m = new Map<string, Snapshot>()
    for (const s of snapshots) m.set(s.id, s)
    return m
  }, [snapshots])
  const snapA = snapById.get(compareA) ?? null
  const snapB = snapById.get(compareB) ?? null

  // store raw slices — Restore preview diff 계산용
  const boards = useFlowBase((s) => s.boards)
  const wikiPagesState = useFlowBase((s) => s.wikiPages)
  const automationsState = useFlowBase((s) => s.automations)
  const libraryState = useFlowBase((s) => s.library)
  const settingsState = useFlowBase((s) => s.settings)
  const schemaPositionsState = useFlowBase((s) => s.schemaPositions)
  const viewSettingsState = useFlowBase((s) => s.viewSettings)
  const suggestedAutomationsState = useFlowBase((s) => s.suggestedAutomations)
  const trashedBoardsState = useFlowBase((s) => s.trashedBoards)
  const trashedRowsState = useFlowBase((s) => s.trashedRows)
  const trashedWikiPagesState = useFlowBase((s) => s.trashedWikiPages)

  // Restore 확인 다이얼로그용 diff summary (target 있을 때만 계산)
  const restorePreviewSummary = useMemo(() => {
    if (!restoreTarget) return null
    const currentState: SnapshotState = {
      boards,
      library: libraryState,
      wikiPages: wikiPagesState,
      automations: automationsState,
      suggestedAutomations: suggestedAutomationsState,
      trashedBoards: trashedBoardsState,
      trashedRows: trashedRowsState,
      trashedWikiPages: trashedWikiPagesState,
      settings: settingsState,
      schemaPositions: schemaPositionsState,
      viewSettings: viewSettingsState,
    }
    return summarizeDiff(diffSnapshotStates(restoreTarget.state, currentState))
  }, [
    restoreTarget,
    boards,
    libraryState,
    wikiPagesState,
    automationsState,
    suggestedAutomationsState,
    trashedBoardsState,
    trashedRowsState,
    trashedWikiPagesState,
    settingsState,
    schemaPositionsState,
    viewSettingsState,
  ])

  // memberId → name 매핑 — 없는 멤버는 id 그대로 표시.
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of members) map.set(m.id, m.name)
    return map
  }, [members])

  const onSaved = (label: string) => {
    toast.success(`Snapshot "${label}" saved`, { id: "snapshot-saved" })
  }

  const handleRestore = (snap: Snapshot) => {
    const ok = restoreSnapshot(snap.id)
    if (ok) {
      toast.success(`Restored "${snap.label}"`, {
        id: "snapshot-restored",
        description: "Your previous state was auto-saved.",
      })
    }
    setRestoreTarget(null)
  }

  const handleDelete = (snap: Snapshot) => {
    deleteSnapshot(snap.id)
    toast(`Snapshot "${snap.label}" deleted`, { id: "snapshot-deleted" })
    setDeleteTarget(null)
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b border-border-subtle bg-background/95 px-6 py-4 backdrop-blur">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-chart-4/15 text-chart-4">
            <Camera className="size-4" strokeWidth={1.75} />
          </span>
          <h1 className="text-[20px] font-bold tracking-[-0.02em]">Snapshots</h1>
          <span className="text-xs tabular-nums text-muted-foreground">
            {snapshots.length} {snapshots.length === 1 ? "save point" : "save points"}
          </span>
          <div className="ml-auto">
            <Button
              size="sm"
              onClick={() => setSaveOpen(true)}
              disabled={isViewer}
              title={isViewer ? "Viewers can't save snapshots" : undefined}
              className="gap-1.5 text-[12px]"
              data-action="save-snapshot"
            >
              <Camera className="size-3.5" strokeWidth={2} />
              Save snapshot
            </Button>
          </div>
        </div>
        <p className="pl-[38px] text-[11.5px] text-muted-foreground">
          Manual save points for the whole workspace. Restore brings everything back
          — your current state is auto-saved so you can always undo.
        </p>
        {/* G3-1: A vs B compare — 최소 2개 snapshot 있을 때만 노출 */}
        {snapshots.length >= 2 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-[38px] text-[11.5px]">
            <span className="text-muted-foreground">Compare</span>
            <select
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              data-compare-a
              className="rounded border border-border-subtle bg-card px-1.5 py-0.5 text-[11.5px]"
            >
              <option value="">(A)</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">vs</span>
            <select
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              data-compare-b
              className="rounded border border-border-subtle bg-card px-1.5 py-0.5 text-[11.5px]"
            >
              <option value="">(B)</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="ghost"
              disabled={!snapA || !snapB || compareA === compareB}
              onClick={() => setCompareDualOpen(true)}
              className="h-6 px-2 text-[11px]"
              data-action="compare-dual"
            >
              <GitCompare className="mr-1 size-3" strokeWidth={1.75} />
              Compare
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="min-w-0 flex-1 px-6 py-5">
        {snapshots.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center text-[12.5px] text-muted-foreground">
            <Camera
              className="mx-auto mb-2 size-5 text-muted-foreground/60"
              strokeWidth={1.5}
            />
            No snapshots yet. Save one before a big edit — you can restore it any time.
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col gap-2">
            {snapshots.map((snap) => (
              <SnapshotCard
                key={snap.id}
                snap={snap}
                authorName={memberNameById.get(snap.by) ?? snap.by}
                isViewer={isViewer}
                onRestore={() => setRestoreTarget(snap)}
                onCompare={() => setCompareTarget(snap)}
                onRename={() => setRenameTarget(snap)}
                onDelete={() => setDeleteTarget(snap)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Save dialog */}
      <SaveSnapshotDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSave={(label, description) => {
          const id = saveSnapshot(label, description)
          if (id) onSaved(label.trim() || "Untitled snapshot")
          setSaveOpen(false)
        }}
      />

      {/* Rename dialog */}
      {renameTarget && (
        <RenameSnapshotDialog
          open={!!renameTarget}
          onOpenChange={(o) => !o && setRenameTarget(null)}
          snap={renameTarget}
          onRename={(label, description) => {
            renameSnapshot(renameTarget.id, label, description)
            setRenameTarget(null)
          }}
        />
      )}

      {/* Restore confirm */}
      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-4" strokeWidth={1.75} />
              Restore "{restoreTarget?.label}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-[12.5px]">
              <span className="block">
                Workspace will be reverted to the state from{" "}
                {restoreTarget && formatTs(restoreTarget.ts)}.
              </span>
              {restorePreviewSummary && (
                <span className="block rounded-md border border-border-subtle bg-muted/40 px-2.5 py-1.5 text-[12px] text-foreground">
                  <strong>Preview:</strong> {restorePreviewSummary}
                </span>
              )}
              <span className="block">
                <strong className="text-foreground">Your current state will be auto-saved</strong>{" "}
                as a new snapshot, so you can always restore back.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreTarget && handleRestore(restoreTarget)}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Compare dialog (vs current) */}
      {compareTarget && (
        <SnapshotCompareDialog
          snap={compareTarget}
          open={!!compareTarget}
          onOpenChange={(o) => !o && setCompareTarget(null)}
          onRestore={() => {
            const t = compareTarget
            setCompareTarget(null)
            setRestoreTarget(t)
          }}
        />
      )}

      {/* G3-1: A vs B Compare dialog (두 임의 snapshot) */}
      {snapA && snapB && compareDualOpen && (
        <SnapshotCompareDialog
          snap={snapA}
          compareWith={snapB}
          open={compareDualOpen}
          onOpenChange={setCompareDualOpen}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" strokeWidth={1.75} />
              Delete "{deleteTarget?.label}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px]">
              This snapshot will be permanently removed. The workspace state isn't
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SnapshotCard({
  snap,
  authorName,
  isViewer,
  onRestore,
  onCompare,
  onRename,
  onDelete,
}: {
  snap: Snapshot
  authorName: string
  isViewer: boolean
  onRestore: () => void
  onCompare: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const stats = snapshotStats(snap)
  const isAuto = snap.label.startsWith(AUTO_PREFIX)
  return (
    <li
      data-snapshot-id={snap.id}
      className="group flex items-start gap-3 rounded-lg border border-border-subtle bg-card px-4 py-3 transition-colors hover:border-border"
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md",
          isAuto
            ? "bg-muted-foreground/[0.08] text-muted-foreground"
            : "bg-chart-4/15 text-chart-4",
        )}
      >
        <Camera className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {snap.label}
          </span>
          {isAuto && (
            <span className="shrink-0 whitespace-nowrap rounded-sm bg-muted-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
              Auto
            </span>
          )}
        </div>
        {snap.description && (
          <div className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
            {snap.description}
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" strokeWidth={1.75} />
            {formatTs(snap.ts)}
          </span>
          <span aria-hidden>·</span>
          <span>by {authorName}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {stats.boards} board{stats.boards === 1 ? "" : "s"} ·{" "}
            {stats.rows} row{stats.rows === 1 ? "" : "s"} · {stats.wiki} wiki ·{" "}
            {stats.automations} automation{stats.automations === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onRestore}
          disabled={isViewer}
          title={isViewer ? "Viewers can't restore" : undefined}
          className="h-7 gap-1.5 text-[11.5px]"
          data-action="restore-snapshot"
        >
          <RotateCcw className="size-3" strokeWidth={2} />
          Restore
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
              data-action="snapshot-menu"
              aria-label="Snapshot actions"
            >
              <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onSelect={onCompare}
              className="gap-2 text-[12px]"
            >
              <GitCompare className="size-3" strokeWidth={1.75} />
              Compare with current
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onRename}
              disabled={isViewer}
              className="gap-2 text-[12px]"
            >
              <Pencil className="size-3" strokeWidth={1.75} />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              disabled={isViewer}
              className="gap-2 text-[12px] text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3" strokeWidth={1.75} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

function SaveSnapshotDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSave: (label: string, description?: string) => void
}) {
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")

  // open 변화 시 폼 리셋
  const handleOpen = (o: boolean) => {
    if (!o) {
      setLabel("")
      setDescription("")
    }
    onOpenChange(o)
  }

  const submit = () => {
    onSave(label, description)
    setLabel("")
    setDescription("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-4 text-muted-foreground" strokeWidth={1.75} />
            Save snapshot
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Capture the current workspace state. You can restore it any time later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="snapshot-label" className="text-[11.5px]">
              Label
            </Label>
            <Input
              id="snapshot-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Before AI classify"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
              }}
              data-input="snapshot-label"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="snapshot-description" className="text-[11.5px]">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="snapshot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this point matters…"
              rows={3}
              data-input="snapshot-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpen(false)}
            className="text-[12px]"
          >
            Cancel
          </Button>
          <Button onClick={submit} className="gap-1.5 text-[12px]">
            <Camera className="size-3" strokeWidth={2} />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RenameSnapshotDialog({
  open,
  onOpenChange,
  snap,
  onRename,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  snap: Snapshot
  onRename: (label: string, description?: string) => void
}) {
  const [label, setLabel] = useState(snap.label)
  const [description, setDescription] = useState(snap.description ?? "")

  const submit = () => {
    onRename(label, description)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4 text-muted-foreground" strokeWidth={1.75} />
            Rename snapshot
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="snapshot-rename-label" className="text-[11.5px]">
              Label
            </Label>
            <Input
              id="snapshot-rename-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="snapshot-rename-description"
              className="text-[11.5px]"
            >
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="snapshot-rename-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-[12px]"
          >
            Cancel
          </Button>
          <Button onClick={submit} className="text-[12px]">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
