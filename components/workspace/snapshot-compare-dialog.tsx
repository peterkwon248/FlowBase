// FlowBase V2 — Snapshot vs current state Compare Dialog
// 출처: Key Design #18 Snapshots 후속 — 사용자가 restore 전에 변경 예고를 확인.
//
// 카테고리별 섹션: Boards · Wiki · Automations · Library · Settings.
// 각 카테고리 added/removed/modified/unchanged 카운트. modified boards는 sub stats(rows).
//
// 패턴: wiki-history-dialog와 동일한 modal + section card 답습.

"use client"

import { useMemo } from "react"
import {
  Bookmark,
  Database,
  FileText,
  Layers,
  Minus,
  Plus,
  Settings as SettingsIcon,
  Zap,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  diffSnapshotStates,
  summarizeDiff,
  type BoardModification,
  type CategoryDiff,
  type LibraryDiff,
} from "@/lib/snapshot-diff"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { Snapshot, SnapshotState } from "@/types/flowbase"

interface SnapshotCompareDialogProps {
  snap: Snapshot
  open: boolean
  onOpenChange: (o: boolean) => void
  onRestore?: () => void
  // G3-1: 두 snapshot 비교. compareWith 있으면 snap ↔ compareWith, 없으면 snap ↔ current.
  compareWith?: Snapshot
}

// 현재 store state에서 SnapshotState slice 추출 (store helper와 같음 — UI 안에서만 쓰니 인라인).
function currentSnapshotState(): SnapshotState {
  const s = useFlowBase.getState()
  return {
    boards: s.boards,
    library: s.library,
    wikiPages: s.wikiPages,
    automations: s.automations,
    suggestedAutomations: s.suggestedAutomations,
    trashedBoards: s.trashedBoards,
    trashedRows: s.trashedRows,
    trashedWikiPages: s.trashedWikiPages,
    settings: s.settings,
    schemaPositions: s.schemaPositions,
    viewSettings: s.viewSettings,
  }
}

export function SnapshotCompareDialog({
  snap,
  open,
  onOpenChange,
  onRestore,
  compareWith,
}: SnapshotCompareDialogProps) {
  // store의 raw 슬라이스 구독 — re-render 트리거. (다이얼로그 닫혀 있어도 hook 안전 호출.)
  // boards 변하면 diff 재계산. (compareWith 있을 때는 변경 무관 — snapshot은 immutable.)
  const boards = useFlowBase((s) => s.boards)
  const wikiPages = useFlowBase((s) => s.wikiPages)
  const automations = useFlowBase((s) => s.automations)

  const diff = useMemo(() => {
    if (!open) return null
    const right = compareWith ? compareWith.state : currentSnapshotState()
    return diffSnapshotStates(snap.state, right)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, snap.id, compareWith?.id, boards, wikiPages, automations])

  if (!diff) return null

  const totalLib =
    diff.library.optionLists.added +
    diff.library.optionLists.removed +
    diff.library.optionLists.modified +
    diff.library.fields.added +
    diff.library.fields.removed +
    diff.library.fields.modified +
    diff.library.templates.added +
    diff.library.templates.removed +
    diff.library.templates.modified +
    diff.library.functions.added +
    diff.library.functions.removed +
    diff.library.functions.modified +
    diff.library.dashboards.added +
    diff.library.dashboards.removed +
    diff.library.dashboards.modified

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="size-4 text-chart-4" strokeWidth={1.75} />
            Compare "{snap.label}" with{" "}
            {compareWith ? `"${compareWith.label}"` : "current"}
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            {summarizeDiff(diff)}
          </DialogDescription>
        </DialogHeader>

        {diff.identical ? (
          <div className="rounded-md border border-dashed border-border bg-card px-6 py-10 text-center text-[12.5px] text-muted-foreground">
            {compareWith
              ? `These two snapshots are identical.`
              : `This snapshot matches your current workspace state exactly.`}
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CategorySection
                Icon={Database}
                hue="text-chart-1"
                label="Boards"
                diff={diff.boards}
                modifications={diff.boardModifications}
              />
              <CategorySection
                Icon={FileText}
                hue="text-chart-5"
                label="Wiki pages"
                diff={diff.wikiPages}
              />
              <CategorySection
                Icon={Zap}
                hue="text-chart-3"
                label="Automations"
                diff={diff.automations}
              />
              <LibrarySection diff={diff.library} totalChanges={totalLib} />
            </div>
            {diff.settingsChanged && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-[12px]">
                <SettingsIcon
                  className="size-3.5 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <span className="font-medium">Workspace settings</span>
                <span className="ml-auto text-muted-foreground">changed</span>
              </div>
            )}
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
          {onRestore && !diff.identical && (
            <Button onClick={onRestore} className="text-[12px]">
              Restore this snapshot
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChipDelta({
  count,
  kind,
}: {
  count: number
  kind: "added" | "removed" | "modified"
}) {
  if (count === 0) return null
  const color =
    kind === "added"
      ? "text-emerald-600 dark:text-emerald-400"
      : kind === "removed"
        ? "text-rose-600 dark:text-rose-400"
        : "text-amber-600 dark:text-amber-400"
  const sym = kind === "added" ? "+" : kind === "removed" ? "−" : "~"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 whitespace-nowrap rounded-sm bg-foreground/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums",
        color,
      )}
      title={`${count} ${kind}`}
    >
      {sym}
      {count}
    </span>
  )
}

function CategorySection({
  Icon,
  hue,
  label,
  diff,
  modifications,
}: {
  Icon: typeof Database
  hue: string
  label: string
  diff: CategoryDiff
  modifications?: BoardModification[]
}) {
  const totalChanges =
    diff.added.length + diff.removed.length + diff.modified.length
  const hasMods = modifications && modifications.length > 0
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-card p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-3.5", hue)} strokeWidth={1.75} />
        <span className="text-[13px] font-semibold">{label}</span>
        <div className="ml-auto flex items-center gap-1">
          <ChipDelta count={diff.added.length} kind="added" />
          <ChipDelta count={diff.removed.length} kind="removed" />
          <ChipDelta count={diff.modified.length} kind="modified" />
        </div>
      </div>
      {totalChanges === 0 ? (
        <span className="text-[11.5px] text-muted-foreground">
          {diff.unchanged.length} unchanged
        </span>
      ) : (
        <span className="text-[11.5px] text-muted-foreground">
          {diff.unchanged.length} unchanged
        </span>
      )}
      {hasMods && (
        <ul className="flex flex-col gap-1 border-t border-border-subtle pt-2">
          {modifications.map((m) => (
            <li
              key={m.boardId}
              className="flex items-center gap-1.5 text-[11.5px]"
            >
              <span className="truncate font-medium">{m.label}</span>
              <div className="ml-auto flex items-center gap-0.5">
                {m.rowsAdded > 0 && (
                  <span
                    className="inline-flex items-center text-emerald-600 dark:text-emerald-400"
                    title={`${m.rowsAdded} rows added`}
                  >
                    <Plus className="size-2.5" strokeWidth={2.5} />
                    {m.rowsAdded}
                  </span>
                )}
                {m.rowsRemoved > 0 && (
                  <span
                    className="inline-flex items-center text-rose-600 dark:text-rose-400"
                    title={`${m.rowsRemoved} rows removed`}
                  >
                    <Minus className="size-2.5" strokeWidth={2.5} />
                    {m.rowsRemoved}
                  </span>
                )}
                {m.rowsModified > 0 && (
                  <span
                    className="inline-flex items-center text-amber-600 dark:text-amber-400 tabular-nums"
                    title={`${m.rowsModified} rows modified`}
                  >
                    ~{m.rowsModified}
                  </span>
                )}
                {m.columnsChanged && (
                  <span
                    className="ml-1 rounded-sm bg-foreground/[0.06] px-1 text-[9.5px] uppercase tracking-[0.04em] text-muted-foreground"
                    title="Schema changed"
                  >
                    Schema
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LibrarySection({
  diff,
  totalChanges,
}: {
  diff: LibraryDiff
  totalChanges: number
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-card p-3">
      <div className="flex items-center gap-2">
        <Layers className="size-3.5 text-chart-4" strokeWidth={1.75} />
        <span className="text-[13px] font-semibold">Library</span>
        <span className="ml-auto rounded-sm bg-foreground/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground">
          {totalChanges} changes
        </span>
      </div>
      {totalChanges === 0 ? (
        <span className="text-[11.5px] text-muted-foreground">No changes</span>
      ) : (
        <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
          {(
            [
              ["Option lists", diff.optionLists],
              ["Fields", diff.fields],
              ["Templates", diff.templates],
              ["Functions", diff.functions],
              ["Dashboards", diff.dashboards],
            ] as const
          ).map(([name, d]) => {
            const sum = d.added + d.removed + d.modified
            if (sum === 0) return null
            return (
              <li
                key={name}
                className="flex items-center gap-1 text-muted-foreground"
              >
                <span className="truncate">{name}</span>
                <span className="ml-auto flex items-center gap-0.5">
                  {d.added > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{d.added}
                    </span>
                  )}
                  {d.removed > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 tabular-nums">
                      −{d.removed}
                    </span>
                  )}
                  {d.modified > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 tabular-nums">
                      ~{d.modified}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

