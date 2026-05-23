// FlowBase V2 — 컬럼 헤더 "..." 메뉴 (Rename · Delete)
// 출처: design-ref/prototype/add-column.jsx ColumnHeaderMenu
//
// id 컬럼은 메뉴 ❌ (보호). 다른 모든 컬럼은 트리거 노출.
// Rename은 prompt() — 빠른 구현; 풀 인라인 편집은 향후.

"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFlowBase } from "@/lib/flowbase-store"
import type { ColumnDef } from "@/types/flowbase"

export function ColumnHeaderMenu({ col }: { col: ColumnDef }) {
  const renameColumn = useFlowBase((s) => s.renameColumn)
  const deleteColumn = useFlowBase((s) => s.deleteColumn)

  const [renameOpen, setRenameOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draftLabel, setDraftLabel] = useState(col.label || col.name)

  if (col.name === "id") return null

  const openRename = () => {
    setDraftLabel(col.label || col.name)
    setRenameOpen(true)
  }

  const submitRename = () => {
    const newLabel = draftLabel.trim()
    if (!newLabel) {
      setRenameOpen(false)
      return
    }
    // 라벨만 변경 — key는 보존 (행 데이터 안 깨짐)
    renameColumn(col.name, col.name, newLabel)
    setRenameOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Column options"
            onClick={(e) => e.stopPropagation()}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            data-column-menu={col.name}
          >
            <MoreHorizontal className="size-3.5" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={openRename} className="gap-2">
            <Pencil className="size-3.5 text-muted-foreground" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setConfirmDelete(true)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename column</DialogTitle>
            <DialogDescription className="text-[12px]">
              Changes the display label. The underlying field key stays as{" "}
              <code className="rounded bg-muted px-1 font-mono text-[11px]">
                {col.name}
              </code>{" "}
              to keep your row data intact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="col-label" className="text-[12px]">
              Label
            </Label>
            <Input
              id="col-label"
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete column &ldquo;{col.label || col.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All cell values in this column will be removed. This cannot be
              undone with ⌘Z (column changes aren&apos;t tracked yet).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteColumn(col.name)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
